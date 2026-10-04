import {useEffect,useMemo,useState,startTransition} from 'react';
import {ViewTransition} from 'react';
import {
  ArrowLeft,ArrowUpLeft,Check,ChevronLeft,ChevronDown,Command,LockKeyhole,Menu,
  Network,Play,ShieldCheck,Sparkles,Workflow,Zap,Database,BrainCircuit,
  Bot,Users,Layers3,Route,FileCheck2,Building2,Activity,Globe2,Settings2
} from 'lucide-react';
import SpotlightCard from './components/ui/SpotlightCard';
import EnterpriseMarquee from './components/ui/EnterpriseMarquee';
import EnterpriseProductShowcase from './components/enterprise/EnterpriseProductShowcase';
import EnterpriseWorkforceCatalog from './components/enterprise/EnterpriseWorkforceCatalog';

const roles=[
  ['AI Manager','الأهداف والقرارات التشغيلية','MG','قرارات وأولويات'],
  ['AI Analyst','تحليل البيانات وتحويلها إلى قرارات','AN','بيانات ورؤى'],
  ['AI Operations Worker','تنفيذ الأعمال المتكررة ضمن الصلاحيات','OP','تشغيل وتنفيذ'],
  ['AI Coordinator','تنسيق العمل بين البشر والموظفين الرقميين','CO','تخطيط وتوجيه'],
  ['AI Customer Service Worker','خدمة العملاء وفق المعرفة والسياسات','CX','تجربة العميل'],
];
const sectors=[
  ['المطاعم','تشغيل الفروع والطلبات والمخزون والجودة','OPS'],
  ['المستشفيات','تنسيق العمليات والخدمات وسير الموافقات','CARE'],
  ['الفنادق','الضيافة والطلبات والتشغيل متعدد الأقسام','HOSP'],
  ['الشركات','العمليات الداخلية والمبيعات والمالية والتقنية','BIZ'],
  ['الجهات الحكومية','الخدمات والإجراءات والامتثال والتدقيق','GOV'],
];
const workforceDomains=[
  ['Operations','التشغيل والتنفيذ',Workflow],
  ['Data','التحليل والبيانات',Database],
  ['Customer','خدمة العملاء',Users],
  ['Finance','المالية والمشتريات',Activity],
  ['Technology','التقنية والأتمتة',Settings2],
  ['Governance','المخاطر والحوكمة',ShieldCheck]
];
const integrations=[
  ['OpenAI','AI','https://cdn.simpleicons.org/openai/0B8F66'],
  ['GitHub','DEV','https://cdn.simpleicons.org/github/173A2E'],
  ['Vercel','DEPLOY','https://cdn.simpleicons.org/vercel/173A2E'],
  ['Supabase','DATA','https://cdn.simpleicons.org/supabase/0B8F66'],
  ['n8n','AUTO','https://cdn.simpleicons.org/n8n/EA4B71'],
  ['MCP','TOOLS','https://cdn.simpleicons.org/modelcontextprotocol/6D28D9'],
  ['APIs','API','https://cdn.simpleicons.org/openapi/2563EB'],
  ['SQL','DB','https://cdn.simpleicons.org/postgresql/0E7490']
];

function SectionIntro({eyebrow,title,copy,dark=false}:{eyebrow:string;title:string;copy?:string;dark?:boolean}){
 return <div className={`max-w-3xl ${dark?'text-white':''}`}>
  <span className={`ejx-section-label ${dark?'ejx-section-label-dark':''}`}>{eyebrow}</span>
  <h2 className="mt-5 text-4xl font-semibold tracking-[-1.8px] md:text-6xl">{title}</h2>
  {copy&&<p className={`mt-5 max-w-2xl text-sm leading-8 ${dark?'text-emerald-50/60':'text-slate-500'}`}>{copy}</p>}
 </div>
}

