import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleAlert, Clock3, Pause, Play, Plus, RefreshCw, Workflow } from 'lucide-react';
import { apiClient } from '../api-client.js';

type Employee = { id: string; name: string; role?: string; status: string };
type ToolOption = { name: string; description?: string; risk?: string };
type Routine = { id: string; employee_id: string; employee_name?: string; schedule?: Record<string, any>; enabled: boolean; next_run_at?: string; last_run_at?: string };
type Props = { workspaceId: string; token: string; employees: Employee[]; manager: boolean; onBuildEmployee: () => void };

function unwrap(value: any) { return value?.data ?? value; }
function list(value: any): any[] { const data = unwrap(value); return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []; }
function intervalLabel(value: number) {
  if (value % 10080 === 0) return `كل ${value / 10080} أسبوع`;
  if (value % 1440 === 0) return value / 1440 === 1 ? 'يوميًا' : `كل ${value / 1440} أيام`;
  if (value % 60 === 0) return `كل ${value / 60} ساعة`;
  return `كل ${value} دقيقة`;
}
function dateLabel(value?: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'غير محدد';
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function AutomationPanel({ workspaceId, token, employees, manager, onBuildEmployee }: Props) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [loadedWorkspaceId, setLoadedWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [action, setAction] = useState('data.analyze');
  const [intervalMinutes, setIntervalMinutes] = useState('1440');
  const currentWorkspaceId = useRef(workspaceId);
  const workspaceGeneration = useRef(0);
  const loadVersion = useRef(0);
  const actionVersion = useRef(0);

  if (currentWorkspaceId.current !== workspaceId) {
    currentWorkspaceId.current = workspaceId;
    workspaceGeneration.current += 1;
    loadVersion.current += 1;
    actionVersion.current += 1;
  }

  async function load(targetWorkspaceId = workspaceId, targetToken = token) {
    const generation = workspaceGeneration.current;
    const version = ++loadVersion.current;
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      apiClient.routines(targetWorkspaceId, targetToken),
      apiClient.tools(targetWorkspaceId, targetToken),
    ]);
    if (currentWorkspaceId.current !== targetWorkspaceId || workspaceGeneration.current !== generation || loadVersion.current !== version) return;

    const failures: string[] = [];
    if (results[0].status === 'fulfilled') setRoutines(list(results[0].value));
    else {
      setRoutines([]);
      failures.push('تعذر تحميل الأتمتة المحفوظة. أعد المحاولة.');
    }
    if (results[1].status === 'fulfilled') setTools(list(results[1].value));
    else {
      setTools([]);
      failures.push('تعذر تحميل كتالوج الأدوات؛ لم نعرض أفعالًا تخمينية.');
    }
    setLoadedWorkspaceId(targetWorkspaceId);
    setError(failures.join(' '));
    setLoading(false);
  }

  useEffect(() => {
    const generation = workspaceGeneration.current;
    setRoutines([]);
    setTools([]);
    setLoadedWorkspaceId(null);
    setLoading(true);
    setBusy(false);
    setError('');
    setNotice('');
    setName('');
    setObjective('');
    setEmployeeId('');
    setAction('data.analyze');
    setIntervalMinutes('1440');
    void load(workspaceId, token);
    return () => {
      if (workspaceGeneration.current === generation) {
        loadVersion.current += 1;
        actionVersion.current += 1;
      }
    };
  }, [workspaceId, token]);

  function isCurrentAction(targetWorkspaceId: string, generation: number, version: number) {
    return currentWorkspaceId.current === targetWorkspaceId
      && workspaceGeneration.current === generation
      && actionVersion.current === version;
  }

  async function createRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetWorkspaceId = workspaceId;
    const generation = workspaceGeneration.current;
    const version = ++actionVersion.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const result = await apiClient.createRoutine(targetWorkspaceId, token, {
        employeeId,
        name: name.trim(),
        objective: objective.trim(),
        action,
        input: { objective: objective.trim() },
        intervalMinutes: Number(intervalMinutes),
        timezone,
        enabled: true,
      });
      if (!isCurrentAction(targetWorkspaceId, generation, version)) return;
      const routine = unwrap(result);
      setRoutines(current => [routine, ...current.filter(item => item.id !== routine.id)]);
      setLoadedWorkspaceId(targetWorkspaceId);
      setName('');
      setObjective('');
      setNotice('حُفظت الأتمتة. ينشئ مجدول إنجاز مهمة عند موعدها، ثم تمر عبر الطابور وسياسات الموظف.');
    } catch (cause: any) {
      if (isCurrentAction(targetWorkspaceId, generation, version)) setError(cause?.message || 'تعذر حفظ الأتمتة.');
    } finally {
      if (isCurrentAction(targetWorkspaceId, generation, version)) setBusy(false);
    }
  }

  async function toggleRoutine(routine: Routine) {
    const targetWorkspaceId = workspaceId;
    const generation = workspaceGeneration.current;
    const version = ++actionVersion.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await apiClient.updateRoutine(targetWorkspaceId, token, routine.id, { enabled: !routine.enabled });
      if (!isCurrentAction(targetWorkspaceId, generation, version)) return;
      const updated = unwrap(result);
      setRoutines(current => current.map(item => item.id === routine.id ? { ...item, ...updated } : item));
      setNotice(updated.enabled ? 'استؤنفت الأتمتة.' : 'أوقفت الأتمتة مؤقتًا؛ لم تُحذف بياناتها.');
    } catch (cause: any) {
      if (isCurrentAction(targetWorkspaceId, generation, version)) setError(cause?.message || 'تعذر تحديث الأتمتة.');
    } finally {
      if (isCurrentAction(targetWorkspaceId, generation, version)) setBusy(false);
    }
  }

  const currentDataLoaded = loadedWorkspaceId === workspaceId;
  const visibleRoutines = currentDataLoaded ? routines : [];
  const visibleTools = currentDataLoaded ? tools : [];
  const visibleError = currentDataLoaded ? error : '';
  const visibleNotice = currentDataLoaded ? notice : '';
  const activeEmployees = employees.filter(employee => employee.status === 'active');
  return <div className="automation-layout">
    {manager && <section className="workspace-panel">
      <div className="workspace-panel-heading"><div><h2>أتمتة عملية متكررة</h2><p>أنشئ روتينًا دوريًا لموظف نشط ضمن هذه المساحة.</p></div><Workflow size={18} /></div>
      {!activeEmployees.length ? <div className="workspace-empty"><span><CircleAlert size={18} /></span><strong>يلزم موظف رقمي نشط</strong><p>أنشئ الموظف أولًا ثم عُد لإضافة أتمتة.</p><button className="workspace-text-button" type="button" onClick={onBuildEmployee}>بناء موظف رقمي</button></div> : <form className="workspace-form" aria-label="إنشاء أتمتة متكررة" onSubmit={event => void createRoutine(event)}>
        <label>اسم الأتمتة<input aria-label="اسم الأتمتة" value={name} onChange={event => setName(event.target.value)} required maxLength={160} placeholder="مثال: مراجعة المبيعات اليومية" /></label>
        <label>هدف العملية<textarea aria-label="هدف العملية" value={objective} onChange={event => setObjective(event.target.value)} required maxLength={4000} rows={3} placeholder="ما المهمة التي يجب أن تتكرر؟" /></label>
        <label>الموظف المسؤول<select aria-label="الموظف المسؤول" value={employeeId} onChange={event => setEmployeeId(event.target.value)} required><option value="">اختر موظفًا نشطًا</option>{activeEmployees.map(employee => <option key={employee.id} value={employee.id}>{employee.name} — {employee.role || 'موظف رقمي'}</option>)}</select></label>
        <label>الإجراء<select aria-label="إجراء الأتمتة" value={action} onChange={event => setAction(event.target.value)} required>{visibleTools.map(tool => <option key={tool.name} value={tool.name}>{tool.name}{tool.risk === 'high' ? ' — موافقة مطلوبة' : ''}</option>)}</select></label>
        <label>التكرار<select aria-label="التكرار" value={intervalMinutes} onChange={event => setIntervalMinutes(event.target.value)}><option value="60">كل ساعة</option><option value="360">كل ٦ ساعات</option><option value="1440">يوميًا</option><option value="10080">أسبوعيًا</option></select></label>
        <p className="workspace-inline-hint">الأفعال عالية المخاطر تظل خاضعة للموافقة البشرية. التوقيت يحسب كفاصل زمني في منطقة جهازك.</p>
        <button className="workspace-button primary" type="submit" disabled={busy || !visibleTools.length}><Plus size={16} />{busy ? 'جارٍ الحفظ…' : 'حفظ الأتمتة'}</button>
      </form>}
    </section>}
    <section className="workspace-panel automation-list-panel">
      <div className="workspace-panel-heading"><div><h2>الأتمتة المجدولة</h2><p>المواعيد القادمة والحالة محفوظة في الخادم.</p></div><button type="button" aria-label="تحديث الأتمتة" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /></button></div>
      {visibleError && <div className="workspace-alert" role="alert"><CircleAlert size={16} />{visibleError}</div>}
      {visibleNotice && <div className="workspace-notice" role="status">{visibleNotice}</div>}
      {!currentDataLoaded || loading ? <p className="workspace-loading" role="status">جارٍ تحميل الأتمتة…</p> : visibleRoutines.length ? <div className="automation-list">{visibleRoutines.map(routine => {
        const schedule = routine.schedule || {};
        const interval = Number(schedule.intervalMinutes || 1440);
        return <article className="automation-row" key={routine.id}>
          <span className="automation-icon"><Clock3 size={17} /></span>
          <div className="automation-main"><strong>{schedule.title || 'أتمتة متكررة'}</strong><p>{schedule.objective || 'لا يوجد وصف.'}</p><div className="workspace-task-meta"><span>{routine.employee_name || employees.find(item => item.id === routine.employee_id)?.name || 'موظف رقمي'}</span><span>{intervalLabel(interval)}</span><span>التشغيل التالي: {dateLabel(routine.next_run_at)}</span></div></div>
          <div className="automation-actions"><span className={`workspace-status-pill ${routine.enabled ? 'status-active' : 'status-paused'}`}><i />{routine.enabled ? 'مفعّلة' : 'متوقفة'}</span>{manager && <button className="workspace-start-button" type="button" onClick={() => void toggleRoutine(routine)} disabled={busy}>{routine.enabled ? <><Pause size={13} /> إيقاف مؤقت</> : <><Play size={13} /> استئناف</>}</button>}</div>
        </article>;
      })}</div> : <div className="workspace-empty"><span><Workflow size={18} /></span><strong>لا توجد أتمتة بعد</strong><p>{manager ? 'ابدأ بإنشاء روتين دوري. يحتفظ النظام بمهامه وسجل تشغيلها.' : 'ستظهر هنا الأتمتة المضافة إلى هذه المساحة.'}</p></div>}
      {!manager && <p className="workspace-inline-hint">حسابك للقراءة فقط؛ اطلب من مدير المساحة إنشاء الروتين أو إيقافه.</p>}
    </section>
  </div>;
}
