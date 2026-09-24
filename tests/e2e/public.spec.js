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


test('login gate renders a real credential form and validates required fields',async({page})=>{
  await page.goto('/?auth=1',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#auth-gate')).toBeVisible();
  await expect(page.locator('#auth-form input[name="email"]')).toBeVisible();
  await expect(page.locator('#auth-form input[name="password"]')).toBeVisible();
  const button=page.getByRole('button',{name:'تسجيل الدخول'});
  await button.click();
  await expect(page.locator('#auth-form input[name="email"]:invalid')).toBeVisible();
});
