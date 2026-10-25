import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, CircleAlert, KeyRound, Plug, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react';
import { apiClient } from '../api-client.js';

type Connection = { id: string; provider: string; display_name: string; auth_type?: string; status: string; scopes?: string[]; expires_at?: string; created_at?: string };
type Props = { workspaceId: string; token: string; manager: boolean };

// Only providers whose credential shape is implemented by the server-side tool
// layer are offered here. Adding a provider to this list without a working tool
// would advertise an integration that cannot execute.
const providers: { id: string; label: string; secretLabel: string; hint: string }[] = [
  { id: 'google_workspace', label: 'Google Workspace', secretLabel: 'OAuth access token', hint: 'رمز وصول OAuth فعّال للنطاق المطلوب.' },
  { id: 'gmail', label: 'Gmail', secretLabel: 'OAuth access token', hint: 'صلاحية قراءة/إرسال البريد بحسب نطاق الرمز.' },
  { id: 'google_calendar', label: 'Google Calendar', secretLabel: 'OAuth access token', hint: 'رمز وصول تقويم Google.' },
  { id: 'google_drive', label: 'Google Drive', secretLabel: 'OAuth access token', hint: 'رمز وصول Drive.' },
  { id: 'microsoft_365', label: 'Microsoft 365', secretLabel: 'OAuth access token', hint: 'رمز Microsoft Graph.' },
  { id: 'outlook_email', label: 'Outlook Email', secretLabel: 'OAuth access token', hint: 'رمز Graph لصندوق البريد.' },
  { id: 'slack', label: 'Slack', secretLabel: 'Bot token', hint: 'رمز بوت Slack (xoxb-…).' },
  { id: 'discord', label: 'Discord', secretLabel: 'Bot token', hint: 'رمز بوت Discord.' },
  { id: 'hubspot', label: 'HubSpot', secretLabel: 'Private app token', hint: 'رمز تطبيق خاص من HubSpot.' },
  { id: 'salesforce', label: 'Salesforce', secretLabel: 'Access token', hint: 'رمز وصول Salesforce.' },
  { id: 'stripe', label: 'Stripe', secretLabel: 'Secret key', hint: 'مفتاح Stripe السري — يُخزَّن مشفّرًا ولا يظهر ثانية.' },
  { id: 'shopify', label: 'Shopify', secretLabel: 'Admin access token', hint: 'رمز وصول إداري لمتجر Shopify.' },
  { id: 'jira', label: 'Jira', secretLabel: 'API token', hint: 'رمز API لـ Atlassian.' },
  { id: 'confluence', label: 'Confluence', secretLabel: 'API token', hint: 'رمز API لـ Atlassian.' },
  { id: 'asana', label: 'Asana', secretLabel: 'Access token', hint: 'رمز وصول Asana.' },
  { id: 'linear', label: 'Linear', secretLabel: 'API key', hint: 'مفتاح API من Linear.' },
  { id: 'notion', label: 'Notion', secretLabel: 'Integration token', hint: 'رمز تكامل Notion.' },
  { id: 'airtable', label: 'Airtable', secretLabel: 'Personal access token', hint: 'رمز وصول Airtable.' },
  { id: 'github', label: 'GitHub', secretLabel: 'Personal access token', hint: 'رمز GitHub محدود الصلاحيات.' },
  { id: 'gitlab', label: 'GitLab', secretLabel: 'Access token', hint: 'رمز وصول GitLab.' },
  { id: 'dropbox', label: 'Dropbox', secretLabel: 'Access token', hint: 'رمز وصول Dropbox.' },
  { id: 'zoom', label: 'Zoom', secretLabel: 'Access token', hint: 'رمز وصول Zoom.' },
];
const providerLabel = (id: string) => id === 'mcp' ? 'MCP Server' : providers.find(item => item.id === id)?.label || id;

function unwrap(value: any) { return value?.data ?? value; }
function list(value: any): any[] {
  const data = unwrap(value);
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
function dateLabel(value?: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value));
}

