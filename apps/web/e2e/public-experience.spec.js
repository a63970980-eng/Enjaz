import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Enjaz public experience', () => {
  test('renders the public landing experience and keeps login navigation intact', async ({ page }) => {
    await page.goto('/?public=1', { waitUntil: 'networkidle' });

    await expect(page.locator('#enjaz-public')).toBeVisible();
    await expect(page.getByRole('heading', { name: /حوّل الذكاء الاصطناعي/ })).toBeVisible();
    await expect(page.getByText('Digital Workforce', { exact: true })).toBeVisible();

    const login = page.getByRole('link', { name: 'تسجيل الدخول' });
    await expect(login).toHaveAttribute('href', '?auth=1');
    await login.click();
    await expect(page).toHaveURL(/\?auth=1$/);
  });

  test('has no serious or critical accessibility violations on the public page', async ({ page }) => {
    await page.goto('/?public=1', { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter((violation) =>
      violation.impact === 'serious' || violation.impact === 'critical'
    );

    expect(serious, serious.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
  });
});
