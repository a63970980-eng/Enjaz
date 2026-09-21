import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('public landing page boots and exposes working authentication CTAs',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#enjaz-public')).toBeVisible();
  await expect(page.getByRole('heading',{name:/حوّل الذكاء الاصطناعي/})).toBeVisible();
  await expect(page.locator('[data-auth="login"]').first()).toBeVisible();
  await expect(page.locator('[data-auth="signup"]').first()).toBeVisible();
  await expect(page.locator('.workforce-stage')).toBeVisible();
});

test('public landing page has no serious automated accessibility violations',async({page})=>{
  await page.goto('/',{waitUntil:'networkidle'});
  const results=await new AxeBuilder({page}).analyze();
  const serious=results.violations.filter(v=>v.impact==='critical'||v.impact==='serious');
  expect(serious).toEqual([]);
});
