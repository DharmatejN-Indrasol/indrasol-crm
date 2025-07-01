// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, createErrorResponse } from '../shared/utils.ts';

// console.log("Hello from Functions!")

// Import fetch if needed (Deno already supports it natively)
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
};

Deno.serve(async req => {
    // This is needed if you're deploying functions from a browser.
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
            return createErrorResponse(500, 'Missing environment variables.');
        }

        const { note_id, note_type } = await req.json();

        if (!note_id || !note_type) {
            throw new Error('Missing note_id or note_type in request body.');
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const tableName = note_type === 'contact' ? 'contactnotes' : 'dealnotes';

        // 1. Fetch the note text from the database
        const { data: noteData, error: fetchError } = await supabaseAdmin
            .from(tableName)
            .select('text')
            .eq('id', note_id)
            .single();

        if (fetchError || !noteData) {
            return createErrorResponse(404, `Failed to fetch note: ${fetchError?.message || 'Note not found'}`);
        }

        const noteText = noteData.text;

        if (!noteText) {
            return new Response(JSON.stringify({ summary: '' }), { headers });
        }

        // 2. Call OpenAI API to get the summary and sentiment
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert CRM assistant. Summarize the following note concisely in one sentence, and classify its sentiment as positive, neutral, or negative. Respond in JSON: {"summary": "...", "sentiment": "positive|neutral|negative"}',
                    },
                    { role: 'user', content: noteText },
                ],
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            return createErrorResponse(500, `OpenAI API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();
        let summary = '';
        let sentiment = '';
        try {
            const parsed = JSON.parse(result.choices?.[0]?.message?.content || '{}');
            summary = parsed.summary || '';
            sentiment = parsed.sentiment || '';
        } catch (e) {
            return createErrorResponse(500, 'Failed to parse OpenAI JSON response.');
        }

        if (!summary) {
            return createErrorResponse(500, 'Failed to extract summary from OpenAI response.');
        }
        if (!sentiment) {
            return createErrorResponse(500, 'Failed to extract sentiment from OpenAI response.');
        }

        // 3. Store the summary and sentiment back in the database
        const { error: updateError } = await supabaseAdmin
            .from(tableName)
            .update({ summary, sentiment })
            .eq('id', note_id);

        if (updateError) {
            return createErrorResponse(500, `Failed to save summary/sentiment: ${updateError.message}`);
        }

        // 4. Return the summary and sentiment
        return new Response(JSON.stringify({ summary, sentiment }), { headers: corsHeaders });
    } catch (e) {
        const error = e as Error;
        return createErrorResponse(500, error.message);
    }
});

// // summarize-notes/index.ts
// import { OpenAI } from "openai";
// Deno.serve(async req => {
//   const { note } = await req.json();
//   const ai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });
//   const res = await ai.chat.completions.create({...});
//   return new Response(JSON.stringify({ summary: res.choices[0].message.content }));
// });



/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/summarize-notes' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
