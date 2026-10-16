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
  const routines = [];
  const createdEmployees = [];
  const tools = [
    { name: 'data.analyze', description: 'تحليل بيانات للقراءة فقط', risk: 'low' },
    { name: 'report.create', description: 'إنشاء تقرير', risk: 'low' },
    { name: 'payment', description: 'دفعة مالية', risk: 'high' },
  ];
  await page.route(/\/api\/v1\//, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const headers = await request.allHeaders();
    if (url.searchParams.get('workspaceId') !== 'workspace-1' || headers.authorization !== 'Bearer test-access-token') {
      return route.fulfill({ status: 403, json: { error: 'Workspace scope or bearer token missing' } });
    }

    if (path.endsWith('/runtime/summary')) return route.fulfill({ status: 200, json: { data: { summary: { runs: 4, successful_runs: 3, failed_runs: 1, avg_latency_ms: 1200, cost_cents: 75 }, recent: [] } } });
    if (path.endsWith('/workforce/roles')) return route.fulfill({ status: 200, json: { data: [{ role_code: 'business_analyst', title: 'محلل أعمال', department: 'العمليات', mission: 'تحليل الأداء', skills: ['تحليل', 'تقارير'] }] } });
    if (path.endsWith('/tools')) return route.fulfill({ status: 200, json: { data: tools } });
    if (path.endsWith('/employees') && request.method() === 'GET') {
      return route.fulfill({ status: 200, json: { data: employees } });
    }
    if (path.endsWith('/employees') && request.method() === 'POST') {
      const input = request.postDataJSON();
      createdEmployees.push(input);
      const employee = { id: `employee-${employees.length + 1}`, ...input, status: 'active' };
      employees.unshift(employee);
      return route.fulfill({ status: 201, json: { data: employee } });
    }
    if (path.endsWith('/routines') && request.method() === 'GET') return route.fulfill({ status: 200, json: { data: routines } });
    if (path.endsWith('/routines') && request.method() === 'POST') {
      const input = request.postDataJSON();
      const routine = { id: `routine-${routines.length + 1}`, employee_id: input.employeeId, employee_name: 'محلل الأعمال', timezone: input.timezone, schedule: { title: input.name, objective: input.objective, action: input.action, input: input.input, intervalMinutes: input.intervalMinutes }, enabled: input.enabled, next_run_at: new Date(Date.now() + Number(input.intervalMinutes) * 60_000).toISOString() };
      routines.unshift(routine);
      return route.fulfill({ status: 201, json: { data: routine } });
    }
    const routineMatch = path.match(/\/routines\/([^/]+)$/);
    if (routineMatch && request.method() === 'PATCH') {
      const routine = routines.find(item => item.id === routineMatch[1]);
      Object.assign(routine, request.postDataJSON());
      return route.fulfill({ status: 200, json: { data: routine } });
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
    if (path.endsWith('/billing/subscription')) return route.fulfill({ status: 200, json: { data: { plan_name: 'Growth', status: 'active', current_period_end: '2026-11-16T00:00:00.000Z', max_employees: 15, max_tasks_month: 1000, max_integrations: 10, included_ai_cost_cents: 1000 } } });
    if (path.endsWith('/billing/usage')) return route.fulfill({ status: 200, json: { data: { plan: 'growth', status: 'active', employees: employees.length, tasksThisMonth: tasks.length, integrations: 2, aiCostCents: 75, limits: { employees: 15, tasksMonth: 1000, integrations: 10, includedAiCostCents: 1000 } } } });
    return route.fulfill({ status: 404, json: { error: `Unhandled API request: ${request.method()} ${path}` } });
  });
  return { employees, routines, createdEmployees };
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
  await page.getByRole('button', { name: 'الموظفون الرقميون' }).click();
  await expect(page.getByRole('button', { name: 'بناء موظف رقمي' })).toHaveCount(0);
  await page.getByRole('button', { name: 'الأتمتة' }).click();
  await expect(page.getByRole('form', { name: 'إنشاء أتمتة متكررة' })).toHaveCount(0);
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
    if (url.pathname.endsWith('/billing/subscription')) return route.fulfill({ status: 200, json: { data: { plan_name: 'Starter', status: 'active', max_employees: 5, max_tasks_month: 100, max_integrations: 2, included_ai_cost_cents: 0 } } });
    if (url.pathname.endsWith('/billing/usage')) return route.fulfill({ status: 200, json: { data: { plan: 'starter', status: 'active', employees: 0, tasksThisMonth: 0, integrations: 0, aiCostCents: 0, limits: { employees: 5, tasksMonth: 100, integrations: 2, includedAiCostCents: 0 } } } });
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
  await page.getByRole('button', { name: 'التحليلات والفوترة' }).click();
  await expect(page.getByRole('heading', { name: 'التحليلات والفوترة' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'فتح القائمة' }).click();
  await page.getByRole('button', { name: 'الأتمتة' }).click();
  await expect(page.getByRole('heading', { name: 'الأتمتة', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});


test('manager can configure a digital employee with a role template and least-privilege tools', async ({ page }) => {
  const state = await mockWorkspaceSession(page);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'الموظفون الرقميون' }).click();
  await page.getByRole('button', { name: 'بناء موظف رقمي' }).click();
  await page.getByLabel('قالب الدور').selectOption('business_analyst');
  await page.getByLabel('اسم الموظف').fill('محلل إنجاز');
  await page.getByLabel('الهدف التشغيلي').fill('تحويل بيانات المبيعات إلى توصيات قابلة للقياس.');
  await page.getByLabel('المسؤوليات').fill('مراجعة مؤشرات المبيعات\nإعداد ملخص أسبوعي');
  await page.getByRole('button', { name: 'حفظ الموظف الرقمي' }).click();
  await expect(page.getByText('محلل إنجاز')).toBeVisible();
  expect(state.createdEmployees).toHaveLength(1);
  expect(state.createdEmployees[0].roleCode).toBe('business_analyst');
  expect(state.createdEmployees[0].tools).toContain('data.analyze');
  expect(state.createdEmployees[0].policy.approvalMode).toBe('required');
});

test('manager can schedule and pause a recurring workspace routine', async ({ page }) => {
  await mockWorkspaceSession(page);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'الأتمتة' }).click();
  await page.getByLabel('اسم الأتمتة').fill('مراجعة المبيعات اليومية');
  await page.getByLabel('هدف العملية').fill('حلل أداء المبيعات وأبرز التغيرات.');
  await page.getByLabel('الموظف المسؤول').selectOption('employee-1');
  await page.getByLabel('التكرار').selectOption('1440');
  await page.getByRole('button', { name: 'حفظ الأتمتة' }).click();
  await expect(page.getByText('مراجعة المبيعات اليومية')).toBeVisible();
  await page.getByRole('button', { name: 'إيقاف مؤقت' }).click();
  await expect(page.getByRole('button', { name: 'استئناف' })).toBeVisible();
});

test('analytics tab presents workspace runtime and billing usage without implying invoicing', async ({ page }) => {
  await mockWorkspaceSession(page);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'التحليلات والفوترة' }).click();
  await expect(page.getByText('75٪')).toBeVisible();
  await expect(page.getByText('Growth')).toBeVisible();
  await expect(page.getByText(/الفوترة الحالية تعرض الاستخدام والحدود/)).toBeVisible();
});
