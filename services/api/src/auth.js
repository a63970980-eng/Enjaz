import { randomUUID, createHash } from 'node:crypto';

const users = new Map();
const sessions = new Map();

export function createUser({ email, name, organizationId, workspaceId, role='owner' }) {
  if (!email) throw new Error('email is required');
  const id=randomUUID(); const user={id,email,name,organizationId,workspaceId,role,createdAt:new Date().toISOString()};
  users.set(id,user); return user;
}

export function createSession(userId) {
  if (!users.has(userId)) throw new Error('User not found');
  const raw=randomUUID()+randomUUID(); const token=createHash('sha256').update(raw).digest('hex');
  sessions.set(token,{userId,createdAt:Date.now()}); return raw;
}

export function authenticate(token) {
  if(!token) return null;
  const key=createHash('sha256').update(token).digest('hex'); const session=sessions.get(key);
  if(!session) return null; return users.get(session.userId) || null;
}

export function requireRole(user, roles) { if(!user || !roles.includes(user.role)) throw new Error('Forbidden'); return user; }
