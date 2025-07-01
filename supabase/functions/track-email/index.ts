import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin } from '../shared/supabaseAdmin.ts';

// 1x1 transparent GIF
const PIXEL = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]);

serve(async (req) => {
    const url = new URL(req.url);
    const logId = url.searchParams.get('log_id');

    if (logId) {
        try {
            const supabase = getSupabaseAdmin();
            // Update the communication log to mark it as 'opened'
            const { data: log, error: logError } = await supabase
                .from('communication_logs')
                .update({ status: 'opened', metadata: { opened_at: new Date().toISOString() } })
                .eq('id', logId)
                .select('lead_id')
                .single();

            if (logError) {
                console.error('Error updating communication log:', logError);
            }

            if (log && log.lead_id) {
                // Update the lead's email_tracking and last_activity_at fields
                 const { error: leadError } = await supabase.rpc('update_lead_email_tracking', {
                    p_lead_id: log.lead_id,
                    p_tracking_event: 'open'
                });

                if(leadError) {
                    console.error('Error updating lead email tracking:', leadError);
                }
            }

        } catch (e) {
            console.error('Tracking pixel error:', e);
        }
    }

    return new Response(PIXEL, {
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        },
    });
}); 