import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Activity, AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, BarChart3,
  Bot, Building2, Check, ChevronDown, CircleHelp, ClipboardCheck, Clock3,
  FileText, LayoutDashboard, LoaderCircle, LogOut, Plus, Plug, RefreshCw,
  Search, Settings, ShieldCheck, Sparkles, Workflow, X, Zap,
} from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabase';
import './WorkspaceApp.css';

type Workspace = { id: string; name: string; organization_name?: string; workspace_role?: string };
type Profile = { id: string; name: string; email: string; role: string };
type Employee = {
  id: string; name: string; role: string; role_code?: string; goal?: string;
  status: string; model?: string; mission?: string; created_at?: string;
};
type Task = {
  id: string; title: string; objective?: string; status: string; priority?: number;
  employee_name?: string; employee_role?: string; created_at?: string;
};
type Approval = { id: string; task_title?: string; action: string; reason?: string; status: string; created_at?: string };
type Role = {
  role_code: string; title: string; department: string; mission?: string;
  responsibilities?: unknown[]; skills?: unknown[]; tools?: unknown[];
  permissions?: unknown[]; kpis?: unknown[]; collaboration?: unknown[];
  escalation_rules?: unknown[]; supported_industries?: string[]; version?: number;
};
type ApiMe = { identity: { email: string; name: string }; profile: Profile | null; workspaces: Workspace[] };
type Tab = 'overview' | 'employees' | 'tasks' | 'approvals' | 'integrations' | 'settings';

async function apiRequest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...init, headers, credentials: 'same-origin' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `تعذر إكمال الطلب (${response.status})`);
  return (body?.data ?? body) as T;
}

function friendlyAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (/email not confirmed/i.test(message)) return 'يرجى تأكيد بريدك الإلكتروني أولًا.';
  if (/password should be at least/i.test(message)) return 'استخدم كلمة مرور أطول لا تقل عن 6 أحرف.';
  if (/user already registered/i.test(message)) return 'هذا البريد مسجل بالفعل. سجّل الدخول بدلًا من إنشاء حساب جديد.';
  if (/rate limit/i.test(message)) return 'طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.';
  return message;
}

const tabItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'مركز العمليات', icon: LayoutDashboard },
  { id: 'employees', label: 'الموظفون الرقميون', icon: Bot },
  { id: 'tasks', label: 'المهام وسير العمل', icon: Workflow },
  { id: 'approvals', label: 'الموافقات', icon: ClipboardCheck },
  { id: 'integrations', label: 'التكاملات', icon: Plug },
  { id: 'settings', label: 'إعدادات المؤسسة', icon: Settings },
];

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    active: 'نشط', paused: 'متوقف مؤقتًا', archived: 'مؤرشف', disabled: 'معطل',
    queued: 'في قائمة الانتظار', planning: 'قيد التخطيط', executing: 'قيد التنفيذ',
    awaiting_approval: 'بانتظار الموافقة', completed: 'مكتمل', succeeded: 'مكتمل',
    failed: 'فشل', cancelled: 'ملغى', pending: 'بانتظار المراجعة',
    approved: 'تمت الموافقة', rejected: 'مرفوض', trial: 'فترة تجريبية',
  };
  const tone = ['active', 'completed', 'succeeded', 'approved'].includes(value) ? 'success'
    : ['failed', 'rejected', 'archived', 'cancelled'].includes(value) ? 'danger'
    : ['executing', 'planning', 'queued', 'pending', 'awaiting_approval'].includes(value) ? 'pending' : 'neutral';
  return <span className={`wa-status ${tone}`}><i />{map[value] || value || 'غير محدد'}</span>;
}

