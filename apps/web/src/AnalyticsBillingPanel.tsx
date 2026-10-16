import { Activity, BarChart3, CreditCard, Gauge, Timer } from 'lucide-react';

type Props = { summary: Record<string, any>; recent: any[]; subscription: Record<string, any> | null; usage: Record<string, any> | null };
function number(value: unknown) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function fmt(value: unknown) { return number(value).toLocaleString('ar'); }
function dateLabel(value?: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value));
}
function UsageBar({ label, value, limit, unit = '' }: { label: string; value: unknown; limit: unknown; unit?: string }) {
  const current = Math.max(0, number(value));
  const cap = Math.max(0, number(limit));
  const percent = cap ? Math.min(100, Math.round(current / cap * 100)) : 0;
  return <article className="usage-meter"><div><span>{label}</span><strong>{fmt(current)}{unit}{cap ? ` / ${fmt(cap)}${unit}` : ''}</strong></div><div className="usage-track" role="progressbar" aria-label={label} aria-valuenow={cap ? Math.min(current, cap) : current} aria-valuemin={0} aria-valuemax={cap || current || 1}><i style={{ width: `${percent}%` }} /></div><small>{cap ? `${percent}٪ من الحد الحالي` : 'لا يوجد حد ظاهر لهذه الخطة'}</small></article>;
}
export default function AnalyticsBillingPanel({ summary, recent, subscription, usage }: Props) {
  const runs = number(summary?.runs);
  const succeeded = number(summary?.successful_runs);
  const failed = number(summary?.failed_runs);
  const terminalRuns = succeeded + failed;
  const successRate = terminalRuns ? Math.round(succeeded / terminalRuns * 100) : null;
  const currentPlan = subscription?.plan_name || usage?.plan || 'غير محددة';
  const limits = usage?.limits || subscription || {};
  const aiCost = usage?.aiCostCents ?? summary?.cost_cents ?? 0;
  return <div className="analytics-layout">
    <section className="workspace-panel">
      <div className="workspace-panel-heading"><div><h2>أداء التشغيل</h2><p>مؤشرات مباشرة من سجل التشغيل الخاص بهذه المساحة.</p></div><BarChart3 size={18} /></div>
      <div className="analytics-stat-grid">
        <article className="analytics-stat"><span><Activity size={16} /> سجلات القياس</span><strong>{fmt(runs)}</strong><small>سجلات محفوظة ضمن القياس المتاح</small></article>
        <article className="analytics-stat"><span><Gauge size={16} /> نسبة النجاح</span><strong>{successRate === null ? '—' : `${successRate.toLocaleString('en-US')}٪`}</strong><small>{fmt(succeeded)} ناجحة · {fmt(failed)} متعثرة؛ الحالات النهائية فقط</small></article>
        <article className="analytics-stat"><span><Timer size={16} /> متوسط زمن التنفيذ</span><strong>{summary?.avg_latency_ms == null ? '—' : `${fmt(summary.avg_latency_ms)} ms`}</strong><small>بحسب القياس المتاح</small></article>
        <article className="analytics-stat"><span><CreditCard size={16} /> تكلفة الذكاء الاصطناعي</span><strong>{fmt(aiCost)}</strong><small>سنت مسجل — لا تُعرض عملة في المخطط الحالي</small></article>
      </div>
    </section>
    <section className="workspace-panel">
      <div className="workspace-panel-heading"><div><h2>الخطة والاستخدام</h2><p>مقارنة الاستهلاك بحدود الاشتراك الحالية.</p></div><span className="workspace-count-pill">{currentPlan}</span></div>
      {!usage ? <div className="workspace-empty"><span><CreditCard size={18} /></span><strong>بيانات الاشتراك غير متاحة</strong><p>تحقق من إعداد خطة مساحة العمل ثم أعد تحميل الصفحة.</p></div> : <>
        <div className="billing-summary"><div><small>حالة الاشتراك</small><strong>{subscription?.status || usage.status || 'غير محددة'}</strong></div><div><small>نهاية الفترة الحالية</small><strong>{dateLabel(subscription?.current_period_end || usage.periodEnd)}</strong></div></div>
        <div className="usage-meter-list">
          <UsageBar label="الموظفون الرقميون" value={usage.employees} limit={limits.max_employees ?? limits.employees} />
          <UsageBar label="المهام خلال الشهر" value={usage.tasksThisMonth} limit={limits.max_tasks_month ?? limits.tasksMonth} />
          <UsageBar label="التكاملات النشطة" value={usage.integrations} limit={limits.max_integrations ?? limits.integrations} />
          <UsageBar label="تكلفة الذكاء الاصطناعي" value={usage.aiCostCents} limit={limits.included_ai_cost_cents ?? limits.includedAiCostCents} unit=" سنت" />
        </div>
      </>}
      <div className="billing-scope-note"><CreditCard size={15} /><span>الفوترة الحالية تعرض الاستخدام والحدود فقط؛ لا تشمل إصدار فواتير أو تحصيل مدفوعات أو ضرائب.</span></div>
    </section>
    <section className="workspace-panel analytics-recent-panel">
      <div className="workspace-panel-heading"><div><h2>آخر قياسات التشغيل</h2><p>سجل تشغيلي مختصر للمراجعة.</p></div></div>
      {recent?.length ? <div className="workspace-table-wrap"><table><thead><tr><th>المزود</th><th>النتيجة</th><th>الزمن</th><th>التكلفة (سنت)</th><th>الوقت</th></tr></thead><tbody>{recent.slice(0, 10).map((item, index) => <tr key={item.id || `${item.created_at}-${index}`}><td>{item.provider || '—'}</td><td>{item.status || '—'}</td><td>{item.latency_ms == null ? '—' : `${fmt(item.latency_ms)} ms`}</td><td>{fmt(item.cost_cents)}</td><td>{dateLabel(item.created_at)}</td></tr>)}</tbody></table></div> : <div className="workspace-empty"><span><Activity size={18} /></span><strong>لا توجد قياسات تفصيلية</strong><p>ستظهر القياسات هنا بعد تشغيل المهام.</p></div>}
    </section>
  </div>;
}
