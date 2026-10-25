import { BarChart3, ShieldCheck } from 'lucide-react';
import type { AnalyticsConsent } from './analytics';

type Props = { decision: AnalyticsConsent; onDecision: (decision: 'granted' | 'denied') => void };

/**
 * The only place a member can grant or withdraw product analytics consent.
 * No decision is stored as "unset", which keeps PostHog fully opted out.
 */
export default function AnalyticsConsentNotice({ decision, onDecision }: Props) {
  if (decision === 'granted') {
    return <section className="analytics-consent" aria-label="إعدادات التحليلات">
      <ShieldCheck size={16} />
      <p><strong>تحليلات المنتج مفعّلة.</strong> نرسل أحداثًا مجهولة الهوية عن إنشاء الموظفين والمهام وبدء التنفيذ وقرارات الموافقة، دون أسماء أو بريد أو محتوى أو روابط.</p>
      <button type="button" className="workspace-text-button" onClick={() => onDecision('denied')}>سحب الموافقة</button>
    </section>;
  }
  if (decision === 'denied') {
    return <section className="analytics-consent" aria-label="إعدادات التحليلات">
      <BarChart3 size={16} />
      <p><strong>تحليلات المنتج معطّلة.</strong> لن يُرسل أي حدث من هذه المساحة. يمكنك تفعيلها في أي وقت.</p>
      <button type="button" className="workspace-text-button" onClick={() => onDecision('granted')}>السماح بالتحليلات</button>
    </section>;
  }
  return <section className="analytics-consent" aria-label="إعدادات التحليلات">
    <BarChart3 size={16} />
    <p><strong>هل تسمح بتحليلات المنتج؟</strong> أحداث مجهولة الهوية فقط (مساحة العمل، الدور، حالة المهمة، قرار الموافقة) لقياس مسار التفعيل. لا أسماء ولا بريد ولا محتوى ولا روابط، ويمكنك السحب لاحقًا.</p>
    <div className="analytics-consent-actions">
      <button type="button" className="workspace-button secondary" onClick={() => onDecision('denied')}>رفض</button>
      <button type="button" className="workspace-button primary" onClick={() => onDecision('granted')}>السماح</button>
    </div>
  </section>;
}
