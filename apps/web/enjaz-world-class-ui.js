/* ENJAZ — enterprise interaction polish. No data replacement. */
function wcOpenCommand(){document.querySelector('[data-command-open]')?.click()||document.querySelector('.enjaz-command input')?.focus()}
function wcBind(){const search=document.querySelector('.top-search');if(search&&!search.dataset.wcBound){search.dataset.wcBound='1';search.addEventListener('click',wcOpenCommand);search.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();wcOpenCommand()}})}
const input=document.querySelector('.top-search input');if(input)input.setAttribute('tabindex','-1');
const title=document.querySelector('#content .pagehead h1');if(title){let crumb=document.querySelector('#content .wc-breadcrumb');if(!crumb){crumb=document.createElement('div');crumb.className='wc-breadcrumb';crumb.innerHTML='<span>إنجاز</span><b>›</b><strong></strong>';title.closest('.pagehead')?.before(crumb)}crumb.querySelector('strong').textContent=title.textContent}}
const wcObserver=new MutationObserver(wcBind);wcObserver.observe(document.body,{childList:true,subtree:true});wcBind();
