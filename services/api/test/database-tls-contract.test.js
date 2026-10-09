import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPoolOptions } from '../src/db.js';

test('database connections verify TLS and use bounded production-safe defaults', () => {
  const options = buildPoolOptions({ DATABASE_URL: 'postgres://localhost/enjaz' });
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.equal(options.max, 5);
  assert.equal(options.connectionTimeoutMillis, 5000);
  assert.equal(options.statement_timeout, 15000);
  assert.equal(options.query_timeout, 20000);
  assert.equal(options.idle_in_transaction_session_timeout, 10000);
  assert.equal(options.application_name, 'enjaz-api');
});

test('database TLS can be disabled only through an explicit setting outside production', () => {
  const options = buildPoolOptions({ DATABASE_URL: 'postgres://localhost/enjaz', DATABASE_SSL: 'false', NODE_ENV: 'test' });
  assert.equal(options.ssl, false);
});

test('production rejects disabling TLS or certificate verification', () => {
  assert.throws(
    () => buildPoolOptions({ DATABASE_URL: 'postgres://localhost/enjaz', DATABASE_SSL: 'false', NODE_ENV: 'production' }),
    /DATABASE_SSL=false is forbidden in production/,
  );
  assert.throws(
    () => buildPoolOptions({ DATABASE_URL: 'postgres://localhost/enjaz', DATABASE_SSL_REJECT_UNAUTHORIZED: 'false', NODE_ENV: 'production' }),
    /DATABASE_SSL_REJECT_UNAUTHORIZED=false is forbidden in production/,
  );
});

test('malformed TLS flags fail closed instead of disabling certificate verification', () => {
  assert.throws(
    () => buildPoolOptions({ DATABASE_URL: 'postgres://localhost/enjaz', DATABASE_SSL_REJECT_UNAUTHORIZED: 'flase' }),
    /DATABASE_SSL_REJECT_UNAUTHORIZED must be "true" or "false"/,
  );
  assert.throws(
    () => buildPoolOptions({ DATABASE_URL: 'postgres://localhost/enjaz', DATABASE_SSL: 'off' }),
    /DATABASE_SSL must be "true" or "false"/,
  );
});

test('invalid pool settings fail fast instead of silently creating an unsafe pool', () => {
  assert.throws(
    () => buildPoolOptions({ DATABASE_URL: 'postgres://localhost/enjaz', DB_POOL_SIZE: 'not-a-number' }),
    /DB_POOL_SIZE must be a positive integer/,
  );
});
