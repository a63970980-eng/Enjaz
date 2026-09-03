import {authClient} from './auth-client.js';

const apiBase = window.ENJAZ_API_BASE || '';
const production = Boolean(apiBase);
const root = document.querySelector('.app');
const q = new URLSearchParams(location.search);

const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
const mount = html => {
  let el = document.getElementById('auth-gate');
  if (!el) { el = document.createElement('div'); el.id = 'auth-gate'; document.body.appendChild(el); }
  el.innerHTML = html;
  return el;
};

const form = ({ signup = false, error = '' } = {}) => mount(`<div class="auth-shell"><div class="auth-card"><div class="auth-brand"><span class="brand-mark"><i></i><i></i><i></i></span><div><strong>إنجاز</strong><small>ENJAZ · DIGITAL WORKFORCE</small></div></div><div class="auth-copy"><div class="eyebrow">${signup ? 'START YOUR WORKFORCE' : 'SECURE WORKSPACE'}</div><h1>${signup ? 'ابنِ قوة العمل الرقمية لشركتك' : 'مرحبًا بعودتك'}</h1><p>${signup ? 'أنشئ حسابك، ثم جهّز مؤسستك وأول مساحة عمل خلال دقائق.' : 'سجّل الدخول للوصول إلى قوة العمل الرقمية وبيانات شركتك.'}</p></div>${error ? `<div class="auth-error">${esc(error)}</div>` : ''}<form id="auth-form">${signup ? '<label>الاسم<input name="name" required autocomplete="name" placeholder="اسمك الكامل"></label>' : ''}<label>البريد الإلكتروني<input name="email" type="email" required autocomplete="email" placeholder="name@company.com"></label><label>كلمة المرور<input name="password" type="password" required minlength="8" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="••••••••"></label><button class="primary auth-submit" type="submit">${signup ? 'إنشاء الحساب' : 'تسجيل الدخول'}</button></form><div class="auth-switch">${signup ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'} <button id="auth-switch" class="link-button">${signup ? 'تسجيل الدخول' : 'إنشاء حساب'}</button></div><div class="auth-secure">● جلسة مشفّرة · عزل بيانات المؤسسة · صلاحيات حسب الدور</div></div></div>`);

const confirmation = email => {
  const el = mount(`<div class="auth-shell"><div class="auth-card"><div class="auth-brand"><span class="brand-mark"><i></i><i></i><i></i></span><div><strong>إنجاز</strong><small>ENJAZ · DIGITAL WORKFORCE</small></div></div><div class="auth-copy"><div class="eyebrow">EMAIL VERIFICATION</div><h1>تحقق من بريدك الإلكتروني</h1><p>أرسلنا رسالة تأكيد إلى <strong>${esc(email)}</strong>. افتح الرسالة واضغط زر التأكيد، ثم عد إلى إنجاز لتسجيل الدخول وتهيئة مساحة عملك.</p></div><div class="auth-secure">بعد تأكيد البريد، استخدم بيانات حسابك لتسجيل الدخول. إذا لم تصل الرسالة فتحقق من البريد غير المرغوب فيه.</div><div style="display:flex;gap:10px;margin-top:18px"><button class="primary" id="go-login" style="flex:1">العودة لتسجيل الدخول</button><button class="ghost" id="go-signup" style="flex:1">إنشاء حساب آخر</button></div></div></div>`);
  el.querySelector('#go-login').onclick = () => { q.delete('signup'); history.replaceState({}, '', location.pathname); location.reload(); };
  el.querySelector('#go-signup').onclick = () => { q.set('signup', '1'); history.replaceState({}, '', `${location.pathname}?${q.toString()}`); location.reload(); };
};

