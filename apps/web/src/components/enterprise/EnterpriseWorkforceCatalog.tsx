import {useMemo,useState} from 'react';
import {Activity,Bot,Database,Settings2,ShieldCheck,Users,Workflow} from 'lucide-react';

const domains=[['All','الكل',null],['Operations','التشغيل',Workflow],['Data','البيانات',Database],['Customer','العملاء',Users],['Finance','المالية',Activity],['Technology','التقنية',Settings2],['Governance','الحوكمة',ShieldCheck]] as const;
const roles=[
 ['AI Manager','إدارة الأهداف والأولويات والقرارات التشغيلية','Operations'],
 ['AI Analyst','تحليل البيانات وتحويلها إلى رؤى قابلة للتنفيذ','Data'],
 ['AI Operations Worker','تنفيذ الأعمال المتكررة داخل الصلاحيات','Operations'],
 ['AI Coordinator','تنسيق البشر والموظفين الرقميين وسير العمل','Operations'],
 ['AI Customer Service Worker','خدمة العملاء وفق المعرفة والسياسات','Customer'],
 ['AI Finance Worker','المالية والمشتريات والمراجعات التشغيلية','Finance'],
 ['AI Automation Worker','بناء وتشغيل الأتمتة والتكاملات','Technology'],
 ['AI Governance Worker','السياسات والموافقات والأثر والتدقيق','Governance']
];

export default function EnterpriseWorkforceCatalog(){
 const [domain,setDomain]=useState('All');
 const filtered=useMemo(()=>domain==='All'?roles:roles.filter(x=>x[2]===domain),[domain]);
 return <div className="ejx-workforce-catalog">
  <div className="flex flex-wrap gap-2">{domains.map(([id,label,Icon])=><button key={id} onClick={()=>setDomain(id)} className={`rounded-full border px-4 py-2 text-[8px] font-bold transition ${domain===id?'border-[#063d2d] bg-[#063d2d] text-white':'border-emerald-900/10 bg-white text-slate-500 hover:border-emerald-200'}`}>{Icon&&<Icon size={11} className="mr-1 inline" />}{label}</button>)}</div>
  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(([name,copy])=><article key={name} className="ejx-role-card group rounded-[22px] border border-emerald-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Bot size={16}/></span><span className="text-[7px] font-bold tracking-[.16em] text-emerald-600">DIGITAL ROLE</span></div><b className="mt-5 block text-[11px] text-[#173a2e]">{name}</b><p className="mt-2 min-h-10 text-[8px] leading-5 text-slate-400">{copy}</p><div className="mt-4 flex gap-1.5"><span className="rounded-md bg-slate-50 px-2 py-1 text-[7px] text-slate-400">Skills</span><span className="rounded-md bg-slate-50 px-2 py-1 text-[7px] text-slate-400">Knowledge</span><span className="rounded-md bg-emerald-50 px-2 py-1 text-[7px] text-emerald-700">Policy</span></div></article>)}</div>
 </div>;
}
