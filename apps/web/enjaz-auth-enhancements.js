import {authClient} from './auth-client.js';

const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
let lastEmail='';
function enhance(){
  const gate=document.getElementById('auth-gate');
  if(!gate)return;
  const heading=gate.querySelector('h1');
  if(heading?.textContent?.includes('تحقق من بريدك الإلكتروني')&&!gate.querySelector('#resend-confirmation')){
    const strong=gate.querySelector('.auth-copy strong');
    lastEmail=strong?.textContent?.trim()||sessionStorage.getItem('ENJAZ_PENDING_EMAIL')||lastEmail;
    const button=document.createElement('button');
    button.id='resend-confirmation';button.className='ghost';button.type='button';button.textContent='إعادة إرسال رسالة التأكيد';button.style.width='100%';button.style.marginTop='10px';
    gate.querySelector('#go-login')?.insertAdjacentElement('beforebegin',button);
    button.onclick=async()=>{button.disabled=true;button.textContent='جارٍ الإرسال…';try{await authClient.resendConfirmation(lastEmail);button.textContent='تم إرسال الرسالة من جديد';}catch(err){button.disabled=false;button.textContent='إعادة إرسال رسالة التأكيد';const card=gate.querySelector('.auth-card');card?.insertAdjacentHTML('beforeend',`<div class="auth-error">${esc(err.message)}</div>`)}};
  }
}
new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
enhance();
