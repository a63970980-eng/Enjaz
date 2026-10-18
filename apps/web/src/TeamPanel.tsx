import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Building2, CircleAlert, LoaderCircle, Plus, RefreshCw, Users } from 'lucide-react';
import { apiClient } from '../api-client.js';

type Employee = { id: string; name: string; role?: string; status?: string; department_id?: string; policy?: Record<string, unknown> };
type Department = { id: string; name: string; description?: string; manager_name?: string | null; employee_count?: number };
type Props = {
  workspaceId: string;
  token: string;
  employees: Employee[];
  manager: boolean;
  onAddEmployee: (department: { id: string; name: string }) => void;
};

function unwrap(value: any) { return value?.data ?? value; }
function list(value: any): Department[] {
  const data = unwrap(value);
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
function isInDepartment(employee: Employee, departmentId: string) {
  return String(employee.department_id || employee.policy?.departmentId || '') === String(departmentId);
}

export default function TeamPanel({ workspaceId, token, employees, manager, onAddEmployee }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerEmployeeId, setManagerEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestSequence = useRef(0);

  async function loadDepartments() {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.departments(workspaceId, token);
      if (sequence === requestSequence.current) setDepartments(list(result));
    } catch (cause: any) {
      if (sequence === requestSequence.current) setError(cause?.message || 'تعذر تحميل فرق مساحة العمل.');
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    setDepartments([]);
    void loadDepartments();
    return () => { requestSequence.current += 1; };
  }, [workspaceId, token]);

  const activeEmployees = useMemo(() => employees.filter(employee => employee.status === 'active'), [employees]);

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manager) return;
    const teamName = name.trim();
    if (!teamName) return;
    setBusy(true);
    setError('');
    try {
      const created = unwrap(await apiClient.createDepartment(workspaceId, token, {
        name: teamName,
        description: description.trim(),
        managerEmployeeId: managerEmployeeId || null,
      }));
      if (!created?.id) throw new Error('لم يُعد الخادم معرّف الفريق الذي أنشأه.');
      const selectedManager = activeEmployees.find(employee => employee.id === (created.manager_employee_id || managerEmployeeId));
      setDepartments(current => [...current, { ...created, manager_name: created.manager_name || selectedManager?.name || null }]);
      setName('');
      setDescription('');
      setManagerEmployeeId('');
    } catch (cause: any) {
      setError(cause?.message || 'تعذر إنشاء الفريق.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="team-management" aria-label="فرق وأقسام مساحة العمل">
    {manager && <section className="workspace-panel team-create-panel">
      <div className="workspace-panel-heading">
        <div><h2 id="teams-panel-title">إدارة الفرق</h2><p>أنشئ فرقًا داخل مساحة العمل، ثم اربط الموظفين الرقميين بالقسم المناسب.</p></div>
        <Building2 size={18} aria-hidden="true" />
      </div>
      {error && <div className="workspace-alert" role="alert"><CircleAlert size={16} />{error}</div>}
      <form className="workspace-form team-create-form" aria-label="نموذج إنشاء فريق" onSubmit={event => void createTeam(event)}>
        <label>اسم الفريق<input aria-label="اسم الفريق" value={name} onChange={event => setName(event.target.value)} required maxLength={120} placeholder="مثال: فريق المبيعات" /></label>
        <label>وصف الفريق<textarea aria-label="وصف الفريق" value={description} onChange={event => setDescription(event.target.value)} maxLength={5000} rows={2} placeholder="المهمة الأساسية ونطاق المسؤولية." /></label>
        <label>مدير الفريق<select aria-label="مدير الفريق" value={managerEmployeeId} onChange={event => setManagerEmployeeId(event.target.value)}><option value="">لا يوجد مدير محدد</option>{activeEmployees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}{employee.role ? ` — ${employee.role}` : ''}</option>)}</select></label>
        <button className="workspace-button primary" type="submit" disabled={busy || !name.trim()}><Plus size={15} />{busy ? 'جارٍ إنشاء الفريق…' : 'إنشاء فريق'}</button>
      </form>
    </section>}

    {error && !manager && <div className="workspace-alert" role="alert"><CircleAlert size={16} />{error}</div>}
    <div className="team-grid" aria-label="فرق وأقسام مساحة العمل">
      {loading && <div className="workspace-panel team-empty" role="status"><LoaderCircle size={18} className="spin" /> جارٍ تحميل الفرق…</div>}
      {!loading && !departments.length && <div className="workspace-panel team-empty"><span><Users size={20} /></span><strong>لا توجد فرق بعد</strong><p>{manager ? 'أنشئ أول فريق، ثم أضف إليه موظفين من كتالوج الأدوار.' : 'ستظهر هنا الفرق المعرّفة لهذه المساحة.'}</p><button type="button" className="workspace-button secondary" onClick={() => void loadDepartments()}><RefreshCw size={14} /> إعادة المحاولة</button></div>}
      {!loading && departments.map(department => {
        const members = employees.filter(employee => isInDepartment(employee, department.id));
        const count = Number.isFinite(Number(department.employee_count)) ? Number(department.employee_count) : members.length;
        return <article className="workspace-panel team-card" key={department.id}>
          <div className="team-card-heading"><span className="team-icon"><Building2 size={17} /></span><span className="workspace-count-pill">{count.toLocaleString('ar')} موظف</span></div>
          <h2>{department.name}</h2>
          <p className="team-description">{department.description || 'لا يوجد وصف مضاف لهذا الفريق.'}</p>
          <dl className="team-meta"><div><dt>مدير الفريق</dt><dd>{department.manager_name || 'غير محدد'}</dd></div><div><dt>الأعضاء الظاهرون</dt><dd>{members.length.toLocaleString('ar')}</dd></div></dl>
          {members.length > 0 && <ul className="team-member-list">{members.slice(0, 4).map(employee => <li key={employee.id}><span className="team-member-avatar">{employee.name.slice(0, 1)}</span><span><strong>{employee.name}</strong><small>{employee.role || 'موظف رقمي'}</small></span></li>)}</ul>}
          {manager && <button type="button" className="workspace-button secondary team-add-employee" onClick={() => onAddEmployee({ id: department.id, name: department.name })}><Plus size={14} />إضافة موظف إلى فريق {department.name}</button>}
        </article>;
      })}
    </div>
  </section>;
}
