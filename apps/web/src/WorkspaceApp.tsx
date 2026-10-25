import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Activity, ArrowRight, Bot, Building2, Check, ChevronDown,
  CircleAlert, ClipboardList, Clock3, FileCheck2, LogOut, Menu, Plus,
  RefreshCw, ShieldCheck, Users, Workflow, X, Zap,
} from 'lucide-react';
import { authClient } from '../auth-client.js';
import { api, apiClient } from '../api-client.js';
import EmployeeBuilder from './EmployeeBuilder';
import AutomationPanel from './AutomationPanel';
import AnalyticsBillingPanel from './AnalyticsBillingPanel';
import TeamPanel from './TeamPanel';

type Phase = 'checking' | 'auth' | 'verify' | 'onboarding' | 'provisioning' | 'provisioning-failed' | 'workspace' | 'recovery';
type Tab = 'overview' | 'employees' | 'teams' | 'tasks' | 'approvals' | 'automations' | 'analytics';
type WorkspaceRecord = { id: string; name: string; workspace_role?: string; role?: string; organization_name?: string };
type DashboardData = { summary: Record<string, any>; recent: any[]; subscription: Record<string, any> | null; usage: Record<string, any> | null; employees: any[]; tasks: any[]; approvals: any[]; audit: any[] };

const API_BASE = (window as Window & { ENJAZ_API_BASE?: string }).ENJAZ_API_BASE || import.meta.env.VITE_ENJAZ_API_BASE || '';
const workspaceApi = api as unknown as (path: string, options: { token: string; method: 'POST'; body: Record<string, unknown> }) => Promise<unknown>;
const sectorOptions = [
  { id: 'restaurant', name: 'المطاعم' },
  { id: 'hospital', name: 'المستشفيات' },
  { id: 'hotel', name: 'الفنادق' },
  { id: 'enterprise', name: 'الشركات' },
  { id: 'government', name: 'الجهات الحكومية' },
];
const navItems: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'مركز العمليات', icon: Activity },
  { id: 'employees', label: 'الموظفون الرقميون', icon: Bot },
  { id: 'teams', label: 'الفرق والأقسام', icon: Users },
  { id: 'tasks', label: 'المهام', icon: ClipboardList },
  { id: 'approvals', label: 'الموافقات', icon: FileCheck2 },
  { id: 'automations', label: 'الأتمتة', icon: Workflow },
  { id: 'analytics', label: 'التحليلات والفوترة', icon: Activity },
];
const emptyDashboard: DashboardData = { summary: {}, recent: [], subscription: null, usage: null, employees: [], tasks: [], approvals: [], audit: [] };

