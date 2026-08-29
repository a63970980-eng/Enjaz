const KEYWORDS = [
  ['sales','crm.search'], ['عملاء','crm.search'], ['مبيعات','crm.search'],
  ['lead','crm.create_lead'], ['عميل محتمل','crm.create_lead'], ['دفع','finance.payment'], ['payment','finance.payment']
];

export function planTask(objective, employee) {
  const text = String(objective || '').toLowerCase();
  const selected = KEYWORDS.filter(([keyword]) => text.includes(keyword)).map(([,tool])=>tool);
  const unique = [...new Set(selected)].filter(tool => employee.tools?.some(t => t.name === tool));
  const steps = unique.length ? unique.map((tool,i)=>({id:`planned_${i+1}`,action:tool.split('.')[1],tool,status:'pending'})) : [{id:'planned_1',action:'analyze',status:'pending'}];
  return { objective, steps };
}
