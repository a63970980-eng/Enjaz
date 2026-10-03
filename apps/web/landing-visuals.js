/* ENJAZ live product-scene enhancement. Public landing only; no auth/runtime dependencies. */
export function mountEnjazVisualScenes(root){
  if(!root || root.dataset.visualScenesMounted) return;
  root.dataset.visualScenesMounted="true";
  const demo=root.querySelector(".pp-live-demo");
  if(!demo) return;

  const scenes=document.createElement("section");
  scenes.className="pp-scenes";
  scenes.id="product-scenes";
  scenes.innerHTML=`
    <div class="pp-container">
      <div class="pp-section-head pp-scenes-head">
        <span class="pp-kicker">PRODUCT SCENES · DEMO MODE</span>
        <h2>لا تشاهد بطاقات. شاهد العمل وهو يتحرك.</h2>
        <p>مشاهد تفاعلية توضيحية تُظهر كيف تتحول نية المؤسسة إلى قرار، ثم إلى تنفيذ يمكن متابعته وتدقيقه.</p>
      </div>

      <div class="pp-scene-grid">
        <article class="pp-scene pp-scene-command">
          <div class="pp-scene-copy">
            <span class="pp-scene-index">01 / COMMAND CENTER</span>
            <h3>المؤسسة تتحرك أمامك</h3>
            <p>الأحداث تنتقل بين الطلب، التخطيط، الموافقة والتنفيذ في مسار واحد.</p>
            <span class="pp-scene-demo-badge"><i></i> LIVE PREVIEW</span>
          </div>
          <div class="pp-scene-visual pp-command-visual">
            <div class="pp-live-line"><span>NEW TASK</span><b></b><span>AI COORDINATOR</span><b></b><span>HUMAN APPROVAL</span></div>
            <div class="pp-command-radar"><span class="radar-core">ENJAZ</span><i class="radar-ring r1"></i><i class="radar-ring r2"></i><i class="radar-ring r3"></i><b class="radar-node rn1">TASK</b><b class="radar-node rn2">AI</b><b class="radar-node rn3">POLICY</b><b class="radar-node rn4">AUDIT</b></div>
            <div class="pp-telemetry"><span>ACTIVITY STREAM</span><em>DEMO</em><div><i></i>خطة المهمة جاهزة للمراجعة</div><div><i></i>الصلاحيات تم التحقق منها</div><div><i></i>قرار حساس ينتظر الإنسان</div></div>
          </div>
        </article>

        <article class="pp-scene pp-scene-chat">
          <div class="pp-scene-copy">
            <span class="pp-scene-index">02 / HUMAN × AI</span>
            <h3>محادثة حية، لا شاشة جامدة</h3>
            <p>الموظف الرقمي يشرح ما سيفعله، والإنسان يبقى داخل حلقة القرار.</p>
            <span class="pp-scene-demo-badge"><i></i> INTERACTIVE</span>
          </div>
          <div class="pp-scene-visual pp-chat-visual">
            <div class="pp-chat-window">
              <header><span class="pp-avatar">AI</span><div><strong>AI Operations Worker</strong><small>متصل · DEMO MODE</small></div><i></i></header>
              <div class="pp-chat-messages">
                <div class="scene-msg ai"><small>AI</small><p>أعددت خطة التنفيذ وفق السياسة الحالية.</p></div>
                <div class="scene-msg human"><small>أنت</small><p>اعرض لي الخطوة الحساسة.</p></div>
                <div class="scene-msg ai"><small>AI</small><p>تحتاج هذه الخطوة موافقة بشرية قبل التنفيذ.</p></div>
                <div class="scene-typing"><i></i><i></i><i></i><span>AI يكتب...</span></div>
              </div>
              <footer><span>اكتب توجيهًا توضيحيًا…</span><b>↑</b></footer>
            </div>
          </div>
        </article>

        <article class="pp-scene pp-scene-workforce">
          <div class="pp-scene-copy">
            <span class="pp-scene-index">03 / DIGITAL WORKFORCE</span>
            <h3>48 موظفًا، شبكة عمل واحدة</h3>
            <p>الدور لا يتغير عند الانتقال بين القطاعات؛ السياق والمهارات والمعرفة والأدوات والسياسات والصلاحيات هي التي تتغير.</p>
            <span class="pp-scene-demo-badge"><i></i> 48 DIGITAL WORKFORCE</span>
          </div>
          <div class="pp-scene-visual pp-network-visual">
            <div class="pp-network-core"><strong>48</strong><small>DIGITAL<br/>WORKFORCE</small></div>
            <span class="network-node nn1">MANAGER</span><span class="network-node nn2">ANALYST</span><span class="network-node nn3">OPS</span><span class="network-node nn4">CX</span><span class="network-node nn5">DATA</span>
            <i class="network-orbit no1"></i><i class="network-orbit no2"></i><i class="network-orbit no3"></i>
            <div class="pp-network-labels"><span>SKILLS</span><span>TOOLS</span><span>POLICIES</span><span>KNOWLEDGE</span></div>
          </div>
        </article>

        <article class="pp-scene pp-scene-govern">
          <div class="pp-scene-copy">
            <span class="pp-scene-index">04 / GOVERNANCE</span>
            <h3>الذكاء يتحرك داخل حدود واضحة</h3>
            <p>السياسة تسبق الفعل. الموافقة تسبق القرار الحساس. وسجل التدقيق يحفظ المسار.</p>
            <span class="pp-scene-demo-badge"><i></i> CONTROLLED AUTONOMY</span>
          </div>
          <div class="pp-scene-visual pp-govern-visual">
            <div class="pp-policy-engine"><span class="engine-title">POLICY ENGINE</span><div class="policy-rule"><b>01</b><span>ROLE</span><i>PASS</i></div><div class="policy-rule"><b>02</b><span>PERMISSION</span><i>PASS</i></div><div class="policy-rule"><b>03</b><span>APPROVAL</span><i>WAIT</i></div><div class="policy-rule"><b>04</b><span>AUDIT TRAIL</span><i>READY</i></div></div>
            <div class="pp-govern-shield">✓<small>HUMAN<br/>CONTROL</small></div>
          </div>
        </article>
      </div>
    </div>`;
  demo.parentElement.insertBefore(scenes,demo.nextSibling);

  const chatMessages=scenes.querySelector(".pp-chat-messages");
  if(chatMessages){
    const messages=[...chatMessages.querySelectorAll(".scene-msg")];
    messages.forEach((m,i)=>{m.style.animationDelay=(i*.9+.4)+"s"});
  }
}
