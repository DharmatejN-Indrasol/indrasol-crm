import React, { useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, LinearProgress, Typography } from '@mui/material';
import Papa from 'papaparse';
import { useDataProvider, useNotify } from 'react-admin';
import { useLeadImport, LeadImportSchema } from './useLeadImport';

const ZOOMINFO_CLIENT_ID = 'YOUR_CLIENT_ID';
const ZOOMINFO_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const ZOOMINFO_TOKEN_URL = 'https://api.zoominfo.com/auth/token';
const ZOOMINFO_LEADS_URL = 'https://api.zoominfo.com/v2/lead-enrich'; // Example endpoint

async function getZoomInfoToken() {
    const stored = localStorage.getItem('zoominfo_token');
    const expires = localStorage.getItem('zoominfo_token_expires');
    if (stored && expires && new Date().getTime() < Number(expires)) {
        return stored;
    }
    const response = await fetch(ZOOMINFO_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: ZOOMINFO_CLIENT_ID,
            client_secret: ZOOMINFO_CLIENT_SECRET,
            grant_type: 'client_credentials',
        }),
    });
    if (!response.ok) throw new Error('Failed to get ZoomInfo token');
    const data = await response.json();
    localStorage.setItem('zoominfo_token', data.access_token);
    localStorage.setItem('zoominfo_token_expires', (new Date().getTime() + (data.expires_in - 60) * 1000).toString());
    return data.access_token;
}

async function fetchLeadsFromZoomInfoAPI(): Promise<{leads: LeadImportSchema[], summary: any}> {
    const token = await getZoomInfoToken();
    const lastImport = localStorage.getItem('zoominfo_last_import');
    const url = lastImport ? `${ZOOMINFO_LEADS_URL}?updated_since=${encodeURIComponent(lastImport)}` : ZOOMINFO_LEADS_URL;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) throw new Error('Failed to fetch from ZoomInfo API');
    const data = await response.json();
    // Map and validate
    const leads: LeadImportSchema[] = [];
    const summary = { imported: 0, updated: 0, skipped: 0, failed: 0, errors: [] as string[] };
    for (const item of (data.leads || data.results || [])) {
        // Basic validation
        if (!item.firstName || !item.lastName || (!item.emailAddress && !item.directPhoneNumber)) {
            summary.skipped++;
            summary.errors.push(`Missing required fields for ${item.firstName || ''} ${item.lastName || ''}`);
            continue;
        }
        // Email format validation
        if (item.emailAddress && !/^\S+@\S+\.\S+$/.test(item.emailAddress)) {
            summary.skipped++;
            summary.errors.push(`Invalid email: ${item.emailAddress}`);
            continue;
        }
        leads.push({
            zoominfo_contact_id: item.id,
            last_name: item.lastName,
            first_name: item.firstName,
            middle_name: item.middleName,
            salutation: item.salutation,
            suffix: item.suffix,
            job_title: item.jobTitle,
            management_level: item.managementLevel,
            job_start_date: item.jobStartDate,
            job_function: item.jobFunction,
            department: item.department,
            company_division_name: item.companyDivisionName,
            direct_phone_number: item.directPhoneNumber,
            email_address: item.emailAddress,
            email_domain: item.emailDomain,
            mobile_phone: item.mobilePhone,
            highest_level_of_education: item.highestLevelOfEducation,
            contact_accuracy_score: item.contactAccuracyScore,
            contact_accuracy_grade: item.contactAccuracyGrade,
            zoominfo_contact_profile_url: item.profileUrl,
            linkedin_contact_profile_url: item.linkedinProfileUrl,
            notice_provided_date: item.noticeProvidedDate,
            person_street: item.personStreet,
            person_city: item.personCity,
            person_state: item.personState,
            person_zip_code: item.personZipCode,
            country: item.country,
            zoominfo_company_id: item.companyId,
            company_name: item.companyName,
            website: item.website,
            founded_year: item.foundedYear,
            company_hq_phone: item.companyHqPhone,
            fax: item.fax,
            ticker: item.ticker,
            revenue: item.revenue,
            revenue_range: item.revenueRange,
            employees: item.employees,
            employee_range: item.employeeRange,
            sic_codes: item.sicCodes,
            naics_codes: item.naicsCodes,
            primary_industry: item.primaryIndustry,
            primary_sub_industry: item.primarySubIndustry,
            all_industries: item.allIndustries,
            all_sub_industries: item.allSubIndustries,
            industry_hierarchical_category: item.industryHierarchicalCategory,
            secondary_industry_hierarchical_category: item.secondaryIndustryHierarchicalCategory,
            alexa_rank: item.alexaRank,
            zoominfo_company_profile_url: item.companyProfileUrl,
            linkedin_company_profile_url: item.linkedinCompanyProfileUrl,
            facebook_company_profile_url: item.facebookCompanyProfileUrl,
            twitter_company_profile_url: item.twitterCompanyProfileUrl,
            ownership_type: item.ownershipType,
            business_model: item.businessModel,
            certified_active_company: item.certifiedActiveCompany,
            certification_date: item.certificationDate,
            total_funding_amount: item.totalFundingAmount,
            recent_funding_amount: item.recentFundingAmount,
            recent_funding_round: item.recentFundingRound,
            recent_funding_date: item.recentFundingDate,
            recent_investors: item.recentInvestors,
            all_investors: item.allInvestors,
            company_street_address: item.companyStreetAddress,
            company_city: item.companyCity,
            company_state: item.companyState,
            company_zip_code: item.companyZipCode,
            company_country: item.companyCountry,
            full_address: item.fullAddress,
            query_name: item.queryName,
            gender: item.gender,
            title: item.title,
            email_work: item.emailWork,
            email_home: item.emailHome,
            email_other: item.emailOther,
            phone_work: item.phoneWork,
            phone_home: item.phoneHome,
            phone_other: item.phoneOther,
            background: item.background,
            avatar: item.avatar,
            first_seen: item.firstSeen,
            last_seen: item.lastSeen,
            has_newsletter: item.hasNewsletter,
            status: item.status,
            tags: item.tags,
            linkedin_url: item.linkedinUrl,
        });
    }
    return { leads, summary };
}

const LeadImportDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const notify = useNotify();
    const importLeads = useLeadImport();
    const dataProvider = useDataProvider();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        Papa.parse<LeadImportSchema>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    await importLeads(results.data);
                    notify('Leads imported successfully', { type: 'success' });
                    onClose();
                } catch (err) {
                    notify('Error importing leads', { type: 'error' });
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleZoomInfoImport = async () => {
        setLoading(true);
        try {
            const { leads, summary } = await fetchLeadsFromZoomInfoAPI();
            // Deduplication and upsert logic
            let imported = 0, updated = 0, skipped = summary.skipped, failed = 0;
            for (const lead of leads) {
                try {
                    // Check for existing by zoominfo_contact_id or email_address
                    const existing = await dataProvider.getList('leads', {
                        filter: {
                            ...(lead.zoominfo_contact_id ? { zoominfo_contact_id: lead.zoominfo_contact_id } : {}),
                            ...(lead.email_address ? { email_address: lead.email_address } : {}),
                        },
                        pagination: { page: 1, perPage: 1 },
                        sort: { field: 'id', order: 'ASC' },
                    });
                    if (existing.data.length > 0) {
                        // Update existing
                        await dataProvider.update('leads', {
                            id: existing.data[0].id,
                            data: { ...existing.data[0], ...lead },
                            previousData: existing.data[0],
                        });
                        updated++;
                    } else {
                        await dataProvider.create('leads', { data: lead });
                        imported++;
                    }
                } catch (err) {
                    failed++;
                    summary.errors.push(`Failed to import/update lead: ${lead.first_name} ${lead.last_name}`);
                }
            }
            setSummary({ ...summary, imported, updated, failed });
            localStorage.setItem('zoominfo_last_import', new Date().toISOString());
            notify('Leads imported from ZoomInfo API successfully', { type: 'success' });
        } catch (err) {
            notify('Error importing from ZoomInfo API', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Import Leads</DialogTitle>
            <DialogContent>
                <Typography variant="body2" mb={2}>
                    Upload a CSV file with columns: all ZoomInfo fields supported
                </Typography>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <Button variant="outlined" onClick={() => fileInputRef.current?.click()} disabled={loading} sx={{ mr: 2 }}>
                    Choose CSV File
                </Button>
                <Button variant="contained" color="primary" onClick={handleZoomInfoImport} disabled={loading}>
                    Import from ZoomInfo API
                </Button>
                {loading && <LinearProgress sx={{ mt: 2 }} />}
                {summary && (
                    <div style={{ marginTop: 16 }}>
                        <Typography variant="subtitle2">Import Summary:</Typography>
                        <Typography variant="body2">Imported: {summary.imported}</Typography>
                        <Typography variant="body2">Updated: {summary.updated}</Typography>
                        <Typography variant="body2">Skipped: {summary.skipped}</Typography>
                        <Typography variant="body2">Failed: {summary.failed}</Typography>
                        {summary.errors && summary.errors.length > 0 && (
                            <Typography variant="body2" color="error">
                                Errors:
                                <ul>
                                    {summary.errors.map((err: string, idx: number) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </Typography>
                        )}
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default LeadImportDialog; 