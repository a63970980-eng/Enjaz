import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { encryptCredentials, decryptCredentials } from '../src/credentials-vault.js';

const previous=process.env.ENJAZ_CREDENTIALS_KEY;
process.env.ENJAZ_CREDENTIALS_KEY=randomBytes(32).toString('base64');

test('credentials vault encrypts and decrypts without exposing plaintext', async()=>{
 const credentials={apiKey:'secret-value',refreshToken:'refresh-secret',nested:{provider:'example'}};
 const encrypted=await encryptCredentials(credentials);
 assert.notEqual(encrypted,JSON.stringify(credentials));
 assert.ok(!encrypted.includes('secret-value'));
 assert.deepEqual(await decryptCredentials(encrypted),credentials);
});

test.after(()=>{if(previous===undefined)delete process.env.ENJAZ_CREDENTIALS_KEY;else process.env.ENJAZ_CREDENTIALS_KEY=previous;});