async function workspaceSetup(profile) {
  const current = profile?.workspaces?.[0];
  if (current) {
    localStorage.setItem('ENJAZ_WORKSPACE_ID', current.id);
    sessionStorage.setItem('ENJAZ_WORKSPACES', JSON.stringify(profile.workspaces));
    return true;
  }
  const el = mount(`<div class="auth-shell"><div class="auth-card onboarding-card"><div class="auth-brand"><span class="brand-mark"><i></i><i></i><i></i></span><div><strong>إنجاز</strong><small>مساحة العمل الأولى</small></div></div><div class="auth-copy"><div class="eyebrow">01 / WORKSPACE</div><h1>لنجهّز شركتك</h1><p>هذه المساحة هي مركز عملياتك. يمكنك تغيير كل التفاصيل لاحقًا.</p></div><form id="workspace-form"><label>اسم المؤسسة<input name="organizationName" required placeholder="مثال: شركة إنجاز التقنية"></label><label>اسم مساحة العمل<input name="workspaceName" required placeholder="مثال: العمليات اليومية"></label><button class="primary auth-submit" type="submit">إنشاء مساحة العمل ←</button></form><div class="auth-secure">سيتم إنشاء المؤسسة والعضوية الأولى في عملية واحدة آمنة.</div></div></div>`);
  el.querySelector('#workspace-form').onsubmit = async e => {
    e.preventDefault();
    const b = new FormData(e.currentTarget);
    const btn = e.currentTarget.querySelector('button');
    btn.disabled = true; btn.textContent = 'جارٍ التجهيز…';
    try {
      const data = await authClient.bootstrap(apiBase, { name: profile.identity.name, organizationName: b.get('organizationName'), workspaceName: b.get('workspaceName') });
      const ws = data.workspaces?.[0];
      if (!ws) throw new Error('لم يتم إنشاء مساحة العمل');
      localStorage.setItem('ENJAZ_WORKSPACE_ID', ws.id);
      sessionStorage.setItem('ENJAZ_WORKSPACES', JSON.stringify(data.workspaces));
      location.reload();
    } catch (err) {
      btn.disabled = false; btn.textContent = 'إنشاء مساحة العمل ←';
      el.querySelector('.auth-card').insertAdjacentHTML('beforeend', `<div class="auth-error">${esc(err.message)}</div>`);
    }
  };
}

if (!production) {
  // Preview mode is handled by the normal application.
} else if (!authClient.configured) {
  root?.classList.add('is-config-warning');
  mount(`<div class="auth-shell"><div class="auth-card"><div class="auth-brand"><span class="brand-mark"><i></i><i></i><i></i></span><div><strong>إنجاز</strong><small>ENJAZ · DIGITAL WORKFORCE</small></div></div><div class="auth-copy"><div class="eyebrow">PRODUCTION CONFIGURATION</div><h1>المصادقة جاهزة للتشغيل</h1><p>تم تجهيز التطبيق للإطلاق الحقيقي، لكن مفاتيح Supabase العامة لم تُضبط في بيئة الواجهة بعد.</p></div><div class="auth-error">أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY إلى بيئة الإنتاج، ثم أعد النشر.</div><div class="auth-secure">لن يتم عرض أي مفتاح service_role داخل المتصفح.</div></div></div>`);
} else if (!authClient.token()) {
  root?.classList.add('is-auth-locked');
  const bind = () => {
    const node = document.getElementById('auth-gate');
    node.querySelector('#auth-switch').onclick = () => {
      q.set('signup', q.get('signup') === '1' ? '0' : '1');
      history.replaceState({}, '', `${location.pathname}?${q.toString()}`);
      bind();
    };
    node.querySelector('#auth-form').onsubmit = async e => {
      e.preventDefault();
      const b = new FormData(e.currentTarget);
      const btn = e.currentTarget.querySelector('button');
      const signup = q.get('signup') === '1';
      btn.disabled = true; btn.textContent = 'جارٍ الاتصال…';
      try {
        if (signup) {
          const result = await authClient.signUp(b.get('email'), b.get('password'), b.get('name'));
          if (result.needsEmailConfirmation) {
            sessionStorage.setItem('ENJAZ_PENDING_EMAIL', String(b.get('email')));
            confirmation(b.get('email'));
            return;
          }
        } else {
          await authClient.signIn(b.get('email'), b.get('password'));
        }
        location.reload();
      } catch (err) {
        btn.disabled = false; btn.textContent = signup ? 'إنشاء الحساب' : 'تسجيل الدخول';
        form({ signup, error: err.message });
        bind();
      }
    };
  };
  form({ signup: q.get('signup') === '1' });
  bind();
} else {
  authClient.me(apiBase).then(profile => {
    if (!profile) { location.reload(); return; }
    if (profile.workspaces?.[0]) {
      localStorage.setItem('ENJAZ_WORKSPACE_ID', q.get('workspaceId') || localStorage.getItem('ENJAZ_WORKSPACE_ID') || profile.workspaces[0].id);
      sessionStorage.setItem('ENJAZ_USER_PROFILE', JSON.stringify(profile));
    } else {
      workspaceSetup(profile);
    }
  }).catch(err => mount(`<div class="auth-shell"><div class="auth-card"><div class="auth-copy"><div class="eyebrow">SESSION ERROR</div><h1>تعذر تحميل مساحة العمل</h1><p>${esc(err.message)}</p><button class="primary" onclick="location.reload()">إعادة المحاولة</button></div></div></div>`));
}
