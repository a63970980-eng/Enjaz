import { test, expect } from '@playwright/test';

async function mockWorkspaceSession(page, role = 'manager', workspaceIds = ['workspace-1'], toolsHandler = null, tasksHandler = null) {
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
          workspaces: workspaceIds.map((id, index) => ({ id, name: index ? `شركة التجربة ${index + 1}` : 'شركة التجربة', workspace_role: role })),
        },
      },
    });
  });

  const tasks = [];
  const tasksByWorkspace = new Map(workspaceIds.map((id, index) => [id, index === 0 ? tasks : []]));
  const dashboardWorkspaceReads = [];
  const employees = [{ id: 'employee-1', name: 'محلل الأعمال', role: 'محلل', status: 'active' }];
  const departments = [{ id: 'department-1', name: 'العمليات', description: 'فريق التشغيل', manager_name: 'محلل الأعمال', employee_count: 1 }];
  const routines = [];
  const routinesByWorkspace = new Map(workspaceIds.map((id, index) => [id, index === 0 ? routines : []]));
  const createdEmployees = [];
  const createdDepartments = [];
  const members = [
    { user_id: 'user-1', name: 'نور', email: 'owner@example.com', role, joined_at: '2026-10-01T09:00:00.000Z' },
    { user_id: 'user-2', name: 'سامي', email: 'sami@example.com', role: 'viewer', joined_at: '2026-10-02T09:00:00.000Z' },
  ];
  const invitations = [];
  const issuedInvitationRequests = [];
  const connections = [];
  const createdConnections = [];
  const tools = [
    { name: 'data.analyze', description: 'تحليل بيانات للقراءة فقط', risk: 'low' },
    { name: 'report.create', description: 'إنشاء تقرير', risk: 'low' },
    { name: 'payment', description: 'دفعة مالية', risk: 'high' },
  ];
  await page.route(/\/api\/v1\//, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const workspaceId = url.searchParams.get('workspaceId');
    const headers = await request.allHeaders();
    if (!workspaceIds.includes(workspaceId) || headers.authorization !== 'Bearer test-access-token') {
      return route.fulfill({ status: 403, json: { error: 'Workspace scope or bearer token missing' } });
    }

    if (path.endsWith('/runtime/summary')) {
      dashboardWorkspaceReads.push(workspaceId);
      return route.fulfill({ status: 200, json: { data: { summary: { runs: 4, successful_runs: 3, failed_runs: 1, avg_latency_ms: 1200, cost_cents: 75 }, recent: [] } } });
    }
    if (path.endsWith('/workforce/roles')) return route.fulfill({ status: 200, json: { data: [{ role_code: 'business_analyst', title: 'محلل أعمال', department: 'العمليات', sector: 'enterprise', sector_label: 'الشركات', default_goal: 'تحليل الأداء وتقديم توصيات قابلة للقياس', mission: 'تحليل الأداء', skills: ['تحليل', 'تقارير'], responsibilities: ['مراجعة المؤشرات'], tools: ['data.analyze', 'report.create'] }] } });
    if (path.endsWith('/tools')) return toolsHandler ? toolsHandler(route) : route.fulfill({ status: 200, json: { data: tools } });
    if (path.endsWith('/departments') && request.method() === 'GET') return route.fulfill({ status: 200, json: { data: workspaceId === workspaceIds[0] ? departments : [] } });
    if (path.endsWith('/departments') && request.method() === 'POST') {
      const input = request.postDataJSON();
      const department = { id: `department-${departments.length + 1}`, workspace_id: workspaceId, name: input.name, description: input.description, manager_employee_id: input.managerEmployeeId, employee_count: 0 };
      createdDepartments.push(input);
      departments.push(department);
      return route.fulfill({ status: 201, json: { data: department } });
    }
    if (path.endsWith('/employees') && request.method() === 'GET') {
      return route.fulfill({ status: 200, json: { data: workspaceId === workspaceIds[0] ? employees : [] } });
    }
    if (path.endsWith('/employees') && request.method() === 'POST') {
      const input = request.postDataJSON();
      createdEmployees.push(input);
      const employee = { id: `employee-${employees.length + 1}`, ...input, status: 'active' };
      employees.unshift(employee);
      return route.fulfill({ status: 201, json: { data: employee } });
    }
    if (path.endsWith('/integrations') && request.method() === 'GET') return route.fulfill({ status: 200, json: { data: connections } });
    if (path.endsWith('/integrations') && request.method() === 'POST') {
      const input = request.postDataJSON();
      createdConnections.push(input);
      const connection = { id: `connection-${connections.length + 1}`, workspace_id: workspaceId, provider: input.provider, display_name: input.displayName || input.name, status: 'active', created_at: new Date().toISOString() };
      connections.unshift(connection);
      return route.fulfill({ status: 201, json: { data: connection } });
    }
    if (/\/integrations\/[^/]+\/revoke$/.test(path) && request.method() === 'DELETE') {
      const connection = connections.find(item => path.includes(item.id));
      connection.status = 'revoked';
      return route.fulfill({ status: 200, json: { data: connection } });
    }
    if (path.endsWith('/members/invitations') && request.method() === 'GET') return route.fulfill({ status: 200, json: { data: invitations } });
    if (path.endsWith('/members/invitations') && request.method() === 'POST') {
      const input = request.postDataJSON();
      issuedInvitationRequests.push(input);
      const invitation = { id: `invitation-${invitations.length + 1}`, workspace_id: workspaceId, email: input.email, role: input.role || 'member', status: 'pending', expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(), created_at: new Date().toISOString() };
      invitations.unshift(invitation);
      return route.fulfill({ status: 201, json: { data: { invitation, token: 'test-invitation-token-value-0123456789abcdef', workspace: { id: workspaceId, name: 'شركة التجربة' } } } });
    }
    if (/\/members\/invitations\/[^/]+\/revoke$/.test(path) && request.method() === 'POST') {
      const invitation = invitations.find(item => path.includes(item.id));
      invitation.status = 'revoked';
      return route.fulfill({ status: 200, json: { data: invitation } });
    }
    if (path.endsWith('/members') && request.method() === 'GET') return route.fulfill({ status: 200, json: { data: members } });
    const memberMatch = path.match(/\/members\/([^/]+)$/);
    if (memberMatch && request.method() === 'PATCH') {
      const member = members.find(item => item.user_id === memberMatch[1]);
      member.role = request.postDataJSON().role;
      return route.fulfill({ status: 200, json: { data: member } });
    }
    if (memberMatch && request.method() === 'DELETE') {
      const index = members.findIndex(item => item.user_id === memberMatch[1]);
      if (index >= 0) members.splice(index, 1);
      return route.fulfill({ status: 200, json: { data: { userId: memberMatch[1] } } });
    }
    if (path.endsWith('/routines') && request.method() === 'GET') return route.fulfill({ status: 200, json: { data: routinesByWorkspace.get(workspaceId) || [] } });
    if (path.endsWith('/routines') && request.method() === 'POST') {
      const input = request.postDataJSON();
      const scopedRoutines = routinesByWorkspace.get(workspaceId) || [];
      const routine = { id: `routine-${scopedRoutines.length + 1}`, employee_id: input.employeeId, employee_name: 'محلل الأعمال', timezone: input.timezone, schedule: { title: input.name, objective: input.objective, action: input.action, input: input.input, intervalMinutes: input.intervalMinutes }, enabled: input.enabled, next_run_at: new Date(Date.now() + Number(input.intervalMinutes) * 60_000).toISOString() };
      scopedRoutines.unshift(routine);
      return route.fulfill({ status: 201, json: { data: routine } });
    }
    const routineMatch = path.match(/\/routines\/([^/]+)$/);
    if (routineMatch && request.method() === 'PATCH') {
      const routine = (routinesByWorkspace.get(workspaceId) || []).find(item => item.id === routineMatch[1]);
      Object.assign(routine, request.postDataJSON());
      return route.fulfill({ status: 200, json: { data: routine } });
    }
    if (path.endsWith('/tasks') && request.method() === 'GET') {
      return route.fulfill({ status: 200, json: { data: tasksByWorkspace.get(workspaceId) || [] } });
    }
    if (path.endsWith('/tasks') && request.method() === 'POST') {
      if (tasksHandler) return tasksHandler(route, workspaceId);
      const input = request.postDataJSON();
      const scopedTasks = tasksByWorkspace.get(workspaceId) || [];
      const task = { id: `task-${scopedTasks.length + 1}`, ...input, employee_id: input.employeeId, employee_name: 'محلل الأعمال', status: 'queued' };
      scopedTasks.unshift(task);
      return route.fulfill({ status: 201, json: { data: task } });
    }
    if (path.endsWith('/approvals')) {
      return route.fulfill({ status: 200, json: { data: [] } });
    }
    if (path.endsWith('/audit')) {
      return route.fulfill({ status: 200, json: { data: [] } });
    }
    if (path.endsWith('/billing/subscription')) return route.fulfill({ status: 200, json: { data: { plan_name: 'Growth', status: 'active', current_period_end: '2026-11-16T00:00:00.000Z', max_employees: 15, max_tasks_month: 1000, max_integrations: 10, included_ai_cost_cents: 1000 } } });
    if (path.endsWith('/billing/usage')) return route.fulfill({ status: 200, json: { data: { plan: 'growth', status: 'active', employees: workspaceId === workspaceIds[0] ? employees.length : 0, tasksThisMonth: (tasksByWorkspace.get(workspaceId) || []).length, integrations: 2, aiCostCents: 75, limits: { employees: 15, tasksMonth: 1000, integrations: 10, includedAiCostCents: 1000 } } } });
    return route.fulfill({ status: 404, json: { error: `Unhandled API request: ${request.method()} ${path}` } });
  });
  return { employees, routines, departments, createdEmployees, createdDepartments, dashboardWorkspaceReads, members, invitations, issuedInvitationRequests, connections, createdConnections };
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
  await page.getByRole('button', { name: 'الفرق والأقسام' }).click();
  await expect(page.getByRole('button', { name: 'إنشاء فريق' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /إضافة موظف إلى فريق/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'فرق وأقسام مساحة العمل' })).toBeVisible();
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
  await page.getByRole('button', { name: 'فتح القائمة' }).click();
  await page.getByRole('button', { name: 'الفرق والأقسام' }).click();
  await expect(page.getByRole('heading', { name: 'إدارة الفرق' })).toBeVisible();
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

