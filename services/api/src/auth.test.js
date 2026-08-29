import test from 'node:test';
import assert from 'node:assert/strict';
import { createUser, createSession, authenticate, requireRole } from './auth.js';

test('creates and authenticates a session',()=>{
  const user=createUser({email:'demo@example.com',name:'Demo',organizationId:'org_1',workspaceId:'ws_1'});
  const token=createSession(user.id);
  assert.equal(authenticate(token).id,user.id);
});

test('rejects invalid session',()=>assert.equal(authenticate('invalid-token'),null));

test('enforces roles',()=>{
  const user={role:'member'};
  assert.throws(()=>requireRole(user,['owner']));
});