export default function IntegrationsPanel({ workspaceId, token, manager }: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [provider, setProvider] = useState(providers[0].id);
  const [displayName, setDisplayName] = useState('');
  const [secret, setSecret] = useState('');
  const requestSequence = useRef(0);

  async function load() {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.integrations(workspaceId, token);
      if (sequence === requestSequence.current) setConnections(list(result));
    } catch (cause: any) {
      if (sequence === requestSequence.current) setError(cause?.message || 'تعذر تحميل التكاملات.');
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    setConnections([]);
    setNotice('');
    setSecret('');
    setDisplayName('');
    void load();
    return () => { requestSequence.current += 1; };
  }, [workspaceId, token]);

  const selected = providers.find(item => item.id === provider) || providers[0];

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manager) return;
    const value = secret.trim();
    if (!value) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const created = unwrap(await apiClient.createIntegration(workspaceId, token, {
        provider,
        name: displayName.trim() || selected.label,
        displayName: displayName.trim() || selected.label,
        authType: 'api_key',
        credentials: { token: value },
        scopes: [],
        metadata: {},
        config: {},
      }));
      if (!created?.id) throw new Error('لم يُعد الخادم معرّف الاتصال. أعد المحاولة.');
      setConnections(current => [created, ...current]);
      setSecret('');
      setDisplayName('');
      setNotice('حُفظ الاتصال بتشفير AES-256-GCM. لن يظهر الرمز مرة أخرى في الواجهة أو السجلات.');
    } catch (cause: any) {
      setError(cause?.message || 'تعذر حفظ التكامل. تحقق من صحة الرمز ومن إعداد مفتاح التشفير في الخادم.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(connection: Connection) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiClient.revokeIntegration(workspaceId, token, connection.id);
      setConnections(current => current.map(item => item.id === connection.id ? { ...item, status: 'revoked' } : item));
      setNotice('أُلغي الاتصال. لن تستخدمه أدوات الموظفين بعد الآن.');
    } catch (cause: any) {
      setError(cause?.message || 'تعذر إلغاء الاتصال.');
    } finally {
      setBusy(false);
    }
  }

  const active = connections.filter(item => item.status === 'active');
  return <div className="integrations-layout">
    {error && <div className="workspace-alert" role="alert"><CircleAlert size={16} />{error}</div>}
    {notice && <div className="workspace-notice" role="status"><Check size={16} />{notice}<button type="button" aria-label="إغلاق التنبيه" onClick={() => setNotice('')}><X size={14} /></button></div>}

    {manager && <section className="workspace-panel">
      <div className="workspace-panel-heading"><div><h2>ربط خدمة خارجية</h2><p>تُشفَّر بيانات الاعتماد في الخادم بمفتاح ENJAZ_CREDENTIALS_KEY ولا تُعاد إلى المتصفح.</p></div><Plug size={18} /></div>
      <form className="workspace-form integration-form" aria-label="ربط تكامل جديد" onSubmit={event => void connect(event)}>
        <label>الخدمة<select aria-label="خدمة التكامل" value={provider} onChange={event => setProvider(event.target.value)}>{providers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>اسم الاتصال<input aria-label="اسم الاتصال" value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={120} placeholder={selected.label} /></label>
        <label>{selected.secretLabel}<input aria-label={selected.secretLabel} type="password" autoComplete="off" value={secret} onChange={event => setSecret(event.target.value)} required placeholder="••••••••" /></label>
        <p className="workspace-inline-hint"><KeyRound size={14} /> {selected.hint}</p>
        <button className="workspace-button primary" type="submit" disabled={busy || !secret.trim()}><Plug size={15} />{busy ? 'جارٍ الحفظ…' : 'حفظ الاتصال'}</button>
      </form>
    </section>}

    <section className="workspace-panel">
      <div className="workspace-panel-heading"><div><h2>التكاملات المتصلة</h2><p>{active.length.toLocaleString('ar')} اتصال نشط من أصل {connections.length.toLocaleString('ar')}.</p></div><button type="button" aria-label="تحديث التكاملات" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /></button></div>
      {loading ? <p className="workspace-loading" role="status">جارٍ تحميل التكاملات…</p> : connections.length ? <div className="workspace-table-wrap"><table>
        <thead><tr><th>الخدمة</th><th>الاتصال</th><th>الحالة</th><th>أُنشئ</th>{manager && <th>إجراء</th>}</tr></thead>
        <tbody>{connections.map(connection => <tr key={connection.id}>
          <td><span className="table-primary"><span className="table-icon"><Plug size={15} /></span>{providerLabel(connection.provider)}</span></td>
          <td>{connection.display_name}</td>
          <td><span className={`workspace-status-pill status-${connection.status === 'active' ? 'active' : 'paused'}`}><i />{connection.status === 'active' ? 'نشط' : connection.status === 'revoked' ? 'ملغى' : connection.status}</span></td>
          <td>{dateLabel(connection.created_at)}</td>
          {manager && <td>{connection.status === 'active' && <button type="button" className="member-remove-button" disabled={busy} onClick={() => void revoke(connection)}><Trash2 size={13} /> إلغاء</button>}</td>}
        </tr>)}</tbody>
      </table></div> : <div className="workspace-empty"><span><Plug size={18} /></span><strong>لا توجد تكاملات</strong><p>{manager ? 'أضف أول اتصال ليتمكن الموظفون من استخدام أدوات الخدمة المسموحة.' : 'سيظهر هنا ما يضيفه مدير المساحة.'}</p></div>}
    </section>

    <section className="workspace-panel integration-scope-panel">
      <div className="workspace-panel-heading"><div><h2>حدود التشغيل</h2><p>ما يفعله النظام فعلًا عند استخدام التكامل.</p></div><ShieldCheck size={18} /></div>
      <ul className="integration-scope-list">
        <li>كل استخدام يمر عبر سجل الأدوات المركزي ويُقيَّد بقائمة نطاقات الخدمة المسموحة.</li>
        <li>الأفعال عالية المخاطر تتطلب موافقة بشرية قبل التنفيذ، وتُسجَّل في سجل التدقيق.</li>
        <li>لا يوجد فحص اتصال تلقائي من هذه الصفحة؛ يظهر الخطأ عند أول استدعاء فعلي للأداة.</li>
        <li>إلغاء الاتصال يوقف استخدامه فورًا دون حذف سجل التدقيق السابق.</li>
      </ul>
    </section>
  </div>;
}
