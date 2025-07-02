import React, { useRef, useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, LinearProgress, Typography, Box, Table, TableHead, TableBody, TableRow, TableCell, Alert, Stepper, Step, StepLabel, StepContent, TextField, Checkbox, Tooltip, Dialog as MuiDialog, DialogActions as MuiDialogActions, DialogContent as MuiDialogContent, DialogTitle as MuiDialogTitle
} from '@mui/material';
import { CheckCircle, Warning, ListAlt } from '@mui/icons-material';
import Papa from 'papaparse';
import { useDataProvider, useNotify } from 'react-admin';
import { useLeadImport, LeadImportSchema, PREVIEW_FIELDS, REQUIRED_FIELDS } from './useLeadImport';
import UploadStep from './UploadStep';
import MappingStep from './MappingStep';
import PreviewStep from './PreviewStep';

const ZOOMINFO_CLIENT_ID = 'YOUR_CLIENT_ID';
const ZOOMINFO_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const ZOOMINFO_TOKEN_URL = 'https://api.zoominfo.com/auth/token';
const ZOOMINFO_LEADS_URL = 'https://api.zoominfo.com/v2/lead-enrich'; // Example endpoint

const CONTACT_FIELDS = [
    'email_address', 'direct_phone_number', 'mobile_phone',
    'email_work', 'email_home', 'email_other',
    'phone_work', 'phone_home', 'phone_other',
    'linkedin_contact_profile_url', 'linkedin_url',
    'zoominfo_contact_profile_url', 'zoominfo_company_profile_url',
    'facebook_company_profile_url', 'twitter_company_profile_url'
];

// Add a mapping from possible CSV/ZoomInfo field names to internal schema
const FIELD_ALIASES: Record<string, string> = {
    // Standard fields
    'first name': 'first_name', 'firstname': 'first_name', 'first_name': 'first_name',
    'last name': 'last_name', 'lastname': 'last_name', 'last_name': 'last_name',
    'company': 'company_name', 'company name': 'company_name', 'company_name': 'company_name',
    'status': 'status',
    // Email/phone
    'email': 'email_address', 'email address': 'email_address', 'email_address': 'email_address', 'emailaddress': 'email_address',
    'direct phone': 'direct_phone_number', 'direct phone number': 'direct_phone_number', 'direct_phone_number': 'direct_phone_number',
    'mobile phone': 'mobile_phone', 'mobile_phone': 'mobile_phone',
    // ZoomInfo/LinkedIn
    'linkedin': 'linkedin_url', 'linkedin url': 'linkedin_url', 'linkedin_url': 'linkedin_url',
    'linkedin contact profile url': 'linkedin_contact_profile_url', 'linkedin_contact_profile_url': 'linkedin_contact_profile_url',
    'zoominfo contact profile url': 'zoominfo_contact_profile_url', 'zoominfo_contact_profile_url': 'zoominfo_contact_profile_url',
    'zoominfo company profile url': 'zoominfo_company_profile_url', 'zoominfo_company_profile_url': 'zoominfo_company_profile_url',
    'facebook company profile url': 'facebook_company_profile_url', 'facebook_company_profile_url': 'facebook_company_profile_url',
    'twitter company profile url': 'twitter_company_profile_url', 'twitter_company_profile_url': 'twitter_company_profile_url',
    // Other possible aliases
    'email work': 'email_work', 'email_work': 'email_work',
    'email home': 'email_home', 'email_home': 'email_home',
    'email other': 'email_other', 'email_other': 'email_other',
    'phone work': 'phone_work', 'phone_work': 'phone_work',
    'phone home': 'phone_home', 'phone_home': 'phone_home',
    'phone other': 'phone_other', 'phone_other': 'phone_other',
};

function normalizeFieldName(field: string): string {
    const key = field.trim().toLowerCase().replace(/\s+/g, ' ');
    return FIELD_ALIASES[key] || field;
}

