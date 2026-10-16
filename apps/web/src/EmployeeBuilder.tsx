import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Bot, CircleAlert, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { apiClient } from '../api-client.js';

type CatalogRole = {
  role_code?: string;
  title?: string;
  name?: string;
  department?: string;
  description?: string;
  mission?: string;
  goal?: string;
  skills?: string[] | string;
  responsibilities?: string[] | string;
};
type ToolOption = { name: string; description?: string; risk?: string };
type Props = {
  workspaceId: string;
  token: string;
  busy: boolean;
  onCancel: () => void;
  onCreate: (employee: Record<string, unknown>) => Promise<void>;
};

function unwrap(value: any) { return value?.data ?? value; }
function list(value: any): any[] {
  const data = unwrap(value);
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
function splitLines(value: string) { return value.split(/\n|,/).map(item => item.trim()).filter(Boolean); }
function roleTitle(role: CatalogRole) { return role.title || role.name || role.role_code || ''; }

export default function EmployeeBuilder({ workspaceId, token, busy, onCancel, onCreate }: Props) {
  const [roles, setRoles] = useState<CatalogRole[]>([]);
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [mission, setMission] = useState('');
  const [skills, setSkills] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['data.analyze']);
  const [approvalMode, setApprovalMode] = useState<'required' | 'always'>('required');
  const [maxExecutions, setMaxExecutions] = useState(10);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([apiClient.workforceRoles(workspaceId, token), apiClient.tools(workspaceId, token)]).then(results => {
      if (!active) return;
      if (results[0].status === 'fulfilled') setRoles(list(results[0].value));
      else setCatalogError('تعذر تحميل كتالوج الأدوار؛ يمكنك إدخال مسمى مخصص.');
      if (results[1].status === 'fulfilled') {
        const catalog = list(results[1].value) as ToolOption[];
        setTools(catalog);
        setSelectedTools(current => current.filter(name => catalog.some(tool => tool.name === name)));
      } else {
        setCatalogError('تعذر تحميل كتالوج الأدوات. أعد المحاولة قبل حفظ الموظف.');
      }
    });
    return () => { active = false; };
  }, [workspaceId, token]);

  const selectedRole = useMemo(() => roles.find(item => item.role_code === roleCode), [roles, roleCode]);

  function chooseRole(code: string) {
    setRoleCode(code);
    const item = roles.find(candidate => candidate.role_code === code);
    if (!item) return;
    setRole(roleTitle(item));
    if (!goal) setGoal(item.goal || item.description || item.mission || '');
    if (!mission) setMission(item.mission || item.description || '');
    if (!skills && item.skills) setSkills(Array.isArray(item.skills) ? item.skills.join(', ') : item.skills);
    if (!responsibilities && item.responsibilities) setResponsibilities(Array.isArray(item.responsibilities) ? item.responsibilities.join('\n') : item.responsibilities);
  }

  function toggleTool(toolName: string) {
    setSelectedTools(current => current.includes(toolName) ? current.filter(item => item !== toolName) : [...current, toolName]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!selectedTools.length) {
      setError('اختر أداة واحدة على الأقل؛ لا يحصل الموظف على أي صلاحية غير محددة.');
      return;
    }
    try {
      await onCreate({
        name: name.trim(),
        role: role.trim(),
        roleCode: roleCode || undefined,
        goal: goal.trim(),
        mission: mission.trim() || goal.trim(),
        skills: splitLines(skills),
        responsibilities: splitLines(responsibilities),
        tools: selectedTools,
        policy: { approvalMode, maxToolExecutionsPerTask: maxExecutions },
        status: 'active',
      });
    } catch (cause: any) {
      setError(cause?.message || 'تعذر حفظ الموظف الرقمي.');
    }
  }

  return <section className="workspace-panel employee-builder-panel" aria-labelledby="employee-builder-title">
    <div className="workspace-panel-heading">
      <div><h2 id="employee-builder-title">منشئ الموظف الرقمي</h2><p>حوّل احتياجًا تشغيليًا إلى دور واضح بصلاحيات محدودة وقابلة للمراجعة.</p></div>
      <button type="button" className="builder-close" aria-label="إغلاق المنشئ" onClick={onCancel}><X size={17} /></button>
    </div>
    {catalogError && <p className="workspace-inline-hint" role="status">{catalogError}</p>}
    {error && <div className="workspace-alert" role="alert"><CircleAlert size={16} />{error}</div>}
    <form className="workspace-form employee-builder-form" aria-label="بناء موظف رقمي" onSubmit={event => void submit(event)}>
      <div className="builder-step-heading"><span>١</span><div><strong>الدور والنتيجة</strong><small>من سيعمل؟ وما النتيجة التي يتحمل مسؤوليتها؟</small></div></div>
      <label>قالب الدور
        <select aria-label="قالب الدور" value={roleCode} onChange={event => chooseRole(event.target.value)}>
          <option value="">دور مخصص</option>
          {roles.map(item => <option key={item.role_code || roleTitle(item)} value={item.role_code || ''}>{roleTitle(item)}{item.department ? ` — ${item.department}` : ''}</option>)}
        </select>
      </label>
      <label>اسم الموظف<input aria-label="اسم الموظف" value={name} onChange={event => setName(event.target.value)} required maxLength={160} placeholder="مثال: محلل الأداء التجاري" /></label>
      <label>المسمى الوظيفي<input aria-label="المسمى الوظيفي" value={role} onChange={event => { setRole(event.target.value); if (roleCode && event.target.value !== roleTitle(selectedRole || {})) setRoleCode(''); }} required maxLength={160} placeholder="مثال: محلل أعمال" /></label>
      <label>الهدف التشغيلي<textarea aria-label="الهدف التشغيلي" value={goal} onChange={event => setGoal(event.target.value)} required maxLength={5000} rows={3} placeholder="صف مخرجًا قابلًا للتحقق، لا وصفًا عامًا للذكاء الاصطناعي." /></label>
      <label>رسالة الدور<textarea aria-label="رسالة الدور" value={mission} onChange={event => setMission(event.target.value)} maxLength={5000} rows={2} placeholder="المهمة التي يعمل الموظف لتحقيقها." /></label>

      <div className="builder-step-heading"><span>٢</span><div><strong>المهارات ومسؤوليات الدور</strong><small>ضع حدودًا عملية لما ينجزه الموظف.</small></div></div>
      <label>المهارات، مفصولة بفواصل<input aria-label="المهارات" value={skills} onChange={event => setSkills(event.target.value)} maxLength={1500} placeholder="تحليل البيانات، كتابة التقارير" /></label>
      <label>المسؤوليات<textarea aria-label="المسؤوليات" value={responsibilities} onChange={event => setResponsibilities(event.target.value)} maxLength={3000} rows={3} placeholder={'مراجعة المؤشرات\nإعداد ملخص أسبوعي'} /></label>

      <div className="builder-step-heading"><span>٣</span><div><strong>الأدوات والحوكمة</strong><small>الصلاحيات اختيار صريح، وكل أداة عالية المخاطر تبقى خلف الموافقة.</small></div></div>
      <fieldset className="builder-tools"><legend>الأدوات المسموح بها</legend>
        {tools.map(tool => <label className="builder-tool-option" key={tool.name}>
          <input type="checkbox" checked={selectedTools.includes(tool.name)} onChange={() => toggleTool(tool.name)} />
          <span><strong>{tool.name}</strong><small>{tool.description || 'أداة من كتالوج إنجاز'}</small></span>
          <em className={tool.risk === 'high' ? 'risk-high' : 'risk-low'}>{tool.risk === 'high' ? 'تتطلب موافقة' : 'مخاطر منخفضة'}</em>
        </label>)}
        {!tools.length && <p className="workspace-inline-hint">لا يمكن حفظ الموظف حتى يتوفر كتالوج الأدوات.</p>}
      </fieldset>
      <div className="builder-policy-grid">
        <label>نمط الموافقة<select aria-label="نمط الموافقة" value={approvalMode} onChange={event => setApprovalMode(event.target.value as 'required' | 'always')}><option value="required">موافقة على الإجراءات عالية المخاطر</option><option value="always">موافقة بشرية على كل إجراء</option></select></label>
        <label>الحد الأقصى للأدوات في المهمة<input aria-label="الحد الأقصى للأدوات في المهمة" type="number" min={1} max={12} value={maxExecutions} onChange={event => setMaxExecutions(Number(event.target.value))} /></label>
      </div>
      <div className="workspace-execution-note"><ShieldCheck size={16} /> لا تتجاوز هذه الشاشة سجل الأدوات أو بوابة الموافقات. لا تُمنح أدوات غير مختارة.</div>
      <div className="builder-actions">
        <button className="workspace-button secondary" type="button" onClick={onCancel}>إلغاء</button>
        <button className="workspace-button primary" type="submit" disabled={busy || !tools.length || !role.trim()}><Bot size={16} />{busy ? <><LoaderCircle size={15} className="spin" /> جارٍ الحفظ…</> : 'حفظ الموظف الرقمي'}</button>
      </div>
    </form>
  </section>;
}
