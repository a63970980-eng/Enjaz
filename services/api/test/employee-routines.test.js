import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRoutine } from '../src/employee-routines.js';

test('routine validation normalizes safe defaults',()=>{
  const routine=validateRoutine({employeeId:'e1',name:'Morning operations',objective:'Review the latest operating signals'});
  assert.equal(routine.action,'data.analyze');
  assert.equal(routine.intervalMinutes,1440);
  assert.deepEqual(routine.input,{});
});

test('routine validation rejects invalid intervals',()=>{
  assert.throws(()=>validateRoutine({employeeId:'e1',name:'x',objective:'y',intervalMinutes:0}),/intervalMinutes/);
  assert.throws(()=>validateRoutine({employeeId:'e1',name:'x',objective:'y',intervalMinutes:31536001}),/intervalMinutes/);
});

test('routine validation rejects missing objective',()=>{
  assert.throws(()=>validateRoutine({employeeId:'e1',name:'x',objective:''}),/objective/);
});