test('employee builder shows catalog loading and allows retry after tool catalog failure', async ({ page }) => {
  let toolRequests = 0;
  let retryAllowed = false;
  await mockWorkspaceSession(page, 'manager', ['workspace-1'], async route => {
    toolRequests += 1;
    await new Promise(resolve => setTimeout(resolve, 250));
    if (!retryAllowed) return route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' } });
    return route.fulfill({ status: 200, json: { data: [{ name: 'data.analyze', description: 'تحليل بيانات للقراءة فقط', risk: 'low' }] } });
  });
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'الموظفون الرقميون' }).click();
  await page.getByRole('button', { name: 'بناء موظف رقمي' }).click();
  await expect(page.getByText('جارٍ تحميل كتالوج الأدوار والأدوات…')).toBeVisible();
  await expect(page.getByText('تعذر تحميل كتالوج الأدوات. أعد المحاولة قبل حفظ الموظف.')).toBeVisible();
  retryAllowed = true;
  await page.getByRole('button', { name: 'إعادة المحاولة' }).click();
  await expect(page.getByText('data.analyze').first()).toBeVisible();
  expect(toolRequests).toBeGreaterThanOrEqual(2);
});

test('workspace owner can create a team and add a specialized employee to that team', async ({ page }) => {
  const state = await mockWorkspaceSession(page, 'manager');
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'الفرق والأقسام' }).click();

  await page.getByLabel('اسم الفريق').fill('فريق المبيعات');
  await page.getByLabel('وصف الفريق').fill('تأهيل الفرص ومراجعة الأداء التجاري.');
  await page.getByLabel('مدير الفريق').selectOption('employee-1');
  await page.getByRole('button', { name: 'إنشاء فريق' }).click();
  await expect(page.getByRole('heading', { name: 'فريق المبيعات' })).toBeVisible();
  await expect(page.locator('.team-meta dd').first()).toHaveText('محلل الأعمال');

  await page.getByRole('button', { name: 'إضافة موظف إلى فريق فريق المبيعات' }).click();
  await expect(page.getByText('الفريق المحدد: فريق المبيعات')).toBeVisible();
  await page.getByLabel('قالب الدور').selectOption('business_analyst');
  await expect(page.getByLabel('الهدف التشغيلي')).toHaveValue('تحليل الأداء وتقديم توصيات قابلة للقياس');
  await page.getByLabel('اسم الموظف').fill('محلل المبيعات');
  await page.getByRole('button', { name: 'حفظ الموظف الرقمي' }).click();

  expect(state.createdDepartments[0]).toMatchObject({ name: 'فريق المبيعات', managerEmployeeId: 'employee-1' });
  expect(state.createdEmployees[0].departmentId).toBe('department-2');
  expect(state.createdEmployees[0].policy.departmentId).toBe('department-2');
  expect(state.createdEmployees[0].roleCode).toBe('business_analyst');
  expect(state.createdEmployees[0].tools).toEqual(['data.analyze', 'report.create']);
});

