import {apiClient} from './api-client.js';

const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const token=()=>window.ENJAZ_ACCESS_TOKEN||'';
const workspace=()=>window.ENJAZ_WORKSPACE_ID||'';
let bound=false;
let state={open:false,loading:false,items:[],error:''};

function mount(){
 if(document.getElementById('enjaz-notifications'))return document.getElementById('enjaz-notifications');
 const el=document.createElement('div');el.id='enjaz-notifications';el.className='enjaz-notifications';
 el.innerHTML=`<div class="enjaz-notifications-backdrop"></div><section class="enjaz-notifications-panel" role="dialog" aria-modal="false" aria-labelledby="enjaz-notifications-title"><header><div><span class="eyebrow">ENJAZ / ACTIVITY</span><h2 id="enjaz-notifications-title">مركز التنبيهات</h2></div><button type="button" class="enjaz-notifications-close" aria-label="إغلاق">×</button></header><div class="enjaz-notifications-body" id="enjaz-notifications-body"></div></section>`;
 document.body.appendChild(el);
 el.querySelector('.enjaz-notifications-backdrop').onclick=close;
 el.querySelector('.enjaz-notifications-close').onclick=close;
 return el;
}
function close(){state.open=false;mount().classList.remove('open')}
async function open(){state.open=true;const el=mount();el.classList.add('open');await load();render()}
async function load(){if(!token()||!workspace()){state.items=[];return}state.loading=true;state.error='';render();try{const [approvals,audit,tasks]=await Promise.all([apiClient.approvals(workspace(),token()),apiClient.audit(workspace(),token()),apiClient.tasks(workspace(),token())]);const approvalsList=(approvals.data||[]).filter(x=>x.status==='pending').map(x=>({kind:'approval',title:'موافقة بانتظار قرارك',meta:x.title||x.description||'طلب اعتماد',date:x.created_at,id:x.id}));const auditList=(audit.data||[]).slice(0,10).map(x=>({kind:'activity',title:x.action||x.event_type||'نشاط تشغيلي',meta:x.entity_type||'سجل تدقيق',date:x.created_at,id:x.id}));const taskList=(tasks.data||[]).filter(x=>['running','in_progress','processing'].includes(String(x.status||'').toLowerCase())).slice(0,6).map(x=>({kind:'task',title:'مهمة قيد التنفيذ',meta:x.title||'مهمة',date:x.updated_at||x.created_at,id:x.id}));state.items=[...approvalsList,...taskList,...auditList].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,15)}catch(e){state.error=e?.message||'تعذر تحميل التنبيهات.'}finally{state.loading=false;render()}}
function render(){const body=document.getElementById('enjaz-notifications-body');if(!body)return;if(state.loading){body.innerHTML='<div class="notification-state">جارٍ تحميل النشاط…</div>';return}if(state.error){body.innerHTML=`<div class="notification-state error">${esc(state.error)}<button type="button" class="ghost" id="notification-retry">إعادة المحاولة</button></div>`;body.querySelector('#notification-retry').onclick=load;return}if(!state.items.length){body.innerHTML='<div class="notification-state"><strong>كل شيء هادئ.</strong><span>ستظهر هنا الموافقات والنشاطات التشغيلية المهمة.</span></div>';return}body.innerHTML=state.items.map(x=>`<article class="notification-item"><span class="notification-icon">${x.kind==='approval'?'◇':x.kind==='task'?'✓':'•'}</span><div><strong>${esc(x.title)}</strong><small>${esc(x.meta)} · ${timeAgo(x.date)}</small></div></article>`).join('')}
function timeAgo(v){if(!v)return'—';const m=Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000));if(m<1)return'الآن';if(m<60)return`منذ ${m} د`;const h=Math.floor(m/60);if(h<24)return`منذ ${h} س`;return`منذ ${Math.floor(h/24)} ي`}
function wire(){if(bound)return;const button=document.querySelector('.top-actions .icon-btn');if(!button)return;bound=true;button.dataset.notificationsBound='1';button.onclick=open;button.setAttribute('aria-label','مركز التنبيهات');button.title='مركز التنبيهات';mount()}
wire();new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
