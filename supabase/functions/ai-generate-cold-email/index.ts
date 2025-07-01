import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, createErrorResponse } from '../shared/utils.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { recipient, prompt } = await req.json();
    if (!recipient || !recipient.name || !recipient.email) {
      return createErrorResponse(400, 'Missing recipient info');
    }
    const userPrompt = prompt || 'Write a friendly, professional cold email introducing our CRM and offering a quick call.';
    const systemPrompt = `You are an expert B2B sales assistant. Generate a cold email for the following recipient. Respond in JSON: {"subject": "...", "body": "..."}`;
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Recipient: ${JSON.stringify(recipient)}\nPrompt: ${userPrompt}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!openaiRes.ok) {
      return createErrorResponse(500, 'OpenAI API error');
    }
    const result = await openaiRes.json();
    let subject = '';
    let body = '';
    try {
      const parsed = JSON.parse(result.choices?.[0]?.message?.content || '{}');
      subject = parsed.subject || '';
      body = parsed.body || '';
    } catch (e) {
      return createErrorResponse(500, 'Failed to parse OpenAI JSON response.');
    }
    return new Response(JSON.stringify({ subject, body }), { headers: corsHeaders });
  } catch (e) {
    const error = e as Error;
    return createErrorResponse(500, error.message);
  }
}); 