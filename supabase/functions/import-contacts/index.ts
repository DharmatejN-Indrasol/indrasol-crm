// Permissions: Requires a valid Supabase JWT in the Authorization header. Only authenticated users can access.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { supabaseAdmin } from '../shared/supabaseAdmin.ts';
import { corsHeaders, createErrorResponse } from '../shared/utils.ts';

// Test ZoomInfo credentials (replace with real env vars in production)
const ZOOMINFO_CLIENT_ID = Deno.env.get('ZOOMINFO_CLIENT_ID') ?? 'test-client-id';
const ZOOMINFO_CLIENT_SECRET = Deno.env.get('ZOOMINFO_CLIENT_SECRET') ?? 'test-client-secret';
const ZOOMINFO_AUTH_URL = Deno.env.get('ZOOMINFO_AUTH_URL') ?? 'https://api.zoominfo.com/authenticate';
const ZOOMINFO_CONTACTS_URL = 'https://api.zoominfo.com/contacts';

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

async function fetchZoomInfoContacts(token, filters) {
    // Build query params from filters
    const params = new URLSearchParams();
    if (filters?.jobTitle) params.append('jobTitle', filters.jobTitle);
    if (filters?.state) params.append('state', filters.state);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.managementLevel) params.append('managementLevel', filters.managementLevel);
    if (filters?.emailDomain) params.append('emailDomain', filters.emailDomain);
    if (filters?.companySize) params.append('companySize', filters.companySize);
    // Add more filters as needed
    const url = `${ZOOMINFO_CONTACTS_URL}?${params.toString()}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error('Failed to fetch contacts from ZoomInfo');
    const data = await res.json();
    return data.contacts || data; // adjust as per actual API response
}

function mapZoomInfoContactToInternal(contact: any) {
    // Minimal mapping for test/demo; expand as needed
    return {
        first_name: contact.firstName || '',
        last_name: contact.lastName || '',
        email_jsonb: [{ email: contact.email, type: 'Work' }],
        phone_jsonb: contact.phone ? [{ number: contact.phone, type: 'Work' }] : [],
        company_name: contact.company || '',
        linkedin_url: contact.linkedinUrl || '',
        external_id: contact.contactId || '',
        background: contact.title || '',
        // Add more fields as needed
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
        // 2. Fetch contacts with filters
        const contacts = await fetchZoomInfoContacts(token, filters);
        // 3. Return contacts to frontend for further processing
        return new Response(JSON.stringify({ contacts }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    } catch (e) {
        return createErrorResponse(500, `Import failed: ${(e as Error).message}`);
    }
}); 