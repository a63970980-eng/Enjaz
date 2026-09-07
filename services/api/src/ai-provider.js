const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const DEFAULT_OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';
const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);

const clean = (value) => typeof value === 'string' ? value.trim() : '';

async function readJson(response) {
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const message = data?.error?.message || data?.error || data?.message || `AI provider returned ${response.status}`;
    throw new Error(String(message));
  }
  return data;
}

async function request(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await readJson(await fetch(url, { ...options, signal: controller.signal }));
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`AI provider timed out after ${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeMessages(messages) {
  return messages.map((message) => ({
    role: ['system', 'user', 'assistant'].includes(message?.role) ? message.role : 'user',
    content: String(message?.content ?? ''),
  }));
}

function geminiPayload(messages) {
  const normalized = normalizeMessages(messages);
  const system = normalized.filter((message) => message.role === 'system').map((message) => message.content).join('\n\n').trim();
  const contents = normalized.filter((message) => message.role !== 'system').map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
  if (!contents.length) contents.push({ role: 'user', parts: [{ text: system || 'Respond to the request.' }] });
  return { contents, ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}) };
}

async function callGemini({ messages, model }) {
  const key = clean(process.env.GEMINI_API_KEY);
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  const data = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(geminiPayload(messages)),
  });
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!text) throw new Error('Gemini returned no text');
  return { provider: 'gemini', model, text, usage: data?.usageMetadata || null, raw: data };
}

async function callOpenRouter({ messages, model }) {
  const key = clean(process.env.OPENROUTER_API_KEY);
  if (!key) throw new Error('OPENROUTER_API_KEY is not configured');
  const data = await request('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://enjaz-eight.vercel.app',
      'X-Title': 'Enjaz AI Workforce',
    },
    body: JSON.stringify({ model, messages: normalizeMessages(messages) }),
  });
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenRouter returned no text');
  return { provider: 'openrouter', model, text, usage: data?.usage || null, raw: data };
}

export async function generateAI({ messages, provider = process.env.AI_PROVIDER || 'auto', model }) {
  if (!Array.isArray(messages) || !messages.length) throw new Error('messages are required');
  const requested = String(provider).toLowerCase();
  const providers = requested === 'gemini' ? ['gemini'] : requested === 'openrouter' ? ['openrouter'] : ['gemini', 'openrouter'];
  const errors = [];
  for (const name of providers) {
    try {
      return name === 'gemini'
        ? await callGemini({ messages, model: model || DEFAULT_GEMINI_MODEL })
        : await callOpenRouter({ messages, model: model || DEFAULT_OPENROUTER_MODEL });
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`No AI provider succeeded. ${errors.join(' | ')}`);
}

export function getAIProviderStatus() {
  return {
    mode: process.env.AI_PROVIDER || 'auto',
    gemini: Boolean(clean(process.env.GEMINI_API_KEY)),
    openrouter: Boolean(clean(process.env.OPENROUTER_API_KEY)),
    openai: Boolean(clean(process.env.OPENAI_API_KEY)),
  };
}