test('switching workspace clears old team cards and a team-bound employee builder', async ({ page }) => {
  await mockWorkspaceSession(page, 'manager', ['workspace-1', 'workspace-2']);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'الفرق والأقسام' }).click();
  await expect(page.getByRole('heading', { name: 'العمليات' })).toBeVisible();

  const workspaceSelect = page.getByLabel('مساحة العمل الحالية');
  await workspaceSelect.selectOption('workspace-2');
  await expect(page.getByRole('heading', { name: 'العمليات' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /إضافة موظف إلى فريق/ })).toHaveCount(0);

  await workspaceSelect.selectOption('workspace-1');
  await expect(page.getByRole('button', { name: 'إضافة موظف إلى فريق العمليات' })).toBeVisible();
  await page.getByRole('button', { name: 'إضافة موظف إلى فريق العمليات' }).click();
  await expect(page.getByText('الفريق المحدد: العمليات')).toBeVisible();
  await workspaceSelect.selectOption('workspace-2');
  await expect(page.getByRole('heading', { name: 'منشئ الموظف الرقمي' })).toHaveCount(0);
});

test('a late task response from the previous workspace cannot reload its dashboard', async ({ page }) => {
  let markTaskStarted;
  let releaseTask;
  const taskStarted = new Promise(resolve => { markTaskStarted = resolve; });
  const taskGate = new Promise(resolve => { releaseTask = resolve; });
  const state = await mockWorkspaceSession(page, 'manager', ['workspace-1', 'workspace-2'], null, async route => {
    markTaskStarted();
    await taskGate;
    const input = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { data: { id: 'delayed-task', ...input, employee_id: input.employeeId, status: 'queued' } } });
  });
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'المهام', exact: true }).click();
  await page.getByLabel('عنوان المهمة').fill('مراجعة خاصة بالمساحة الأولى');
  await page.getByLabel('الهدف والنتيجة المطلوبة').fill('تحليل داخلي للمساحة الأولى.');
  await page.getByLabel('الموظف الرقمي').selectOption('employee-1');
  const createResponse = page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/tasks') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'إنشاء المهمة' }).click();
  await taskStarted;

  const workspaceSelect = page.getByLabel('مساحة العمل الحالية');
  await workspaceSelect.selectOption('workspace-2');
  await expect(workspaceSelect).toHaveValue('workspace-2');
  await expect(page.getByLabel('عنوان المهمة')).toHaveValue('');
  await workspaceSelect.selectOption('workspace-1');
  await expect(workspaceSelect).toHaveValue('workspace-1');
  await expect(page.getByLabel('عنوان المهمة')).toHaveValue('');
  const oldWorkspaceReads = state.dashboardWorkspaceReads.filter(id => id === 'workspace-1').length;
  expect(state.dashboardWorkspaceReads).toContain('workspace-2');

  releaseTask();
  await createResponse;
  await page.waitForLoadState('networkidle');
  expect(state.dashboardWorkspaceReads.filter(id => id === 'workspace-1').length).toBe(oldWorkspaceReads);
  await expect(page.getByText('حُفظت المهمة في مساحة العمل. ابدأ التخطيط والتنفيذ من بطاقة المهمة عندما تكون جاهزًا.')).toHaveCount(0);
});

