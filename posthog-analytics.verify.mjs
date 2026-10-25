#!/usr/bin/env node
/**
 * Offline verification for the ENJAZ PostHog product-analytics integration.
 *
 * Reads the importer manifest and the original pnpm lock (read-only), confirms no SDK was
 * added to the server app, then runs the real handler tests with the repository's Node
 * toolchain in a fresh, synthetic environment. Nothing is transmitted and nothing is
 * deployed; the browser client is exercised with an in-memory transport only.
 *
 * Usage: node posthog-analytics.verify.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const webRoot = join(repoRoot, 'apps/web');
const apiRoot = join(repoRoot, 'services/api');
const PINNED_SDK = '1.438.13';
const IMPORTER = 'apps/web';
const TEST_FILES = ['test/posthog-analytics.test.mjs'];
const LINKS = { US: 'https://us.i.posthog.com' };
const VERIFY_TOKEN = 'synthetic-project-token-offline-verify';
const VERIFY_HOST = 'https://posthog.invalid';
const TIMEOUT_MS = 240_000;

const failures = [];
function fail(message) {
  failures.push(message);
}
function requireReadable(path, label) {
  if (!existsSync(path)) {
    fail(`${label} is missing: ${relative(repoRoot, path)}`);
    return false;
  }
  return true;
}

// --- Read-only lock and manifest readers -------------------------------------------------
function readManifest(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`cannot read manifest ${relative(repoRoot, path)}: ${error.message}`);
    return null;
  }
}

function importerSection(lockText, importer) {
  const marker = `\n  ${importer}:\n`;
  const start = lockText.indexOf(marker);
  if (start === -1) return '';
  const rest = lockText.slice(start + marker.length);
  const nextImporter = rest.search(/\n {2}[^\s].*:\n/);
  return nextImporter === -1 ? rest : rest.slice(0, nextImporter);
}

// --- 1. Package manager and lock integrity ------------------------------------------------
const pnpmWorkspace = join(repoRoot, 'pnpm-workspace.yaml');
const lockPath = join(repoRoot, 'pnpm-lock.yaml');
const manifestPath = join(webRoot, 'package.json');
const hasWorkspace = requireReadable(pnpmWorkspace, 'pnpm workspace file');
const hasLock = requireReadable(lockPath, 'original lockfile');
const hasManifest = requireReadable(manifestPath, 'web manifest');

for (const foreignLock of ['yarn.lock', 'package-lock.json', 'bun.lockb', 'bun.lock']) {
  if (existsSync(join(repoRoot, foreignLock))) fail(`conflicting lockfile present: ${foreignLock}`);
}
if (hasWorkspace && !/apps\/\*/.test(readFileSync(pnpmWorkspace, 'utf8'))) {
  fail('pnpm-workspace.yaml does not declare apps/*');
}

const rootManifest = readManifest(join(repoRoot, 'package.json'));
if (rootManifest && !String(rootManifest.packageManager || '').startsWith('pnpm@')) {
  fail('root package.json does not declare the pnpm packageManager');
}

// --- 2. Browser importer pins the SDK and the lock resolves it ---------------------------
const webManifest = hasManifest ? readManifest(manifestPath) : null;
if (webManifest) {
  const pinned = webManifest.dependencies?.['posthog-js'];
  if (pinned !== PINNED_SDK) fail(`apps/web must pin posthog-js ${PINNED_SDK} exactly (found ${pinned ?? 'none'})`);
}

if (hasLock) {
  const lock = readFileSync(lockPath, 'utf8');
  if (!/^lockfileVersion: '9\.0'$/m.test(lock)) fail('pnpm-lock.yaml is not lockfileVersion 9.0');
  const section = importerSection(lock, IMPORTER);
  if (!section) fail(`pnpm-lock.yaml has no importer for ${IMPORTER}`);
  else {
    if (!new RegExp(`posthog-js:\\s*\\n\\s+specifier: ${PINNED_SDK.replace(/\./g, '\\.')}\\s*\\n\\s+version: ${PINNED_SDK.replace(/\./g, '\\.')}`).test(section)) {
      fail(`pnpm-lock.yaml importer ${IMPORTER} does not resolve posthog-js@${PINNED_SDK}`);
    }
  }
  if (!new RegExp(`^ {2}posthog-js@${PINNED_SDK.replace(/\./g, '\\.')}:`, 'm').test(lock)) {
    fail(`pnpm-lock.yaml has no package snapshot for posthog-js@${PINNED_SDK}`);
  }
}

const installedSdk = join(webRoot, 'node_modules/posthog-js/package.json');
if (existsSync(installedSdk)) {
  const installedVersion = readManifest(installedSdk)?.version;
  if (installedVersion !== PINNED_SDK) fail(`installed posthog-js is ${installedVersion}, expected ${PINNED_SDK}`);
}

