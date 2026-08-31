import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRuntimeConfiguration } from './runtime-validation.js';

test('runtime rejects an employee with an unknown tool',()=>{assert.throws(()=>validateRuntimeConfiguration({tools:['not.registered']}),/unknown tool/i);});
test('runtime accepts registered tools',()=>{const r=validateRuntimeConfiguration({tools:['data.analyze']});assert.equal(r.valid,true);assert.equal(r.toolCount,1);});
