import {defineConfig,devices} from '@playwright/test';

const baseURL=process.env.ENJAZ_E2E_BASE_URL;
if(!baseURL) throw new Error('ENJAZ_E2E_BASE_URL is required for e2e tests.');

export default defineConfig({
  testDir:'./tests/e2e',
  timeout:30000,
  fullyParallel:true,
  forbidOnly:!!process.env.CI,
  retries:process.env.CI?2:0,
  workers:process.env.CI?1:undefined,
  reporter:process.env.CI?'github':'list',
  use:{
    baseURL,
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure',
    ...devices['Desktop Chrome']
  }
});