function unwrap(value: any) { return value?.data ?? value; }
function rows(value: any): any[] {
  const data = unwrap(value);
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
function statusLabel(status: string) {
  const labels: Record<string, string> = {
    queued: 'في قائمة الانتظار', planning: 'جارٍ التخطيط', executing: 'قيد التنفيذ',
    awaiting_approval: 'بانتظار الموافقة', completed: 'مكتملة', succeeded: 'مكتملة',
    failed: 'متعذرة', cancelled: 'ملغاة', pending: 'بانتظار القرار', approved: 'معتمدة',
    rejected: 'مرفوضة', active: 'نشط', paused: 'متوقف مؤقتًا', archived: 'مؤرشف',
  };
  return labels[status] || status || 'غير محدد';
}
function formatDate(value: string | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
function workspaceRole(workspace: WorkspaceRecord | null) { return workspace?.workspace_role || workspace?.role || ''; }
function canManage(workspace: WorkspaceRecord | null) { return ['owner', 'admin', 'manager'].includes(workspaceRole(workspace)); }
function profileName(data: any) {
  return data?.profile?.name || data?.identity?.name || data?.user?.name || 'مستخدم إنجاز';
}
function profileWorkspaces(data: any): WorkspaceRecord[] {
  return Array.isArray(data?.workspaces) ? data.workspaces : Array.isArray(data?.profile?.workspaces) ? data.profile.workspaces : [];
}
function selectedWorkspace(spaces: WorkspaceRecord[]) {
  const requested = new URLSearchParams(window.location.search).get('workspaceId') || localStorage.getItem('ENJAZ_WORKSPACE_ID');
  return (requested && spaces.find(item => String(item.id) === String(requested))) || spaces[0] || null;
}
function adoptAuthCallback() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const type = params.get('type') || '';
  const accessToken = params.get('access_token');
  if (!accessToken || !['signup', 'invite', 'magiclink', 'email'].includes(type)) return false;
  sessionStorage.setItem('ENJAZ_ACCESS_TOKEN', accessToken);
  const refreshToken = params.get('refresh_token');
  if (refreshToken) sessionStorage.setItem('ENJAZ_REFRESH_TOKEN', refreshToken);
  (window as Window & { ENJAZ_ACCESS_TOKEN?: string }).ENJAZ_ACCESS_TOKEN = accessToken;
  history.replaceState(history.state, '', `${window.location.pathname}${window.location.search}`);
  return true;
}

export default function WorkspaceApp() {
  const query = new URLSearchParams(window.location.search);
  const [phase, setPhase] = useState<Phase>('checking');
  const [mode, setMode] = useState<'login' | 'signup'>(query.get('signup') === '1' ? 'signup' : 'login');
  const [profile, setProfile] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [employeeBuilderOpen, setEmployeeBuilderOpen] = useState(false);
  const [employeeBuilderDepartment, setEmployeeBuilderDepartment] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedSector, setSelectedSector] = useState('restaurant');
  const [taskDraft, setTaskDraft] = useState({ title: '', objective: '', employeeId: '' });
  const requestVersion = useRef(0);
  const activeWorkspaceId = useRef<string | null>(null);
  const workspaceActionVersion = useRef(0);

  function isCurrentWorkspaceAction(target: WorkspaceRecord, actionVersion: number) {
    return activeWorkspaceId.current === target.id && workspaceActionVersion.current === actionVersion;
  }

  const manager = canManage(workspace);
  const activeEmployees = useMemo(() => dashboard.employees.filter(item => item.status === 'active'), [dashboard.employees]);
  const pendingApprovals = useMemo(() => dashboard.approvals.filter(item => item.status === 'pending'), [dashboard.approvals]);
  const openTasks = useMemo(() => dashboard.tasks.filter(item => !['completed', 'succeeded', 'failed', 'cancelled'].includes(item.status)), [dashboard.tasks]);

  async function loadDashboard(target: WorkspaceRecord | null = workspace) {
    if (!target?.id || !authClient.token() || activeWorkspaceId.current !== target.id) return;
    const version = ++requestVersion.current;
    setLoadingData(true);
    setError('');
    const results = await Promise.allSettled([
      apiClient.runtimeSummary(target.id, authClient.token()),
      apiClient.employees(target.id, authClient.token()),
      apiClient.tasks(target.id, authClient.token()),
      apiClient.approvals(target.id, authClient.token()),
      apiClient.audit(target.id, authClient.token()),
      apiClient.billingSubscription(target.id, authClient.token()),
      apiClient.billingUsage(target.id, authClient.token()),
    ]);
    if (version !== requestVersion.current || activeWorkspaceId.current !== target.id) return;
    const value = (index: number) => results[index].status === 'fulfilled' ? unwrap(results[index].value) : null;
    const runtime = value(0);
    setDashboard({
      summary: runtime?.summary || {},
      recent: Array.isArray(runtime?.recent) ? runtime.recent : [],
      subscription: value(5) || null,
      usage: value(6) || null,
      employees: rows(value(1)),
      tasks: rows(value(2)),
      approvals: rows(value(3)),
      audit: rows(value(4)),
    });
    const failures = results.filter(item => item.status === 'rejected').length;
    if (failures) setError(failures === results.length ? 'تعذر تحميل بيانات مساحة العمل. تحقق من اتصال الخدمة ثم أعد المحاولة.' : 'تعذر تحميل بعض بيانات المساحة. يمكنك إعادة المحاولة دون فقد التغييرات.');
    setLoadingData(false);
  }

  async function acceptIdentity(data: any) {
    setProfile(data);
    const spaces = profileWorkspaces(data);
    setWorkspaces(spaces);
    if (!spaces.length) {
      activeWorkspaceId.current = null;
      requestVersion.current += 1;
      workspaceActionVersion.current += 1;
      setWorkspace(null);
      setDashboard(emptyDashboard);
      setLoadingData(false);
      setPhase('onboarding');
      return;
    }
    const selected = selectedWorkspace(spaces);
    activeWorkspaceId.current = selected!.id;
      requestVersion.current += 1;
      workspaceActionVersion.current += 1;
      setDashboard(emptyDashboard);
      setTaskDraft({ title: '', objective: '', employeeId: '' });
      setWorkspace(selected);
    localStorage.setItem('ENJAZ_WORKSPACE_ID', selected!.id);
    setPhase('workspace');
    await loadDashboard(selected);
  }

  async function restoreSession() {
    setPhase('checking');
    setError('');
    try {
      const result = await authClient.me(API_BASE);
      if (!result) {
        setPhase('recovery');
        setError('تعذر التحقق من الجلسة. أعد المحاولة أو سجّل الدخول من جديد.');
        return;
      }
      await acceptIdentity(result);
    } catch (cause: any) {
      setPhase('recovery');
      setError(cause?.message || 'تعذر تحميل بيانات الحساب.');
    }
  }

  useEffect(() => {
    adoptAuthCallback();
    if (authClient.token()) void restoreSession();
    else setPhase('auth');
    // Restore once on entry; workspace changes use the explicit selector below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const enteredEmail = String(form.get('email') || '').trim().toLowerCase();
    try {
      if (mode === 'signup') {
        const result = await authClient.signUp(enteredEmail, String(form.get('password') || ''), String(form.get('name') || '').trim());
        setEmail(enteredEmail);
        if (result?.needsEmailConfirmation) {
          setPhase('verify');
          return;
        }
      } else {
        await authClient.signIn(enteredEmail, String(form.get('password') || ''));
      }
      await restoreSession();
    } catch (cause: any) {
      setError(cause?.message || 'تعذر إكمال تسجيل الدخول.');
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    setBusy(true);
    setError('');
    try {
      await authClient.resendConfirmation(email);
      setNotice('أُعيد إرسال رسالة التأكيد. افحص صندوق الوارد ومجلد الرسائل غير المرغوب فيها.');
    } catch (cause: any) {
      setError(cause?.message || 'تعذر إرسال رسالة التأكيد.');
    } finally {
      setBusy(false);
    }
  }

  async function provisionWorkspace(target: WorkspaceRecord, sector: string) {
    setBusy(true);
    setPhase('provisioning');
    setError('');
    try {
      await apiClient.provisionIndustryPack(target.id, authClient.token(), sector);
      setPhase('workspace');
      setNotice('اكتمل إعداد مساحة العمل وحزمة القطاع.');
      await loadDashboard(target);
    } catch (cause: any) {
      setPhase('provisioning-failed');
      setError(cause?.message || 'تعذر تفعيل حزمة القطاع. مساحة العمل محفوظة ويمكن إعادة المحاولة بأمان.');
    } finally {
      setBusy(false);
    }
  }

  async function handleOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const sector = String(form.get('sector') || 'restaurant');
    setSelectedSector(sector);
    try {
      const result = await authClient.bootstrap(API_BASE, {
        name: profileName(profile),
        organizationName: String(form.get('organizationName') || '').trim(),
        workspaceName: String(form.get('workspaceName') || '').trim(),
        sector,
      });
      const spaces = profileWorkspaces(result);
      const target = spaces[0] || result?.workspace || null;
      if (!target?.id) throw new Error('لم يعِد الخادم مساحة عمل بعد التهيئة. أعد المحاولة قبل المتابعة.');
      const nextSpaces = spaces.length ? spaces : [target];
      activeWorkspaceId.current = target.id;
      requestVersion.current += 1;
      workspaceActionVersion.current += 1;
      setDashboard(emptyDashboard);
      setWorkspaces(nextSpaces);
      setWorkspace(target);
      localStorage.setItem('ENJAZ_WORKSPACE_ID', target.id);
      await provisionWorkspace(target, sector);
    } catch (cause: any) {
      setPhase('onboarding');
      setError(cause?.message || 'تعذر إنشاء مساحة العمل. لم يتم إعلان التهيئة ناجحة.');
    } finally {
      setBusy(false);
    }
  }

  async function chooseWorkspace(id: string) {
    const selected = workspaces.find(item => item.id === id);
    if (!selected) return;
    activeWorkspaceId.current = selected.id;
    requestVersion.current += 1;
    workspaceActionVersion.current += 1;
    setBusy(false);
    setDashboard(emptyDashboard);
    setTaskDraft({ title: '', objective: '', employeeId: '' });
    setLoadingData(true);
    setEmployeeBuilderOpen(false);
    setEmployeeBuilderDepartment(null);
    setWorkspace(selected);
    localStorage.setItem('ENJAZ_WORKSPACE_ID', selected.id);
    setNotice('');
    setError('');
    await loadDashboard(selected);
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !taskDraft.employeeId) return;
    const target = workspace;
    const actionVersion = ++workspaceActionVersion.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiClient.createTask(target.id, authClient.token(), {
        title: taskDraft.title.trim(),
        objective: taskDraft.objective.trim(),
        employeeId: taskDraft.employeeId,
        priority: 5,
      });
      if (!isCurrentWorkspaceAction(target, actionVersion)) return;
      setTaskDraft({ title: '', objective: '', employeeId: '' });
      setNotice('حُفظت المهمة في مساحة العمل. ابدأ التخطيط والتنفيذ من بطاقة المهمة عندما تكون جاهزًا.');
      await loadDashboard(target);
    } catch (cause: any) {
      if (isCurrentWorkspaceAction(target, actionVersion)) setError(cause?.message || 'تعذر إنشاء المهمة.');
    } finally {
      if (actionVersion === workspaceActionVersion.current) setBusy(false);
    }
  }

  async function createEmployee(employee: Record<string, unknown>) {
    if (!workspace) return;
    const target = workspace;
    const actionVersion = ++workspaceActionVersion.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiClient.createEmployee(target.id, authClient.token(), employee);
      if (!isCurrentWorkspaceAction(target, actionVersion)) return;
      setEmployeeBuilderOpen(false);
      setEmployeeBuilderDepartment(null);
      setNotice('حُفظ الموظف الرقمي في المساحة. راجع صلاحيات أدواته قبل إسناد مهام إنتاجية.');
      await loadDashboard(target);
    } catch (cause) {
      if (isCurrentWorkspaceAction(target, actionVersion)) throw cause;
    } finally {
      if (actionVersion === workspaceActionVersion.current) setBusy(false);
    }
  }

  function buildEmployeeForDepartment(department: { id: string; name: string } | null = null) {
    setEmployeeBuilderDepartment(department);
    setEmployeeBuilderOpen(true);
    setActiveTab('employees');
  }

  async function startTask(task: any) {
    if (!workspace) return;
    const target = workspace;
    const actionVersion = ++workspaceActionVersion.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await workspaceApi(`/api/v1/tasks/${encodeURIComponent(task.id)}/plan?workspaceId=${encodeURIComponent(target.id)}`, {
        token: authClient.token(), method: 'POST', body: { goal: task.objective },
      });
      if (!isCurrentWorkspaceAction(target, actionVersion)) return;
      setNotice('بدأ التخطيط والتنفيذ. راقب تقدم المهمة؛ الإجراءات الحساسة تبقى خلف بوابة الموافقة.');
      await loadDashboard(target);
    } catch (cause: any) {
      if (isCurrentWorkspaceAction(target, actionVersion)) setError(cause?.message || 'تعذر بدء المهمة.');
    } finally {
      if (actionVersion === workspaceActionVersion.current) setBusy(false);
    }
  }

  async function decideApproval(approval: any, decision: 'approve' | 'reject') {
    if (!workspace) return;
    const target = workspace;
    const actionVersion = ++workspaceActionVersion.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiClient.decideApproval(target.id, authClient.token(), approval.id, decision);
      if (!isCurrentWorkspaceAction(target, actionVersion)) return;
      setNotice(decision === 'approve' ? 'سُجل الاعتماد وأُرسلت المهمة إلى طابور التنفيذ.' : 'سُجل الرفض وأُوقفت المهمة المرتبطة.');
      await loadDashboard(target);
    } catch (cause: any) {
      if (isCurrentWorkspaceAction(target, actionVersion)) setError(cause?.message || 'تعذر تسجيل قرار الموافقة.');
    } finally {
      if (actionVersion === workspaceActionVersion.current) setBusy(false);
    }
  }

  function signOut() {
    activeWorkspaceId.current = null;
    requestVersion.current += 1;
    workspaceActionVersion.current += 1;
    authClient.signOut();
    setProfile(null);
    setWorkspace(null);
    setWorkspaces([]);
    setDashboard(emptyDashboard);
    setTaskDraft({ title: '', objective: '', employeeId: '' });
    setLoadingData(false);
    setBusy(false);
    setError('');
    setNotice('');
    setPhase('auth');
  }

  if (phase === 'checking' || phase === 'provisioning') {
    return <main className="workspace-status-screen" dir="rtl"><div className="workspace-status-card"><span className="workspace-mark"><Zap size={22} /></span><h1>{phase === 'provisioning' ? 'نجهز بيئة مؤسستك' : 'نتحقق من جلسة العمل'}</h1><p role="status" aria-live="polite">{phase === 'provisioning' ? 'ننشئ الأقسام والموظفين الرقميين وقواعدهم. لا تغلق هذه الصفحة.' : 'جارٍ استعادة الحساب والمساحة بأمان…'}</p><span className="workspace-spinner" /></div></main>;
  }

  if (phase === 'auth' || phase === 'verify' || phase === 'recovery') {
    const signup = mode === 'signup' && phase === 'auth';
    return <main className="workspace-auth-page" dir="rtl">
      <a className="workspace-back-link" href="/" aria-label="العودة إلى موقع إنجاز"><ArrowRight size={17} /> العودة إلى إنجاز</a>
      <section className="workspace-auth-card">
        <div className="workspace-brand"><span className="workspace-mark"><Zap size={21} /></span><span><strong>إنجاز</strong><small>مساحة عمل مؤسسية</small></span></div>
        {phase === 'verify' ? <>
          <span className="workspace-kicker">تأكيد البريد الإلكتروني</span><h1>تحقق من بريدك</h1>
          <p>أرسلنا رابط تأكيد إلى <strong>{email}</strong>. بعد تأكيد الحساب، سجّل الدخول للمتابعة.</p>
          {notice && <div className="workspace-notice" role="status">{notice}</div>}
          {error && <div className="workspace-alert" role="alert"><CircleAlert size={17} />{error}</div>}
          <button className="workspace-button primary" type="button" onClick={() => void resendConfirmation()} disabled={busy}>{busy ? 'جارٍ الإرسال…' : 'إعادة إرسال رسالة التأكيد'}</button>
          <button className="workspace-text-button" type="button" onClick={() => { setPhase('auth'); setMode('login'); setError(''); }}>العودة لتسجيل الدخول</button>
        </> : phase === 'recovery' ? <>
          <span className="workspace-kicker">استعادة الجلسة</span><h1>تعذر تحميل مساحة العمل</h1>
          <p>لم نغيّر الحساب أو المساحة. يمكنك المحاولة مجددًا أو تسجيل الدخول من جديد.</p>
          {error && <div className="workspace-alert" role="alert"><CircleAlert size={17} />{error}</div>}
          <button className="workspace-button primary" type="button" onClick={() => void restoreSession()}>إعادة المحاولة</button>
          <button className="workspace-text-button" type="button" onClick={signOut}>العودة لتسجيل الدخول</button>
        </> : <>
          <span className="workspace-kicker">بوابة آمنة للموظفين</span>
          <h1>{signup ? 'أنشئ حساب مؤسستك' : 'سجّل الدخول إلى مساحة العمل'}</h1>
          <p>{signup ? 'ابدأ بحسابك، ثم أنشئ مساحة العمل وحزمة القطاع المناسبة.' : 'ادخل إلى مؤسستك لإدارة الموظفين والمهام والموافقات.'}</p>
          {error && <div className="workspace-alert" role="alert"><CircleAlert size={17} />{error}</div>}
          <form className="workspace-form" aria-label={signup ? 'إنشاء حساب' : 'تسجيل الدخول'} onSubmit={event => void handleAuth(event)}>
            {signup && <label>الاسم الكامل<input name="name" autoComplete="name" required maxLength={120} /></label>}
            <label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
            <label>كلمة المرور<input name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} /></label>
            <button className="workspace-button primary" type="submit" disabled={busy}>{busy ? 'جارٍ التحقق…' : signup ? 'إنشاء الحساب' : 'تسجيل الدخول'}</button>
          </form>
          <p className="workspace-auth-switch">{signup ? 'لديك حساب بالفعل؟' : 'جديد على إنجاز؟'} <button type="button" className="workspace-text-button" onClick={() => { setMode(signup ? 'login' : 'signup'); setError(''); }}>{signup ? 'تسجيل الدخول' : 'إنشاء حساب'}</button></p>
          <div className="workspace-security-note"><ShieldCheck size={15} /> صلاحيات مساحة العمل يتحقق منها الخادم عند كل طلب.</div>
        </>}
      </section>
    </main>;
  }

  if (phase === 'onboarding' || phase === 'provisioning-failed') {
    return <main className="workspace-auth-page" dir="rtl">
      <a className="workspace-back-link" href="/" aria-label="العودة إلى موقع إنجاز"><ArrowRight size={17} /> العودة إلى إنجاز</a>
      <section className="workspace-auth-card onboarding-card">
        <div className="workspace-brand"><span className="workspace-mark"><Building2 size={21} /></span><span><strong>إنجاز</strong><small>إعداد المؤسسة</small></span></div>
        <span className="workspace-kicker">خطوة واحدة للبدء</span><h1>{phase === 'provisioning-failed' ? 'بقي تفعيل حزمة القطاع' : 'أنشئ مساحة عملك'}</h1>
        <p>ننشئ المساحة أولًا، ثم نفعّل هيكلًا أوليًا قابلًا للإدارة. لا نعرضها جاهزة حتى ينجح التحقق من تهيئة القطاع.</p>
        {error && <div className="workspace-alert" role="alert"><CircleAlert size={17} />{error}</div>}
        {phase === 'provisioning-failed' && workspace ? <>
          <div className="workspace-provision-status"><strong>{workspace.name}</strong><span>المؤسسة محفوظة. إعادة المحاولة آمنة لأن التهيئة قابلة للتكرار.</span></div>
          <button className="workspace-button primary" type="button" onClick={() => void provisionWorkspace(workspace, selectedSector)} disabled={busy}>{busy ? 'جارٍ إعادة المحاولة…' : 'إعادة محاولة تفعيل القطاع'}</button>
          <button className="workspace-text-button" type="button" onClick={() => setPhase('onboarding')}>تعديل بيانات المساحة</button>
        </> : <form className="workspace-form" aria-label="إعداد مساحة العمل" onSubmit={event => void handleOnboarding(event)}>
          <label>اسم المؤسسة<input name="organizationName" required maxLength={120} autoComplete="organization" placeholder="مثال: شركة إنجاز" /></label>
          <label>اسم مساحة العمل<input name="workspaceName" required maxLength={80} placeholder="مثال: العمليات الرئيسية" /></label>
          <label>القطاع<select name="sector" value={selectedSector} onChange={event => setSelectedSector(event.target.value)}>{sectorOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <button className="workspace-button primary" type="submit" disabled={busy}>{busy ? 'جارٍ إعداد المساحة…' : 'إنشاء المؤسسة وتفعيل القطاع'}</button>
        </form>}
        <div className="workspace-security-note"><ShieldCheck size={15} /> الحساب الحالي هو منشئ المساحة؛ العضويات لا تُنشأ من المتصفح مباشرة.</div>
      </section>
    </main>;
  }

  const tasks = dashboard.tasks;
  return <main className="workspace-layout" dir="rtl">
    <aside className={`workspace-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
      <a className="workspace-brand" href="/" aria-label="إنجاز — الصفحة الرئيسية"><span className="workspace-mark"><Zap size={20} /></span><span><strong>إنجاز</strong><small>مركز التشغيل</small></span></a>
      <div className="workspace-side-label">مساحة العمل</div>
      <nav className="workspace-nav" aria-label="التنقل داخل مساحة العمل">
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={activeTab === id ? 'active' : ''} onClick={() => { setActiveTab(id); setMobileNavOpen(false); }}><Icon size={18} /><span>{label}</span>{id === 'approvals' && pendingApprovals.length > 0 && <b>{pendingApprovals.length}</b>}</button>)}
      </nav>
      <div className="workspace-sidebar-bottom"><ShieldCheck size={16} /><span>القرارات الحساسة<br /><strong>تحتاج موافقة بشرية</strong></span></div>
    </aside>

    <section className="workspace-content">
      <header className="workspace-topbar">
        <button className="workspace-mobile-menu" type="button" aria-label={mobileNavOpen ? 'إغلاق القائمة' : 'فتح القائمة'} onClick={() => setMobileNavOpen(value => !value)}>{mobileNavOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <div className="workspace-breadcrumb"><span>إنجاز</span><ChevronDown size={14} /><select aria-label="مساحة العمل الحالية" value={workspace?.id || ''} onChange={event => void chooseWorkspace(event.target.value)}>{workspaces.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div className="workspace-user"><span className="workspace-avatar">{profileName(profile).slice(0, 1)}</span><span className="workspace-user-name">{profileName(profile)}</span><button type="button" onClick={signOut} aria-label="تسجيل الخروج" title="تسجيل الخروج"><LogOut size={17} /></button></div>
      </header>

      <div className="workspace-page">
        <div className="workspace-page-heading">
          <div><span className="workspace-kicker">{workspace?.organization_name || 'مساحة مؤسستك'}</span><h1>{navItems.find(item => item.id === activeTab)?.label}</h1><p>{activeTab === 'overview' ? 'نظرة مباشرة على القوى العاملة والمهام والقرارات المطلوبة.' : 'بيانات هذه الصفحة تُحمّل من واجهة إنجاز الموثقة لمساحة عملك.'}</p></div>
          <button className="workspace-button secondary" type="button" onClick={() => void loadDashboard(workspace)} disabled={loadingData}><RefreshCw size={16} className={loadingData ? 'spin' : ''} /> تحديث البيانات</button>
        </div>
        {error && <div className="workspace-alert workspace-page-alert" role="alert"><CircleAlert size={17} />{error}</div>}
        {notice && <div className="workspace-notice workspace-page-notice" role="status"><Check size={17} />{notice}<button type="button" aria-label="إغلاق التنبيه" onClick={() => setNotice('')}><X size={15} /></button></div>}
        {loadingData && <p className="workspace-loading" role="status" aria-live="polite">جارٍ تحميل بيانات المساحة…</p>}
        {!manager && <p className="workspace-inline-hint workspace-readonly-note"><ShieldCheck size={15} /> صلاحية المدير غير متوفرة لهذا الحساب؛ تُعرض بيانات المساحة للقراءة فقط.</p>}

        {activeTab === 'overview' && <>
          <div className="workspace-stat-grid">
            <StatCard icon={Bot} label="موظفون نشطون" value={activeEmployees.length} hint="من سجلات مساحة العمل" />
            <StatCard icon={Workflow} label="مهام مفتوحة" value={openTasks.length} hint="تتضمن المهام قيد التنفيذ" />
            <StatCard icon={FileCheck2} label="موافقات معلقة" value={pendingApprovals.length} hint="تحتاج قرار مسؤول" accent={pendingApprovals.length > 0} />
            <StatCard icon={Activity} label="عمليات مسجلة" value={Number(dashboard.summary.runs || 0)} hint="من سجل تشغيل المنصة" />
          </div>
          <div className="workspace-dashboard-grid">
            <section className="workspace-panel"><div className="workspace-panel-heading"><div><h2>أحدث المهام</h2><p>الحالة الفعلية من الخادم</p></div><button type="button" onClick={() => setActiveTab('tasks')}>كل المهام <ArrowRight size={14} /></button></div>
              {tasks.length ? <TaskList tasks={tasks.slice(0, 5)} canStart={manager} busy={busy} onStart={startTask} /> : <EmptyState title="لا توجد مهام بعد" body={manager ? 'أنشئ أول مهمة واربطها بموظف رقمي.' : 'ستظهر هنا المهام المسندة إلى هذه المساحة.'} />}
            </section>
            <section className="workspace-panel"><div className="workspace-panel-heading"><div><h2>الموافقات المطلوبة</h2><p>الإجراءات الحساسة تبقى تحت إشرافك</p></div><button type="button" onClick={() => setActiveTab('approvals')}>عرض الكل <ArrowRight size={14} /></button></div>
              {pendingApprovals.length ? <ApprovalList approvals={pendingApprovals.slice(0, 4)} manager={manager} busy={busy} onDecision={decideApproval} /> : <EmptyState title="لا توجد موافقات معلقة" body="لا يوجد إجراء ينتظر قرارًا في هذه المساحة." />}
            </section>
          </div>
          <section className="workspace-panel workspace-activity-panel"><div className="workspace-panel-heading"><div><h2>آخر النشاط</h2><p>سجل تدقيق مساحة العمل</p></div></div>
            {dashboard.audit.length ? <ul className="workspace-audit-list">{dashboard.audit.slice(0, 6).map((item, index) => <li key={item.id || index}><span className="audit-dot" /><span><strong>{item.action || item.event_type || 'نشاط مسجل'}</strong><small>{formatDate(item.created_at)}</small></span></li>)}</ul> : <EmptyState title="السجل جاهز" body="ستظهر الأحداث بعد إنشاء المهام والقرارات داخل المساحة." />}
          </section>
        </>}

        {activeTab === 'employees' && <>
          {manager && employeeBuilderOpen && <EmployeeBuilder workspaceId={workspace!.id} token={authClient.token()} busy={busy} department={employeeBuilderDepartment} onCancel={() => { setEmployeeBuilderOpen(false); setEmployeeBuilderDepartment(null); }} onCreate={createEmployee} />}
          <section className="workspace-panel"><div className="workspace-panel-heading"><div><h2>القوى العاملة الرقمية</h2><p>{dashboard.employees.length} سجل في هذه المساحة</p></div>{manager && <button className="workspace-button primary" type="button" onClick={() => { if (employeeBuilderOpen) { setEmployeeBuilderOpen(false); setEmployeeBuilderDepartment(null); } else buildEmployeeForDepartment(null); }}><Plus size={15} />{employeeBuilderOpen ? 'إخفاء المنشئ' : 'بناء موظف رقمي'}</button>}</div>
            {dashboard.employees.length ? <div className="workspace-table-wrap"><table><thead><tr><th>الموظف</th><th>الدور</th><th>الحالة</th><th>تاريخ الإنشاء</th></tr></thead><tbody>{dashboard.employees.map(employee => <tr key={employee.id}><td><span className="table-primary"><span className="table-icon"><Bot size={17} /></span>{employee.name}</span></td><td>{employee.role || employee.role_code || '—'}</td><td><StatusPill status={employee.status} /></td><td>{formatDate(employee.created_at)}</td></tr>)}</tbody></table></div> : <EmptyState title="لا يوجد موظفون رقميون" body={manager ? 'أنشئ موظفًا من الكتالوج وحدد له هدفًا وأدوات وصلاحيات.' : 'لا توجد سجلات في هذه المساحة بعد.'} />}
          </section>
        </>}
        {activeTab === 'teams' && workspace && <TeamPanel key={workspace.id} workspaceId={workspace.id} token={authClient.token()} employees={dashboard.employees} manager={manager} onAddEmployee={buildEmployeeForDepartment} />}
        {activeTab === 'automations' && workspace && <AutomationPanel key={workspace.id} workspaceId={workspace.id} token={authClient.token()} employees={dashboard.employees} manager={manager} onBuildEmployee={() => buildEmployeeForDepartment(null)} />}
        {activeTab === 'analytics' && <AnalyticsBillingPanel summary={dashboard.summary} recent={dashboard.recent} subscription={dashboard.subscription} usage={dashboard.usage} />}

        {activeTab === 'tasks' && <div className="workspace-dashboard-grid task-page-grid">
          {manager && <section className="workspace-panel"><div className="workspace-panel-heading"><div><h2>مهمة جديدة</h2><p>تُحفظ المهمة داخل هذه المساحة فقط.</p></div><Plus size={18} /></div>
            <form className="workspace-form" aria-label="إنشاء مهمة" onSubmit={event => void createTask(event)}>
              <label>عنوان المهمة<input aria-label="عنوان المهمة" value={taskDraft.title} onChange={event => setTaskDraft(value => ({ ...value, title: event.target.value }))} required maxLength={160} placeholder="مثال: إعداد تقرير الأداء" /></label>
              <label>الهدف والنتيجة المطلوبة<textarea aria-label="الهدف والنتيجة المطلوبة" value={taskDraft.objective} onChange={event => setTaskDraft(value => ({ ...value, objective: event.target.value }))} required maxLength={4000} rows={4} placeholder="ما النتيجة التي تريدها؟ اذكر القيود أو الموعد عند الحاجة." /></label>
              <label>الموظف الرقمي<select aria-label="الموظف الرقمي" value={taskDraft.employeeId} onChange={event => setTaskDraft(value => ({ ...value, employeeId: event.target.value }))} required><option value="">اختر موظفًا نشطًا</option>{activeEmployees.map(employee => <option key={employee.id} value={employee.id}>{employee.name} — {employee.role}</option>)}</select></label>
              {!activeEmployees.length && <p className="workspace-inline-hint">يلزم موظف نشط قبل إنشاء مهمة.</p>}
              <button className="workspace-button primary" type="submit" disabled={busy || !activeEmployees.length}><Plus size={16} /> إنشاء المهمة</button>
            </form>
          </section>}
          <section className="workspace-panel"><div className="workspace-panel-heading"><div><h2>سجل المهام</h2><p>الحالة وآخر تحديث محفوظان في الخادم.</p></div></div>
            {tasks.length ? <TaskList tasks={tasks} canStart={manager} busy={busy} onStart={startTask} /> : <EmptyState title="لا توجد مهام" body={manager ? 'ابدأ بإنشاء مهمة من النموذج.' : 'ستظهر المهام عند إسنادها إلى هذه المساحة.'} />}
          </section>
          {manager && <p className="workspace-execution-note"><ShieldCheck size={16} /> عند بدء مهمة، ينشئ الخادم خطة ويبدأ الخطوات المسموحة؛ وتبقى الإجراءات عالية المخاطر خلف الموافقة.</p>}
        </div>}

        {activeTab === 'approvals' && <section className="workspace-panel"><div className="workspace-panel-heading"><div><h2>قرارات الموافقة</h2><p>كل قرار يمر عبر API ويسجل في سجل التدقيق.</p></div><span className="workspace-count-pill">{pendingApprovals.length} معلقة</span></div>
          {dashboard.approvals.length ? <ApprovalList approvals={dashboard.approvals} manager={manager} busy={busy} onDecision={decideApproval} /> : <EmptyState title="لا توجد موافقات" body="ستظهر هنا الإجراءات التي تتطلب مراجعة بشرية." />}
          {!manager && <p className="workspace-inline-hint">حسابك للقراءة فقط في هذه المساحة. اطلب من مدير المساحة تنفيذ القرار.</p>}
        </section>}
      </div>
    </section>
  </main>;
}

function StatCard({ icon: Icon, label, value, hint, accent = false }: { icon: typeof Activity; label: string; value: number; hint: string; accent?: boolean }) {
  return <article className={`workspace-stat-card ${accent ? 'is-accent' : ''}`}><span className="workspace-stat-icon"><Icon size={19} /></span><span className="workspace-stat-label">{label}</span><strong>{value.toLocaleString('ar')}</strong><small>{hint}</small></article>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="workspace-empty"><span><CircleAlert size={18} /></span><strong>{title}</strong><p>{body}</p></div>;
}

function StatusPill({ status }: { status: string }) {
  return <span className={`workspace-status-pill status-${status || 'unknown'}`}><i />{statusLabel(status)}</span>;
}

function TaskList({ tasks, canStart, busy, onStart }: { tasks: any[]; canStart: boolean; busy: boolean; onStart: (task: any) => void }) {
  return <div className="workspace-task-list">{tasks.map(task => <article className="workspace-task-row" key={task.id}>
    <span className="workspace-task-icon"><ClipboardList size={17} /></span>
    <div className="workspace-task-main"><strong>{task.title}</strong><p>{task.objective || 'لا يوجد وصف إضافي.'}</p><div className="workspace-task-meta"><span><Bot size={13} />{task.employee_name || task.employee_role || 'موظف رقمي'}</span><span><Clock3 size={13} />{formatDate(task.created_at)}</span></div></div>
    <div className="workspace-task-actions"><StatusPill status={task.status} />{canStart && task.status === 'queued' && <button type="button" className="workspace-start-button" onClick={() => onStart(task)} disabled={busy}><Zap size={14} /> بدء</button>}</div>
  </article>)}</div>;
}

function ApprovalList({ approvals, manager, busy, onDecision }: { approvals: any[]; manager: boolean; busy: boolean; onDecision: (approval: any, decision: 'approve' | 'reject') => void }) {
  return <div className="workspace-approval-list">{approvals.map(approval => <article className="workspace-approval-row" key={approval.id}>
    <span className="workspace-approval-icon"><FileCheck2 size={17} /></span><div className="workspace-approval-main"><strong>{approval.task_title || approval.action || 'إجراء يحتاج مراجعة'}</strong><p>{approval.reason || approval.action || 'طلب موافقة على إجراء من موظف رقمي.'}</p><small>{approval.employee_name || 'موظف رقمي'} · {formatDate(approval.created_at)}</small></div>
    {approval.status === 'pending' && manager && <div className="workspace-approval-actions"><button type="button" className="approve" onClick={() => onDecision(approval, 'approve')} disabled={busy}><Check size={14} /> اعتماد</button><button type="button" className="reject" onClick={() => onDecision(approval, 'reject')} disabled={busy}>رفض</button></div>}
    {approval.status !== 'pending' && <StatusPill status={approval.status} />}
  </article>)}</div>;
}
