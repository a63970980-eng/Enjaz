const REQUEST_TIMEOUT_MS = 8_000;

function getCompanyIdForWorkspace(workspaceId, env = process.env) {
  const raw = env.PAPERCLIP_WORKSPACE_COMPANY_MAP;
  if (!raw) return null;
  let mapping;
  try { mapping = JSON.parse(raw); } catch {
    throw Object.assign(new Error('Paperclip workspace mapping is invalid'), { status: 503 });
  }
  const companyId = mapping?.[workspaceId];
  return typeof companyId === 'string' && companyId.trim() ? companyId.trim() : null;
}

export function paperclipConfiguration(env = process.env) {
  const baseUrl = String(env.PAPERCLIP_API_URL || '').trim().replace(/\/+$/, '');
  const apiKey = String(env.PAPERCLIP_API_KEY || '').trim();
  return { configured: Boolean(baseUrl && apiKey), baseUrl, apiKey };
}

export async function getPaperclipDashboard(workspaceId, env = process.env) {
  const { configured, baseUrl, apiKey } = paperclipConfiguration(env);
  if (!configured) {
    throw Object.assign(new Error('Paperclip integration is not configured'), { status: 503 });
  }
  const companyId = getCompanyIdForWorkspace(workspaceId, env);
  if (!companyId) {
    throw Object.assign(new Error('Paperclip is not mapped to this workspace'), { status: 404 });
  }
  let target;
  try { target = new URL(`/api/companies/${encodeURIComponent(companyId)}/dashboard`, baseUrl); }
  catch { throw Object.assign(new Error('Paperclip API URL is invalid'), { status: 503 }); }
  if (target.protocol !== 'https:' && !(target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname))) {
    throw Object.assign(new Error('Paperclip API must use HTTPS outside localhost'), { status: 503 });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: controller.signal,
      redirect: 'error',
    });
    if (!response.ok) {
      throw Object.assign(new Error(response.status >= 500 ? 'Paperclip service unavailable' : 'Paperclip request rejected'), {
        status: response.status === 401 || response.status === 403 ? 502 : 503,
      });
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw Object.assign(new Error('Paperclip returned an unexpected response'), { status: 502 });
    }
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw Object.assign(new Error('Paperclip request timed out'), { status: 504 });
    }
    if (error?.status) throw error;
    throw Object.assign(new Error('Paperclip service is unreachable'), { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
