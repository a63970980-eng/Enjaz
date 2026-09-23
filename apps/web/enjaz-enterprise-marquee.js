/* ENJAZ enterprise marquee.
   Uses the same proven duplication + translate pattern used by open-source marquee components.
   The public shell is mounted dynamically, so this module watches for it safely.
*/
const ITEMS=[
  "ALPHA GROUP",
  "NOVA HOSPITALITY",
  "HORIZON HEALTH",
  "NEXUS INDUSTRIES",
  "SUMMIT HOTELS",
  "CITY SERVICES",
  "ORBIT OPERATIONS",
  "VISION ENTERPRISES"
];

const escapeHtml=value=>String(value).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

const buildMarquee=strip=>{
  if(!strip||strip.dataset.enjazMarqueeReady==="1")return;
  const source=strip.querySelector("div");
  const existing=[...strip.querySelectorAll("b")].map(el=>el.textContent.trim()).filter(Boolean);
  const items=existing.length>=4?existing:ITEMS;
  const group=items.map(name=>`<span class="enjaz-marquee-item">${escapeHtml(name)}</span>`).join("");
  const group2=group;
  strip.dataset.enjazMarqueeReady="1";
  strip.innerHTML=`
    <span aria-hidden="true">جاهز للمؤسسات الحديثة</span>
    <div>
      <div class="enjaz-enterprise-marquee" role="presentation" aria-hidden="true">
        <div class="enjaz-marquee-track">
          <div class="enjaz-marquee-group">${group}</div>
          <div class="enjaz-marquee-group">${group2}</div>
        </div>
      </div>
    </div>`;
};

const scan=()=>{
  document.querySelectorAll("#enjaz-public .logo-strip").forEach(buildMarquee);
};

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",scan,{once:true});
else scan();

new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
