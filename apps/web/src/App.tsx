import {useEffect,useMemo,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {ArrowLeft,ArrowUpLeft,Check,ChevronLeft,Command,LockKeyhole,Menu,Network,Play,ShieldCheck,Sparkles,Workflow,Zap} from 'lucide-react';

const roles=[
  ['AI Manager','الأهداف والقرارات التشغيلية','MG'],
  ['AI Analyst','تحليل البيانات وتحويلها إلى قرارات','AN'],
  ['AI Operations Worker','تنفيذ الأعمال المتكررة ضمن الصلاحيات','OP'],
  ['AI Coordinator','تنسيق العمل بين البشر والموظفين الرقميين','CO'],
  ['AI Customer Service Worker','خدمة العملاء وفق المعرفة والسياسات','CX'],
];
const sectors=['المطاعم','المستشفيات','الفنادق','الشركات','الجهات الحكومية'];
const integrations=[
  ['OpenAI','AI','text-emerald-700'],['GitHub','DEV','text-slate-800'],['Vercel','DEPLOY','text-slate-800'],
  ['Supabase','DATA','text-emerald-700'],['n8n','AUTO','text-orange-600'],['MCP','TOOLS','text-violet-700'],
  ['APIs','API','text-blue-700'],['SQL','DB','text-cyan-700']
];

function Reveal({children,className='',delay=0}:{children:React.ReactNode;className?:string;delay?:number}){
 const reduced=useReducedMotion();
 return <motion.div className={className} initial={reduced?false:{opacity:0,y:28}} whileInView={reduced?undefined:{opacity:1,y:0}} viewport={{once:true,amount:.14}} transition={reduced?{duration:0}:{duration:.7,delay,ease:[.22,1,.36,1]}}>{children}</motion.div>;
}

function ProductPreview(){
 const [tab,setTab]=useState(0);
 const tabs=['مركز القيادة','القوى العاملة','سير العمل','الحوكمة'];
 const activity=[
  ['طلب جديد','AI Coordinator','يُحلّل السياق ويجهّز خطة التنفيذ'],
  ['مراجعة مطلوبة','Human Reviewer','قرار بشري قبل الإجراء الحساس'],
  ['سجل التدقيق','Governance Engine','كل خطوة موثقة وقابلة للتتبع']
 ];
 return <div id="demo" className="relative mx-auto w-full max-w-[720px]">
   <div className="absolute -inset-10 rounded-[60px] bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,.22),transparent_62%)] blur-3xl"/>
   <div className="relative rounded-[30px] border border-[#cbded5] bg-white p-2 shadow-[0_45px_120px_rgba(4,57,42,.18)] [transform:perspective(1500px)_rotateY(-2deg)_rotateX(1deg)]">
    <div className="flex h-11 items-center justify-between rounded-[22px] bg-[#f5f9f7] px-4 text-[9px] text-slate-400">
      <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="font-semibold tracking-[.18em] text-[#31584b]">ENJAZ OS</span></div>
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">PREVIEW</span>
    </div>
    <div className="grid min-h-[480px] md:grid-cols-[150px_1fr]">
      <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-[#dce9e4] bg-white p-2 md:hidden">{tabs.map((t,i)=><button key={t} onClick={()=>setTab(i)} className={`shrink-0 rounded-xl px-3 py-2 text-[9px] font-semibold ${tab===i?'bg-[#063d2d] text-emerald-100':'text-slate-500'}`}>{t}</button>)}</div><aside className="hidden rounded-br-[24px] bg-[#052b20] p-3 text-white md:block">
       <div className="mb-7 flex items-center gap-2 px-2 pt-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400 text-[#052b20]"><Command size={14}/></span><b className="text-sm">إنجاز</b></div>
       {tabs.map((t,i)=><button key={t} onClick={()=>setTab(i)} className={`mb-1 w-full rounded-xl px-3 py-3 text-right text-[10px] transition ${tab===i?'bg-emerald-400/15 text-emerald-200':'text-white/45 hover:bg-white/5 hover:text-white'}`}>{t}</button>)}
       <div className="mt-20 rounded-xl border border-white/10 bg-white/[.04] p-3"><span className="text-[8px] text-emerald-300">POLICY STATUS</span><b className="mt-2 block text-[10px]">All systems governed</b></div>
      </aside>
      <main className="bg-[#fbfdfc] p-5 md:p-7">
       <div className="flex items-start justify-between">
        <div><span className="text-[9px] font-bold tracking-[.18em] text-emerald-700">LIVE PRODUCT PREVIEW</span><h3 className="mt-2 text-xl font-semibold tracking-tight text-[#08251b]">{tabs[tab]}</h3></div>
        <span className="hidden rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[8px] text-slate-500 sm:block">Workspace / Operations</span>
       </div>
       {tab===0&&<div className="mt-7 space-y-3">{activity.map((x,i)=><div key={x[0]} className="group flex items-center gap-3 rounded-2xl border border-[#dce9e4] bg-white p-4 shadow-[0_8px_24px_rgba(4,57,42,.035)] transition hover:-translate-y-0.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{i===0?<Workflow size={17}/>:i===1?<ShieldCheck size={17}/>:<LockKeyhole size={17}/>}</span><div className="min-w-0 flex-1"><b className="block text-xs text-[#173a2e]">{x[0]}</b><span className="mt-1 block truncate text-[9px] text-slate-400">{x[1]} · {x[2]}</span></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] text-emerald-700">{i===1?'WAIT':'ACTIVE'}</span></div>)}</div>}
       {tab===1&&<div className="mt-7 grid gap-3 sm:grid-cols-2">{roles.slice(0,4).map(r=><div key={r[0]} className="rounded-2xl border border-[#dce9e4] bg-white p-4"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#063d2d] text-[8px] font-bold text-emerald-200">{r[2]}</span><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,.5)]"/></div><b className="mt-5 block text-[10px] text-[#173a2e]">{r[0]}</b><p className="mt-1 text-[9px] leading-5 text-slate-400">{r[1]}</p></div>)}</div>}
       {tab===2&&<div className="mt-12"><div className="relative h-24"><div className="absolute left-5 right-5 top-6 h-px bg-[#d7e6e0]"/><div className="relative grid grid-cols-4">{['الهدف','الخطة','الموافقة','التنفيذ'].map((x,i)=><div key={x} className="text-center"><span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl border ${i<3?'border-emerald-200 bg-emerald-50 text-emerald-700':'border-slate-200 bg-white text-slate-400'}`}>{i<3?<Check size={17}/>:<Play size={15}/>}</span><b className="mt-3 block text-[9px] text-slate-500">{x}</b></div>)}</div></div><div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"><span className="text-[8px] font-bold tracking-[.16em] text-emerald-700">AUTOMATION PATH</span><p className="mt-2 text-[11px] leading-6 text-[#31584b]">يتحرك العمل تلقائيًا بين المراحل مع توقفات واضحة عند نقاط القرار البشري.</p></div></div>}
       {tab===3&&<div className="mt-7 grid gap-3">{['Identity & Permissions','Policy Engine','Human Approval','Audit Trail'].map((x,i)=><div key={x} className="flex items-center gap-3 rounded-2xl border border-[#dce9e4] bg-white p-4"><ShieldCheck size={17} className="text-emerald-700"/><span className="text-[10px] font-medium text-slate-600">{x}</span><span className="mr-auto rounded-full bg-emerald-50 px-2 py-1 text-[8px] text-emerald-700">{i===2?'REVIEW':'PASS'}</span></div>)}</div>}
      </main>
    </div>
   </div>
   <div className="absolute -bottom-8 -left-5 hidden w-48 rounded-2xl border border-[#d6e5df] bg-white p-4 shadow-[0_20px_60px_rgba(4,57,42,.14)] md:block"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/><b className="text-[9px] text-slate-600">WORKFLOW ACTIVE</b></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-50"><div className="h-full w-[78%] rounded-full bg-emerald-500"/></div><div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>Execution</span><span>78%</span></div></div>
   <div className="absolute -right-4 -top-5 hidden w-44 rounded-2xl border border-emerald-300/10 bg-[#063d2d] p-4 text-white shadow-2xl md:block"><span className="text-[8px] tracking-[.16em] text-emerald-300">DIGITAL WORKER</span><b className="mt-2 block text-sm">AI Coordinator</b><span className="mt-1 block text-[9px] text-white/45">Planning · Routing · Approval</span></div>
 </div>
}

function WorkforceVisual(){
 const nodes=['OPS','DATA','CX','FIN','AI','GOV'];
 return <div className="relative mx-auto aspect-square w-full max-w-[560px]">
  <div className="absolute inset-[7%] rounded-full border border-emerald-200/10 [transform:rotateX(64deg)_rotateZ(-12deg)]"/>
  <div className="absolute inset-[18%] rounded-full border border-emerald-200/15 [transform:rotateX(64deg)_rotateZ(18deg)]"/>
  <div className="absolute inset-[31%] rounded-full border border-emerald-200/20 [transform:rotateX(64deg)_rotateZ(-25deg)]"/>
  <div className="absolute inset-[34%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#24c995,#063d2d_72%)] shadow-[0_0_120px_rgba(24,185,129,.22)]"/>
  <div className="absolute inset-0 grid place-items-center text-center"><div><b className="block text-6xl tracking-[-3px]">48</b><span className="text-[9px] tracking-[.24em] text-emerald-200">DIGITAL WORKFORCE</span></div></div>
  {nodes.map((n,i)=><span key={n} className={`absolute grid h-12 w-12 place-items-center rounded-xl border border-emerald-200/15 bg-white/[.07] text-[8px] font-semibold text-emerald-100 backdrop-blur ${['left-[9%] top-[45%]','right-[12%] top-[18%]','right-[7%] bottom-[27%]','left-[18%] bottom-[12%]','left-[8%] top-[18%]','right-[32%] bottom-[3%]'][i]}`}>{n}</span>)}
 </div>
}

function AuthBridge(){
 useEffect(()=>{document.documentElement.classList.add('enjaz-auth-route');let host=document.querySelector('.enjaz-root');if(!host){host=document.createElement('div');host.className='enjaz-root';document.body.appendChild(host)}import('../auth-gate-v2.js').catch(error=>console.error('[ENJAZ_AUTH_BOOT]',error));return()=>{document.documentElement.classList.remove('enjaz-auth-route');host?.remove()};},[]);
 return null;
}

function App(){
 const [menuOpen,setMenuOpen]=useState(false);
 const nav=useMemo(()=>[['المنصة','#platform'],['القوى العاملة','#workforce'],['كيف تعمل','#how'],['القطاعات','#sectors'],['الحوكمة','#governance']],[]);
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
      <h1 className="mt-6 max-w-[650px] text-[clamp(45px,6.4vw,86px)] font-semibold leading-[1.02] tracking-[-3.5px]">قوة عمل رقمية.<br/><span className="bg-gradient-to-l from-[#087c58] via-[#15a875] to-[#063d2d] bg-clip-text text-transparent">مؤسسة تتحرك بذكاء.</span></h1>
      <p className="mt-7 max-w-[600px] text-[15px] leading-8 text-slate-600 sm:text-[17px]">إنجاز توحّد الموظفين الرقميين والعمليات وسير العمل والحوكمة في طبقة تشغيل واحدة — من النية إلى التنفيذ.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="/?auth=1&signup=1" className="group flex items-center justify-center gap-2 rounded-2xl bg-[#063d2d] px-6 py-4 text-xs font-semibold text-white shadow-xl shadow-emerald-950/15 transition hover:-translate-y-0.5 hover:shadow-2xl">أنشئ مساحة مؤسستك<ArrowLeft size={16} className="transition group-hover:-translate-x-1"/></a><a href="#demo" className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-900/10 bg-white px-6 py-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><Play size={14}/> شاهد المنتج</a></div>
      <div className="mt-7 grid max-w-[600px] grid-cols-3 gap-2"><span className="rounded-xl border border-emerald-900/10 bg-white px-3 py-3 text-[9px] text-slate-500"><b className="block text-[#173a2e]">01</b>سياق موحّد</span><span className="rounded-xl border border-emerald-900/10 bg-white px-3 py-3 text-[9px] text-slate-500"><b className="block text-[#173a2e]">02</b>تنفيذ مضبوط</span><span className="rounded-xl border border-emerald-900/10 bg-white px-3 py-3 text-[9px] text-slate-500"><b className="block text-[#173a2e]">03</b>أثر قابل للتدقيق</span></div>
     </div>
     <Reveal><ProductPreview/></Reveal>
    </div>
   </section>
   <section className="border-y border-emerald-950/5 bg-white">
    <div className="mx-auto flex max-w-[1280px] items-center gap-8 overflow-hidden px-5 py-5"><span className="hidden shrink-0 text-[9px] font-bold tracking-[.18em] text-slate-400 lg:block">CONNECTED TOOLS</span><div className="flex min-w-max gap-3 animate-[marquee_30s_linear_infinite]">{[...integrations,...integrations].map(([name,type,icon],i)=><span key={i} className="flex items-center gap-2 rounded-full border border-emerald-900/10 bg-[#f7fbf9] px-4 py-2.5 shadow-sm"><span className={`grid h-6 w-6 place-items-center rounded-lg bg-white text-[7px] font-black shadow-sm ${icon}`}>{type}</span><b className="text-[9px] text-slate-600">{name}</b></span>)}</div></div>
   </section>
   <Reveal><section id="platform" className="mx-auto max-w-[1280px] px-5 py-24 md:py-32">
    <div className="max-w-2xl"><span className="inline-flex rounded-full border border-emerald-800/10 bg-emerald-50 px-3 py-1.5 text-[9px] font-bold tracking-[.2em] text-emerald-700">THE PLATFORM</span><h2 className="mt-4 text-4xl font-semibold tracking-[-1.8px] md:text-6xl">ليست مجموعة أدوات.<br/>إنها طبقة تشغيل.</h2><p className="mt-5 text-sm leading-8 text-slate-500">كل جزء من إنجاز مصمم ليعمل داخل مسار واحد: سياق، قرار، تنفيذ، ثم أثر قابل للتدقيق.</p></div>
    <div className="mt-12 grid gap-4 md:grid-cols-12">
      <article className="group relative min-h-[390px] overflow-hidden rounded-[30px] bg-[#063d2d] p-7 text-white shadow-[0_25px_70px_rgba(4,57,42,.12)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_35px_90px_rgba(4,57,42,.2)] md:col-span-7"><span className="text-[9px] font-bold tracking-[.18em] text-emerald-300">COMMAND CENTER</span><h3 className="mt-5 text-3xl font-semibold tracking-tight">المؤسسة ترى العمل كما يحدث.</h3><p className="mt-3 max-w-md text-xs leading-7 text-white/55">الأهداف والمهام والقرارات والموافقات وسجل التدقيق في سياق واحد.</p><div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-emerald-200/10 bg-black/10 p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><Network size={17}/></span><div className="flex-1"><b className="block text-[10px]">Operational Context</b><span className="text-[8px] text-white/35">Goal → Plan → Approval → Execution</span></div><span className="text-[8px] text-emerald-300">LIVE</span></div></div><div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full border border-emerald-200/10 shadow-[0_0_0_45px_rgba(126,226,188,.025),0_0_0_90px_rgba(126,226,188,.02)]"/></article>
      <article className="min-h-[390px] overflow-hidden rounded-[30px] bg-[#e6f5ee] p-7 transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(4,57,42,.1)] md:col-span-5"><span className="text-[9px] font-bold tracking-[.18em] text-emerald-700">HUMAN × AI</span><h3 className="mt-5 text-3xl font-semibold tracking-tight text-[#08251b]">البشر يوجّهون.<br/>الرقميون ينفّذون.</h3><p className="mt-3 text-xs leading-7 text-[#547066]">تعاون واضح بين الفريق البشري والموظفين الرقميين مع نقاط قرار ومساءلة.</p><div className="mt-10 grid grid-cols-2 gap-2"><span className="rounded-xl bg-white p-4 text-[9px] text-slate-500">Human Review</span><span className="rounded-xl bg-white p-4 text-[9px] text-slate-500">Digital Action</span><span className="rounded-xl bg-white p-4 text-[9px] text-slate-500">Shared Context</span><span className="rounded-xl bg-white p-4 text-[9px] text-slate-500">Audit Trail</span></div></article>
      <article className="min-h-[300px] overflow-hidden rounded-[30px] bg-[#fff4dc] p-7 transition duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(70,50,10,.1)] md:col-span-5"><span className="text-[9px] font-bold tracking-[.18em] text-amber-800/70">WORKFLOWS</span><h3 className="mt-5 text-2xl font-semibold">من الطلب إلى التنفيذ.</h3><div className="mt-8 flex flex-wrap items-center gap-2 text-[9px]"><span className="rounded-lg bg-white px-3 py-2">هدف</span><ChevronLeft size={12}/><span className="rounded-lg bg-white px-3 py-2">خطة</span><ChevronLeft size={12}/><span className="rounded-lg bg-white px-3 py-2">موافقة</span><ChevronLeft size={12}/><span className="rounded-lg bg-white px-3 py-2">تنفيذ</span></div></article>
      <article className="min-h-[300px] overflow-hidden rounded-[30px] bg-[#f0eafa] p-7 transition duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(60,40,100,.1)] md:col-span-7"><span className="text-[9px] font-bold tracking-[.18em] text-violet-800/70">GOVERNANCE ENGINE</span><h3 className="mt-5 text-2xl font-semibold">الحوكمة ليست طبقة لاحقة.</h3><p className="mt-3 max-w-lg text-xs leading-7 text-slate-500">الصلاحيات والسياسات والموافقة البشرية وسجل التدقيق تعمل داخل المسار نفسه.</p><div className="mt-7 flex flex-wrap gap-2">{['Identity','Permissions','Policies','Human Approval','Audit'].map(x=><span key={x} className="rounded-lg border border-violet-900/10 bg-white px-3 py-2 text-[8px] text-slate-500">{x}</span>)}</div></article>
    </div>
   </section></Reveal>
   <Reveal><section id="workforce" className="relative overflow-hidden bg-[#03271d] text-white"><div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(126,226,188,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(126,226,188,.035)_1px,transparent_1px)] [background-size:56px_56px]"/>
    <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-5 py-24 md:py-32 lg:grid-cols-[.8fr_1.2fr]">
     <div><span className="text-[9px] font-bold tracking-[.2em] text-emerald-300">DIGITAL WORKFORCE</span><h2 className="mt-4 text-4xl font-semibold tracking-[-1.8px] md:text-6xl">48 موظفًا رقميًا.<br/><span className="text-emerald-300">فريق واحد يتكيّف.</span></h2><p className="mt-6 max-w-xl text-sm leading-8 text-emerald-50/60">لا ننسخ الموظف لكل قطاع. الموظف نفسه ينتقل بين المؤسسات مع تغيير السياق والمعرفة والأدوات والسياسات والصلاحيات.</p><div className="mt-5 flex flex-wrap gap-2 text-[8px] text-emerald-100/65"><span className="rounded-full border border-white/10 px-3 py-2">Industry Context</span><span className="rounded-full border border-white/10 px-3 py-2">Skills</span><span className="rounded-full border border-white/10 px-3 py-2">Knowledge</span><span className="rounded-full border border-white/10 px-3 py-2">Tools</span><span className="rounded-full border border-white/10 px-3 py-2">Policies</span><span className="rounded-full border border-white/10 px-3 py-2">Permissions</span></div><div className="mt-8 grid gap-2 sm:grid-cols-2">{roles.map(r=><div key={r[0]} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 transition hover:border-emerald-300/20 hover:bg-white/[.07]"><div className="flex items-center justify-between"><b className="text-[10px]">{r[0]}</b><span className="text-[8px] text-emerald-300">{r[2]}</span></div><p className="mt-1 text-[9px] leading-5 text-white/40">{r[1]}</p></div>)}</div></div>
     <WorkforceVisual/>
    </div>
   </section></Reveal>
   <Reveal><section id="how" className="mx-auto max-w-[1280px] px-5 py-24 md:py-32">
    <div className="max-w-xl"><span className="text-[9px] font-bold tracking-[.2em] text-emerald-700">HOW ENJAZ WORKS</span><h2 className="mt-4 text-4xl font-semibold tracking-[-1.8px] md:text-6xl">من النية إلى الإنجاز.</h2></div>
    <div className="mt-12 grid gap-0 overflow-hidden rounded-[28px] border border-emerald-900/10 bg-white shadow-[0_25px_70px_rgba(4,57,42,.06)] md:grid-cols-5">{[['01','حدّد الهدف','ما الذي تريد إنجازه؟'],['02','خطّط','حوّل الهدف إلى خطوات.'],['03','وافق','أوقف ما يحتاج قرارًا بشريًا.'],['04','نفّذ','دع الموظفين الرقميين يعملون.'],['05','تتبّع','كل أثر يبقى واضحًا.']].map(([n,t,d])=><div key={n} className="group relative min-h-[190px] border-b border-emerald-900/10 p-6 last:border-0 md:border-b-0 md:border-l md:last:border-l-0"><span className="text-[9px] font-bold text-emerald-700">{n}</span><b className="mt-12 block text-base">{t}</b><p className="mt-2 text-[9px] leading-5 text-slate-400">{d}</p><div className="absolute right-0 top-0 h-1 w-0 bg-emerald-500 transition-all group-hover:w-full"/></div>)}</div>
   </section></Reveal>
   <Reveal><section id="sectors" className="border-y border-emerald-950/5 bg-[#eef6f2]">
    <div className="mx-auto max-w-[1280px] px-5 py-24 md:py-28"><span className="text-[9px] font-bold tracking-[.2em] text-emerald-700">INDUSTRY CONTEXT</span><h2 className="mt-4 text-4xl font-semibold tracking-[-1.8px] md:text-6xl">تتكيّف إنجاز مع مؤسستك.</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500">منصة واحدة، وسياقات تشغيل مختلفة — دون إنشاء نسخة منفصلة من الموظف الرقمي لكل قطاع.</p><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{sectors.map((s,i)=><div key={s} className="group relative min-h-[190px] overflow-hidden rounded-[25px] border border-emerald-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><span className="text-[9px] text-emerald-700">0{i+1}</span><h3 className="mt-16 text-lg font-semibold">{s}</h3><ArrowUpLeft className="absolute bottom-5 left-5 text-emerald-600 transition group-hover:-translate-y-1 group-hover:translate-x-1" size={18}/><div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-emerald-50 transition group-hover:scale-150"/></div>)}</div></div>
   </section></Reveal>
   <Reveal><section id="governance" className="mx-auto max-w-[1280px] px-5 py-24 md:py-32">
    <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><span className="text-[9px] font-bold tracking-[.2em] text-emerald-700">OPERATIONS & GOVERNANCE</span><h2 className="mt-4 text-4xl font-semibold tracking-[-1.8px] md:text-6xl">استقلالية محسوبة.<br/>وحوكمة مستمرة.</h2><p className="mt-5 max-w-xl text-sm leading-8 text-slate-500">كل موظف رقمي يعمل داخل سياق وصلاحيات وسياسات يمكن تتبعها — مع إبقاء القرار البشري في مكانه عندما يلزم.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{['Identity','Role & Goals','Skills & Tools','Knowledge','Model Strategy','Autonomy','Budget','Policies','Audit Trail'].map(x=><div key={x} className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><ShieldCheck size={17} className="text-emerald-700"/><b className="mt-7 block text-[10px]">{x}</b></div>)}</div></div>
   </section></Reveal>
   <section className="px-5 pb-20"><div className="mx-auto max-w-[1280px] overflow-hidden rounded-[34px] border border-emerald-200/10 shadow-[0_35px_100px_rgba(3,41,31,.22)] bg-[radial-gradient(circle_at_20%_20%,rgba(126,226,188,.17),transparent_30%),linear-gradient(125deg,#07543d,#03291f)] px-6 py-20 text-center text-white md:px-10 md:py-28"><Sparkles className="mx-auto mb-5 text-emerald-200" size={24}/><h2 className="text-4xl font-semibold tracking-[-1.8px] md:text-6xl">ابدأ من مؤسستك.<br/>وابنِ طبقة تشغيل حقيقية.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-emerald-50/65">اجمع البشر والموظفين الرقميين والعمليات والحوكمة في مكان واحد.</p><a href="/?auth=1&signup=1" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-xs font-semibold text-[#063d2d] shadow-2xl transition hover:-translate-y-0.5">ابدأ مع إنجاز <ArrowLeft size={16}/></a></div></section>
  </main>
  <footer className="bg-[#041c14] text-white"><div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-5 py-8 text-[10px] text-white/45 sm:flex-row sm:items-center sm:justify-between"><span>© ENJAZ — Intelligent Operating Platform</span><div className="flex gap-5"><a href="#">الخصوصية</a><a href="#">الشروط</a><a href="/?auth=1">تسجيل الدخول</a></div></div></footer>
  <style>{`@keyframes marquee{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.animate-[marquee_30s_linear_infinite]{animation:none}}`}</style>
 </div>
}
export default App;