function AuthPanel({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (authError) throw authError;
        if (data.session) setNotice('تم إنشاء الحساب بنجاح. سننقلك إلى إعداد مساحة العمل.');
        else setNotice('تم إرسال طلب إنشاء الحساب. افحص بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : 'تعذر تسجيل الدخول.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wa-auth-shell">
      <div className="wa-auth-decoration"><span /><span /><span /></div>
      <div className="wa-auth-top">
        <a className="wa-brand" href="#home" onClick={onBack}><span className="wa-brand-icon"><Zap size={21} /></span><span>إنجاز<small>ENJAZ WORKFORCE</small></span></a>
        <button className="wa-back-link" onClick={onBack}><ArrowRight size={16} /> العودة للموقع</button>
      </div>
      <div className="wa-auth-layout">
        <section className="wa-auth-pitch">
          <span className="wa-eyebrow"><ShieldCheck size={15} /> مساحة عمل مؤسسية</span>
          <h1>العمل الذكي يبدأ<br /><span>بمساحة منظمة.</span></h1>
          <p>أدِر موظفيك الرقميين ومهامك وموافقاتك من مساحة عمل واحدة، مع صلاحيات واضحة وسجل قابل للمراجعة.</p>
          <div className="wa-auth-proof"><span><Check size={15} /> دخول آمن</span><span><Check size={15} /> بيانات معزولة حسب المؤسسة</span><span><Check size={15} /> موافقات بشرية</span></div>
        </section>
        <section className="wa-auth-card" aria-labelledby="wa-auth-title">
          <div className="wa-auth-card-head"><span className="wa-auth-icon"><Bot size={23} /></span><span className="wa-auth-kicker">بوابة إنجاز</span></div>
          <h2 id="wa-auth-title">{mode === 'signin' ? 'مرحبًا بعودتك' : 'أنشئ حساب إنجاز'}</h2>
          <p className="wa-auth-subtitle">{mode === 'signin' ? 'سجّل الدخول للمتابعة إلى مساحة عملك.' : 'ابدأ حسابك ثم أنشئ مساحة مؤسستك.'}</p>
          <div className="wa-auth-tabs" role="tablist" aria-label="نوع الحساب">
            <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); setNotice(''); }}>تسجيل الدخول</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setNotice(''); }}>حساب جديد</button>
          </div>
          {!supabaseConfigured && <div className="wa-notice error"><AlertCircle size={17} /><span>تسجيل الدخول غير مهيأ في هذه البيئة. افتح النسخة المنشورة مع إعدادات الهوية الصحيحة.</span></div>}
          {error && <div className="wa-notice error" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}
          {notice && <div className="wa-notice success" role="status"><Check size={17} /><span>{notice}</span></div>}
          <form className="wa-auth-form" onSubmit={submit}>
            {mode === 'signup' && <label>الاسم الكامل<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required placeholder="كيف نناديك؟" /></label>}
            <label>البريد الإلكتروني<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required placeholder="you@company.com" dir="ltr" /></label>
            <label>كلمة المرور<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={6} placeholder="6 أحرف على الأقل" dir="ltr" /></label>
            <button className="wa-primary-button" disabled={busy || !supabaseConfigured} type="submit">{busy ? <LoaderCircle className="spin" size={17} /> : null}{busy ? 'جارٍ التحقق…' : mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء الحساب'}<ArrowLeft size={16} /></button>
          </form>
          <div className="wa-auth-foot"><LockKeyholeMini /> تتم المصادقة عبر Supabase Auth؛ لا نخزن كلمة مرورك في إنجاز.</div>
        </section>
      </div>
      <div className="wa-auth-bottom">© {new Date().getFullYear()} ENJAZ · منصة تشغيل الموظفين الرقميين</div>
    </div>
  );
}

function LockKeyholeMini() {
  return <ShieldCheck size={14} aria-hidden="true" />;
}

