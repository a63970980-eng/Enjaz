import {useState} from 'react';
import {Activity,ArrowUpLeft,BrainCircuit,Check,Database,Network,ShieldCheck,Workflow,Zap} from 'lucide-react';
import SpotlightCard from '../ui/SpotlightCard';

const capabilities=[
 {id:'command',ey:'01 · COMMAND',title:'مركز القيادة',copy:'صورة واحدة للأهداف والطلبات والقرارات وحالة التنفيذ.',icon:Network},
 {id:'workers',ey:'02 · WORKFORCE',title:'القوى العاملة الرقمية',copy:'أدوار رقمية تعمل ضمن سياق المؤسسة وصلاحياتها.',icon:BrainCircuit},
 {id:'workflow',ey:'03 · WORKFLOW',title:'محرك سير العمل',copy:'تحويل النية إلى خطوات قابلة للتنفيذ والمراجعة.',icon:Workflow},
 {id:'governance',ey:'04 · GOVERNANCE',title:'الحوكمة',copy:'هوية وسياسات وموافقات وأثر تدقيقي داخل المسار.',icon:ShieldCheck},
];

export default function EnterpriseProductShowcase(){
 const [active,setActive]=useState(0); const item=capabilities[active]; const Icon=item.icon;
 return <div className="ejx-product-showcase">
  <div className="grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
   <div className="rounded-[30px] border border-emerald-900/10 bg-[#f3f8f5] p-3">
    {capabilities.map((x,i)=>{const X=x.icon;return <button key={x.id} onClick={()=>setActive(i)} className={`ejx-showcase-tab ${active===i?'is-active':''}`}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><X size={17}/></span>
      <span className="min-w-0 text-right"><b className="block text-[11px] text-[#173a2e]">{x.title}</b><small className="mt-1 block truncate text-[8px] text-slate-400">{x.copy}</small></span>
      <ArrowUpLeft size={14} className="text-slate-300"/>
    </button>})}
    <div className="mt-3 rounded-2xl bg-[#063d2d] p-5 text-white"><span className="text-[8px] font-bold tracking-[.18em] text-emerald-300">ENJAZ OS</span><b className="mt-3 block text-lg">Product is the proof.</b><p className="mt-2 text-[9px] leading-6 text-white/45">واجهة توضح كيف تعمل المنصة، لا مجرد وصف لما تفعله.</p></div>
   </div>
   <SpotlightCard className="rounded-[30px] border border-emerald-900/10 bg-white p-3 shadow-[0_30px_90px_rgba(3,27,20,.09)]">
    <div className="rounded-[24px] bg-[#fbfdfc] p-5 md:p-7">
     <div className="flex items-start justify-between gap-4"><div><span className="text-[8px] font-bold tracking-[.18em] text-emerald-700">{item.ey}</span><h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#08251b]">{item.title}</h3><p className="mt-2 max-w-xl text-[10px] leading-6 text-slate-400">{item.copy}</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon size={21}/></span></div>
     <div className="mt-8 grid gap-3 md:grid-cols-3">
      {[
       ['CONTEXT','السياق والمعرفة','READY',Database],
       ['DECISION','الخطة والقرار','CONTROLLED',Zap],
       ['EVIDENCE','التنفيذ والأثر','AUDITABLE',Activity]
      ].map(([a,b,c,X])=>{const I=X;return <div key={a} className="rounded-2xl border border-emerald-900/10 bg-white p-4"><span className="text-[7px] font-bold tracking-[.16em] text-slate-400">{a}</span><b className="mt-3 block text-[11px] text-[#173a2e]">{b}</b><span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[7px] font-bold text-emerald-700"><I size={10}/>{c}</span></div>})}
     </div>
     <div className="mt-4 rounded-2xl border border-emerald-100 bg-[#f0faf5] p-5">
      <div className="flex items-center justify-between"><span className="text-[8px] font-bold tracking-[.16em] text-emerald-700">OPERATING TRACE</span><span className="text-[8px] text-slate-400">PREVIEW</span></div>
      <div className="mt-5 flex flex-wrap items-center gap-2">{['Signal','Context','Decision','Action','Evidence'].map((x,i)=><span key={x} className="inline-flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-[8px] font-bold ${i<4?'bg-[#063d2d] text-emerald-200':'bg-emerald-200 text-[#063d2d]'}`}>{i+1}</span><b className="text-[8px] text-slate-500">{x}</b>{i<4&&<span className="mx-1 text-emerald-300">→</span>}</span>)}</div>
     </div>
    </div>
   </SpotlightCard>
  </div>
 </div>;
}