function mapRowToSchema(row: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => {
        mapped[normalizeFieldName(key)] = value;
    });
    return mapped;
}

function hasMissingRequired(row: Record<string, any>) {
    // All required fields must be present and non-empty
    const missingBasic = REQUIRED_FIELDS.some(field => !row[field] || row[field].toString().trim() === '');
    // At least one communication channel must be present and non-empty
    const hasContact = CONTACT_FIELDS.some(field => row[field] && row[field].toString().trim() !== '');
    return missingBasic || !hasContact;
}

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

async function fetchLeadsFromZoomInfoAPI(): Promise<{ leads: LeadImportSchema[], summary: any }> {
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

const LeadImportDialog = ({ open, onClose, importAccess = true }: { open: boolean; onClose: () => void; importAccess?: boolean }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notify = useNotify();
    const importLeads = useLeadImport();
    const dataProvider = useDataProvider();
    const [file, setFile] = useState<File | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewRows, setPreviewRows] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [missingRequiredRows, setMissingRequiredRows] = useState<number[]>([]);
    const [activeStep, setActiveStep] = useState(0);
    const [allFields, setAllFields] = useState<string[]>(PREVIEW_FIELDS);
    const [page, setPage] = useState(0); // For preview table pagination
    const [rowsPerPage, setRowsPerPage] = useState(20); // Default rows per page
    const [currentPageRows, setCurrentPageRows] = useState<any[]>([]); // Only current page
    const [totalRows, setTotalRows] = useState(0); // Total number of rows in file
    const [editBuffer, setEditBuffer] = useState<Record<number, any>>({}); // Edits by row index
    const [isParsing, setIsParsing] = useState(false); // Parsing state
    const [mapping, setMapping] = useState<Record<string, string>>({}); // Manual field mapping
    const [mappingStep, setMappingStep] = useState(true); // Show mapping step after upload
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set()); // Selected global row indices
    const [showOnlySelected, setShowOnlySelected] = useState(false); // Toggle for previewing only selected
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<'all' | 'page' | 'selected' | null>(null);
    const [importingRowsCount, setImportingRowsCount] = useState(0);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
    // Buffered lazy loading: cache rows for each page
    const [pageBuffer, setPageBuffer] = useState<Map<number, any[]>>(new Map());
    const [mappingError, setMappingError] = useState<string | null>(null);
    const [papaParseDebug, setPapaParseDebug] = useState<any>(null); // For debugging raw PapaParse result

    const stepLabels = ['Upload', 'Mapping', 'Preview', 'Import'];

    // Update allFields whenever previewRows or headers change
    useEffect(() => {
        if (previewRows.length > 0) {
            const allKeys = new Set<string>([...PREVIEW_FIELDS]);
            previewRows.forEach((row: any) => Object.keys(row).forEach(k => allKeys.add(k)));
            setAllFields(Array.from(allKeys));
        }
    }, [previewRows, headers]);

    // Reset page when previewRows changes
    useEffect(() => {
        setPage(0);
    }, [previewRows]);

    // Reset page and clear buffer when file changes
    useEffect(() => {
        setPage(0);
        setEditBuffer({});
        setCurrentPageRows([]);
        setTotalRows(0);
        setPageBuffer(new Map());
    }, [file]);

    // When headers are set, initialize default mapping (auto-map by name)
    useEffect(() => {
        if (headers.length > 0 && mappingStep) {
            const autoMap: Record<string, string> = {};
            PREVIEW_FIELDS.forEach(field => {
                const found = headers.find(h => normalizeFieldName(h) === field);
                if (found) autoMap[field] = found;
            });
            setMapping(autoMap);
        }
    }, [headers, mappingStep]);

    // Helper to map a CSV row to internal schema using mapping
    const mapRowWithMapping = (row: Record<string, any>) => {
        const mapped: Record<string, any> = {};
        Object.entries(mapping).forEach(([internal, csvCol]) => {
            mapped[internal] = row[csvCol];
        });
        // Ensure name, email, and phone fields are set for LeadList and Kanban
        mapped.name = [mapped.first_name, mapped.last_name].filter(Boolean).join(' ').trim();
        mapped.email = mapped.email_address || mapped.email_work || mapped.email_home || mapped.email_other || '';
        mapped.phone = mapped.direct_phone_number || mapped.mobile_phone || mapped.phone_work || mapped.phone_home || mapped.phone_other || '';
        return mapped;
    };

    // When user clicks 'Continue to Preview' after mapping, set showPreview true and load the first page
    const handleContinueToPreview = () => {
        if (!isMappingValid()) {
            setMappingError('Please map all required fields before continuing.');
            return;
        }
        setMappingError(null);
        setMappingStep(false);
        setShowPreview(true);
        loadPage(0, rowsPerPage);
        setActiveStep(2);
    };

    // Helper to load and buffer a page, and prefetch next/prev
    const loadPage = (pageNum: number, perPage: number, onlySelected: boolean = false) => {
        if (!file) return;
        // If page is in buffer, use it
        if (pageBuffer.has(pageNum)) {
            setCurrentPageRows(pageBuffer.get(pageNum)!);
            setShowPreview(true);
            setIsParsing(false);
        } else {
            setIsParsing(true);
            let rows: any[] = [];
            let rowIdx = 0;
            let headersSet = false;
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                step: (result: any, parser: any) => {
                    if (!headersSet && result.meta && result.meta.fields) {
                        setHeaders(result.meta.fields);
                        headersSet = true;
                    }
                    const isInPage = rowIdx >= pageNum * perPage && rowIdx < (pageNum + 1) * perPage;
                    const isSelected = selectedRows.has(rowIdx);
                    if ((onlySelected && isInPage && isSelected) || (!onlySelected && isInPage)) {
                        let mapped = mappingStep ? result.data : mapRowWithMapping(result.data);
                        rows.push(editBuffer[rowIdx] ? { ...mapped, ...editBuffer[rowIdx] } : mapped);
                    }
                    rowIdx++;
                },
                complete: () => {
                    setCurrentPageRows(rows);
                    setTotalRows(rowIdx);
                    setIsParsing(false);
                    setShowPreview(true);
                    // Update buffer
                    setPageBuffer(prev => {
                        const next = new Map(prev);
                        next.set(pageNum, rows);
                        return next;
                    });
                    // Prefetch next and previous pages in the background
                    [pageNum - 1, pageNum + 1].forEach(p => {
                        if (p >= 0 && !pageBuffer.has(p)) {
                            let preRows: any[] = [];
                            let preIdx = 0;
                            Papa.parse(file, {
                                header: true,
                                skipEmptyLines: true,
                                step: (result: any) => {
                                    const isInPage = preIdx >= p * perPage && preIdx < (p + 1) * perPage;
                                    const isSelected = selectedRows.has(preIdx);
                                    if ((onlySelected && isInPage && isSelected) || (!onlySelected && isInPage)) {
                                        let mapped = mappingStep ? result.data : mapRowWithMapping(result.data);
                                        preRows.push(editBuffer[preIdx] ? { ...mapped, ...editBuffer[preIdx] } : mapped);
                                    }
                                    preIdx++;
                                },
                                complete: () => {
                                    setPageBuffer(prev => {
                                        const next = new Map(prev);
                                        next.set(p, preRows);
                                        return next;
                                    });
                                },
                            });
                        }
                    });
                },
            });
        }
    };

    // On file, page, rowsPerPage, mappingStep, showOnlySelected, or selectedRows change, load the current page accordingly
    useEffect(() => {
        if (file && !mappingStep) {
            loadPage(page, rowsPerPage, showOnlySelected);
        }
    }, [file, page, rowsPerPage, mappingStep, showOnlySelected, selectedRows]);

    // After file upload, set mappingStep to true
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setShowPreview(false);
        setImportResult(null);
        setImportError(null);
        setHeaders([]);
        setMissingRequiredRows([]);
        setMapping({});
        // Parse first row to get headers
        Papa.parse(f, {
            header: true,
            preview: 1,
            skipEmptyLines: true,
            complete: (results: any) => {
                // Debug log for full PapaParse result
                // eslint-disable-next-line no-console
                console.log('PapaParse preview result:', results);
                setPapaParseDebug(results);
                setHeaders(results.meta.fields || []);
                setMappingStep(true);
                setActiveStep(1); // Go to mapping step
            },
        });
    };

    // Step 2: Edit preview table (now edits editBuffer)
    const handleCellChange = (rowIdx: number, field: string, value: string) => {
        setEditBuffer(prev => ({
            ...prev,
            [rowIdx]: { ...prev[rowIdx], [field]: value },
        }));
    };

    // Helper to get global row indices for current page
    const getCurrentPageIndices = () => {
        return pagedRows.map((_, idx) => page * rowsPerPage + idx);
    };
    // Select all/none for current page
    const handleSelectAllPage = (checked: boolean) => {
        const indices = getCurrentPageIndices();
        setSelectedRows(prev => {
            const next = new Set(prev);
            indices.forEach(idx => {
                if (checked) next.add(idx);
                else next.delete(idx);
            });
            return next;
        });
    };
    // Select individual row
    const handleSelectRow = (globalIdx: number, checked: boolean) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (checked) next.add(globalIdx);
            else next.delete(globalIdx);
            return next;
        });
    };
    // Toggle preview only selected
    const handleShowOnlySelected = () => setShowOnlySelected(s => !s);

    // Open confirmation dialog before import
    const openConfirm = (type: 'all' | 'page' | 'selected') => {
        setConfirmType(type);
        if (type === 'all') setImportingRowsCount(totalRows);
        else if (type === 'page') setImportingRowsCount(pagedRows.length);
        else if (type === 'selected') setImportingRowsCount(selectedRows.size);
        setConfirmOpen(true);
    };
    const closeConfirm = () => setConfirmOpen(false);
    // On confirm, run the import
    const handleConfirmImport = () => {
        setConfirmOpen(false);
        setImportSuccess(false);
        setImportErrorMsg(null);
        if (confirmType === 'all') handleImportAll();
        else if (confirmType === 'page') handleImportPage();
        else if (confirmType === 'selected') handleImportSelected();
    };

    // Import helpers
    const importRows = (rowIndices: number[] | null) => {
        if (missingRequiredRows.length > 0) {
            setImportError('Some rows in the preview are missing required fields. Please fix your CSV.');
            setImportErrorMsg('Some rows in the preview are missing required fields. Please fix your CSV.');
            return;
        }
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        setImportError(null);
        setImportSuccess(false);
        setImportErrorMsg(null);
        let allRows: any[] = [];
        let importedIndices: number[] = [];
        let rowIdx = 0;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: (result: any) => {
                let mapped = mappingStep ? result.data : mapRowWithMapping(result.data);
                if (editBuffer[rowIdx]) mapped = { ...mapped, ...editBuffer[rowIdx] };
                // If rowIndices is null, import all; else only if included
                if (!rowIndices || rowIndices.includes(rowIdx)) {
                    allRows.push(mapped);
                    importedIndices.push(rowIdx);
                }
                rowIdx++;
            },
            complete: () => {
                importLeads(allRows)
                    .then(() => {
                        setImportResult('Leads imported successfully');
                        setImportSuccess(true);
                        setImportErrorMsg(null);
                        notify('Leads imported successfully', { type: 'success' });
                        setActiveStep(2);
                        // Remove imported rows from previewRows, editBuffer, selectedRows, and pageBuffer
                        setPreviewRows(prev => prev.filter((_, idx) => !importedIndices.includes(idx)));
                        setEditBuffer(prev => {
                            const next = { ...prev };
                            importedIndices.forEach(idx => delete next[idx]);
                            return next;
                        });
                        setSelectedRows(prev => {
                            const next = new Set(prev);
                            importedIndices.forEach(idx => next.delete(idx));
                            return next;
                        });
                        setPageBuffer(prev => {
                            const next = new Map(prev);
                            for (const [pageNum, rows] of next.entries()) {
                                next.set(pageNum, rows.filter((_, idx) => !importedIndices.includes(page * rowsPerPage + idx)));
                            }
                            return next;
                        });
                        setTotalRows(t => t - importedIndices.length);
                    })
                    .catch(() => {
                        setImportError('Error importing leads');
                        setImportErrorMsg('Error importing leads');
                        setImportSuccess(false);
                        notify('Error importing leads', { type: 'error' });
                    })
                    .finally(() => setImporting(false));
            },
        });
    };
    // Import all
    const handleImportAll = () => importRows(null);
    // Import current page
    const handleImportPage = () => {
        const indices = getCurrentPageIndices();
        importRows(indices);
    };
    // Import selected
    const handleImportSelected = () => {
        importRows(Array.from(selectedRows));
    };

    // Use buffer for currentPageRows if available
    const pagedRows = pageBuffer.get(page) || currentPageRows;
    const pageCount = Math.ceil(totalRows / rowsPerPage);
    // For preview, filter pagedRows if showOnlySelected
    const previewRowsToShow = showOnlySelected
        ? pagedRows.filter((_, idx) => selectedRows.has(page * rowsPerPage + idx))
        : pagedRows;

    // Show spinner if page is not loaded
    const isPageLoading = isParsing || !pageBuffer.has(page);

    // Restore handleZoomInfoImport
    const handleZoomInfoImport = async () => {
        setImporting(true);
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
            setImportResult({ ...summary, imported, updated, failed });
            localStorage.setItem('zoominfo_last_import', new Date().toISOString());
            notify('Leads imported from ZoomInfo API successfully', { type: 'success' });
        } catch (err) {
            notify('Error importing from ZoomInfo API', { type: 'error' });
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setShowPreview(false);
        setPreviewRows([]);
        setHeaders([]);
        setImporting(false);
        setImportResult(null);
        setImportError(null);
        setMissingRequiredRows([]);
        setActiveStep(0);
        setMappingStep(true);
        setMapping({});
        setPage(0);
        setEditBuffer({});
        setCurrentPageRows([]);
        setTotalRows(0);
        setPageBuffer(new Map());
        setMappingError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isMappingValid = () => {
        return REQUIRED_FIELDS.every(field => mapping[field] && mapping[field].trim() !== '');
    };

    // Debug log for headers in mapping step
    useEffect(() => {
        if (activeStep === 1) {
            // eslint-disable-next-line no-console
            console.log('MappingStep headers:', headers);
        }
    }, [activeStep, headers]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Import Leads</DialogTitle>
            {/* Step summary bar */}
            <Box sx={{ p: 2, mb: 2, background: '#f5f7fa', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">
                    <strong>Step:</strong> {stepLabels[activeStep]}
                </Typography>
                {file && (
                    <Typography variant="subtitle2" sx={{ ml: 2 }}>
                        <strong>File:</strong> {file.name}
                    </Typography>
                )}
                {activeStep >= 2 && (
                    <Typography variant="subtitle2" sx={{ ml: 2 }}>
                        <strong>Rows:</strong> {totalRows}
                    </Typography>
                )}
            </Box>
            <DialogContent>
                <Stepper activeStep={activeStep} orientation="horizontal">
                    <Step key="upload">
                        <StepLabel>Upload CSV File</StepLabel>
                    </Step>
                    <Step key="mapping">
                        <StepLabel>Map Fields</StepLabel>
                    </Step>
                    <Step key="preview">
                        <StepLabel>Preview & Import</StepLabel>
                    </Step>
                </Stepper>
                {/* Step content below the Stepper */}
                {activeStep === 0 && (
                    <Box sx={{ mt: 2 }}>
                        <UploadStep file={file} onFileChange={handleFileChange} onNext={() => setActiveStep(1)} fileInputRef={fileInputRef as React.RefObject<HTMLInputElement | null>} />
                        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => {
                            // Download a template CSV
                            const csv = PREVIEW_FIELDS.join(',') + '\n';
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'lead_import_template.csv';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}>Download Template CSV</Button>
                    </Box>
                )}
                {activeStep === 1 && (
                    <Box sx={{ mt: 2, border: '2px dashed #1976d2', background: '#e3f2fd', p: 2 }}>
                        <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 8 }}>Mapping step here (debug)</div>
                        <div style={{ marginBottom: 8 }}>Headers detected: <span style={{ color: '#d32f2f' }}>{headers && headers.length > 0 ? headers.join(', ') : 'None'}</span></div>
                        {headers.length === 0 && (
                            <>
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    No headers found in the selected file. Please check your CSV for a header row as the first line.
                                </Alert>
                                {/* Debug: show raw PapaParse result */}
                                <Box sx={{ fontSize: 12, color: '#333', background: '#fffde7', p: 1, border: '1px solid #fbc02d', mb: 2 }}>
                                    <div>Raw PapaParse result:</div>
                                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(papaParseDebug, null, 2)}</pre>
                                </Box>
                            </>
                        )}
                        {headers.length > 0 && (
                            <MappingStep mappingStep={mappingStep} headers={headers} mapping={mapping} setMapping={setMapping} onContinue={handleContinueToPreview} />
                        )}
                        {mappingError && <Alert severity="error" sx={{ mt: 2 }}>{mappingError}</Alert>}
                        <Button variant="contained" onClick={handleContinueToPreview} disabled={!isMappingValid()} sx={{ mt: 2 }}>
                            Continue to Preview
                        </Button>
                    </Box>
                )}
                {activeStep === 2 && (
                    <PreviewStep
                        importErrorMsg={importErrorMsg}
                        importSuccess={importSuccess}
                        showPreview={showPreview}
                        isPageLoading={isPageLoading}
                        previewRowsToShow={previewRowsToShow}
                        pagedRows={pagedRows}
                        selectedRows={selectedRows}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        pageCount={pageCount}
                        allFields={allFields}
                        handleShowOnlySelected={handleShowOnlySelected}
                        showOnlySelected={showOnlySelected}
                        getCurrentPageIndices={getCurrentPageIndices}
                        handleSelectAllPage={handleSelectAllPage}
                        handleSelectRow={handleSelectRow}
                        handleCellChange={handleCellChange}
                        REQUIRED_FIELDS={REQUIRED_FIELDS}
                        CONTACT_FIELDS={CONTACT_FIELDS}
                        setPage={setPage}
                        setRowsPerPage={setRowsPerPage}
                        importAccess={importAccess}
                        openConfirm={openConfirm}
                        importing={importing}
                        missingRequiredRows={missingRequiredRows}
                        handleImportAll={handleImportAll}
                        handleImportPage={handleImportPage}
                        handleImportSelected={handleImportSelected}
                        confirmOpen={confirmOpen}
                        closeConfirm={closeConfirm}
                        confirmType={confirmType}
                        totalRows={totalRows}
                        handleConfirmImport={handleConfirmImport}
                        importResult={importResult}
                        importError={importError}
                        setActiveStep={setActiveStep}
                        ClearAllSelectionsButton={selectedRows.size > 0 ? (
                            <Button sx={{ mb: 1 }} variant="outlined" color="warning" onClick={() => setSelectedRows(new Set())}>
                                Clear All Selections
                            </Button>
                        ) : null}
                    />
                )}
                <Box sx={{ mt: 4 }}>
                    <Button variant="contained" color="primary" onClick={handleReset} sx={{ mr: 2 }}>
                        Reset
                    </Button>
                    <Button variant="contained" color="secondary" onClick={handleZoomInfoImport}>
                        Import from ZoomInfo API
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={importing}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default LeadImportDialog; 