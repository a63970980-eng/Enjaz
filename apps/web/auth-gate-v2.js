import {authClient} from './auth-client.js';
import {apiClient} from './api-client.js';

const root=document.querySelector('.enjaz-root');
const q=new URLSearchParams(location.search);
const apiBase=window.ENJAZ_API_BASE||'';
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const mount=html=>{let el=document.getElementById('auth-gate');if(!el){el=document.createElement('div');el.id='auth-gate';document.body.appendChild(el)}el.innerHTML=html;return el};
const clearGate=()=>{document.getElementById('auth-gate')?.remove();root?.classList.remove('is-auth-locked')};
const isSignup=()=>q.get('signup')==='1';
let resolveAuthReady;
window.__ENJAZ_AUTH_STATE__='resolving';
window.__ENJAZ_AUTH_READY__=new Promise(resolve=>{resolveAuthReady=resolve});
const setAuthState=state=>{window.__ENJAZ_AUTH_STATE__=state;resolveAuthReady?.(state);resolveAuthReady=null};
const goAuth=signup=>{const url=new URL(location.href);url.search='';url.searchParams.set('auth','1');if(signup)url.searchParams.set('signup','1');history.replaceState({},'',url.toString());renderForm()};

const form=({signup=isSignup(),error='' }={})=>mount(`<div class="auth-shell"><div class="auth-card"><div class="auth-brand"><span class="brand-mark"><i></i><i></i><i></i></span><div><strong>إنجاز</strong><small>ENJAZ · DIGITAL WORKFORCE</small></div></div><div class="auth-copy"><div class="eyebrow">${signup?'START YOUR WORKFORCE':'SECURE WORKSPACE'}</div><h1>${signup?'ابنِ قوة العمل الرقمية لشركتك':'مرحبًا بعودتك'}</h1><p>${signup?'أنشئ حسابك ثم سنقودك خطوة بخطوة لتأسيس مؤسستك وتفعيل قوة العمل المناسبة لقطاعك.':'سجّل الدخول للوصول إلى قوة العمل الرقمية وبيانات شركتك.'}</p></div>${error?`<div class="auth-error" role="alert">${esc(error)}</div>`:''}<form id="auth-form">${signup?'<label>الاسم<input name="name" required autocomplete="name" placeholder="اسمك الكامل"></label>':''}<label>البريد الإلكتروني<input name="email" type="email" required autocomplete="email" placeholder="name@company.com"></label><label>كلمة المرور<input name="password" type="password" required minlength="8" autocomplete="${signup?'new-password':'current-password'}" placeholder="••••••••"></label><button class="primary auth-submit" type="submit">${signup?'إنشاء الحساب':'تسجيل الدخول'}</button></form><div class="auth-switch">${signup?'لديك حساب بالفعل؟':'ليس لديك حساب؟'} <button id="auth-switch" class="link-button" type="button">${signup?'تسجيل الدخول':'إنشاء حساب'}</button></div><div class="auth-secure">● جلسة آمنة · عزل بيانات المؤسسة · صلاحيات حسب الدور</div></div></div>`);

const sectorOptions=[
 ['restaurants','المطاعم','تشغيل الفروع، الطلبات، المخزون، المشتريات، الجودة وخدمة العملاء.','مطاعم'],
 ['hospitals','المستشفيات','إدارة المواعيد، التنسيق التشغيلي، الجودة، المرضى والعمليات.','مستشفيات'],
 ['hotels','الفنادق','الضيافة، الحجوزات، التشغيل، خدمة النزلاء والجودة.','فنادق'],
 ['companies','الشركات','المبيعات، العمليات، الموارد، خدمة العملاء، المالية والتقارير.','شركات'],
 ['government','الجهات الحكومية','الخدمات، المعاملات، الامتثال، المتابعة، الجودة والتقارير.','جهات حكومية']
];

