import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, CircleAlert, Copy, Mail, Plus, RefreshCw, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';
import { apiClient } from '../api-client.js';

type Member = { user_id: string; email: string; name: string; role: string; joined_at?: string };
type Invitation = { id: string; email: string; role: string; status: string; expires_at?: string; created_at?: string };
type IssuedInvitation = { invitation: Invitation; token: string; workspace?: { id: string; name: string } };
type Props = { workspaceId: string; token: string; manager: boolean; currentUserId: string };

const roleLabels: Record<string, string> = { manager: 'مدير مساحة', member: 'عضو', viewer: 'قراءة فقط' };

function unwrap(value: any) { return value?.data ?? value; }
function list(value: any): any[] {
  const data = unwrap(value);
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
function dateLabel(value?: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value));
}

export default function MembersPanel({ workspaceId, token, manager, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [issued, setIssued] = useState<IssuedInvitation | null>(null);
  const [copyState, setCopyState] = useState('');
  const requestSequence = useRef(0);

  async function load() {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      apiClient.members(workspaceId, token),
      apiClient.invitations(workspaceId, token),
    ]);
    if (sequence !== requestSequence.current) return;
    const failures: string[] = [];
    if (results[0].status === 'fulfilled') setMembers(list(results[0].value));
    else failures.push('تعذر تحميل أعضاء مساحة العمل.');
    if (results[1].status === 'fulfilled') setInvitations(list(results[1].value));
    else failures.push('تعذر تحميل الدعوات.');
    setError(failures.join(' '));
    setLoading(false);
  }

  useEffect(() => {
    setMembers([]);
    setInvitations([]);
    setIssued(null);
    setEmail('');
    setRole('member');
    setNotice('');
    setCopyState('');
    void load();
    return () => { requestSequence.current += 1; };
  }, [workspaceId, token]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manager) return;
    setBusy(true);
    setError('');
    setNotice('');
    setIssued(null);
    try {
      const result = unwrap(await apiClient.createInvitation(workspaceId, token, { email: email.trim(), role })) as IssuedInvitation;
      if (!result?.token) throw new Error('لم يُعد الخادم رمز الدعوة. أعد المحاولة.');
      setIssued(result);
      setInvitations(current => [result.invitation, ...current.filter(item => item.id !== result.invitation.id)]);
      setEmail('');
      setNotice('أُنشئت الدعوة. لا تُرسل رسائل بريد تلقائيًا بعد — انسخ الرابط وسلّمه للشخص المستهدف.');
    } catch (cause: any) {
      setError(cause?.message || 'تعذر إنشاء الدعوة.');
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string, kind: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setCopyState(kind);
      setTimeout(() => setCopyState(''), 2500);
    } catch {
      setCopyState('failed');
    }
  }

  async function changeRole(member: Member, nextRole: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = unwrap(await apiClient.updateMemberRole(workspaceId, token, member.user_id, nextRole));
      setMembers(current => current.map(item => item.user_id === member.user_id ? { ...item, role: updated?.role || nextRole } : item));
      setNotice('حُدّث دور العضو. تُطبَّق الصلاحيات الجديدة على الطلبات القادمة فورًا.');
    } catch (cause: any) {
      setError(cause?.message || 'تعذر تحديث دور العضو.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(member: Member) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiClient.removeMember(workspaceId, token, member.user_id);
      setMembers(current => current.filter(item => item.user_id !== member.user_id));
      setNotice('أُزيل العضو من مساحة العمل وسُجّل الإجراء في سجل التدقيق.');
    } catch (cause: any) {
      setError(cause?.message || 'تعذر إزالة العضو.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invitation: Invitation) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiClient.revokeInvitation(workspaceId, token, invitation.id);
      setInvitations(current => current.map(item => item.id === invitation.id ? { ...item, status: 'revoked' } : item));
      setNotice('أُلغيت الدعوة ولن يعمل رابطها بعد الآن.');
    } catch (cause: any) {
      setError(cause?.message || 'تعذر إلغاء الدعوة.');
    } finally {
      setBusy(false);
    }
  }

  const pending = invitations.filter(item => item.status === 'pending');
  const inviteLink = issued?.token ? `${window.location.origin}/workspace.html?invite=${encodeURIComponent(issued.token)}` : '';

  return <div className="members-layout">
    {error && <div className="workspace-alert" role="alert"><CircleAlert size={16} />{error}</div>}
    {notice && <div className="workspace-notice" role="status"><Check size={16} />{notice}<button type="button" aria-label="إغلاق التنبيه" onClick={() => setNotice('')}><X size={14} /></button></div>}

    {manager && <section className="workspace-panel">
      <div className="workspace-panel-heading"><div><h2>دعوة عضو إلى المساحة</h2><p>الدعوة مرتبطة بالبريد الإلكتروني وتنتهي بعد سبعة أيام، ويُخزَّن رمزها مشفّرًا فقط.</p></div><Mail size={18} /></div>
      <form className="workspace-form member-invite-form" aria-label="دعوة عضو" onSubmit={event => void invite(event)}>
        <label>البريد الإلكتروني<input aria-label="بريد العضو المدعو" type="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} placeholder="name@company.com" /></label>
        <label>الدور<select aria-label="دور العضو المدعو" value={role} onChange={event => setRole(event.target.value)}><option value="member">عضو</option><option value="viewer">قراءة فقط</option><option value="manager">مدير مساحة</option></select></label>
        <button className="workspace-button primary" type="submit" disabled={busy || !email.trim()}><UserPlus size={15} />{busy ? 'جارٍ الإنشاء…' : 'إنشاء دعوة'}</button>
      </form>
      {issued && <div className="member-invite-result" role="group" aria-label="رابط الدعوة">
        <div className="member-invite-link"><span>رابط الدعوة لـ {issued.invitation.email}</span><code>{inviteLink}</code></div>
        <div className="member-invite-actions">
          <button type="button" className="workspace-button secondary" onClick={() => void copy(inviteLink, 'link')}><Copy size={14} />{copyState === 'link' ? 'نُسخ الرابط' : 'نسخ الرابط'}</button>
          <button type="button" className="workspace-button secondary" onClick={() => void copy(issued.token, 'token')}><Copy size={14} />{copyState === 'token' ? 'نُسخ الرمز' : 'نسخ الرمز'}</button>
        </div>
        {copyState === 'failed' && <p className="workspace-inline-hint" role="alert">تعذر النسخ التلقائي؛ حدّد الرابط أعلاه وانسخه يدويًا.</p>}
        <p className="workspace-inline-hint">يُعرض الرمز مرة واحدة فقط. لإعادة الإرسال أنشئ دعوة جديدة بعد إلغاء الحالية.</p>
      </div>}
    </section>}

    <section className="workspace-panel">
      <div className="workspace-panel-heading"><div><h2>أعضاء المساحة</h2><p>{members.length.toLocaleString('ar')} عضو لديهم وصول إلى هذه المساحة فقط.</p></div><button type="button" aria-label="تحديث الأعضاء" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /></button></div>
      {loading ? <p className="workspace-loading" role="status">جارٍ تحميل الأعضاء…</p> : members.length ? <div className="workspace-table-wrap"><table>
        <thead><tr><th>العضو</th><th>البريد</th><th>الدور</th><th>تاريخ الانضمام</th>{manager && <th>إجراءات</th>}</tr></thead>
        <tbody>{members.map(member => <tr key={member.user_id}>
          <td><span className="table-primary"><span className="table-icon"><Users size={16} /></span>{member.name}{member.user_id === currentUserId && <small className="member-self-tag"> (أنت)</small>}</span></td>
          <td>{member.email}</td>
          <td>{manager ? <select aria-label={`دور ${member.email}`} value={member.role} disabled={busy} onChange={event => void changeRole(member, event.target.value)}><option value="viewer">قراءة فقط</option><option value="member">عضو</option><option value="manager">مدير مساحة</option></select> : <span className="workspace-status-pill status-active"><i />{roleLabels[member.role] || member.role}</span>}</td>
          <td>{dateLabel(member.joined_at)}</td>
          {manager && <td><button type="button" className="member-remove-button" aria-label={`إزالة ${member.email}`} disabled={busy || member.user_id === currentUserId} title={member.user_id === currentUserId ? 'لا يمكنك إزالة عضويتك بنفسك' : 'إزالة من المساحة'} onClick={() => void remove(member)}><Trash2 size={14} /> إزالة</button></td>}
        </tr>)}</tbody>
      </table></div> : <div className="workspace-empty"><span><Users size={18} /></span><strong>لا يوجد أعضاء ظاهرون</strong><p>ستظهر العضوية بعد قبول أول دعوة.</p></div>}
      {!manager && <p className="workspace-inline-hint"><ShieldCheck size={15} /> إدارة الأعضاء والأدوار متاحة لمدير المساحة فقط، ويتحقق الخادم من الصلاحية في كل طلب.</p>}
    </section>

    <section className="workspace-panel">
      <div className="workspace-panel-heading"><div><h2>الدعوات</h2><p>{pending.length.toLocaleString('ar')} دعوة معلقة. الدعوات المنتهية لا تمنح وصولًا.</p></div><Plus size={17} /></div>
      {loading ? <p className="workspace-loading" role="status">جارٍ تحميل الدعوات…</p> : invitations.length ? <div className="workspace-table-wrap"><table>
        <thead><tr><th>البريد</th><th>الدور</th><th>الحالة</th><th>تنتهي في</th>{manager && <th>إجراء</th>}</tr></thead>
        <tbody>{invitations.map(invitation => <tr key={invitation.id}>
          <td>{invitation.email}</td>
          <td>{roleLabels[invitation.role] || invitation.role}</td>
          <td><span className={`workspace-status-pill status-${invitation.status === 'pending' ? 'active' : invitation.status === 'accepted' ? 'completed' : 'paused'}`}><i />{{ pending: 'معلقة', accepted: 'مقبولة', revoked: 'ملغاة', expired: 'منتهية' }[invitation.status] || invitation.status}</span></td>
          <td>{dateLabel(invitation.expires_at)}</td>
          {manager && <td>{invitation.status === 'pending' && <button type="button" className="workspace-text-button" disabled={busy} onClick={() => void revoke(invitation)}>إلغاء الدعوة</button>}</td>}
        </tr>)}</tbody>
      </table></div> : <div className="workspace-empty"><span><Mail size={18} /></span><strong>لا توجد دعوات</strong><p>{manager ? 'ابدأ بدعوة عضو من النموذج أعلاه.' : 'ستظهر الدعوات التي أنشأها مدير المساحة.'}</p></div>}
    </section>
  </div>;
}
