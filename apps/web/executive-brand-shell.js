(() => {
  const css = `
  :root{--enjaz-ink:#0b211b;--enjaz-deep:#092019;--enjaz-teal:#1c8a78;--enjaz-gold:#c3a15d;--enjaz-paper:#f5f6f2;--enjaz-line:#dce3de;--enjaz-muted:#68766f}
  body{background:var(--enjaz-paper)!important;color:var(--enjaz-ink)!important}
  .side{background:linear-gradient(180deg,#081d17 0%,#0c2a21 58%,#092019 100%)!important;border-left:1px solid rgba(255,255,255,.06)!important;box-shadow:12px 0 35px rgba(4,25,19,.08)!important}
  .side .brand{padding:30px 24px 26px!important;border-bottom:1px solid rgba(255,255,255,.09)!important;display:grid!important;grid-template-columns:54px 1fr!important;column-gap:13px!important;align-items:center!important}
  .side .brand .brand-mark{width:54px!important;height:54px!important;border-radius:15px!important;background:linear-gradient(145deg,#1b8c79,#0e5d4f)!important;color:#d0b06b!important;display:grid!important;place-items:center!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),0 10px 28px rgba(0,0,0,.18)!important}
  .side .brand .brand-mark svg{width:38px!important;height:38px!important}
  .side .brand .brand-name{font-size:25px!important;font-weight:800!important;letter-spacing:-.5px!important;color:#fff!important}
  .side .brand small{grid-column:2!important;color:#aabdb6!important;font-size:8px!important;letter-spacing:1.1px!important;margin-top:-8px!important;white-space:nowrap!important}
  .side .nav{padding:22px 13px!important;gap:5px!important}
  .side .nav button{border-radius:10px!important;color:#b8c8c1!important;font-weight:600!important;text-align:right!important;padding:12px 15px!important;border:1px solid transparent!important}
  .side .nav button:hover{background:rgba(255,255,255,.055)!important;color:#fff!important}
  .side .nav button.active{background:rgba(195,161,93,.13)!important;color:#fff!important;border-color:rgba(195,161,93,.2)!important;box-shadow:inset 3px 0 0 #c3a15d!important}
  .main{background:var(--enjaz-paper)!important;padding:0!important;max-width:none!important}
  #content{max-width:1540px;margin:0 auto;padding:0 52px 70px!important}
  .enjaz-command{position:relative;margin:0 -52px 34px;padding:48px 52px 42px;background:#0b241c;color:#fff;overflow:hidden;border-bottom:1px solid #173c31}
  .enjaz-command:after{content:"";position:absolute;width:500px;height:500px;border:1px solid rgba(195,161,93,.17);border-radius:50%;left:-180px;top:-310px;box-shadow:0 0 0 55px rgba(28,138,120,.025),0 0 0 110px rgba(195,161,93,.018)}
  .enjaz-command .ey{font-size:11px;letter-spacing:2.4px;color:#9fc4b9;font-weight:700;margin-bottom:12px}
  .enjaz-command h1{position:relative;z-index:1;font-size:42px;line-height:1.12;letter-spacing:-1.5px;margin:0 0 12px;color:#fff;font-weight:800}
  .enjaz-command p{position:relative;z-index:1;margin:0;color:#b6c9c2;font-size:15px;max-width:700px}
  .enjaz-command .gold{color:#d5b978}
  .enjaz-command .command-row{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:30px;margin-top:32px}
  .enjaz-command .command-stats{display:flex;gap:30px;flex-wrap:wrap}
  .enjaz-command .metric{min-width:110px;border-right:1px solid rgba(255,255,255,.12);padding-right:20px}.enjaz-command .metric b{display:block;font-size:25px;color:#fff}.enjaz-command .metric span{font-size:11px;color:#91aaa1}
  .enjaz-command .command-btn{border:1px solid rgba(195,161,93,.5);background:#c3a15d;color:#10251e;border-radius:8px;padding:13px 20px;font-weight:800;cursor:pointer}
  .workforce-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:0 0 17px}.workforce-intro h2{margin:0;font-size:24px;letter-spacing:-.5px}.workforce-intro p{margin:6px 0 0;color:var(--enjaz-muted);font-size:13px}.workforce-intro .label{font-size:10px;letter-spacing:1.7px;color:var(--enjaz-teal);font-weight:800}
  .workforce-board{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:18px;margin-bottom:30px}.workforce-roster,.workforce-side{background:#fff;border:1px solid var(--enjaz-line);border-radius:13px;box-shadow:0 8px 28px rgba(19,42,33,.045)}
  .roster-head{display:grid;grid-template-columns:2fr 1.1fr 1fr .8fr;padding:13px 20px;border-bottom:1px solid var(--enjaz-line);color:#7a8781;font-size:10px;font-weight:800;letter-spacing:.8px}.roster-row{display:grid;grid-template-columns:2fr 1.1fr 1fr .8fr;align-items:center;padding:16px 20px;border-bottom:1px solid #edf1ee}.roster-row:last-child{border-bottom:0}.person{display:flex;align-items:center;gap:12px}.avatar-e{width:39px;height:39px;border-radius:50%;display:grid;place-items:center;background:#e7f1ed;color:#176653;font-weight:800;border:1px solid #d1e3dc}.person strong{font-size:13px}.person small{display:block;color:#84918b;font-size:11px;margin-top:3px}.role-cell,.goal-cell{font-size:11px;color:#53635c}.live{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#21715f;font-weight:700}.live i{width:7px;height:7px;border-radius:50%;background:#2e9c82;box-shadow:0 0 0 4px rgba(46,156,130,.1)}
  .workforce-side{padding:21px}.workforce-side .cap{font-size:10px;color:var(--enjaz-teal);font-weight:800;letter-spacing:1.5px}.workforce-side h3{margin:7px 0 5px;font-size:18px}.workforce-side p{font-size:12px;line-height:1.8;color:#77847e;margin:0 0 18px}.sector{padding:12px 0;border-top:1px solid #e8eeea;display:flex;justify-content:space-between;font-size:12px}.sector b{font-size:11px;color:#1c5e50}.sector span{color:#7b8781}.sector-btn{margin-top:15px;width:100%;border:1px solid #c9d8d1;background:#f8faf8;border-radius:8px;padding:11px;font-weight:800;color:#174b3a;cursor:pointer}.sector-btn:hover{background:#eef5f1}
  .operating-grid{display:grid;grid-template-columns:1.45fr 1fr;gap:18px}.op-panel{background:#fff;border:1px solid var(--enjaz-line);border-radius:13px;padding:22px}.op-panel h3{margin:0;font-size:16px}.op-panel .cap{font-size:10px;color:#84928b;letter-spacing:1.5px;font-weight:800}.op-line{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #edf1ee}.op-line:last-child{border-bottom:0}.op-line strong{font-size:12px}.op-line small{display:block;color:#89958f;margin-top:3px;font-size:10px}.pill-e{padding:5px 8px;border-radius:999px;background:#eef6f2;color:#22725e;font-size:9px;font-weight:800}
  @media(max-width:1050px){#content{padding:0 24px 50px!important}.enjaz-command{margin:0 -24px 28px;padding:36px 24px}.workforce-board,.operating-grid{grid-template-columns:1fr}.roster-head{display:none}.roster-row{grid-template-columns:1fr auto}.roster-row .role-cell,.roster-row .goal-cell{display:none}}
  @media(max-width:700px){.side{width:230px!important}.enjaz-command h1{font-size:31px}.enjaz-command .command-row{align-items:flex-start;flex-direction:column}.command-stats{gap:14px!important}.enjaz-command .metric{min-width:80px}.workforce-intro{display:block}.workforce-side{order:-1}}
  `;
  const style=document.createElement('style');style.id='enjaz-executive-brand';style.textContent=css;document.head.appendChild(style);

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials=n=>(String(n||'م').trim().charAt(0)||'م');
  let done=false;
  function upgrade(){
    const content=document.querySelector('#content');
    if(!content||done)return;
    const hero=content.querySelector('.hero');
    if(!hero)return;
    const text=content.innerText||'';
    const employeeNodes=[...content.querySelectorAll('.person-row')];
    const stats=[...hero.querySelectorAll('.hero-meta span')].map(x=>x.textContent.trim());
    const employeeCount=(text.match(/الموظفون الرقميون\s+(\d+)/)||[])[1]||'0';
    const active=(text.match(/(\d+) موظف نشط/)||[])[1]||employeeCount;
    const running=(text.match(/(\d+) قيد التنفيذ/)||[])[1]||'0';
    const pending=(text.match(/(\d+) موافقة معلقة/)||[])[1]||'0';
    const people=employeeNodes.slice(0,6).map(n=>{const name=n.querySelector('strong')?.textContent||'موظف رقمي';const role=n.querySelector('small')?.textContent||'موظف عمليات';return {name,role}});
    done=true;
    content.innerHTML=`
      <section class="enjaz-command">
        <div class="ey">ENJAZ · COMPANY OPERATING SYSTEM</div>
        <h1>الشركة تعمل.<br><span class="gold">قوة العمل الرقمية تتولى التنفيذ.</span></h1>
        <p>مركز القيادة التنفيذي لإدارة الموظفين الرقميين والمهام والقرارات والنتائج — من الهدف إلى الإنجاز.</p>
        <div class="command-row"><div class="command-stats">
          <div class="metric"><b>${esc(active)}</b><span>موظفون نشطون</span></div>
          <div class="metric"><b>${esc(running)}</b><span>أعمال قيد التنفيذ</span></div>
          <div class="metric"><b>${esc(pending)}</b><span>قرارات تحتاج اعتماد</span></div>
        </div><button class="command-btn" data-exec-nav="employees">إدارة قوة العمل ←</button></div>
      </section>
      <section class="workforce-intro"><div><div class="label">DIGITAL WORKFORCE</div><h2>قوة العمل الرقمية</h2><p>الموظفون الذين ينفذون أعمال الشركة فعليًا، وليس مجرد أدوات ذكاء اصطناعي.</p></div></section>
      <section class="workforce-board">
        <div class="workforce-roster"><div class="roster-head"><span>الموظف</span><span>الدور</span><span>الهدف</span><span>الحالة</span></div>
          ${people.length?people.map(p=>`<div class="roster-row"><div class="person"><span class="avatar-e">${esc(initials(p.name))}</span><div><strong>${esc(p.name)}</strong><small>موظف رقمي · ENJAZ</small></div></div><div class="role-cell">${esc(p.role)}</div><div class="goal-cell">تشغيل وتحسين العمل</div><div class="live"><i></i> نشط</div></div>`).join(''):`<div style="padding:38px 20px;text-align:center"><strong>قوة العمل جاهزة للانطلاق</strong><p style="color:#84918b;font-size:12px">اختر قطاعًا لتفعيل أول فريق من الموظفين الرقميين.</p></div>`}
        </div>
        <aside class="workforce-side"><div class="cap">READY WORKFORCE</div><h3>ابدأ بقسم كامل</h3><p>اختر مجال شركتك وسيُجهّز لك الفريق المناسب بالأدوار والمهارات والأهداف.</p>
          <div class="sector"><span>المطاعم والضيافة</span><b>فريق جاهز</b></div><div class="sector"><span>المستشفيات</span><b>فريق جاهز</b></div><div class="sector"><span>الشركات</span><b>فريق جاهز</b></div><div class="sector"><span>الجهات الحكومية</span><b>فريق جاهز</b></div>
          <button class="sector-btn" data-exec-nav="employees">استعراض الموظفين والفرق</button>
        </aside>
      </section>
      <section class="operating-grid"><div class="op-panel"><div class="cap">OPERATING RHYTHM</div><h3>كيف تعمل إنجاز</h3>
        <div class="op-line"><div><strong>الهدف</strong><small>تحديد النتيجة المطلوبة</small></div><span class="pill-e">01</span></div>
        <div class="op-line"><div><strong>التخطيط والتنفيذ</strong><small>الموظف يفهم المهمة وينفذها عبر أدواته</small></div><span class="pill-e">02</span></div>
        <div class="op-line"><div><strong>المراجعة والاعتماد</strong><small>القرارات الحساسة تبقى تحت رقابة الإنسان</small></div><span class="pill-e">03</span></div>
        <div class="op-line"><div><strong>النتيجة والسجل</strong><small>كل عمل قابل للتتبع والتدقيق</small></div><span class="pill-e">04</span></div>
      </div><div class="op-panel"><div class="cap">COMMAND</div><h3>أوامر سريعة</h3>
        <div class="op-line"><div><strong>قوة العمل الرقمية</strong><small>الموظفون، الأدوار، الأداء</small></div><span class="pill-e" data-exec-nav="employees">فتح</span></div>
        <div class="op-line"><div><strong>صندوق العمل</strong><small>المهام والنتائج</small></div><span class="pill-e" data-exec-nav="tasks">فتح</span></div>
        <div class="op-line"><div><strong>القرارات والموافقات</strong><small>العمل الذي يحتاج تدخلك</small></div><span class="pill-e" data-exec-nav="approvals">فتح</span></div>
      </div></section>`;
    content.querySelectorAll('[data-exec-nav]').forEach(b=>b.onclick=()=>{const n=b.dataset.execNav;const nav=document.querySelector(`[data-nav="${n}"]`);if(nav)nav.click()});
  }
  const observer=new MutationObserver(upgrade);observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(upgrade,50);setTimeout(upgrade,500);setTimeout(upgrade,1500);
})();
