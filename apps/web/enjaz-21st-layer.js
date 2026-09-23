/* ENJAZ 21st-inspired interaction behavior — presentation only. */
if(window.__ENJAZ_PUBLIC_SHOWN__){
  const interactiveCards=document.querySelectorAll(
    '#enjaz-public .employee-catalog-preview article,'+
    '#enjaz-public .cap-card,'+
    '#enjaz-public .flow-step,'+
    '#enjaz-public .trust-grid>div'
  );
  if(window.matchMedia('(pointer:fine)').matches){
    interactiveCards.forEach(card=>{
      card.addEventListener('pointermove',event=>{
        const r=card.getBoundingClientRect();
        card.style.setProperty('--mx',((event.clientX-r.left)/r.width*100)+'%');
        card.style.setProperty('--my',((event.clientY-r.top)/r.height*100)+'%');
      });
      card.addEventListener('pointerleave',()=>{
        card.style.removeProperty('--mx');card.style.removeProperty('--my');
      });
    });
  }
  const nav=document.querySelector('#enjaz-public .public-nav');
  const syncNav=()=>{
    nav?.style.setProperty('box-shadow',scrollY>8?'0 10px 30px rgba(19,61,105,.09)':'0 8px 30px rgba(19,61,105,.045)');
  };
  syncNav();addEventListener('scroll',syncNav,{passive:true});
}
