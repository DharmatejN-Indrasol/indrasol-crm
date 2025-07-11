import { useCallback } from 'react';
import { useDataProvider, useGetIdentity } from 'react-admin';
import type { DataProvider } from 'react-admin';

export type LeadImportSchema = {
    zoominfo_contact_id?: string;
    last_name: string;
    first_name: string;
    middle_name?: string;
    salutation?: string;
    suffix?: string;
    job_title?: string;
    management_level?: string;
    job_start_date?: string;
    job_function?: string;
    department?: string;
    company_division_name?: string;
    direct_phone_number?: string;
    email_address?: string;
    email_domain?: string;
    mobile_phone?: string;
    highest_level_of_education?: string;
    contact_accuracy_score?: string;
    contact_accuracy_grade?: string;
    zoominfo_contact_profile_url?: string;
    linkedin_contact_profile_url?: string;
    notice_provided_date?: string;
    person_street?: string;
    person_city?: string;
    person_state?: string;
    person_zip_code?: string;
    country?: string;
    zoominfo_company_id?: string;
    company_name: string;
    website?: string;
    founded_year?: number;
    company_hq_phone?: string;
    fax?: string;
    ticker?: string;
    revenue?: string;
    revenue_range?: string;
    employees?: number;
    employee_range?: string;
    sic_codes?: string;
    naics_codes?: string;
    primary_industry?: string;
    primary_sub_industry?: string;
    all_industries?: string;
    all_sub_industries?: string;
    industry_hierarchical_category?: string;
    secondary_industry_hierarchical_category?: string;
    alexa_rank?: number;
    zoominfo_company_profile_url?: string;
    linkedin_company_profile_url?: string;
    facebook_company_profile_url?: string;
    twitter_company_profile_url?: string;
    ownership_type?: string;
    business_model?: string;
    certified_active_company?: string;
    certification_date?: string;
    total_funding_amount?: number;
    recent_funding_amount?: number;
    recent_funding_round?: string;
    recent_funding_date?: string;
    recent_investors?: string;
    all_investors?: string;
    company_street_address?: string;
    company_city?: string;
    company_state?: string;
    company_zip_code?: string;
    company_country?: string;
    full_address?: string;
    query_name?: string;
    gender?: string;
    title?: string;
    email_work?: string;
    email_home?: string;
    email_other?: string;
    phone_work?: string;
    phone_home?: string;
    phone_other?: string;
    background?: string;
    avatar?: string;
    first_seen?: string;
    last_seen?: string;
    has_newsletter?: string;
    status?: string;
    tags?: string;
    linkedin_url?: string;
    owner_id?: number;
    created_at?: string;
    updated_at?: string;
};

export function useLeadImport() {
    const today = new Date().toISOString();
    const user = useGetIdentity();
    const dataProvider = useDataProvider();
    const allowedFields = [
        'first_name', 'last_name', 'company_name', 'company_id', 'owner_id', 'status', 'source', 'notes', 'created_by',
        'zoominfo_contact_id', 'middle_name', 'salutation', 'suffix', 'job_title', 'management_level', 'job_start_date',
        'job_function', 'department', 'company_division_name', 'direct_phone_number', 'email_address', 'email_domain',
        'mobile_phone', 'highest_level_of_education', 'contact_accuracy_score', 'contact_accuracy_grade',
        'zoominfo_contact_profile_url', 'linkedin_contact_profile_url', 'notice_provided_date', 'person_street',
        'person_city', 'person_state', 'person_zip_code', 'country', 'zoominfo_company_id', 'website', 'founded_year',
        'company_hq_phone', 'fax', 'ticker', 'revenue', 'revenue_range', 'employees', 'employee_range', 'sic_codes',
        'naics_codes', 'primary_industry', 'primary_sub_industry', 'all_industries', 'all_sub_industries',
        'industry_hierarchical_category', 'secondary_industry_hierarchical_category', 'alexa_rank',
        'zoominfo_company_profile_url', 'linkedin_company_profile_url', 'facebook_company_profile_url',
        'twitter_company_profile_url', 'ownership_type', 'business_model', 'certified_active_company', 'certification_date',
        'total_funding_amount', 'created_at', 'updated_at'
    ];
    const contactFields = [
        'email_address', 'direct_phone_number', 'mobile_phone',
        'email_work', 'email_home', 'email_other',
        'phone_work', 'phone_home', 'phone_other',
        'linkedin_contact_profile_url', 'linkedin_url',
        'zoominfo_contact_profile_url', 'zoominfo_company_profile_url',
        'facebook_company_profile_url', 'twitter_company_profile_url'
    ];
    const processBatch = useCallback(
        async (batch: LeadImportSchema[]) => {
            await Promise.all(
                batch.map(async (lead) => {
                    // Validation: required fields
                    if (!lead.first_name || !lead.last_name || !lead.company_name) {
                        throw new Error('Missing required fields: first_name, last_name, or company_name');
                    }
                    // Validation: at least one contact field
                    const hasContact = contactFields.some(field => lead[field as keyof LeadImportSchema] && String(lead[field as keyof LeadImportSchema]).trim() !== '');
                    if (!hasContact) {
                        throw new Error('At least one contact field (email, phone, LinkedIn, etc.) is required.');
                    }
                    // Only send allowed fields
                    const leadData: Record<string, any> = Object.fromEntries(
                        Object.entries(lead)
                            .filter(([key, value]) => allowedFields.includes(key) && value !== undefined && value !== null && value !== '')
                    );
                    // Type validation for numbers
                    ['founded_year', 'employees', 'alexa_rank', 'total_funding_amount'].forEach(field => {
                        if (leadData[field]) leadData[field] = Number(leadData[field]);
                    });
                    await dataProvider.create('leads', {
                        data: {
                            ...leadData,
                            owner_id: lead.owner_id || user?.identity?.id,
                            created_at: lead.created_at || today,
                            updated_at: lead.updated_at || today,
                        },
                    });
                })
            );
        },
        [dataProvider, user?.identity?.id, today]
    );
    return processBatch;
}

export const PREVIEW_FIELDS = [
    'first_name', 'last_name', 'company_name', 'status',
    'email_address', 'direct_phone_number', 'mobile_phone',
    'email_work', 'email_home', 'email_other',
    'phone_work', 'phone_home', 'phone_other',
    'linkedin_contact_profile_url', 'linkedin_url',
    'zoominfo_contact_profile_url', 'zoominfo_company_profile_url',
    'facebook_company_profile_url', 'twitter_company_profile_url'
];

export const REQUIRED_FIELDS = [
    'first_name', 'last_name', 'company_name'
]; 