const workspaceSetup=async profile=>{
 const safeProfile=profile&&typeof profile==='object'?profile:{};
 const el=mount(`<div class="auth-shell"><div class="auth-card onboarding-card onboarding-enterprise"><div class="auth-brand"><span class="brand-mark"><i></i><i></i><i></i></span><div><strong>إنجاز</strong><small>ENTERPRISE ACTIVATION</small></div></div><div class="auth-copy"><div class="eyebrow">01 / ORGANIZATION</div><h1>أسّس بيئة العمل الصحيحة</h1><p>ابدأ بالمؤسسة والقطاع. بعد ذلك يجهّز إنجاز حزمة القوى العاملة الرقمية المتخصصة بدل أن تبدأ ببناء الموظفين واحدًا واحدًا.</p></div><form id="workspace-form"><div class="onboarding-section-label">هوية المؤسسة</div><div class="onboarding-fields"><label>اسم المؤسسة<input name="organizationName" required maxlength="120" placeholder="مثال: شركة إنجاز للتشغيل"></label><label>اسم مساحة العمل<input name="workspaceName" required maxlength="80" placeholder="مثال: العمليات الرئيسية"></label></div><div class="onboarding-section-label">اختر قطاع المؤسسة</div><div class="sector-choice-grid">${sectorOptions.map(([id,title,desc,short],i)=>`<label class="sector-choice"><input type="radio" name="sector" value="${id}" ${i===0?'checked':''}><span class="sector-choice-mark">${esc(short.charAt(0))}</span><span><strong>${esc(title)}</strong><small>${esc(desc)}</small></span><i>✓</i></label>`).join('')}</div><button class="primary auth-submit" type="submit">إنشاء المؤسسة وتفعيل القطاع ←</button></form><div class="auth-secure">سيتم إنشاء المؤسسة أولًا ثم تفعيل حزمة القطاع بشكل آمن. يمكنك إدارة الفروع والأدوار لاحقًا من مركز القيادة.</div></div></div>`);
 el.querySelector('#workspace-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const b=new FormData(e.currentTarget),btn=e.currentTarget.querySelector('button');
  btn.disabled=true;btn.textContent='جارٍ تأسيس بيئة المؤسسة…';
  try{
   const sector=String(b.get('sector')||'restaurants');
   const data=await authClient.bootstrap(apiBase,{name:safeProfile.identity?.name||safeProfile.user?.name||'',organizationName:b.get('organizationName'),workspaceName:b.get('workspaceName'),sector});
   const workspaces=Array.isArray(data?.workspaces)?data.workspaces:[];
   const workspace=workspaces[0]||data?.workspace;
   if(!workspace)throw new Error('لم يتم إنشاء مساحة العمل.');
   localStorage.setItem('ENJAZ_WORKSPACE_ID',workspace.id);
   sessionStorage.setItem('ENJAZ_WORKSPACES',JSON.stringify(workspaces.length?workspaces:[{...workspace,role:data.role||workspace.workspace_role||'owner'}]));
   sessionStorage.setItem('ENJAZ_ONBOARDING_SECTOR',sector);
   window.ENJAZ_WORKSPACE_ID=workspace.id;window.ENJAZ_ACCESS_TOKEN=authClient.token();
   let provisioningError='';
   try{await apiClient.provisionIndustryPack(workspace.id,authClient.token(),sector);}
   catch(error){provisioningError=error?.message||'تعذر تفعيل حزمة القطاع تلقائيًا.';console.warn('[ENJAZ_ONBOARDING_PROVISION]',error)}
   setAuthState('authenticated');clearGate();
   if(provisioningError)sessionStorage.setItem('ENJAZ_ONBOARDING_NOTICE',provisioningError);
   window.location.reload();
  }catch(err){
   btn.disabled=false;btn.textContent='إنشاء المؤسسة وتفعيل القطاع ←';
   const old=el.querySelector('.auth-error');old?.remove();
   el.querySelector('.auth-card')?.insertAdjacentHTML('beforeend',`<div class="auth-error" role="alert">${esc(err?.message||'تعذر إنشاء مساحة العمل.')}</div>`)
  }
 });
};

const renderForm=({error='' }={})=>{const el=form({error});el.querySelector('#auth-switch')?.addEventListener('click',()=>goAuth(!isSignup()));el.querySelector('#auth-form')?.addEventListener('submit',async e=>{e.preventDefault();const b=new FormData(e.currentTarget),btn=e.currentTarget.querySelector('button');btn.disabled=true;btn.textContent=isSignup()?'جارٍ إنشاء الحساب…':'جارٍ تسجيل الدخول…';try{if(isSignup())await authClient.signUp(b.get('email'),b.get('password'),b.get('name'));else await authClient.signIn(b.get('email'),b.get('password'));await recover()}catch(err){btn.disabled=false;btn.textContent=isSignup()?'إنشاء الحساب':'تسجيل الدخول';renderForm({error:err?.message||'تعذر إكمال العملية.'})}});return el};

async function recover(){try{const profile=await authClient.me(apiBase);if(!profile){authClient.signOut();setAuthState('public');window.location.href=location.origin+location.pathname;return}const memberships=Array.isArray(profile.workspaces)?profile.workspaces:[];if(!memberships.length){setAuthState('auth');await workspaceSetup(profile);return}const requested=q.get('workspaceId')||localStorage.getItem('ENJAZ_WORKSPACE_ID')||'';const selected=requested&&memberships.some(w=>String(w.id)===String(requested))?memberships.find(w=>String(w.id)===String(requested)):memberships[0];localStorage.setItem('ENJAZ_WORKSPACE_ID',selected.id);sessionStorage.setItem('ENJAZ_WORKSPACES',JSON.stringify(memberships));sessionStorage.setItem('ENJAZ_USER_PROFILE',JSON.stringify(profile));window.ENJAZ_WORKSPACE_ID=selected.id;window.ENJAZ_ACCESS_TOKEN=authClient.token();const enteredFromAuth=q.has('auth')||q.has('signup')||q.has('workspaceId');if(enteredFromAuth){const url=new URL(location.href);url.search='';history.replaceState({},'',url.toString())}setAuthState('authenticated');clearGate();window.dispatchEvent(new CustomEvent('enjaz:authenticated'));if(enteredFromAuth)window.location.reload();
}catch(err){setAuthState('error');const el=mount(`<div class="auth-shell"><div class="auth-card session-recovery"><div class="auth-brand"><span class="brand-mark">إ</span><div><strong>إنجاز</strong><small>ENJAZ · SESSION RECOVERY</small></div></div><div class="auth-copy"><div class="eyebrow">SESSION RECOVERY</div><h1>تعذر تحميل مساحة العمل</h1><p>لم نفقد حسابك. حاول استعادة الجلسة أو ابدأ من جديد.</p></div><div class="auth-error" role="alert">${esc(err?.message||'تعذر قراءة جلسة المستخدم.')}</div><div class="auth-recovery-actions"><button class="primary" id="retry-session" type="button">إعادة المحاولة</button><button class="ghost" id="reset-session" type="button">إعادة ضبط الجلسة</button></div></div></div>`);el.querySelector('#retry-session')?.addEventListener('click',()=>location.reload());el.querySelector('#reset-session')?.addEventListener('click',()=>{authClient.signOut();location.href=location.origin+location.pathname})}}

if(q.has('auth')){root?.classList.add('is-auth-locked');setAuthState('auth');renderForm()}else if(authClient.token()){recover()}else{window.__ENJAZ_PUBLIC_SHOWN__=true;setAuthState('public')}
