import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('public landing page boots and exposes working authentication CTAs',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#enjaz-public')).toBeVisible();
  await expect(page.getByRole('heading',{name:/قوة عمل رقمية تعمل معك/})).toBeVisible();
  await expect(page.locator('[data-public-login]').first()).toBeVisible();
  await expect(page.locator('[data-public-signup]').first()).toBeVisible();
  await expect(page.locator('.sf-command-card')).toBeVisible();
  await page.getByRole('button',{name:'ابدأ مع إنجاز'}).first().click();
  await expect(page.locator('#auth-gate #auth-form')).toBeVisible();
});

test('public landing remains usable on a mobile viewport without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/landing.html',{waitUntil:'networkidle'});
  await expect(page.locator('#enjaz-public')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByText('معاينة المنتج · PREVIEW')).toBeVisible();
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
