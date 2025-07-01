import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

const exchangeCodeForToken = async (provider: string, code: string) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const tokenUrl = `${supabaseUrl}/auth/v1/token?grant_type=authorization_code&code=${code}`;
    
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to exchange code: ${JSON.stringify(error)}`);
    }

    return response.json();
};

const getProviderProfile = async (provider: string, accessToken: string) => {
    let url = '';
    if (provider === 'google') {
        url = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
    } else if (provider === 'azure') {
        url = 'https://graph.microsoft.com/v1.0/me';
    } else {
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch profile for ${provider}`);
    }

    return response.json();
};


serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const provider = url.searchParams.get('provider') || 'google'; // default to google

        if (!code) {
            throw new Error('Authorization code not found.');
        }

        const tokenData = await exchangeCodeForToken(provider, code);
        const { access_token, refresh_token, expires_at, user } = tokenData;

        if (!user || !user.id) {
            throw new Error('User not found in token response.');
        }

        const profileInfo = await getProviderProfile(provider, access_token);
        
        const supabaseAdmin = getSupabaseAdmin();

        const integrationData = {
            user_id: user.id,
            provider: provider,
            refresh_token,
            access_token,
            expires_at: new Date(expires_at * 1000).toISOString(),
            scopes: tokenData.scopes || [],
            profile_info: {
                email: profileInfo.email || user.email,
                name: profileInfo.name,
                picture: profileInfo.picture || profileInfo.avatar_url,
            },
        };

        const { error } = await supabaseAdmin
            .from('calendar_integrations')
            .upsert(integrationData, { onConflict: 'user_id,provider' });
        
        if (error) {
            throw error;
        }

        // Redirect back to the settings page
        const redirectUrl = new URL('/settings/calendar?success=true', url.origin);
        return Response.redirect(redirectUrl.toString(), 302);

    } catch (error) {
        console.error('OAuth callback error:', error);
        const redirectUrl = new URL('/settings/calendar?error=' + encodeURIComponent(error.message), new URL(req.url).origin);
        return Response.redirect(redirectUrl.toString(), 302);
    }
}); 