// --- 3. Server route adds no analytics SDK ---------------------------------------------
const apiManifest = readManifest(join(apiRoot, 'package.json'));
if (apiManifest) {
  const serverDeps = { ...apiManifest.dependencies, ...apiManifest.devDependencies };
  for (const sdk of ['posthog-js', 'posthog-node', 'posthog']) {
    if (sdk in serverDeps) fail(`services/api must not depend on ${sdk}; server capture stays native HTTP only`);
  }
}
function walk(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'build', 'coverage'].includes(entry.name)) walk(path, found);
    } else if (/\.(m?js|cjs|ts)$/.test(entry.name)) found.push(path);
  }
  return found;
}
const apiSource = join(apiRoot, 'src');
if (existsSync(apiSource)) {
  for (const file of walk(apiSource)) {
    if (/from\s+['"]posthog|require\(['"]posthog/.test(readFileSync(file, 'utf8'))) {
      fail(`services/api imports a PostHog SDK in ${relative(repoRoot, file)}`);
    }
  }
}

// --- 4. Tests exist and assert something ------------------------------------------------
const testPaths = [];
let assertionCount = 0;
for (const relativePath of TEST_FILES) {
  const path = join(webRoot, relativePath);
  if (!requireReadable(path, 'handler test')) continue;
  const source = readFileSync(path, 'utf8');
  testPaths.push(path);
  const assertionsInFile = (source.match(/\bassert\./g) || []).length;
  assertionCount += assertionsInFile;
  if (assertionsInFile === 0) fail(`${relativePath} contains no assertions`);
  const cases = source.split(/\n(?=test\()/).slice(1);
  for (const block of cases) {
    const name = (block.match(/test\('([^']+)'/) || [])[1] || 'unnamed test';
    if (!/\bassert\./.test(block)) fail(`test "${name}" asserts nothing`);
  }
  if (/^\s*test\.skip\(/m.test(source)) fail(`${relativePath} skips a test`);
}
if (!testPaths.length) fail('no handler tests were found to run');

// --- 5. Run the real tests with a clean, synthetic environment --------------------------
function childEnvironment() {
  // Starts from {}: no inherited env, no dotenv/NODE_OPTIONS autoload, no credentials.
  const env = {};
  env.PATH = process.env.PATH || '/usr/local/bin:/usr/bin:/bin';
  env.HOME = join(tmpdir(), 'enjaz-posthog-verify');
  env.TMPDIR = tmpdir();
  env.TMP = tmpdir();
  env.TEMP = tmpdir();
  env.LANG = 'C.UTF-8';
  env.NODE_ENV = 'test';
  env.VITE_POSTHOG_PROJECT_TOKEN = VERIFY_TOKEN;
  env.VITE_POSTHOG_HOST = VERIFY_HOST;
  return env;
}

let testOutput = '';
if (!failures.length) {
  const result = spawnSync(
    process.execPath,
    ['--test', '--test-reporter=tap', ...TEST_FILES],
    {
      cwd: webRoot,
      env: childEnvironment(),
      shell: false,
      timeout: TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024,
      encoding: 'utf8',
    },
  );
  testOutput = `${result.stdout || ''}${result.stderr || ''}`;
  if (result.error) fail(`test runner failed to start: ${result.error.message}`);
  else if (result.signal) fail(`test runner was terminated by ${result.signal}`);
  else if (result.status !== 0) fail(`test runner exited with status ${result.status}`);

  const count = (pattern) => {
    const match = testOutput.match(pattern);
    return match ? Number(match[1]) : null;
  };
  const total = count(/^# tests (\d+)$/m);
  const passed = count(/^# pass (\d+)$/m);
  const failed = count(/^# fail (\d+)$/m);
  const skipped = count(/^# skipped (\d+)$/m) ?? 0;
  if (total === null || passed === null || failed === null) {
    fail('the test runner did not report TAP results');
  } else {
    if (total === 0) fail('the test runner executed zero tests');
    if (failed !== 0) fail(`${failed} handler test(s) failed`);
    if (passed + skipped !== total) fail(`TAP summary is inconsistent: ${passed} passed, ${skipped} skipped, ${total} total`);
    if (passed === 0) fail('no handler test passed');
    if (skipped > 0) fail(`${skipped} handler test(s) were skipped`);
  }
  if (assertionCount === 0) fail('the handler tests contain zero assertions');
  if (VERIFY_TOKEN.startsWith('phc_') || VERIFY_TOKEN.startsWith('phx_')) fail('verification token must be synthetic, never a real project or personal key');
  if (VERIFY_HOST !== LINKS.US && !/^https:\/\/posthog\.invalid$/.test(VERIFY_HOST)) fail('verification host must be a non-routable placeholder');
}

// --- 6. Verdict -------------------------------------------------------------------------
if (failures.length) {
  console.error('PostHog offline verification FAILED:');
  for (const message of failures) console.error(` - ${message}`);
  if (testOutput) console.error(testOutput.trim());
  process.exit(1);
}
console.log('PostHog offline verification passed.');
console.log(` - importer apps/web pins posthog-js ${PINNED_SDK}; pnpm-lock.yaml resolves it (lockfileVersion 9.0)`);
console.log(` - services/api has no PostHog SDK dependency or import`);
console.log(` - ${TEST_FILES.length} real-handler test file(s), ${assertionCount} assertions, no network delivery, synthetic config only`);
