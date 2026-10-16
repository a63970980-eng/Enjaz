import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const landing = await readFile(new URL('./landing.html', import.meta.url), 'utf8');
const app = await readFile(new URL('./src/App.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('./workspace.html', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('./vite.config.js', import.meta.url), 'utf8');

test('public entry point uses same-origin executable code and denies framing', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /frame-ancestors 'none'/);
  assert.match(html, /meta name="referrer" content="no-referrer"/);
  assert.match(html, /src="\/src\/main\.tsx"/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
});

test('the legacy landing route serves the same clean public experience', () => {
  assert.match(landing, /src="\/src\/main\.tsx"/);
  assert.match(landing, /إنجاز/);
  assert.doesNotMatch(landing, /src="https?:/i);
});

test('the public experience labels previews and includes all launch sectors', () => {
  assert.match(app, /PREVIEW/);
  for (const sector of ['الشركات', 'المطاعم', 'المستشفيات', 'الفنادق', 'الجهات الحكومية']) {
    assert.ok(app.includes(sector), `missing sector: ${sector}`);
  }
  assert.match(app, /معاينة توضيحية/);
});

test('public registration and sign-in actions lead to the authenticated Workspace portal', () => {
  assert.match(app, /href="\/workspace\.html\?auth=1"/);
  assert.match(app, /href="\/workspace\.html\?signup=1"/);
  assert.match(workspace, /meta name="robots" content="noindex, nofollow"/);
  assert.match(workspace, /Content-Security-Policy/);
  assert.match(workspace, /src="\/src\/workspace-main\.tsx"/);
  assert.doesNotMatch(workspace, /<script[^>]+src="https?:/i);
});

test('the production Vite build explicitly includes the Workspace document', () => {
  assert.match(viteConfig, /workspace:\s*fileURLToPath\(new URL\('\.\/workspace\.html'/);
});
