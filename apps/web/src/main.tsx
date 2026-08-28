import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const employees = [
  { name: 'أحمد', role: 'موظف المبيعات', status: 'نشط', tasks: 12 },
  { name: 'سارة', role: 'خدمة العملاء', status: 'نشط', tasks: 8 },
  { name: 'نور', role: 'محلل البيانات', status: 'بانتظار الموافقة', tasks: 5 },
];

function App() {
  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><span>ENJAZ</span><small>AI Workforce</small></div>
      <nav>{['نظرة عامة','الموظفون الرقميون','المهام','سير العمل','التكاملات','الموافقات','سجل التدقيق'].map((x,i)=><div className={i===0?'nav active':'nav'} key={x}>{x}</div>)}</nav>
      <div className="tenant"><small>Workspace</small><strong>شركة تجريبية</strong></div>
    </aside>
    <section className="content">
      <header><div><p className="eyebrow">لوحة التحكم</p><h1>القوى العاملة الرقمية</h1><p className="muted">أدر موظفي AI والمهام والتنفيذ من مساحة عمل واحدة.</p></div><button>+ إنشاء موظف AI</button></header>
      <section className="stats"><Card title="الموظفون النشطون" value="3"/><Card title="المهام قيد التنفيذ" value="25"/><Card title="بانتظار الموافقة" value="4"/><Card title="استخدام هذا الشهر" value="18.4%"/></section>
      <section className="panel"><div className="panelHead"><h2>الموظفون الرقميون</h2><span>عرض الكل ←</span></div><div className="table">{employees.map(e=><div className="row" key={e.name}><div className="avatar">{e.name[0]}</div><div className="person"><strong>{e.name}</strong><small>{e.role}</small></div><span className={e.status==='نشط'?'status':'status waiting'}>{e.status}</span><span>{e.tasks} مهام</span><b>•••</b></div>)}</div></section>
      <section className="panel"><div className="panelHead"><h2>آخر نشاط</h2><span>التدقيق الكامل ←</span></div><div className="activity"><p><b>أحمد</b> حلل 247 عميلًا في CRM <time>منذ 3 دقائق</time></p><p><b>سارة</b> صعّدت شكوى إلى الموظف المسؤول <time>منذ 11 دقيقة</time></p><p><b>نور</b> أنهت تقرير المبيعات وتنتظر الموافقة <time>منذ 24 دقيقة</time></p></div></section>
    </section>
  </main>;
}
function Card({title,value}:{title:string,value:string}) { return <div className="card"><span>{title}</span><strong>{value}</strong></div> }

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
