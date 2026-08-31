import { randomUUID } from 'node:crypto';

export function requestContext(req) {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(incoming) ? incoming : randomUUID();
  return { id, startedAt: Date.now() };
}

export function requestDuration(context) {
  return Date.now() - context.startedAt;
}
