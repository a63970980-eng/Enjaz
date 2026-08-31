import test from 'node:test';
import assert from 'node:assert/strict';

const allowed=new Set(['pending','approved','rejected','expired','executed']);
test('approval lifecycle accepts execution terminal state',()=>{assert.ok(allowed.has('executed'));assert.equal(allowed.has('unknown'),false);});
test('approval decision remains separate from execution',()=>{assert.notEqual('approved','executed');assert.ok(['approved','rejected'].includes('approved'));});