test('scheduled routines from a previous workspace are hidden after switching workspaces', async ({ page }) => {
  await mockWorkspaceSession(page, 'manager', ['workspace-1', 'workspace-2']);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'الأتمتة' }).click();
  await page.getByLabel('اسم الأتمتة').fill('روتين المساحة الأولى');
  await page.getByLabel('هدف العملية').fill('مراجعة دورية خاصة بالمستأجر الأول.');
  await page.getByLabel('الموظف المسؤول').selectOption('employee-1');
  await page.getByRole('button', { name: 'حفظ الأتمتة' }).click();
  await expect(page.getByText('روتين المساحة الأولى')).toBeVisible();

  const workspaceSelect = page.getByLabel('مساحة العمل الحالية');
  await workspaceSelect.selectOption('workspace-2');
  await expect(workspaceSelect).toHaveValue('workspace-2');
  await expect(page.getByText('لا توجد أتمتة بعد')).toBeVisible();
  await expect(page.getByText('روتين المساحة الأولى')).toHaveCount(0);
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

test('manager can invite a member and revoke the invitation from the members surface', async ({ page }) => {
  const state = await mockWorkspaceSession(page);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'الأعضاء والصلاحيات' }).click();

  await expect(page.getByRole('heading', { name: 'أعضاء المساحة' })).toBeVisible();
  await expect(page.locator('table').first().getByText('sami@example.com')).toBeVisible();
  await page.getByLabel('بريد العضو المدعو').fill('new.member@example.com');
  await page.getByLabel('دور العضو المدعو').selectOption('manager');
  await page.getByRole('button', { name: 'إنشاء دعوة' }).click();

  await expect(page.getByText(/أُنشئت الدعوة/)).toBeVisible();
  await expect(page.getByRole('group', { name: 'رابط الدعوة' })).toContainText('new.member@example.com');
  const link = await page.getByRole('group', { name: 'رابط الدعوة' }).locator('code').innerText();
  expect(link).toContain('workspace.html?invite=');
  expect(state.issuedInvitationRequests[0]).toMatchObject({ email: 'new.member@example.com', role: 'manager' });

  await page.getByRole('button', { name: 'إلغاء الدعوة' }).click();
  await expect(page.getByText('ملغاة')).toBeVisible();
  expect(state.invitations[0].status).toBe('revoked');
});

