import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/db.js', import.meta.url), 'utf8');

test('database TLS certificate verification is enabled by default', () => {
  assert.match(source, /DATABASE_SSL_REJECT_UNAUTHORIZED\?\?'true'/);
  assert.match(source, /prefer DATABASE_CA/i);
  assert.match(source, /rejectUnauthorized/);
});

test('database TLS can only be disabled through an explicit environment setting', () => {
  assert.match(source, /DATABASE_SSL_REJECT_UNAUTHORIZED/);
  assert.doesNotMatch(source, /DATABASE_SSL_REJECT_UNAUTHORIZED\|\|'false'/);
});
