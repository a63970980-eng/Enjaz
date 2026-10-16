import { test, expect } from '@playwright/test';

async function mockWorkspaceSession(page, role = 'manager') {
  await page.route(/\/auth\/v1\/token\?grant_type=password/, route => route.fulfill({
    status: 200,
    json: {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: { id: 'auth-user-1', email: 'owner@example.com', user_metadata: { full_name: 'نور' } },
    },
  }));

  await page.route(/\/functions\/v1\/enjaz-auth-bridge/, async route => {
    const request = route.request().postDataJSON();
    if (request.action !== 'me') {
      return route.fulfill({ status: 404, json: { error: 'Unexpected auth bridge action' } });
    }
    return route.fulfill({
      status: 200,
      json: {
        data: {
          identity: { authId: 'auth-user-1', email: 'owner@example.com', name: 'نور' },
          profile: { id: 'user-1', name: 'نور', email: 'owner@example.com' },
          workspaces: [{ id: 'workspace-1', name: 'شركة التجربة', workspace_role: role }],
        },
      },
    });
  });

  const tasks = [];
  const employees = [{ id: 'employee-1', name: 'محلل الأعمال', role: 'محلل', status: 'active' }];
  await page.route(/\/api\/v1\//, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const headers = await request.allHeaders();
    if (url.searchParams.get('workspaceId') !== 'workspace-1' || headers.authorization !== 'Bearer test-access-token') {
      return route.fulfill({ status: 403, json: { error: 'Workspace scope or bearer token missing' } });
    }

    if (path.endsWith('/runtime/summary')) {
      return route.fulfill({ status: 200, json: { data: { summary: { runs: 4, successful_runs: 3, failed_runs: 1, cost_cents: 0 }, recent: [] } } });
    }
    if (path.endsWith('/employees') && request.method() === 'GET') {
      return route.fulfill({ status: 200, json: { data: employees } });
    }
    if (path.endsWith('/tasks') && request.method() === 'GET') {
      return route.fulfill({ status: 200, json: { data: tasks } });
    }
    if (path.endsWith('/tasks') && request.method() === 'POST') {
      const input = request.postDataJSON();
      const task = { id: `task-${tasks.length + 1}`, ...input, employee_id: input.employeeId, employee_name: 'محلل الأعمال', status: 'queued' };
      tasks.unshift(task);
      return route.fulfill({ status: 201, json: { data: task } });
    }
    if (path.endsWith('/approvals')) {
      return route.fulfill({ status: 200, json: { data: [] } });
    }
    if (path.endsWith('/audit')) {
      return route.fulfill({ status: 200, json: { data: [] } });
    }
    return route.fulfill({ status: 404, json: { error: `Unhandled API request: ${request.method()} ${path}` } });
  });
}

test('workspace route presents a sign-in flow without implying an authenticated session', async ({ page }) => {
  await page.goto('/workspace.html');
  await expect(page).toHaveTitle(/مساحة العمل/);
  await expect(page.getByRole('heading', { name: /سجّل الدخول/ })).toBeVisible();
  await expect(page.getByLabel('البريد الإلكتروني')).toBeVisible();
  await expect(page.getByLabel('كلمة المرور')).toBeVisible();
  await expect(page.getByText('شركة التجربة')).toHaveCount(0);
});

test('authenticated manager sees live workspace data and can create a task', async ({ page }) => {
  await mockWorkspaceSession(page);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();

  await expect(page.getByRole('heading', { name: 'مركز العمليات' })).toBeVisible();
  await expect(page.getByLabel('مساحة العمل الحالية')).toHaveValue('workspace-1');
  await page.getByRole('button', { name: 'الموظفون الرقميون' }).click();
  await expect(page.getByText('محلل الأعمال')).toBeVisible();
  await page.getByRole('button', { name: 'المهام' }).click();
  await expect(page.getByRole('form', { name: 'إنشاء مهمة' })).toBeVisible();

  await page.getByLabel('عنوان المهمة').fill('مراجعة المبيعات');
  await page.getByLabel('الهدف والنتيجة المطلوبة').fill('حلل بيانات المبيعات لهذا الشهر وأعد ملخصًا.');
  await page.getByLabel('الموظف الرقمي').selectOption('employee-1');
  await page.getByRole('button', { name: 'إنشاء المهمة' }).click();
  await expect(page.getByText('مراجعة المبيعات')).toBeVisible();
});

