/* Enjaz Workforce Entry Guard
 * The primary workforce action is the ready digital employee library.
 * Manual employee creation remains available only as a legacy implementation detail;
 * the product entry point always routes users to the ready employee library.
 */
const libraryButton=()=>document.querySelector('[data-enjaz-library]');

function openReadyLibrary(event){
  const target=event.target?.closest?.('[data-action="create-employee"], [data-workforce-library-entry]');
  if(!target)return;
  const library=libraryButton();
  if(!library)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  library.click();
}

function normalizeEntryButtons(){
  document.querySelectorAll('[data-action="create-employee"]').forEach(button=>{
    const needsUpdate=button.dataset.workforceLibraryEntry!=='1'||button.textContent!=='مكتبة الموظفين'||button.title!=='اختيار موظف رقمي جاهز من مكتبة إنجاز'||button.getAttribute('aria-label')!=='فتح مكتبة الموظفين الجاهزين';
    if(!needsUpdate)return;
    button.dataset.workforceLibraryEntry='1';
    button.textContent='مكتبة الموظفين';
    button.title='اختيار موظف رقمي جاهز من مكتبة إنجاز';
    button.setAttribute('aria-label','فتح مكتبة الموظفين الجاهزين');
  });
}

function boot(){
  document.addEventListener('click',openReadyLibrary,true);
  normalizeEntryButtons();
  new MutationObserver(normalizeEntryButtons).observe(document.body,{subtree:true,childList:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
