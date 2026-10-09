import { test, expect } from '@playwright/test';

test('new public landing page boots with a clear ENJAZ product preview', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/إنجاز/);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { name: /أعمالك تتحرك/ })).toBeVisible();
  await expect(page.getByText('PREVIEW')).toBeVisible();
  await expect(page.getByRole('link', { name: /اكتشف المنصة/ }).first()).toBeVisible();
});

test('product preview disclosure explains that its content is illustrative', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /شاهد معاينة المنتج/ }).click();
  await expect(page.getByRole('status')).toContainText('معاينة توضيحية');
  await expect(page.getByRole('button', { name: /إغلاق المعاينة/ })).toHaveAttribute('aria-expanded', 'true');
});

test('sector tabs update the sector context accessibly', async ({ page }) => {
  await page.goto('/');
  const governmentTab = page.getByRole('tab', { name: /الجهات الحكومية/ });
  await governmentTab.click();
  await expect(governmentTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel').getByRole('heading', { name: 'الجهات الحكومية' })).toBeVisible();
});

test('mobile landing page has no horizontal overflow and retains core navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'فتح القائمة' })).toBeVisible();
  await page.getByRole('button', { name: 'فتح القائمة' }).click();
  await expect(page.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeVisible();
});

test('primary actions and controls are keyboard reachable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
});