test('read-only workspace role does not show manager-only task creation', async ({ page }) => {
  await mockWorkspaceSession(page, 'viewer');
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();

  await expect(page.getByRole('heading', { name: 'مركز العمليات' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'إنشاء مهمة' })).toHaveCount(0);
  await expect(page.getByText(/صلاحية المدير/)).toBeVisible();
});

test('email confirmation callback restores a session and removes tokens from the address bar', async ({ page }) => {
  await mockWorkspaceSession(page);
  await page.goto('/workspace.html#access_token=callback-access&refresh_token=callback-refresh&type=signup');

  await expect(page.getByRole('heading', { name: 'مركز العمليات' })).toBeVisible();
  await expect(page).toHaveURL(/\/workspace\.html$/);
  expect(await page.evaluate(() => sessionStorage.getItem('ENJAZ_ACCESS_TOKEN'))).toBe('callback-access');
});


test('new account can bootstrap a workspace and provision its selected sector', async ({ page }) => {
  const provisionedPacks = [];
  await page.route(/\/functions\/v1\/enjaz-auth-bridge/, async route => {
    const request = route.request().postDataJSON();
    if (request.action === 'signup') {
      return route.fulfill({ status: 200, json: { access_token: 'new-access-token', refresh_token: 'new-refresh-token' } });
    }
    if (request.action === 'me') {
      return route.fulfill({ status: 200, json: { data: {
        identity: { authId: 'new-auth-user', email: 'new@example.com', name: 'ليان' },
        profile: { id: 'new-user', name: 'ليان', email: 'new@example.com' },
        workspaces: [],
      } } });
    }
    if (request.action === 'bootstrap') {
      return route.fulfill({ status: 201, json: { data: {
        created: true,
        user: { id: 'new-user', name: 'ليان', email: 'new@example.com' },
        workspaces: [{ id: 'new-workspace', name: 'مساحة ليان', organization_name: 'مؤسسة ليان', workspace_role: 'manager' }],
      } } });
    }
    return route.fulfill({ status: 404, json: { error: 'Unexpected auth bridge action' } });
  });
  await page.route(/\/functions\/v1\/enjaz-industry/, async route => {
    const url = new URL(route.request().url());
    provisionedPacks.push(url.pathname);
    return route.fulfill({ status: 201, json: { data: { created: true, employees: 2, departments: 2 } } });
  });
  await page.route(/\/api\/v1\//, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = await request.allHeaders();
    if (url.searchParams.get('workspaceId') !== 'new-workspace' || headers.authorization !== 'Bearer new-access-token') {
      return route.fulfill({ status: 403, json: { error: 'Workspace scope or bearer token missing' } });
    }
    if (url.pathname.endsWith('/runtime/summary')) return route.fulfill({ status: 200, json: { data: { summary: {}, recent: [] } } });
    if (url.pathname.endsWith('/employees')) return route.fulfill({ status: 200, json: { data: [] } });
    if (url.pathname.endsWith('/tasks')) return route.fulfill({ status: 200, json: { data: [] } });
    if (url.pathname.endsWith('/approvals')) return route.fulfill({ status: 200, json: { data: [] } });
    if (url.pathname.endsWith('/audit')) return route.fulfill({ status: 200, json: { data: [] } });
    return route.fulfill({ status: 404, json: { error: `Unhandled API request: ${request.method()} ${url.pathname}` } });
  });

  await page.goto('/workspace.html?signup=1');
  await page.getByLabel('الاسم الكامل').fill('ليان');
  await page.getByLabel('البريد الإلكتروني').fill('new@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await expect(page.getByRole('form', { name: 'إعداد مساحة العمل' })).toBeVisible();

  await page.getByLabel('اسم المؤسسة').fill('مؤسسة ليان');
  await page.getByLabel('اسم مساحة العمل').fill('مساحة ليان');
  await page.getByLabel('القطاع').selectOption('hotel');
  await page.getByRole('button', { name: 'إنشاء المؤسسة وتفعيل القطاع' }).click();

  await expect(page.getByRole('heading', { name: 'مركز العمليات' })).toBeVisible();
  await expect(page.getByLabel('مساحة العمل الحالية')).toHaveValue('new-workspace');
  expect(provisionedPacks).toContain('/functions/v1/enjaz-industry/industry-packs/hotel/provision');
});


test('workspace remains usable on mobile without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockWorkspaceSession(page);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await expect(page.getByRole('heading', { name: 'مركز العمليات' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'فتح القائمة' }).click();
  await expect(page.getByRole('navigation', { name: 'التنقل داخل مساحة العمل' })).toBeVisible();
});