function ProductPreview(){
 const [tab,setTab]=useState(0);
 const tabs=['مركز القيادة','القوى العاملة','سير العمل','الحوكمة'];
 const activity=[
  ['طلب جديد','AI Coordinator','يحلّل السياق ويجهّز خطة التنفيذ',Workflow],
  ['مراجعة مطلوبة','Human Reviewer','قرار بشري قبل الإجراء الحساس',ShieldCheck],
  ['سجل التدقيق','Governance Engine','كل خطوة موثقة وقابلة للتتبع',LockKeyhole]
 ];
 return <SpotlightCard className="relative mx-auto w-full max-w-[750px]">
  <div id="demo" className="relative w-full">
  <div className="absolute -inset-12 rounded-[70px] bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,.25),transparent_62%)] blur-3xl"/>
  <div className="relative rounded-[32px] border border-[#cbded5] bg-white p-2 shadow-[0_45px_120px_rgba(4,57,42,.18)] [transform:perspective(1600px)_rotateY(-2deg)_rotateX(1deg)]">
   <div className="flex h-11 items-center justify-between rounded-[23px] bg-[#f5f9f7] px-4 text-[9px] text-slate-400">
    <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="font-semibold tracking-[.18em] text-[#31584b]">ENJAZ OS</span></div>
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-bold text-emerald-700">PREVIEW</span>
   </div>
   <div className="grid min-h-[500px] md:grid-cols-[158px_1fr]">
    <div className="mb-3 flex gap-2 overflow-x-auto rounded-2xl border border-[#dce9e4] bg-white p-2 md:hidden">{tabs.map((t,i)=><button key={t} onClick={()=>startTransition(()=>setTab(i))} className={`shrink-0 rounded-xl px-3 py-2 text-[9px] font-semibold ${tab===i?'bg-[#063d2d] text-emerald-100':'text-slate-500'}`}>{t}</button>)}</div>
    <aside className="hidden rounded-br-[25px] bg-[#052b20] p-3 text-white md:block">
     <div className="mb-7 flex items-center gap-2 px-2 pt-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400 text-[#052b20]"><Command size={14}/></span><b className="text-sm">إنجاز</b></div>
     {tabs.map((t,i)=><button key={t} onClick={()=>startTransition(()=>setTab(i))} className={`mb-1 w-full rounded-xl px-3 py-3 text-right text-[10px] transition ${tab===i?'bg-emerald-400/15 text-emerald-200':'text-white/45 hover:bg-white/5 hover:text-white'}`}>{t}</button>)}
     <div className="mt-20 rounded-xl border border-white/10 bg-white/[.04] p-3"><span className="text-[8px] text-emerald-300">CONTROL PLANE</span><b className="mt-2 block text-[10px]">Governed by design</b><span className="mt-1 block text-[8px] text-white/35">Policy · Approval · Audit</span></div>
    </aside>
    <main className="bg-[#fbfdfc] p-5 md:p-7">
     <div className="flex items-start justify-between">
      <div><span className="text-[9px] font-bold tracking-[.18em] text-emerald-700">INTERACTIVE PRODUCT PREVIEW</span><h3 className="mt-2 text-xl font-semibold tracking-tight text-[#08251b]">{tabs[tab]}</h3></div>
      <span className="hidden rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[8px] text-slate-500 sm:block">Workspace / Operations</span>
     </div>
     <ViewTransition><div key={tab}>
      {tab===0&&<div className="mt-7 space-y-3">
       <div className="grid gap-2 sm:grid-cols-3">
        {[
         ['CONTEXT','Operational request','قطاع · سياسة · صلاحية'],
         ['DECISION','AI Coordinator','Plan ready'],
         ['CONTROL','Human approval','1 checkpoint']
        ].map((x,i)=><div key={x[0]} className="rounded-2xl border border-emerald-100 bg-white p-3"><span className="text-[7px] font-bold tracking-[.16em] text-slate-400">{x[0]}</span><b className="mt-2 block text-[10px] text-[#173a2e]">{x[1]}</b><span className={`mt-1 block text-[8px] ${i===2?'text-amber-600':'text-emerald-700'}`}>{x[2]}</span></div>)}
       </div>
       <div className="rounded-2xl border border-emerald-100 bg-[#f2faf6] p-4"><span className="text-[8px] font-bold tracking-[.16em] text-emerald-700">ILLUSTRATIVE SCENARIO · PREVIEW</span><p className="mt-2 text-[10px] leading-6 text-[#31584b]">طلب تشغيلي يدخل المنصة → الموظف الرقمي يفهم السياق → يبني خطة → يطلب الموافقة عند الحاجة → ينفذ ويسجل النتيجة.</p></div>
       {activity.map(([a,b,c,Icon],i)=><div key={a} className="group flex items-center gap-3 rounded-2xl border border-[#dce9e4] bg-white p-4 shadow-[0_8px_24px_rgba(4,57,42,.035)] transition hover:-translate-y-0.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{<Icon size={17}/>}</span><div className="min-w-0 flex-1"><b className="block text-xs text-[#173a2e]">{a}</b><span className="mt-1 block truncate text-[9px] text-slate-400">{b} · {c}</span></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] text-emerald-700">{i===1?'REVIEW':'PREVIEW'}</span></div>)}
      </div>}
      {tab===1&&<div className="mt-7 grid gap-3 sm:grid-cols-2">{roles.slice(0,4).map(r=><div key={r[0]} className="rounded-2xl border border-[#dce9e4] bg-white p-4"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#063d2d] text-[8px] font-bold text-emerald-200">{r[2]}</span><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,.5)]"/></div><b className="mt-5 block text-[10px] text-[#173a2e]">{r[0]}</b><p className="mt-1 text-[9px] leading-5 text-slate-400">{r[1]}</p></div>)}</div>}
      {tab===2&&<div className="mt-10"><div className="relative h-28"><div className="absolute left-5 right-5 top-6 h-px bg-[#d7e6e0]"/><div className="relative grid grid-cols-4">{['الهدف','الخطة','الموافقة','التنفيذ'].map((x,i)=><div key={x} className="text-center"><span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl border ${i<3?'border-emerald-200 bg-emerald-50 text-emerald-700':'border-slate-200 bg-white text-slate-400'}`}>{i<3?<Check size={17}/>:<Play size={15}/>}</span><b className="mt-3 block text-[9px] text-slate-500">{x}</b></div>)}</div></div><div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"><span className="text-[8px] font-bold tracking-[.16em] text-emerald-700">AUTOMATION PATH</span><p className="mt-2 text-[11px] leading-6 text-[#31584b]">يتحرك العمل تلقائيًا بين المراحل مع توقفات واضحة عند نقاط القرار البشري.</p></div></div>}
      {tab===3&&<div className="mt-7 grid gap-3">{['Identity & Permissions','Policy Engine','Human Approval','Audit Trail'].map((x,i)=><div key={x} className="flex items-center gap-3 rounded-2xl border border-[#dce9e4] bg-white p-4"><ShieldCheck size={17} className="text-emerald-700"/><span className="text-[10px] font-medium text-slate-600">{x}</span><span className="mr-auto rounded-full bg-emerald-50 px-2 py-1 text-[8px] text-emerald-700">{i===2?'REVIEW':'PASS'}</span></div>)}</div>}
     </div></ViewTransition>
    </main>
   </div>
  </div>
  <div className="absolute -bottom-8 -left-5 hidden w-56 rounded-2xl border border-[#d6e5df] bg-white p-4 shadow-[0_20px_60px_rgba(4,57,42,.14)] md:block"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><ShieldCheck size={13}/></span><div><b className="block text-[9px] text-slate-700">GOVERNED BY DESIGN</b><span className="text-[8px] text-slate-400">Policy · Approval · Audit</span></div></div></div>
  <div className="absolute -right-4 -top-5 hidden w-48 rounded-2xl border border-emerald-300/10 bg-[#063d2d] p-4 text-white shadow-2xl md:block"><span className="text-[8px] tracking-[.16em] text-emerald-300">DIGITAL WORKER</span><b className="mt-2 block text-sm">AI Coordinator</b><span className="mt-1 block text-[9px] text-white/45">Planning · Routing · Approval</span></div>
  </div>
 </SpotlightCard>
}

function WorkforceVisual(){
 const nodes=['OPS','DATA','CX','FIN','AI','GOV'];
 return <div className="relative mx-auto aspect-square w-full max-w-[560px]">
  <div className="absolute inset-[7%] rounded-full border border-emerald-200/10 [transform:rotateX(64deg)_rotateZ(-12deg)]"/>
  <div className="absolute inset-[18%] rounded-full border border-emerald-200/15 [transform:rotateX(64deg)_rotateZ(18deg)]"/>
  <div className="absolute inset-[31%] rounded-full border border-emerald-200/20 [transform:rotateX(64deg)_rotateZ(-25deg)]"/>
  <div className="absolute inset-[34%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#24c995,#063d2d_72%)] shadow-[0_0_120px_rgba(24,185,129,.22)]"/>
  <div className="absolute inset-0 grid place-items-center text-center"><div><b className="block text-6xl tracking-[-3px]">48</b><span className="text-[9px] tracking-[.24em] text-emerald-200">GLOBAL DIGITAL ROLES</span></div></div>
  {nodes.map((n,i)=><span key={n} className={`absolute grid h-12 w-12 place-items-center rounded-xl border border-emerald-200/15 bg-white/[.07] text-[8px] font-semibold text-emerald-100 backdrop-blur ${['left-[9%] top-[45%]','right-[12%] top-[18%]','right-[7%] bottom-[27%]','left-[18%] bottom-[12%]','left-[8%] top-[18%]','right-[32%] bottom-[3%]'][i]}`}>{n}</span>)}
 </div>
}

function EnterpriseSuite(){
 const items=[['01','Command Center','طبقة القيادة','رؤية موحّدة للأهداف والطلبات والقرارات',Network],['02','Digital Workforce','القوى العاملة','48 دورًا رقميًا عالميًا ضمن سياق المؤسسة وصلاحياتها',Bot],['03','Workflow Engine','الأتمتة','مسارات منطقية قابلة للتنفيذ والمراجعة',Workflow],['04','Knowledge Layer','المعرفة','السياق والسياسات والمعرفة داخل مسار التنفيذ',BrainCircuit],['05','Integration Fabric','التكامل','الأدوات والأنظمة داخل مسار العمل',Network],['06','Governance Plane','الحوكمة','صلاحيات وموافقات وسياسات وأثر تدقيقي',ShieldCheck]];
 return <div className="mt-12 grid gap-px overflow-hidden rounded-[32px] border border-emerald-900/10 bg-[#d9e9e2] shadow-[0_30px_100px_rgba(3,27,20,.07)] md:grid-cols-2 lg:grid-cols-3">{items.map(([n,name,kicker,desc,I])=>{const Icon=I;return <article key={name as string} className="ejx-suite-card group relative min-h-[275px] overflow-hidden bg-white p-7 transition hover:-translate-y-1 hover:shadow-2xl"><div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.18em] text-emerald-700">{n as string}</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f0f8f4] text-emerald-700 transition group-hover:bg-[#063d2d] group-hover:text-emerald-200"><Icon size={17}/></span></div><span className="mt-9 block text-[8px] font-bold tracking-[.16em] text-slate-400">{kicker as string}</span><h3 className="mt-2 text-xl font-semibold text-[#08251b]">{name as string}</h3><p className="mt-3 text-[10px] leading-6 text-slate-400">{desc as string}</p><div className="absolute bottom-0 right-0 h-1 w-0 bg-emerald-500 transition-all duration-500 group-hover:w-full"/></article>})}</div>
}
function EnterpriseLoop(){
 const steps=[['01','Signal','الطلب أو الحدث'],['02','Context','السياق والمعرفة'],['03','Decision','القرار والخطة'],['04','Action','التنفيذ المنضبط'],['05','Evidence','الأثر والتدقيق']];
 return <div className="mt-12 grid overflow-hidden rounded-[30px] border border-emerald-900/10 bg-white shadow-[0_25px_80px_rgba(3,27,20,.06)] md:grid-cols-5">{steps.map(([n,a,b],i)=><div key={n} className="ejx-loop-step relative border-b border-emerald-900/10 p-6 last:border-0 md:border-b-0 md:border-l md:last:border-l-0"><span className="text-[9px] font-bold tracking-[.16em] text-emerald-700">{n}</span><div className="mt-12 text-lg font-semibold text-[#173a2e]">{a}</div><p className="mt-2 text-[9px] leading-5 text-slate-400">{b}</p>{i<4&&<ArrowUpLeft className="absolute left-5 top-1/2 hidden -translate-y-1/2 text-emerald-300 md:block" size={15}/>}</div>)}</div>
}
function CapabilityMatrix(){
 const [active,setActive]=useState(0);
 const capabilities=[
  ['Command Center','رؤية موحّدة للعمل والمهام والقرارات','الأهداف · السياق · الأولويات',Network],
  ['Digital Workforce','موظفون رقميون يعملون ضمن أدوار وصلاحيات','المهارات · المعرفة · الأدوات',Bot],
  ['Workflow Engine','تحويل الهدف إلى مسار قابل للتنفيذ','الخطة · التوجيه · التنفيذ',Route],
  ['Governance','ضبط الاستقلالية داخل حدود المؤسسة','السياسات · الموافقة · التدقيق',ShieldCheck]
 ];
 const x=capabilities[active];
 const Icon=x[3];
 return <div className="mt-12 grid overflow-hidden rounded-[30px] border border-emerald-900/10 bg-white shadow-[0_30px_90px_rgba(4,57,42,.07)] lg:grid-cols-[.8fr_1.2fr]">
  <div className="border-b border-emerald-900/10 bg-[#f4faf7] p-3 lg:border-b-0 lg:border-l">
   {capabilities.map(([name,desc,meta,I],i)=><button key={name as string} onClick={()=>setActive(i)} className={`ejx-capability-tab ${active===i?'is-active':''}`}><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">{<I size={17}/>}</span><span className="min-w-0 text-right"><b className="block text-xs">{name as string}</b><span className="mt-1 block text-[9px] text-slate-400">{desc as string}</span></span><ChevronLeft size={15} className="mr-auto text-slate-300"/></button>)}
  </div>
  <div className="relative min-h-[360px] overflow-hidden bg-[#052b20] p-7 text-white md:p-10">
   <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-emerald-200/10 shadow-[0_0_0_50px_rgba(126,226,188,.025),0_0_0_100px_rgba(126,226,188,.02)]"/>
   <div className="relative z-10"><span className="text-[9px] font-bold tracking-[.18em] text-emerald-300">ENJAZ CONTROL PLANE</span><h3 className="mt-4 text-3xl font-semibold">{x[0] as string}</h3><p className="mt-3 max-w-lg text-sm leading-7 text-white/55">{x[1] as string}</p><div className="mt-9 grid gap-2 sm:grid-cols-3">{(x[2] as string).split(' · ').map((m:string,i:number)=><div key={m} className="rounded-2xl border border-white/10 bg-white/[.045] p-4"><span className="text-[8px] text-emerald-300">0{i+1}</span><b className="mt-5 block text-[10px]">{m}</b></div>)}</div></div>
  </div>
 </div>
}

function AuthBridge(){
 useEffect(()=>{document.documentElement.classList.add('enjaz-auth-route');let host=document.querySelector('.enjaz-root');if(!host){host=document.createElement('div');host.className='enjaz-root';document.body.appendChild(host)}import('../auth-gate-v2.js').catch(error=>console.error('[ENJAZ_AUTH_BOOT]',error));return()=>{document.documentElement.classList.remove('enjaz-auth-route');host?.remove()};},[]);
 return null;
}

function App(){
 const [menuOpen,setMenuOpen]=useState(false);
 const [openSector,setOpenSector]=useState<number|null>(null);
 const nav=useMemo(()=>[['المنصة','#platform'],['الحزمة','#suite'],['القوى العاملة','#workforce'],['كيف تعمل','#how'],['القطاعات','#sectors'],['الحوكمة','#governance']],[]);
 if(new URLSearchParams(window.location.search).has('auth'))return <AuthBridge/>;
 return <div dir="rtl" className="public-platform min-h-screen overflow-hidden bg-[#f7fbf9] text-[#08251b]">
  <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-white/80 backdrop-blur-xl">
   <div className="mx-auto flex h-[74px] max-w-[1280px] items-center justify-between px-4 sm:px-6">
    <a href="#" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-gradient-to-br from-[#0b9568] to-[#063d2d] text-white shadow-[0_10px_30px_rgba(7,132,94,.2)]"><Command size={18}/></span><span><b className="block text-[18px] tracking-tight">إنجاز</b><small className="text-[8px] font-semibold tracking-[.24em] text-emerald-700">ENJAZ</small></span></a>
    <nav className="hidden items-center gap-8 text-[12px] font-medium text-slate-600 lg:flex">{nav.map(x=><a key={x[0]} href={x[1]} className="transition hover:text-emerald-700">{x[0]}</a>)}</nav>
    <div className="flex items-center gap-2"><a href="/?auth=1" className="hidden rounded-xl px-3 py-2 text-xs text-slate-600 sm:block">تسجيل الدخول</a><a href="/?auth=1&signup=1" className="rounded-xl bg-[#063d2d] px-4 py-2.5 text-[11px] font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-[#087c58]">ابدأ مع إنجاز</a><button onClick={()=>setMenuOpen(v=>!v)} aria-label="فتح القائمة" aria-expanded={menuOpen} className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-900/10 lg:hidden"><Menu size={18}/></button></div>
   </div>
   {menuOpen&&<div className="border-t border-emerald-900/10 bg-white px-5 py-4 lg:hidden">{nav.map(x=><a key={x[0]} href={x[1]} onClick={()=>setMenuOpen(false)} className="block border-b border-slate-100 py-3 text-sm text-slate-600 last:border-0">{x[0]}</a>)}</div>}
  </header>
  <main>
   <section className="relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(16,185,129,.13),transparent_28%),radial-gradient(circle_at_8%_75%,rgba(6,61,45,.06),transparent_24%)]"/>
    <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[.88fr_1.12fr] lg:gap-16 lg:pb-28 lg:pt-24">
     <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/10 bg-white px-3 py-2 text-[9px] font-bold tracking-[.15em] text-emerald-800 shadow-sm"><Zap size={11}/> INTELLIGENT OPERATING PLATFORM</div>
      <h1 className="mt-6 max-w-[670px] text-[clamp(45px,6.4vw,86px)] font-semibold leading-[1.02] tracking-[-3.5px]">قوة عمل رقمية.<br/><span className="bg-gradient-to-l from-[#087c58] via-[#15a875] to-[#063d2d] bg-clip-text text-transparent">مؤسسة تتحرك بذكاء.</span></h1>
      <p className="mt-7 max-w-[600px] text-[15px] leading-8 text-slate-600 sm:text-[17px]">إنجاز هي منصة تشغيل مؤسسية تجمع الموظفين الرقميين والعمليات وسير العمل والحوكمة في مكان واحد — لتحويل الطلب إلى قرار، ثم تنفيذ، ثم أثر قابل للتدقيق.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="/?auth=1&signup=1" className="group flex items-center justify-center gap-2 rounded-2xl bg-[#063d2d] px-6 py-4 text-xs font-semibold text-white shadow-xl shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:shadow-2xl">أنشئ مساحة مؤسستك<ArrowLeft size={16} className="transition group-hover:-translate-x-1"/></a><a href="#demo" className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-900/10 bg-white px-6 py-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><Play size={14}/> شاهد المنتج</a></div>
      <div className="mt-7 grid max-w-[600px] grid-cols-3 gap-2"><span className="rounded-xl border border-emerald-900/10 bg-white px-3 py-3 text-[9px] text-slate-500"><b className="block text-[#173a2e]">01</b>سياق موحّد</span><span className="rounded-xl border border-emerald-900/10 bg-white px-3 py-3 text-[9px] text-slate-500"><b className="block text-[#173a2e]">02</b>تنفيذ مضبوط</span><span className="rounded-xl border border-emerald-900/10 bg-white px-3 py-3 text-[9px] text-slate-500"><b className="block text-[#173a2e]">03</b>أثر قابل للتدقيق</span></div>
     </div>
     <ProductPreview/>
    </div>
   </section>
   <section className="border-y border-emerald-950/5 bg-white"><div className="mx-auto flex max-w-[1280px] items-center gap-8 overflow-hidden px-5 py-5"><span className="hidden shrink-0 text-[9px] font-bold tracking-[.18em] text-slate-400 lg:block">CONNECTED TOOLS</span><EnterpriseMarquee duration={28} className="min-w-0"><div className="flex min-w-max gap-3">{integrations.map(([name,type,icon],i)=><span key={i} className="flex items-center gap-2 rounded-full border border-emerald-900/10 bg-[#f7fbf9] px-4 py-2.5 shadow-sm"><span className="grid h-6 w-6 place-items-center rounded-lg bg-white shadow-sm"><img src={icon} alt={name} width="15" height="15" loading="lazy" decoding="async"/></span><b className="text-[9px] text-slate-600">{name}</b><span className="text-[7px] font-semibold tracking-[.12em] text-slate-300">{type}</span></span>)}</div></EnterpriseMarquee></div></section>
   <section className="border-b border-emerald-950/5 bg-white"><div className="mx-auto max-w-[1280px] px-5 py-7 md:py-9"><div className="grid overflow-hidden rounded-[22px] border border-emerald-900/10 bg-[#f7fbf9] md:grid-cols-4">{[
    ['AI-NATIVE','ذكاء اصطناعي داخل مسار العمل','من الفهم إلى القرار والتنفيذ.'],
    ['HUMAN-GOVERNED','قرار بشري عند الحاجة','الموافقة والسياسات جزء من المسار.'],
    ['CROSS-INDUSTRY','سياق يتكيّف مع المؤسسة','نفس القوة، معرفة وسياسات مختلفة.'],
    ['AUDIT-READY','أثر تشغيلي واضح','كل خطوة يمكن تتبعها ومراجعتها.']
   ].map(([a,b,c],i)=><div key={a} className={`ejx-proof-cell p-5 md:p-6 ${i?'border-t md:border-r md:border-t-0':''}`}><span className="text-[8px] font-bold tracking-[.16em] text-emerald-700">{a}</span><b className="mt-2 block text-[12px] text-[#173a2e]">{b}</b><span className="mt-1 block text-[9px] leading-5 text-slate-400">{c}</span></div>)}</div></div></section>
   <section id="platform" className="mx-auto max-w-[1280px] px-5 py-24 md:py-32"><SectionIntro eyebrow="THE ENJAZ PLATFORM" title={<>المنتج أمامك.<br/><span className="text-emerald-700">والعمل يتحرك أمامك.</span></>} copy="بدل سرد قائمة خصائص، نعرض طبقة التشغيل كما ستفهمها المؤسسة: قيادة، قوة عمل رقمية، سير عمل، وحوكمة — في تجربة واحدة."/><div className="mt-12"><EnterpriseProductShowcase/></div></section>
   <section id="suite" className="border-y border-emerald-950/5 bg-[#f3f8f5]"><div className="mx-auto max-w-[1280px] px-5 py-24 md:py-32"><SectionIntro eyebrow="DIGITAL WORKFORCE" title={<>48 دورًا عالميًا.<br/>اختر التخصص، لا النسخة.</>} copy="الموظف الرقمي نفسه يمكنه العمل عبر القطاعات. التخصص يأتي من سياق الصناعة والمهارات والمعرفة والأدوات والسياسات والصلاحيات."/><div className="mt-10"><EnterpriseWorkforceCatalog/></div></div></section>
   <section id="workforce" className="relative overflow-hidden bg-[#03271d] text-white"><div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(126,226,188,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(126,226,188,.035)_1px,transparent_1px)] [background-size:56px_56px]"/><div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-5 py-24 md:py-32 lg:grid-cols-[.82fr_1.18fr]"><div><SectionIntro dark eyebrow="DIGITAL WORKFORCE" title={<>48 موظفًا رقميًا.<br/><span className="text-emerald-300">فريق واحد يتكيّف.</span></>} copy="لا ننسخ الموظف لكل قطاع. الموظف نفسه يعمل عبر القطاعات، ويتخصص عبر سياق الصناعة والمهارات والمعرفة والأدوات والسياسات والصلاحيات."/><div className="mt-8 grid gap-2 sm:grid-cols-2">{roles.map(r=><div key={r[0]} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 transition hover:border-emerald-300/20 hover:bg-white/[.07]"><div className="flex items-center justify-between"><b className="text-[10px]">{r[0]}</b><span className="text-[8px] text-emerald-300">{r[2]}</span></div><p className="mt-1 text-[9px] leading-5 text-white/40">{r[1]}</p></div>)}</div><div className="mt-6 rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center justify-between"><span className="text-[8px] font-bold tracking-[.16em] text-emerald-300">48-ROLE CATALOG</span><span className="text-[8px] text-white/35">GLOBAL · CROSS-INDUSTRY</span></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{workforceDomains.map(([a,b,I])=>{const Icon=I;return <div key={a as string} className="rounded-xl bg-white/[.04] px-3 py-3"><Icon size={13} className="text-emerald-300"/><b className="mt-2 block text-[9px]">{a as string}</b><span className="mt-1 block text-[8px] text-white/35">{b as string}</span></div>})}</div></div></div><WorkforceVisual/></div></section>
   <section id="how" className="mx-auto max-w-[1280px] px-5 py-24 md:py-32"><SectionIntro eyebrow="HOW ENJAZ WORKS" title={<>من النية إلى الإنجاز.</>} copy="مسار تشغيلي واضح يحدد أين يعمل الذكاء، وأين يحتاج العمل إلى قرار بشري."/><div className="mt-12 grid gap-0 overflow-hidden rounded-[28px] border border-emerald-900/10 bg-white shadow-[0_25px_70px_rgba(4,57,42,.06)] md:grid-cols-5">{[['01','حدّد الهدف','ما الذي تريد إنجازه؟'],['02','خطّط','حوّل الهدف إلى خطوات.'],['03','وافق','أوقف ما يحتاج قرارًا بشريًا.'],['04','نفّذ','دع الموظفين الرقميين يعملون.'],['05','تتبّع','كل أثر يبقى واضحًا.']].map(([n,t,d])=><div key={n} className="group relative min-h-[190px] border-b border-emerald-900/10 p-6 last:border-0 md:border-b-0 md:border-l md:last:border-l-0"><span className="text-[9px] font-bold text-emerald-700">{n}</span><b className="mt-12 block text-base">{t}</b><p className="mt-2 text-[9px] leading-5 text-slate-400">{d}</p><div className="absolute right-0 top-0 h-1 w-0 bg-emerald-500 transition-all group-hover:w-full"/></div>)}</div></section>
   <section id="sectors" className="border-y border-emerald-950/5 bg-[#eef6f2]"><div className="mx-auto max-w-[1280px] px-5 py-24 md:py-28"><SectionIntro eyebrow="INDUSTRY CONTEXT" title={<>نفس المنصة.<br/>سياق مختلف لكل مؤسسة.</>} copy="السياق الصناعي يغيّر المعرفة والسياسات والأدوات وطريقة العمل — دون إنشاء نسخة منفصلة من الموظف الرقمي."/><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{sectors.map(([name,desc,code],i)=><button key={name} onClick={()=>setOpenSector(openSector===i?null:i)} className={`ejx-sector-card group relative min-h-[225px] overflow-hidden rounded-[25px] border bg-white p-5 text-right shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${openSector===i?'is-open':''}`}><span className="text-[9px] font-bold text-emerald-700">0{i+1} · {code}</span><h3 className="mt-14 text-lg font-semibold">{name}</h3><p className="mt-3 text-[9px] leading-6 text-slate-400">{desc}</p><ChevronDown className={`absolute bottom-5 left-5 text-emerald-600 transition ${openSector===i?'rotate-180':''}`} size={17}/><div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-emerald-50 transition group-hover:scale-150"/></button>)}</div></div></section>
   <section className="mx-auto max-w-[1280px] px-5 py-24 md:py-32"><SectionIntro eyebrow="ENTERPRISE ARCHITECTURE" title={<>ذكاء قوي.<br/>وحدود واضحة.</>} copy="الاستقلالية في إنجاز ليست صلاحية مفتوحة؛ إنها قدرة تعمل داخل هوية المؤسسة وأهدافها وسياساتها وميزانيتها وأثرها القابل للمراجعة."/><div className="mt-12 grid gap-3 md:grid-cols-3">{[
    ['Identity','من يعمل؟','هوية المؤسسة والأدوار والصلاحيات',Users],
    ['Context','ما الذي يعرفه؟','معرفة الصناعة والأهداف والبيانات',Layers3],
    ['Control','ما الذي يستطيع فعله؟','السياسات والموافقات والميزانية والتدقيق',ShieldCheck]
   ].map(([a,b,c,I])=>{const Icon=I;return <article key={a as string} className="rounded-[26px] border border-emerald-900/10 bg-white p-7 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={19}/></span><span className="mt-7 block text-[9px] font-bold tracking-[.16em] text-emerald-700">{a as string}</span><h3 className="mt-3 text-xl font-semibold">{b as string}</h3><p className="mt-2 text-[10px] leading-6 text-slate-400">{c as string}</p></article>})}</div></section>
   <section id="governance" className="bg-white px-5 py-24 md:py-32"><div className="mx-auto max-w-[1280px]"><SectionIntro eyebrow="OPERATIONS & GOVERNANCE" title={<>الحوكمة ليست طبقة لاحقة.<br/>إنها جزء من التنفيذ.</>} copy="الصلاحيات والسياسات والموافقة البشرية وسجل التدقيق تعمل داخل المسار نفسه."/><div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{['Identity','Role & Goals','Skills & Tools','Knowledge','Model Strategy','Autonomy','Budget','Policies','Audit Trail','Human Approval'].map((x,i)=><div key={x} className="ejx-governance-tile rounded-2xl border border-emerald-900/10 bg-[#f7fbf9] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><ShieldCheck size={17} className="text-emerald-700"/><b className="mt-7 block text-[10px]">{x}</b><span className="mt-2 block text-[8px] text-slate-400">CONTROL 0{i+1}</span></div>)}</div></div></section>
   <section className="relative overflow-hidden bg-[#063d2d] text-white"><div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(126,226,188,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(126,226,188,.035)_1px,transparent_1px)] [background-size:64px_64px]"/><div className="relative mx-auto grid max-w-[1280px] gap-12 px-5 py-24 md:py-32 lg:grid-cols-[1fr_.75fr] lg:items-center"><div><SectionIntro dark eyebrow="ENJAZ FOR ENTERPRISE" title={<>ابنِ طبقة تشغيل<br/><span className="text-emerald-300">تتحرك مع مؤسستك.</span></>} copy="من أول طلب تشغيلي إلى آخر أثر في سجل التدقيق، إنجاز تجمع الذكاء والتنفيذ والحوكمة في نظام واحد."/><div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="/?auth=1&signup=1" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-xs font-semibold text-[#063d2d] shadow-2xl transition hover:-translate-y-0.5">ابدأ مع إنجاز<ArrowLeft size={16}/></a><a href="#demo" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.05] px-6 py-4 text-xs font-semibold text-white transition hover:bg-white/10"><Play size={14}/> استكشف المنتج</a></div></div><div className="ejx-enterprise-seal rounded-[30px] border border-emerald-200/10 bg-white/[.045] p-7"><Globe2 className="text-emerald-300" size={22}/><b className="mt-6 block text-2xl">Global by architecture.</b><p className="mt-3 text-xs leading-7 text-white/45">48 دورًا رقميًا عالميًا، وسياق صناعي قابل للتكييف، وحوكمة مدمجة في مسار العمل.</p><div className="mt-7 grid grid-cols-2 gap-2">{['AI-NATIVE','CROSS-INDUSTRY','HUMAN-GOVERNED','AUDIT-READY'].map(x=><span key={x} className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-3 text-[8px] tracking-[.12em] text-emerald-200">{x}</span>)}</div></div></div></section>
   <section className="px-5 py-20"><div className="mx-auto max-w-[1280px] overflow-hidden rounded-[34px] border border-emerald-200/10 bg-[radial-gradient(circle_at_20%_20%,rgba(126,226,188,.17),transparent_30%),linear-gradient(125deg,#07543d,#03291f)] px-6 py-20 text-center text-white shadow-[0_35px_100px_rgba(3,41,31,.22)] md:px-10 md:py-28"><Sparkles className="mx-auto mb-5 text-emerald-200" size={24}/><h2 className="text-4xl font-semibold tracking-[-1.8px] md:text-6xl">اجعل العمل يتحرك.<br/>واجعل القرار واضحًا.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-emerald-50/65">اجمع البشر والموظفين الرقميين والعمليات والحوكمة في مكان واحد.</p><a href="/?auth=1&signup=1" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-xs font-semibold text-[#063d2d] shadow-2xl transition hover:-translate-y-0.5">أنشئ مساحة مؤسستك<ArrowLeft size={16}/></a></div></section>
  </main>
  <footer className="bg-[#041c14] text-white"><div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]"><div><a href="#" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-[#063d2d]"><Command size={17}/></span><b className="text-lg">إنجاز</b></a><p className="mt-4 max-w-xs text-[10px] leading-6 text-white/35">Intelligent Operating Platform — قوة عمل رقمية للمؤسسات التي تريد أن يتحرك العمل بوضوح.</p></div><div><b className="text-[10px] text-white/70">المنصة</b><a href="#platform" className="mt-4 block text-[10px] text-white/35 hover:text-white">طبقة التشغيل</a><a href="#workforce" className="mt-3 block text-[10px] text-white/35 hover:text-white">القوى العاملة</a></div><div><b className="text-[10px] text-white/70">المؤسسة</b><a href="#sectors" className="mt-4 block text-[10px] text-white/35 hover:text-white">القطاعات</a><a href="#governance" className="mt-3 block text-[10px] text-white/35 hover:text-white">الحوكمة</a></div><div><b className="text-[10px] text-white/70">الحساب</b><a href="/?auth=1" className="mt-4 block text-[10px] text-white/35 hover:text-white">تسجيل الدخول</a><a href="/?auth=1&signup=1" className="mt-3 block text-[10px] text-white/35 hover:text-white">ابدأ مع إنجاز</a></div></div><div className="border-t border-white/10"><div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-6 text-[9px] text-white/30 sm:flex-row sm:items-center sm:justify-between"><span>© ENJAZ — Intelligent Operating Platform</span><div className="flex gap-5"><a href="#">الخصوصية</a><a href="#">الشروط</a></div></div></div></footer>
  <style>{`@keyframes marquee{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.animate-[marquee_30s_linear_infinite]{animation:none}}`}</style>
 </div>
}
export default App;
