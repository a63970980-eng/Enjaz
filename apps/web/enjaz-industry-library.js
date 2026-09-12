import {apiClient} from './api-client.js';

const workspace=()=>window.ENJAZ_WORKSPACE_ID||'';
const token=()=>window.ENJAZ_ACCESS_TOKEN||'';
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const navLabel='مكتبة الموظفين';
let bound=false;

async function renderLibrary(){
 const content=document.getElementById('content');if(!content)return;
 document.querySelectorAll('.enjaz-nav button').forEach(x=>x.classList.remove('active'));
 document.querySelector('[data-enjaz-library]')?.classList.add('active');
 content.innerHTML='<section class="pagehead"><div><div class="eyebrow">READY WORKFORCE CATALOG</div><h1>مكتبة الموظفين الجاهزين</h1><p>اختر قطاع مؤسستك ثم فعّل حزمة قوة عمل جاهزة. الموظفون الذين يتم تفعيلهم يصبحون أصولًا تشغيلية حقيقية داخل مساحة العمل.</p></div></section><div class="panel"><div class="e360-loading">جارٍ تحميل الكتالوج…</div></div>';
 try{
  const result=await apiClient.industryPacks(workspace(),token());const packs=Array.isArray(result.data)?result.data:[];
  content.innerHTML=`<section class="pagehead"><div><div class="eyebrow">READY WORKFORCE CATALOG</div><h1>${navLabel}</h1><p>قوة عمل جاهزة حسب القطاع: مطاعم، مستشفيات، فنادق، شركات، وجهات حكومية. لا تحتاج إلى بناء موظف من الصفر.</p></div><button type="button" class="ghost" data-library-refresh>تحديث</button></section><div class="employee-grid">${packs.map(pack=>`<article class="employee-card"><div class="employee-card-head"><span class="avatar avatar-lg">${esc(pack.label?.charAt(0)||'م')}</span><div><h3>${esc(pack.label)}</h3><p>${esc(pack.id)}</p></div><span class="dot-status"></span></div><div class="employee-tags"><span>${Number(pack.roles||0)} أدوار جاهزة</span><span>${Number(pack.departments||0)} أقسام</span></div><div class="employee-metrics"><div><b>${Number(pack.roles||0)}</b><small>أدوار</small></div><div><b>${Number(pack.departments||0)}</b><small>أقسام</small></div><div><b>جاهز</b><small>System Catalog</small></div></div><button type="button" class="primary" data-provision-pack="${esc(pack.id)}">تجهيز هذا القطاع</button></article>`).join('')||'<div class="empty"><h2>لا توجد حزم جاهزة</h2><p>تحقق من اتصال خدمة الكتالوج.</p></div>'}</div>`;
  content.querySelector('[data-library-refresh]')?.addEventListener('click',renderLibrary);
  content.querySelectorAll('[data-provision-pack]').forEach(button=>button.addEventListener('click',async()=>{
   const pack=button.dataset.provisionPack;button.disabled=true;button.textContent='جارٍ التجهيز…';
   try{const result=await apiClient.provisionIndustryPack(workspace(),token(),pack);const d=result.data||{};button.textContent=d.created?`تم إنشاء ${d.employees||0} موظف`:`القطاع مفعّل (${d.employees||0})`;button.classList.remove('primary');button.classList.add('ghost');}
   catch(error){button.disabled=false;button.textContent='إعادة المحاولة';alert(error.message||'تعذر تجهيز القطاع');}
  }));
 }catch(error){content.innerHTML=`<section class="pagehead"><div><div class="eyebrow">READY WORKFORCE CATALOG</div><h1>${navLabel}</h1></div></section><div class="panel"><div class="error">${esc(error.message||'تعذر تحميل الكتالوج')}</div><button type="button" class="primary" data-library-retry>إعادة المحاولة</button></div>`;content.querySelector('[data-library-retry]')?.addEventListener('click',renderLibrary);}
}

function installNav(){
 const nav=document.querySelector('.enjaz-nav');if(!nav||nav.querySelector('[data-enjaz-library]'))return;
 const button=document.createElement('button');button.type='button';button.dataset.enjazLibrary='1';button.innerHTML='<i>▦</i><span>مكتبة الموظفين</span>';button.addEventListener('click',renderLibrary);
 const employees=nav.querySelector('[data-nav="employees"]');employees?.insertAdjacentElement('afterend',button);
}
function boot(){if(bound)return;bound=true;installNav();const observer=new MutationObserver(installNav);observer.observe(document.body,{subtree:true,childList:true});}
window.ENJAZ_OPEN_WORKFORCE_LIBRARY=renderLibrary;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
