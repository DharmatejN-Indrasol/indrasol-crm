// Permissions: Requires a valid Supabase JWT in the Authorization header. Only authenticated users can access.
// @ts-ignore: Deno global types are available in the Edge Functions runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import supabaseAdmin from '../shared/supabaseAdmin.ts';
import { corsHeaders, createErrorResponse } from '../shared/utils.ts';

// @ts-ignore
const ZOOMINFO_CLIENT_ID = Deno.env.get('ZOOMINFO_CLIENT_ID') ?? 'test-client-id';
// @ts-ignore
const ZOOMINFO_CLIENT_SECRET = Deno.env.get('ZOOMINFO_CLIENT_SECRET') ?? 'test-client-secret';
// @ts-ignore
const ZOOMINFO_AUTH_URL = Deno.env.get('ZOOMINFO_AUTH_URL') ?? 'https://api.zoominfo.com/authenticate';
// @ts-ignore
const ZOOMINFO_LEADS_URL = Deno.env.get('ZOOMINFO_LEADS_URL') ?? 'https://api.zoominfo.com/leads/search'; // This might need adjustment based on actual ZoomInfo API

async function getZoomInfoToken() {
    const res = await fetch(ZOOMINFO_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientId: ZOOMINFO_CLIENT_ID,
            clientSecret: ZOOMINFO_CLIENT_SECRET,
        }),
    });
    if (!res.ok) throw new Error('Failed to authenticate with ZoomInfo');
    const data = await res.json();
    return data.accessToken;
}

function mapFrontendFiltersToZoomInfo(filters: Record<string, string>) {
    // Adjust these keys to match the ZoomInfo API exactly
    const mapping: Record<string, string> = {
        jobTitle: 'jobTitle', // or 'job_title' if ZoomInfo expects snake_case
        state: 'state',       // or 'locationState' if required
        industry: 'industry',
        managementLevel: 'managementLevel',
        emailDomain: 'emailDomain',
    };
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value && mapping[key]) {
            result[mapping[key]] = value;
        }
    }
    return result;
}

async function fetchZoomInfoLeads(token: string, filters: any) {
    const mappedFilters = mapFrontendFiltersToZoomInfo(filters);
    const params = new URLSearchParams(mappedFilters);
    const url = `${ZOOMINFO_LEADS_URL}?${params.toString()}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch leads from ZoomInfo');
    const data = await res.json();
    return data.leads || data; // adjust as per actual API response
}

function mapZoomInfoLeadToInternal(lead: any) {
    return {
        first_name: lead.firstName || '',
        last_name: lead.lastName || '',
        company_name: lead.companyName || '',
        job_title: lead.jobTitle || '',
        email_address: lead.email,
        direct_phone_number: lead.phone,
        zoominfo_contact_id: lead.zoominfo_contact_id,
        middle_name: lead.middleName,
        salutation: lead.salutation,
        suffix: lead.suffix,
        management_level: lead.managementLevel,
        job_start_date: lead.jobStartDate,
        job_function: lead.jobFunction,
        department: lead.department,
        company_division_name: lead.companyDivisionName,
        mobile_phone: lead.mobilePhone,
        email_domain: lead.emailDomain,
        highest_level_of_education: lead.highestLevelOfEducation,
        contact_accuracy_score: lead.contactAccuracyScore,
        contact_accuracy_grade: lead.contactAccuracyGrade,
        zoominfo_contact_profile_url: lead.zoominfoContactProfileUrl,
        linkedin_contact_profile_url: lead.linkedinContactProfileUrl,
        notice_provided_date: lead.noticeProvidedDate,
        person_street: lead.personStreet,
        person_city: lead.personCity,
        person_state: lead.personState,
        person_zip_code: lead.personZipCode,
        country: lead.country,
        zoominfo_company_id: lead.zoominfoCompanyId,
        website: lead.website,
        founded_year: lead.foundedYear,
        company_hq_phone: lead.companyHqPhone,
        fax: lead.fax,
        ticker: lead.ticker,
        revenue: lead.revenue,
        revenue_range: lead.revenueRange,
        employees: lead.employees,
        employee_range: lead.employeeRange,
        sic_codes: lead.sicCodes,
        naics_codes: lead.naicsCodes,
        primary_industry: lead.primaryIndustry,
        primary_sub_industry: lead.primarySubIndustry,
        all_industries: lead.allIndustries,
        all_sub_industries: lead.allSubIndustries,
        industry_hierarchical_category: lead.industryHierarchicalCategory,
        secondary_industry_hierarchical_category: lead.secondaryIndustryHierarchicalCategory,
        alexa_rank: lead.alexaRank,
        zoominfo_company_profile_url: lead.zoominfoCompanyProfileUrl,
        linkedin_company_profile_url: lead.linkedinCompanyProfileUrl,
        facebook_company_profile_url: lead.facebookCompanyProfileUrl,
        twitter_company_profile_url: lead.twitterCompanyProfileUrl,
        ownership_type: lead.ownershipType,
        business_model: lead.businessModel,
        certified_active_company: lead.certifiedActiveCompany,
        certification_date: lead.certificationDate,
        total_funding_amount: lead.totalFundingAmount,
    };
}

export async function handler(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    // JWT authentication
    const authHeader = req.headers.get('Authorization');
    // @ts-ignore
    const localClient = createClient(
        // @ts-ignore
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );
    const { data } = await localClient.auth.getUser();
    if (!data?.user) {
        return createErrorResponse(401, 'Unauthorized: Valid Supabase JWT required.');
    }
    try {
        const filters = req.method === 'POST' ? await req.json() : {};
        const token = await getZoomInfoToken();
        const leadsFromZoomInfo = await fetchZoomInfoLeads(token, filters);
        const leads = leadsFromZoomInfo.map(mapZoomInfoLeadToInternal);
        if (leads.length > 0) {
            const { error } = await supabaseAdmin.getClient().from('leads').upsert(leads, {
                onConflict: 'zoominfo_contact_id',
            });
            if (error) {
                throw error;
            }
        }
        return new Response(JSON.stringify({ leads }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    } catch (e) {
        return createErrorResponse(500, `Import failed: ${(e as Error).message}`);
    }
}

// @ts-ignore
Deno.serve(handler); 