test('read-only members cannot invite, change roles or remove members', async ({ page }) => {
  await mockWorkspaceSession(page, 'viewer');
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'الأعضاء والصلاحيات' }).click();

  await expect(page.getByRole('heading', { name: 'أعضاء المساحة' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'دعوة عضو' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /إزالة/ })).toHaveCount(0);
  await expect(page.getByLabel('دور owner@example.com')).toHaveCount(0);
  await expect(page.getByText(/إدارة الأعضاء والأدوار متاحة لمدير المساحة فقط/)).toBeVisible();
});

test('manager can connect and revoke an encrypted integration without exposing the secret', async ({ page }) => {
  const state = await mockWorkspaceSession(page);
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'التكاملات' }).click();

  await expect(page.getByRole('heading', { name: 'التكاملات المتصلة' })).toBeVisible();
  await page.getByLabel('خدمة التكامل').selectOption('slack');
  await page.getByLabel('اسم الاتصال').fill('قناة العمليات');
  await page.getByLabel('Bot token').fill('xoxb-test-token-value');
  await page.getByRole('button', { name: 'حفظ الاتصال' }).click();

  await expect(page.getByText('قناة العمليات')).toBeVisible();
  await expect(page.getByText(/حُفظ الاتصال بتشفير/)).toBeVisible();
  expect(state.createdConnections[0]).toMatchObject({ provider: 'slack', displayName: 'قناة العمليات', credentials: { token: 'xoxb-test-token-value' } });
  await expect(page.locator('body')).not.toContainText('xoxb-test-token-value');

  await page.getByRole('button', { name: 'إلغاء' }).click();
  await expect(page.getByText('ملغى')).toBeVisible();
  expect(state.connections[0].status).toBe('revoked');
});

test('read-only members cannot connect or revoke integrations', async ({ page }) => {
  await mockWorkspaceSession(page, 'viewer');
  await page.goto('/workspace.html');
  await page.getByLabel('البريد الإلكتروني').fill('owner@example.com');
  await page.getByLabel('كلمة المرور').fill('valid-test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.getByRole('button', { name: 'التكاملات' }).click();

  await expect(page.getByRole('heading', { name: 'التكاملات المتصلة' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'ربط تكامل جديد' })).toHaveCount(0);
  await expect(page.getByText(/لا توجد تكاملات/)).toBeVisible();
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
