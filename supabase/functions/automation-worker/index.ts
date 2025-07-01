import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/cors.ts';
import { getSupabaseAdmin } from '../shared/supabaseAdmin.ts';

const BATCH_SIZE = 50;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = getSupabaseAdmin();

        // Process leads with pending follow-ups
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select(`
                id,
                name,
                email,
                phone,
                sequence_id,
                sequence_step,
                next_follow_up_at,
                metadata
            `)
            .is('sequence_id', null)
            .lte('next_follow_up_at', new Date().toISOString())
            .limit(BATCH_SIZE);

        if (leadsError) throw leadsError;

        // Process each lead
        for (const lead of leads || []) {
            try {
                // Get sequence
                const { data: sequence, error: sequenceError } = await supabase
                    .from('sequences')
                    .select('*')
                    .eq('id', lead.sequence_id)
                    .single();

                if (sequenceError) throw sequenceError;
                if (!sequence) continue;

                // Get current step
                const currentStep = sequence.steps[lead.sequence_step];
                if (!currentStep) {
                    // Sequence completed
                    await supabase
                        .from('leads')
                        .update({
                            sequence_id: null,
                            sequence_step: null,
                            next_follow_up_at: null,
                        })
                        .eq('id', lead.id);
                    continue;
                }

                // Process step
                await processStep(supabase, lead, sequence, currentStep);

                // Move to next step
                const nextStep = sequence.steps[lead.sequence_step + 1];
                await supabase
                    .from('leads')
                    .update({
                        sequence_step: lead.sequence_step + 1,
                        next_follow_up_at: nextStep ? calculateNextFollowUp(nextStep) : null,
                    })
                    .eq('id', lead.id);
            } catch (error) {
                console.error(`Error processing lead ${lead.id}:`, error);
                // Log error and continue with next lead
                await supabase
                    .from('automation_errors')
                    .insert({
                        lead_id: lead.id,
                        error: error.message,
                        metadata: { stack: error.stack },
                    });
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

async function processStep(supabase: any, lead: any, sequence: any, step: any) {
    // Get template if specified
    let template = null;
    if (step.template_id) {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', step.template_id)
            .single();

        if (error) throw error;
        template = data;
    }

    // Execute step based on type
    switch (step.type) {
        case 'email':
            await sendEmail(supabase, lead, template);
            break;
        case 'sms':
            await sendSMS(supabase, lead, template);
            break;
        case 'call':
            await createCallTask(supabase, lead, template);
            break;
        case 'task':
            await createTask(supabase, lead, template);
            break;
    }

    // Log communication
    await supabase
        .from('communication_logs')
        .insert({
            lead_id: lead.id,
            type: step.type,
            direction: 'outbound',
            status: 'completed',
            content: template?.content,
            template_id: template?.id,
            sequence_id: sequence.id,
            metadata: {
                step_index: lead.sequence_step,
                variables: extractVariables(lead),
            },
        });
}

function calculateNextFollowUp(step: any): string {
    const now = new Date();
    switch (step.delay_unit) {
        case 'minutes':
            now.setMinutes(now.getMinutes() + step.delay);
            break;
        case 'hours':
            now.setHours(now.getHours() + step.delay);
            break;
        case 'days':
            now.setDate(now.getDate() + step.delay);
            break;
    }
    return now.toISOString();
}

async function sendEmail(supabase: any, lead: any, template: any) {
    if (!template) throw new Error('Email template required');
    if (!lead.email) throw new Error('Lead email required');

    const content = replaceVariables(template.content, lead);
    const subject = replaceVariables(template.subject || '', lead);

    // TODO: Integrate with email service (e.g., SendGrid, Mailgun)
    // For now, just log
    console.log('Sending email:', { to: lead.email, subject, content });
}

async function sendSMS(supabase: any, lead: any, template: any) {
    if (!template) throw new Error('SMS template required');
    if (!lead.phone) throw new Error('Lead phone required');

    const content = replaceVariables(template.content, lead);

    // TODO: Integrate with SMS service (e.g., Twilio)
    // For now, just log
    console.log('Sending SMS:', { to: lead.phone, content });
}

async function createCallTask(supabase: any, lead: any, template: any) {
    const script = template ? replaceVariables(template.content, lead) : '';

    await supabase
        .from('tasks')
        .insert({
            title: `Call ${lead.name}`,
            description: script,
            due_date: new Date().toISOString(),
            type: 'call',
            lead_id: lead.id,
            status: 'pending',
        });
}

async function createTask(supabase: any, lead: any, template: any) {
    const description = template ? replaceVariables(template.content, lead) : '';

    await supabase
        .from('tasks')
        .insert({
            title: `Follow up with ${lead.name}`,
            description,
            due_date: new Date().toISOString(),
            type: 'follow_up',
            lead_id: lead.id,
            status: 'pending',
        });
}

function replaceVariables(content: string, lead: any): string {
    const variables = extractVariables(lead);
    return content.replace(/\{\{(\w+)\}\}/g, (match: string, variable: string) => {
        return variables[variable] || match;
    });
}

function extractVariables(lead: any): Record<string, string> {
    return {
        name: lead.name,
        first_name: lead.name.split(' ')[0],
        last_name: lead.name.split(' ').slice(1).join(' '),
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        ...lead.metadata,
    };
} 