export default function WorkspaceApp({ onBack }: { onBack: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [usage, setUsage] = useState<{ employees: number; tasksThisMonth: number; integrations: number; limits?: { employees: number; tasksMonth: number; integrations: number } } | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [onboarding, setOnboarding] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [employeeModal, setEmployeeModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRoleCode, setEmployeeRoleCode] = useState('');
  const [employeeGoal, setEmployeeGoal] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskObjective, setTaskObjective] = useState('');
  const [taskEmployeeId, setTaskEmployeeId] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const token = session?.access_token || '';

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setAuthReady(true); }
    }).catch(() => { if (mounted) setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const refreshProfile = useCallback(async (accessToken: string) => {
    const me = await apiRequest<ApiMe>(accessToken, '/api/v1/auth/me');
    setProfile(me.profile);
    setWorkspaces(me.workspaces || []);
    if (!me.profile || !me.workspaces?.length) {
      setOnboarding(true);
      setOrganizationName(prev => prev || (me.identity?.name ? `${me.identity.name} Organization` : ''));
      setWorkspaceName(prev => prev || 'مساحة العمل الرئيسية');
      setWorkspaceId('');
    } else {
      setOnboarding(false);
      setWorkspaceId(current => me.workspaces.some(w => w.id === current) ? current : me.workspaces[0].id);
    }
  }, []);

  useEffect(() => {
    if (!token) { setProfile(null); setWorkspaces([]); setWorkspaceId(''); setEmployees([]); setTasks([]); setApprovals([]); setRoles([]); setUsage(null); return; }
    let cancelled = false;
    setPageLoading(true); setLoadError('');
    apiRequest<ApiMe>(token, '/api/v1/auth/me').then(me => {
      if (cancelled) return;
      setProfile(me.profile);
      setWorkspaces(me.workspaces || []);
      if (!me.profile || !me.workspaces?.length) {
        setOnboarding(true);
        setOrganizationName(prev => prev || (me.identity?.name ? `${me.identity.name} Organization` : ''));
        setWorkspaceName(prev => prev || 'مساحة العمل الرئيسية');
        setWorkspaceId('');
      } else {
        setOnboarding(false);
        setWorkspaceId(current => me.workspaces.some(w => w.id === current) ? current : me.workspaces[0].id);
      }
    }).catch(e => { if (!cancelled) setLoadError(e instanceof Error ? e.message : 'تعذر تحميل الحساب.'); })
      .finally(() => { if (!cancelled) setPageLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const loadWorkspace = useCallback(async () => {
    if (!token || !workspaceId) return;
    setPageLoading(true); setLoadError('');
    const q = `?workspaceId=${encodeURIComponent(workspaceId)}`;
    const results = await Promise.allSettled([
      apiRequest<Employee[]>(token, `/api/v1/employees${q}`),
      apiRequest<Task[]>(token, `/api/v1/tasks${q}`),
      apiRequest<Approval[]>(token, `/api/v1/approvals${q}`),
      apiRequest<Role[]>(token, `/api/v1/workforce/roles${q}`),
      apiRequest<typeof usage>(token, `/api/v1/billing/usage${q}`),
    ]);
    if (results[0].status === 'fulfilled') setEmployees(results[0].value);
    if (results[1].status === 'fulfilled') setTasks(results[1].value);
    if (results[2].status === 'fulfilled') setApprovals(results[2].value);
    if (results[3].status === 'fulfilled') setRoles(results[3].value);
    if (results[4].status === 'fulfilled') setUsage(results[4].value);
    const failed = results.find(r => r.status === 'rejected');
    if (failed?.status === 'rejected') setLoadError(failed.reason instanceof Error ? failed.reason.message : 'تعذر تحديث بعض بيانات مساحة العمل.');
    setPageLoading(false);
  }, [token, workspaceId]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  const activeWorkspace = workspaces.find(w => w.id === workspaceId);
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'active'), [employees]);
  const openTasks = useMemo(() => tasks.filter(t => ['queued', 'planning', 'executing', 'awaiting_approval'].includes(t.status)), [tasks]);
  const pendingApprovals = useMemo(() => approvals.filter(a => a.status === 'pending'), [approvals]);
  const filteredEmployees = useMemo(() => employees.filter(e => `${e.name} ${e.role} ${e.role_code || ''}`.toLowerCase().includes(search.toLowerCase())), [employees, search]);

  async function submitOnboarding(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true); setLoadError('');
    try {
      const result = await apiRequest<{ user: Profile; workspaces: Workspace[]; created: boolean }>(token, '/api/v1/onboarding/bootstrap', {
        method: 'POST',
        body: JSON.stringify({ organizationName: organizationName.trim(), workspaceName: workspaceName.trim(), name: profile?.name }),
      });
      setProfile(result.user);
      setWorkspaces(result.workspaces || []);
      setWorkspaceId(result.workspaces?.[0]?.id || '');
      setOnboarding(false);
      setToast(result.created ? 'تم إنشاء مساحة العمل بنجاح.' : 'تم تحميل مساحة عملك.');
    } catch (e) { setLoadError(e instanceof Error ? e.message : 'تعذر إعداد مساحة العمل.'); }
    finally { setSaving(false); }
  }

  async function createEmployee(event: FormEvent) {
    event.preventDefault();
    if (!token || !workspaceId) return;
    const role = roles.find(r => r.role_code === employeeRoleCode);
    if (!role) { setLoadError('اختر دورًا من كتالوج الموظفين الرقميين.'); return; }
    setSaving(true); setLoadError('');
    try {
      await apiRequest<Employee>(token, `/api/v1/employees?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: 'POST',
        body: JSON.stringify({
          name: employeeName.trim(), role: role.title, roleCode: role.role_code,
          goal: employeeGoal.trim() || role.mission || '', mission: role.mission || '',
          responsibilities: role.responsibilities || [], skills: role.skills || [],
          tools: role.tools || [], permissions: role.permissions || [],
          kpis: role.kpis || [], collaboration: role.collaboration || [],
          escalationRules: role.escalation_rules || [],
          industryContext: { supported: role.supported_industries || [], current: null },
          workforceVersion: role.version || 1, status: 'active',
        }),
      });
      setEmployeeModal(false); setEmployeeName(''); setEmployeeRoleCode(''); setEmployeeGoal('');
      setToast('تم إنشاء الموظف الرقمي.'); await loadWorkspace();
    } catch (e) { setLoadError(e instanceof Error ? e.message : 'تعذر إنشاء الموظف.'); }
    finally { setSaving(false); }
  }

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!token || !workspaceId) return;
    setSaving(true); setLoadError('');
    try {
      await apiRequest<Task>(token, `/api/v1/tasks?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: 'POST',
        body: JSON.stringify({ title: taskTitle.trim(), objective: taskObjective.trim(), employeeId: taskEmployeeId, priority: 5 }),
      });
      setTaskModal(false); setTaskTitle(''); setTaskObjective(''); setTaskEmployeeId('');
      setToast('تم إنشاء المهمة وإضافتها إلى قائمة التنفيذ.'); setActiveTab('tasks'); await loadWorkspace();
    } catch (e) { setLoadError(e instanceof Error ? e.message : 'تعذر إنشاء المهمة.'); }
    finally { setSaving(false); }
  }

  async function planTask(task: Task) {
    if (!token || !workspaceId) return;
    setSaving(true); setLoadError('');
    try {
      await apiRequest(token, `/api/v1/tasks/${task.id}/plan?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: 'POST', body: JSON.stringify({ goal: task.objective || task.title }),
      });
      setToast('أُرسل طلب التخطيط والتنفيذ. راجع حالة المهمة وسجل الموافقات.'); await loadWorkspace();
    } catch (e) { setLoadError(e instanceof Error ? e.message : 'تعذر بدء التخطيط.'); }
    finally { setSaving(false); }
  }

  async function decideApproval(approval: Approval, decision: 'approve' | 'reject') {
    if (!token || !workspaceId) return;
    setSaving(true); setLoadError('');
    try {
      await apiRequest(token, `/api/v1/approvals/${approval.id}/${decision}?workspaceId=${encodeURIComponent(workspaceId)}`, { method: 'POST' });
      setToast(decision === 'approve' ? 'تم اعتماد الموافقة.' : 'تم رفض الموافقة.'); await loadWorkspace();
    } catch (e) { setLoadError(e instanceof Error ? e.message : 'تعذر تحديث الموافقة.'); }
    finally { setSaving(false); }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null); setActiveTab('overview'); onBack();
  }

  if (!authReady) return <div className="wa-full-loader"><LoaderCircle className="spin" size={25} /><span>جارٍ تجهيز مساحة العمل…</span></div>;
  if (!session) return <AuthPanel onBack={onBack} />;
  if (pageLoading && !profile && !onboarding) return <div className="wa-full-loader"><LoaderCircle className="spin" size={25} /><span>جارٍ تحميل حسابك…</span></div>;

  if (onboarding) return (
    <div className="wa-auth-shell">
      <div className="wa-auth-top"><a className="wa-brand" href="#app"><span className="wa-brand-icon"><Zap size={21} /></span><span>إنجاز<small>ENJAZ WORKFORCE</small></span></a><button className="wa-back-link" onClick={() => void signOut()}><LogOut size={16} /> تسجيل الخروج</button></div>
      <div className="wa-onboarding-card">
        <span className="wa-auth-icon"><Building2 size={24} /></span>
        <div className="wa-eyebrow">الخطوة الأولى</div>
        <h1>جهّز مساحة عمل مؤسستك</h1>
        <p>ستُنشأ مساحة مستقلة لمؤسستك. يمكنك دعوة الفريق وإعداد الموظفين الرقميين بعد الدخول.</p>
        {loadError && <div className="wa-notice error" role="alert"><AlertCircle size={17} /><span>{loadError}</span></div>}
        <form className="wa-auth-form" onSubmit={submitOnboarding}>
          <label>اسم المؤسسة<input required value={organizationName} onChange={e => setOrganizationName(e.target.value)} placeholder="اسم شركتك أو مؤسستك" /></label>
          <label>اسم مساحة العمل<input required value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder="مثال: العمليات الرئيسية" /></label>
          <button className="wa-primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : null}إنشاء مساحة العمل <ArrowLeft size={16} /></button>
        </form>
        <p className="wa-small-note"><ShieldCheck size={14} /> تُربط المساحة بحسابك وتُحمى بصلاحيات المؤسسة.</p>
      </div>
    </div>
  );

  if (!workspaceId || !activeWorkspace) return (
    <div className="wa-full-loader"><LoaderCircle className="spin" size={25} /><span>جارٍ فتح مساحة العمل…</span><button className="wa-back-link" onClick={() => void refreshProfile(token)}>تحديث الحساب</button></div>
  );

  return (
    <div className="wa-app">
      <aside className="wa-sidebar">
        <a className="wa-brand" href="#app" aria-label="إنجاز"><span className="wa-brand-icon"><Zap size={21} /></span><span>إنجاز<small>ENJAZ WORKFORCE</small></span></a>
        <div className="wa-space-switch"><span className="wa-space-symbol"><Building2 size={17} /></span><span><small>مساحة العمل</small><strong>{activeWorkspace.name}</strong></span><ChevronDown size={15} /></div>
        <div className="wa-side-label">مساحة التشغيل</div>
        <nav className="wa-side-nav" aria-label="قائمة مساحة العمل">
          {tabItems.map(item => { const Icon = item.icon; return <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setActiveTab(item.id)}><Icon size={17} /><span>{item.label}</span>{item.id === 'approvals' && pendingApprovals.length > 0 ? <i className="wa-nav-count">{pendingApprovals.length}</i> : null}</button>; })}
        </nav>
        <div className="wa-sidebar-bottom"><div className="wa-sidebar-security"><ShieldCheck size={16} /><span><strong>الحوكمة مفعّلة</strong><small>الإجراءات الحساسة تحتاج اعتمادًا</small></span></div><button className="wa-side-help" onClick={() => setActiveTab('settings')}><CircleHelp size={16} /> المساعدة والإعدادات</button><div className="wa-user-chip"><span className="wa-user-avatar">{(profile?.name || session.user.email || 'م').slice(0, 1)}</span><span><strong>{profile?.name || session.user.email}</strong><small>{profile?.role || 'عضو مساحة العمل'}</small></span><button aria-label="تسجيل الخروج" onClick={() => void signOut()}><LogOut size={16} /></button></div></div>
      </aside>

      <div className="wa-main-column">
        <header className="wa-topbar">
          <div className="wa-breadcrumb"><span>إنجاز</span><ArrowLeft size={13} /><strong>{tabItems.find(t => t.id === activeTab)?.label}</strong></div>
          <div className="wa-top-actions"><span className="wa-top-secure"><ShieldCheck size={15} /> مساحة محمية</span><button className="wa-icon-button" aria-label="تحديث البيانات" onClick={() => void loadWorkspace()}><RefreshCw size={17} /></button><span className="wa-top-avatar">{(profile?.name || session.user.email || 'م').slice(0, 1)}</span></div>
        </header>
        <main className="wa-content">
          {loadError && <div className="wa-notice error wa-inline-notice" role="alert"><AlertCircle size={17} /><span>{loadError}</span><button onClick={() => setLoadError('')} aria-label="إغلاق التنبيه"><X size={15} /></button></div>}
          {toast && <div className="wa-notice success wa-inline-notice" role="status"><Check size={17} /><span>{toast}</span><button onClick={() => setToast('')} aria-label="إغلاق التنبيه"><X size={15} /></button></div>}
          {activeTab === 'overview' && <section>
            <div className="wa-page-heading"><div><span className="wa-eyebrow"><Activity size={14} /> نظرة تشغيلية</span><h1>أهلًا {profile?.name?.split(' ')[0] || 'بك'}، هذه مساحة عملك.</h1><p>تابع الموظفين الرقميين والمهام والموافقات من مكان واحد.</p></div><button className="wa-primary-button compact" onClick={() => { setActiveTab('tasks'); setTaskModal(true); }}><Plus size={16} /> مهمة جديدة</button></div>
            <div className="wa-metric-grid">
              <Metric icon={Bot} label="الموظفون النشطون" value={activeEmployees.length} foot={`من ${employees.length} موظف رقمي`} />
              <Metric icon={Workflow} label="المهام المفتوحة" value={openTasks.length} foot="بانتظار التنفيذ أو المتابعة" />
              <Metric icon={ClipboardCheck} label="موافقات معلّقة" value={pendingApprovals.length} foot="تحتاج إلى مراجعة الفريق" />
              <Metric icon={Zap} label="المهام هذا الشهر" value={usage?.tasksThisMonth ?? tasks.length} foot={usage?.limits ? `الحد ${usage.limits.tasksMonth.toLocaleString('ar')}` : 'يُحدّث من بيانات مساحة العمل'} />
            </div>
            <div className="wa-overview-grid">
              <section className="wa-panel wa-panel-wide"><div className="wa-panel-heading"><div><h2>أحدث المهام</h2><p>حالة المهام الفعلية في مساحة العمل</p></div><button className="wa-text-button" onClick={() => setActiveTab('tasks')}>عرض الكل <ArrowLeft size={14} /></button></div>
                {tasks.length ? <div className="wa-task-list">{tasks.slice(0, 5).map(task => <div className="wa-task-row" key={task.id}><span className="wa-task-icon"><Workflow size={16} /></span><div className="wa-task-copy"><strong>{task.title}</strong><small>{task.employee_name || 'موظف رقمي'} · {task.created_at ? new Date(task.created_at).toLocaleDateString('ar') : '—'}</small></div><StatusPill value={task.status} /></div>)}</div> : <EmptyState icon={Workflow} title="لا توجد مهام بعد" text="أنشئ أول مهمة واربطها بموظف رقمي نشط." action="إنشاء مهمة" onAction={() => { setActiveTab('tasks'); setTaskModal(true); }} />}</section>
              <section className="wa-panel"><div className="wa-panel-heading"><div><h2>قوة العمل الرقمية</h2><p>حسب حالة الموظف</p></div><button className="wa-mini-action" aria-label="عرض الموظفين" onClick={() => setActiveTab('employees')}><ArrowLeft size={15} /></button></div>
                {employees.length ? <div className="wa-employee-mini-list">{employees.slice(0, 4).map(employee => <div className="wa-employee-mini" key={employee.id}><span className="wa-employee-avatar"><Bot size={17} /></span><span><strong>{employee.name}</strong><small>{employee.role}</small></span><StatusPill value={employee.status} /></div>)}</div> : <EmptyState icon={Bot} title="لم تضف موظفين" text="اختر الأدوار المناسبة وابدأ بفريقك الرقمي." action="استعراض الأدوار" onAction={() => setActiveTab('employees')} />}</section>
            </div>
            <div className="wa-governance-banner"><span className="wa-governance-icon"><ShieldCheck size={21} /></span><div><strong>الإشراف البشري جزء من سير العمل</strong><p>تُعرض الموافقات المعلّقة للمراجعة قبل استكمال الإجراءات التي تتطلب اعتمادًا.</p></div><button onClick={() => setActiveTab('approvals')}>مراجعة الموافقات <ArrowLeft size={15} /></button></div>
          </section>}

          {activeTab === 'employees' && <section>
            <div className="wa-page-heading"><div><span className="wa-eyebrow"><Bot size={14} /> إدارة القوة العاملة</span><h1>الموظفون الرقميون</h1><p>أدوار مشتركة تتخصص عبر مهارات ومعرفة وأدوات وسياسات كل مؤسسة.</p></div><button className="wa-primary-button compact" onClick={() => setEmployeeModal(true)}><Plus size={16} /> إضافة موظف رقمي</button></div>
            <div className="wa-list-toolbar"><label className="wa-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن موظف أو دور…" /></label><span>{filteredEmployees.length} موظف</span></div>
            {filteredEmployees.length ? <div className="wa-employee-grid">{filteredEmployees.map(employee => <article className="wa-employee-card" key={employee.id}><div className="wa-employee-card-top"><span className="wa-employee-avatar large"><Bot size={21} /></span><StatusPill value={employee.status} /></div><h3>{employee.name}</h3><p className="wa-employee-role">{employee.role}</p><p className="wa-employee-goal">{employee.goal || employee.mission || 'لم يُحدد هدف لهذا الموظف بعد.'}</p><div className="wa-employee-card-foot"><span><Sparkles size={14} /> {employee.role_code || 'دور مخصص'}</span><span>{employee.model || 'default'}</span></div></article>)}</div> : <EmptyState icon={Bot} title={search ? 'لا توجد نتائج مطابقة' : 'ابدأ بتكوين فريقك الرقمي'} text={search ? 'جرّب كلمة بحث أخرى.' : 'اختر دورًا من كتالوج الأدوار؛ وسيهيّئ إنجاز المهارات والأدوات والسياسات الأساسية.'} action={search ? undefined : 'إضافة أول موظف'} onAction={search ? undefined : () => setEmployeeModal(true)} />}
          </section>}

          {activeTab === 'tasks' && <section>
            <div className="wa-page-heading"><div><span className="wa-eyebrow"><Workflow size={14} /> التنفيذ والتنسيق</span><h1>المهام وسير العمل</h1><p>أنشئ مهمة، عيّن الموظف المناسب، ثم ابدأ التخطيط عند استعدادك.</p></div><button className="wa-primary-button compact" onClick={() => setTaskModal(true)}><Plus size={16} /> مهمة جديدة</button></div>
            {tasks.length ? <div className="wa-panel wa-table-panel"><div className="wa-table-scroll"><table className="wa-table"><thead><tr><th>المهمة</th><th>الموظف المسؤول</th><th>الحالة</th><th>تاريخ الإنشاء</th><th>الإجراء</th></tr></thead><tbody>{tasks.map(task => <tr key={task.id}><td><strong>{task.title}</strong><small>{task.objective || '—'}</small></td><td>{task.employee_name || '—'}</td><td><StatusPill value={task.status} /></td><td>{task.created_at ? new Date(task.created_at).toLocaleDateString('ar') : '—'}</td><td>{['queued', 'planning'].includes(task.status) ? <button className="wa-row-action" disabled={saving} onClick={() => void planTask(task)}><Zap size={14} /> ابدأ التخطيط</button> : <span className="wa-muted">—</span>}</td></tr>)}</tbody></table></div></div> : <EmptyState icon={Workflow} title="قائمة المهام فارغة" text={activeEmployees.length ? 'أنشئ مهمة وحدد الموظف الرقمي الذي سيتولاها.' : 'أضف موظفًا رقميًا نشطًا قبل إنشاء أول مهمة.'} action={activeEmployees.length ? 'إنشاء مهمة' : 'إضافة موظف'} onAction={() => activeEmployees.length ? setTaskModal(true) : setActiveTab('employees')} />}
          </section>}

          {activeTab === 'approvals' && <section>
            <div className="wa-page-heading"><div><span className="wa-eyebrow"><ClipboardCheck size={14} /> الحوكمة والرقابة</span><h1>الموافقات</h1><p>راجع الإجراءات التي تنتظر قرارًا بشريًا قبل استكمالها.</p></div><span className="wa-approval-count">{pendingApprovals.length} معلّقة</span></div>
            {approvals.length ? <div className="wa-approval-list">{approvals.map(approval => <article className="wa-approval-card" key={approval.id}><div className="wa-approval-symbol"><ShieldCheck size={20} /></div><div className="wa-approval-copy"><strong>{approval.task_title || approval.action || 'إجراء يحتاج مراجعة'}</strong><p>{approval.reason || 'لا توجد ملاحظات إضافية.'}</p><small>{approval.created_at ? new Date(approval.created_at).toLocaleString('ar') : '—'}</small></div><div className="wa-approval-actions"><StatusPill value={approval.status} />{approval.status === 'pending' && <><button className="wa-approve-button" disabled={saving} onClick={() => void decideApproval(approval, 'approve')}><Check size={14} /> اعتماد</button><button className="wa-reject-button" disabled={saving} onClick={() => void decideApproval(approval, 'reject')}>رفض</button></>}</div></article>)}</div> : <EmptyState icon={ShieldCheck} title="لا توجد موافقات معلّقة" text="ستظهر هنا الإجراءات التي تتطلب مراجعة أو اعتمادًا من المسؤول." />}
          </section>}

          {activeTab === 'integrations' && <section>
            <div className="wa-page-heading"><div><span className="wa-eyebrow"><Plug size={14} /> ربط الأنظمة</span><h1>التكاملات</h1><p>اتصالات الأدوات الخارجية تُدار ضمن صلاحيات المؤسسة وسجل الإجراءات.</p></div></div>
            <div className="wa-panel"><div className="wa-panel-heading"><div><h2>اتصالات المؤسسة</h2><p>لا تُعرض أي بيانات سرية في هذه الشاشة.</p></div></div><EmptyState icon={Plug} title="إعداد التكاملات قيد التهيئة" text="تتوفر واجهات التكامل في الخادم؛ واجهة إدارة الاتصالات ستُستكمل بعد اختبار كل مزود ومسار تفويض." /></div>
          </section>}

          {activeTab === 'settings' && <section>
            <div className="wa-page-heading"><div><span className="wa-eyebrow"><Settings size={14} /> إعدادات المؤسسة</span><h1>إعدادات مساحة العمل</h1><p>معلومات الحساب وحدود الخطة الحالية.</p></div></div>
            <div className="wa-settings-grid"><div className="wa-panel"><h2>المؤسسة ومساحة العمل</h2><div className="wa-setting-row"><span>المؤسسة</span><strong>{activeWorkspace.organization_name || '—'}</strong></div><div className="wa-setting-row"><span>مساحة العمل</span><strong>{activeWorkspace.name}</strong></div><div className="wa-setting-row"><span>صلاحيتك</span><strong>{activeWorkspace.workspace_role || profile?.role || 'عضو'}</strong></div><div className="wa-setting-row"><span>البريد</span><strong dir="ltr">{session.user.email}</strong></div></div><div className="wa-panel"><h2>استخدام الخطة</h2>{usage ? <><div className="wa-setting-row"><span>الموظفون</span><strong>{usage.employees}{usage.limits ? ` / ${usage.limits.employees}` : ''}</strong></div><div className="wa-setting-row"><span>مهام الشهر</span><strong>{usage.tasksThisMonth}{usage.limits ? ` / ${usage.limits.tasksMonth}` : ''}</strong></div><div className="wa-setting-row"><span>التكاملات النشطة</span><strong>{usage.integrations}{usage.limits ? ` / ${usage.limits.integrations}` : ''}</strong></div></> : <p className="wa-muted">تعذر تحميل بيانات الخطة لهذه المساحة.</p>}</div></div>
          </section>}
        </main>
      </div>

      {employeeModal && <div className="wa-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setEmployeeModal(false); }}><section className="wa-modal" role="dialog" aria-modal="true" aria-labelledby="wa-employee-modal-title"><div className="wa-modal-head"><div><span className="wa-eyebrow">كتالوج الموظفين</span><h2 id="wa-employee-modal-title">إضافة موظف رقمي</h2></div><button className="wa-icon-button" onClick={() => setEmployeeModal(false)} aria-label="إغلاق"><X size={18} /></button></div><form className="wa-auth-form" onSubmit={createEmployee}><label>اسم الموظف<input value={employeeName} onChange={e => setEmployeeName(e.target.value)} required placeholder="مثال: منسق العمليات" /></label><label>الدور الوظيفي<select value={employeeRoleCode} onChange={e => setEmployeeRoleCode(e.target.value)} required><option value="">اختر دورًا من الكتالوج</option>{roles.map(role => <option key={role.role_code} value={role.role_code}>{role.title} — {role.department}</option>)}</select></label><label>الهدف الأساسي<textarea value={employeeGoal} onChange={e => setEmployeeGoal(e.target.value)} rows={3} placeholder="ما النتيجة التي تريد من الموظف تحقيقها؟" /></label><div className="wa-modal-note"><ShieldCheck size={15} /> تُنسخ المهارات والأدوات والسياسات الافتراضية من كتالوج الأدوار.</div><button className="wa-primary-button" disabled={saving || !roles.length}>{saving ? <LoaderCircle className="spin" size={17} /> : <Plus size={16} />}إنشاء الموظف</button></form></section></div>}

      {taskModal && <div className="wa-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setTaskModal(false); }}><section className="wa-modal" role="dialog" aria-modal="true" aria-labelledby="wa-task-modal-title"><div className="wa-modal-head"><div><span className="wa-eyebrow">سير العمل</span><h2 id="wa-task-modal-title">إنشاء مهمة جديدة</h2></div><button className="wa-icon-button" onClick={() => setTaskModal(false)} aria-label="إغلاق"><X size={18} /></button></div>{!activeEmployees.length ? <div className="wa-notice error"><AlertCircle size={17} /><span>لا يوجد موظف نشط لإسناد المهمة إليه. أضف موظفًا رقميًا أولًا.</span></div> : <form className="wa-auth-form" onSubmit={createTask}><label>عنوان المهمة<input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required placeholder="مثال: إعداد تقرير العمليات الأسبوعي" /></label><label>النتيجة المطلوبة<textarea value={taskObjective} onChange={e => setTaskObjective(e.target.value)} rows={4} required placeholder="اشرح المطلوب والنتيجة التي ستعتبرها مكتملة." /></label><label>الموظف المسؤول<select value={taskEmployeeId} onChange={e => setTaskEmployeeId(e.target.value)} required><option value="">اختر موظفًا نشطًا</option>{activeEmployees.map(employee => <option key={employee.id} value={employee.id}>{employee.name} — {employee.role}</option>)}</select></label><div className="wa-modal-note"><ShieldCheck size={15} /> إنشاء المهمة لا يعني تنفيذها تلقائيًا؛ ابدأ التخطيط بعد مراجعة التفاصيل.</div><button className="wa-primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Plus size={16} />}إنشاء المهمة</button></form>}</section></div>}
    </div>
  );
}

function Metric({ icon: Icon, label, value, foot }: { icon: typeof Bot; label: string; value: number; foot: string }) {
  return <article className="wa-metric-card"><span className="wa-metric-icon"><Icon size={19} /></span><span className="wa-metric-label">{label}</span><strong className="wa-metric-value">{value.toLocaleString('ar')}</strong><small>{foot}</small></article>;
}

function EmptyState({ icon: Icon, title, text, action, onAction }: { icon: typeof Bot; title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="wa-empty"><span className="wa-empty-icon"><Icon size={22} /></span><strong>{title}</strong><p>{text}</p>{action && onAction ? <button className="wa-secondary-button" onClick={onAction}>{action} <ArrowLeft size={14} /></button> : null}</div>;
}
