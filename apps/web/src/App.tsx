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
import ReadyEnterpriseLanding from './components/enterprise/ReadyEnterpriseLanding';

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
  if(new URLSearchParams(window.location.search).has('auth')) return <AuthBridge/>;
  return <div dir="rtl" className="public-platform min-h-screen overflow-x-hidden">
    <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-[1280px] items-center justify-between px-5 lg:px-8">
        <a href="#" className="flex items-center gap-3 font-semibold text-[#06281d]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#063d2d] text-sm font-black text-emerald-200 shadow-lg">E</span><span className="text-xl tracking-[-.04em]">إنجاز</span></a>
        <nav className="hidden items-center gap-7 text-sm text-slate-500 lg:flex"><a href="#platform">المنصة</a><a href="#workforce">القوة العاملة</a><a href="#sectors">القطاعات</a><a href="#governance">الحوكمة</a></nav>
        <div className="flex items-center gap-2"><a href="?auth=login" className="hidden rounded-xl px-4 py-2.5 text-sm text-slate-600 sm:block">تسجيل الدخول</a><a href="?auth=signup" className="rounded-xl bg-[#063d2d] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10">ابدأ الآن</a></div>
      </div>
    </header>
    <main>
      <section className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-5 pb-28 pt-20 lg:grid-cols-[.82fr_1.18fr] lg:px-8 lg:pt-28">
        <div className="order-2 lg:order-1"><span className="ejx-section-label">ENJAZ · AI OPERATING PLATFORM</span><h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-3px] text-[#06281d] md:text-7xl">شغّل مؤسستك بقوة <span className="text-emerald-600">الذكاء الاصطناعي.</span></h1><p className="mt-6 max-w-xl text-base leading-8 text-slate-500 md:text-lg">قوة عاملة رقمية وسير عمل وحوكمة تعمل معًا داخل منصة واحدة.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#demo" className="rounded-xl bg-[#063d2d] px-6 py-3.5 text-sm font-semibold text-white shadow-xl">شاهد العرض التفاعلي</a><a href="#platform" className="rounded-xl border border-emerald-900/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#173a2e]">اكتشف المنصة</a></div><div className="mt-7 flex flex-wrap gap-3 text-[10px] text-slate-400"><span>صلاحيات</span><span>•</span><span>سياسات</span><span>•</span><span>موافقات</span><span>•</span><span>سجل تدقيق</span></div></div>
        <div className="order-1 lg:order-2"><ProductPreview/></div>
      </section>
      <section id="platform" className="border-y border-emerald-900/10 bg-white px-5 py-24 lg:px-8"><div className="mx-auto max-w-[1280px]"><SectionIntro eyebrow="ENJAZ PLATFORM" title="منصة تشغيل مؤسسية، وليست مجرد مساعد ذكي." copy="المنتج يجمع القيادة والقوة العاملة الرقمية وسير العمل والمعرفة والتكامل والحوكمة في طبقة تشغيل واحدة."/><EnterpriseProductShowcase/><EnterpriseSuite/><CapabilityMatrix/></div></section>
      <section id="workforce" className="bg-[#03291f] px-5 py-24 text-white lg:px-8"><div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[.9fr_1.1fr]"><div><SectionIntro dark eyebrow="DIGITAL WORKFORCE" title="48 موظفًا رقميًا عالميًا." copy="الدور نفسه يعمل عبر القطاعات، ويتخصص عبر سياق الصناعة والمهارات والمعرفة والأدوات والسياسات والصلاحيات."/><div className="mt-8"><EnterpriseWorkforceCatalog/></div></div><WorkforceVisual/></div></section>
      <section id="sectors" className="px-5 py-24 lg:px-8"><div className="mx-auto max-w-[1280px]"><SectionIntro eyebrow="FIVE SECTORS" title="مصمم لعمليات المؤسسات المختلفة."/><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{sectors.map(([name,desc,code])=><article key={code} className="group min-h-[230px] rounded-[24px] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><span className="text-[9px] font-bold tracking-[.18em] text-emerald-700">{code}</span><h3 className="mt-12 text-xl font-semibold text-[#173a2e]">{name}</h3><p className="mt-3 text-xs leading-6 text-slate-400">{desc}</p></article>)}</div></div></section>
      <section id="governance" className="bg-[#f2f8f5] px-5 py-24 lg:px-8"><div className="mx-auto max-w-[1280px]"><SectionIntro eyebrow="OPERATIONS & GOVERNANCE" title="الاستقلالية داخل حدود المؤسسة."/><EnterpriseLoop/></div></section>
      <section className="px-5 py-24 lg:px-8"><div className="mx-auto max-w-[1280px] overflow-hidden rounded-[32px] bg-[#063d2d] p-8 text-white shadow-2xl md:p-14"><span className="text-[9px] font-bold tracking-[.18em] text-emerald-300">ENJAZ</span><h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-1.8px] md:text-6xl">ابنِ نظام تشغيل مؤسستك حول العمل الفعلي.</h2><p className="mt-5 max-w-2xl text-sm leading-8 text-white/55">ابدأ من العمليات التي تريد تشغيلها، ثم امنح كل موظف رقمي السياق والأدوات والسياسات التي يحتاجها.</p><a href="?auth=signup" className="mt-8 inline-flex rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-bold text-[#03291f]">ابدأ الآن</a></div></section>
    </main>
    <footer className="border-t border-emerald-900/10 bg-white px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-[1280px] flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>إنجاز — AI Operating Platform</span><span>صلاحيات · سياسات · موافقات · تدقيق</span></div></footer>
  </div>;
}
export default App;
