// Centralized AI service for both mock and real AI APIs
// Usage: import { getNoteSummaryAndSentiment, getAINextAction, ... } from './aiService';
// All functions are async and support both mock and real API (stub for now)

// --- Types ---
export interface NoteLike {
  id?: string|number;
  text?: string;
  [key: string]: any;
}
export interface AIOptions {
  temperature?: number;
  model?: string;
  language?: string;
  [key: string]: any;
}
export interface AISummaryResult {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  error?: string;
}
export interface AINextActionResult {
  action: string;
  error?: string;
}
export interface AISuggestionResult {
  suggestion: string;
  error?: string;
}

const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || process.env.VITE_AI_API_KEY;
const AI_API_URL = import.meta.env.VITE_AI_API_URL || process.env.VITE_AI_API_URL;
const AI_MODE = import.meta.env.VITE_AI_MODE || process.env.VITE_AI_MODE || 'auto'; // 'mock', 'real', 'auto'

function getAIConfig() {
  return {
    apiKey: AI_API_KEY,
    apiUrl: AI_API_URL,
    mode: AI_MODE,
    useReal: AI_MODE === 'real' || (AI_MODE === 'auto' && !!AI_API_KEY),
  };
}

// --- MOCK LOGIC ---
function mockSummaryAndSentiment(note: NoteLike, options?: AIOptions): AISummaryResult {
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (note.text && note.text.length > 100) sentiment = 'positive';
  else if (note.text && note.text.length < 30) sentiment = 'negative';
  const summary = note.text ? note.text.split(' ').slice(0, 12).join(' ') + (note.text.split(' ').length > 12 ? '...' : '') : '';
  return { summary, sentiment };
}
function mockNextAction(context: any, options?: AIOptions): AINextActionResult {
  if (context.type === 'deal' || context.type === 'note') {
    return { action: 'AI: Next best action: Follow up with client.' };
  }
  if (context.type === 'contact') {
    return { action: 'AI: Next best action: Validate email and phone.' };
  }
  if (context.type === 'company') {
    return { action: 'AI: Next best action: Research company background.' };
  }
  return { action: 'AI: Next best action: Review and update.' };
}
function mockSuggestion(context: any, options?: AIOptions): AISuggestionResult {
  return { suggestion: 'AI: Based on data, this is likely a high-value lead.' };
}

// --- REAL API STUBS ---
async function realSummaryAndSentiment(note: NoteLike, options?: AIOptions): Promise<AISummaryResult> {
  try {
    // TODO: Implement real API call (OpenAI, Azure, etc.)
    // Example: fetch(AI_API_URL, { method: 'POST', headers: { ... }, body: ... })
    // For now, fallback to mock
    return mockSummaryAndSentiment(note, options);
  } catch (e: any) {
    // Log error for analytics
    // TODO: send to analytics endpoint
    return { summary: '', sentiment: 'neutral', error: e?.message || 'AI error' };
  }
}
async function realNextAction(context: any, options?: AIOptions): Promise<AINextActionResult> {
  try {
    // TODO: Implement real API call
    return mockNextAction(context, options);
  } catch (e: any) {
    return { action: '', error: e?.message || 'AI error' };
  }
}
async function realSuggestion(context: any, options?: AIOptions): Promise<AISuggestionResult> {
  try {
    // TODO: Implement real API call
    return mockSuggestion(context, options);
  } catch (e: any) {
    return { suggestion: '', error: e?.message || 'AI error' };
  }
}

// --- EXPORTS ---
export async function getNoteSummaryAndSentiment(note: NoteLike, options?: AIOptions, forceMock = false): Promise<AISummaryResult> {
  const config = getAIConfig();
  if (forceMock || !config.useReal) return Promise.resolve(mockSummaryAndSentiment(note, options));
  return realSummaryAndSentiment(note, options);
}
export async function getAINextAction(context: any, options?: AIOptions, forceMock = false): Promise<AINextActionResult> {
  const config = getAIConfig();
  if (forceMock || !config.useReal) return Promise.resolve(mockNextAction(context, options));
  return realNextAction(context, options);
}
export async function getAISuggestion(context: any, options?: AIOptions, forceMock = false): Promise<AISuggestionResult> {
  const config = getAIConfig();
  if (forceMock || !config.useReal) return Promise.resolve(mockSuggestion(context, options));
  return realSuggestion(context, options);
}

// TODO: Add batch support for lists (e.g., getNotesSummaries(notes: NoteLike[], options?: AIOptions))
// TODO: Add multi-provider support (OpenAI, Azure, Google, etc.)
// TODO: Add caching layer (in-memory/localStorage)
// TODO: Add sensitive data redaction utility
// TODO: Add audit logging for real API requests/responses

// Add more AI-powered functions as needed, following the same pattern.
// To add real API logic, replace the stub with a real fetch call and handle errors/fallbacks. 