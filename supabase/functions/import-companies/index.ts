// Permissions: Requires a valid Supabase JWT in the Authorization header. Only authenticated users can access.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { supabaseAdmin } from '../shared/supabaseAdmin.ts';
import { corsHeaders, createErrorResponse } from '../shared/utils.ts';

// Test ZoomInfo credentials (replace with real env vars in production)
const ZOOMINFO_CLIENT_ID = Deno.env.get('ZOOMINFO_CLIENT_ID') ?? 'test-client-id';
const ZOOMINFO_CLIENT_SECRET = Deno.env.get('ZOOMINFO_CLIENT_SECRET') ?? 'test-client-secret';
const ZOOMINFO_AUTH_URL = Deno.env.get('ZOOMINFO_AUTH_URL') ?? 'https://api.zoominfo.com/authenticate';
const ZOOMINFO_COMPANIES_URL = 'https://api.zoominfo.com/companies';

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

async function fetchZoomInfoCompanies(token, filters) {
    // Build query params from filters
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.revenueRange) params.append('revenueRange', filters.revenueRange);
    if (filters?.country) params.append('country', filters.country);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.employeeCount) params.append('employeeCount', filters.employeeCount);
    // Add more filters as needed
    const url = `${ZOOMINFO_COMPANIES_URL}?${params.toString()}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch companies from ZoomInfo');
    const data = await res.json();
    return data.companies || data; // adjust as per actual API response
}

function mapZoomInfoCompanyToInternal(company) {
    // Map ZoomInfo API fields to Supabase companies schema
    let contextLinks = [];
    if (company.context_links) {
        contextLinks = company.context_links.split(',').map(link => link.trim()).filter(Boolean);
    }
    return {
        external_id: company.zoominfo_company_id || company.companyId || '',
        name: company.name || company.companyName || '',
        logo: company.logo || '',
        sector: company.sector || company.industry || '',
        size: company.size || '',
        linkedin_url: company.linkedin_url || company.linkedinCompanyProfileUrl || '',
        website: company.website || '',
        phone_number: company.phone_number || company.phone || '',
        address: company.address || '',
        zipcode: company.zipcode || '',
        city: company.city || '',
        description: company.description || '',
        revenue: company.revenue || '',
        tax_identifier: company.tax_identifier || '',
        country: company.country || '',
        context_links: contextLinks,
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    // JWT authentication
    const authHeader = req.headers.get('Authorization');
    const localClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );
    const { data } = await localClient.auth.getUser();
    if (!data?.user) {
        return createErrorResponse(401, 'Unauthorized: Valid Supabase JWT required.');
    }
    try {
        const filters = req.method === 'POST' ? await req.json() : {};
        // 1. Authenticate with ZoomInfo
        const token = await getZoomInfoToken();
        // 2. Fetch companies with filters
        const companies = await fetchZoomInfoCompanies(token, filters);
        // 3. Return companies to frontend for further processing
        return new Response(JSON.stringify({ companies }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    } catch (e) {
        return createErrorResponse(500, `Import failed: ${(e as Error).message}`);
    }
}); 