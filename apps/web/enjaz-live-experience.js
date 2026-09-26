/* ENJAZ LIVE EXPERIENCE — product network engine (isolated public presentation) */
(()=> {
  const BOOT_KEY='__ENJAZ_LIVE_EXPERIENCE__V2__';
  if(window[BOOT_KEY]) return;
  window[BOOT_KEY]=true;

  const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';
  const GSAP_URL='https://cdn.jsdelivr.net/npm/gsap@3.14.0/+esm';
  const LENIS_URL='https://cdn.jsdelivr.net/npm/lenis@1.3.26/+esm';
  const POST_URL='https://cdn.jsdelivr.net/npm/postprocessing@6.37.8/+esm';

  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=()=>window.matchMedia('(max-width: 900px)').matches;

  async function boot(root){
    if(!root||root.dataset.liveReady) return;
    root.dataset.liveReady='loading';
    try{
      const [{default:THREE},{gsap},{default:Lenis},{EffectComposer,RenderPass,BloomEffect,EffectPass}]=await Promise.all([
        import(THREE_URL),import(GSAP_URL),import(LENIS_URL),import(POST_URL)
      ]);
      const hero=root.querySelector('.sf-hero'), stage=root.querySelector('.sf-hero-stage');
      if(!hero||!stage) throw new Error('hero mount unavailable');
      let canvas=document.getElementById('enjaz-live-canvas');
      if(!canvas){canvas=document.createElement('canvas');canvas.id='enjaz-live-canvas';canvas.setAttribute('aria-hidden','true');hero.prepend(canvas);}

      const scene=new THREE.Scene();
      scene.fog=new THREE.FogExp2(0xeef8ff,0.042);
      const camera=new THREE.PerspectiveCamera(34,1,.1,100);
      camera.position.set(0,.1,8.4);

      const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.25:1.7));
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.08;

      const composer=new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene,camera));
      const bloom=new BloomEffect({intensity:mobile()?.72:1.05,luminanceThreshold:.3,luminanceSmoothing:.72,mipmapBlur:true});
      composer.addPass(new EffectPass(camera,bloom));

      const network=new THREE.Group(); scene.add(network);
      const lights=new THREE.Group(); scene.add(lights);
      lights.add(new THREE.AmbientLight(0xffffff,1.45));
      const blue=new THREE.PointLight(0x169fe1,17,13,2); blue.position.set(-3,2.4,4); lights.add(blue);
      const green=new THREE.PointLight(0x2e9b61,12,10,2); green.position.set(3,-2,3); lights.add(green);

      // Central operational core: the visual metaphor is a live organization, not a decorative orb.
      const coreGroup=new THREE.Group(); network.add(coreGroup);
      const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.0,3),new THREE.MeshPhysicalMaterial({
        color:0x0878c9,emissive:0x0878c9,emissiveIntensity:1.55,roughness:.2,metalness:.3,transparent:true,opacity:.95
      }));
      coreGroup.add(core);
      const coreWire=new THREE.Mesh(new THREE.IcosahedronGeometry(1.18,2),new THREE.MeshBasicMaterial({
        color:0x6ee1ff,transparent:true,opacity:.16,wireframe:true
      })); coreGroup.add(coreWire);

      // Three semantic layers: workforce -> workflows -> command center.
      const layerRadii=[1.58,2.15,2.72];
      const layerColors=[0x18a9df,0x2e9b61,0x4c7fd9];
      const rings=[];
      layerRadii.forEach((radius,i)=>{
        const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.009+i*.001,8,180),
          new THREE.MeshBasicMaterial({color:layerColors[i],transparent:true,opacity:.38,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
        ring.rotation.set(.35+i*.32,.55+i*.43,.18+i*.27);
        network.add(ring); rings.push(ring);
      });

      const roleCount=mobile()?18:28;
      const roleGeo=new THREE.SphereGeometry(.055,8,8);
      const roleMat=new THREE.MeshBasicMaterial({color:0x25b5e8,transparent:true,opacity:.82});
      const roleMesh=new THREE.InstancedMesh(roleGeo,roleMat,roleCount);
      const dummy=new THREE.Object3D();
      const roleData=[];
      for(let i=0;i<roleCount;i++){
        const layer=i%3, radius=layerRadii[layer]+(.12*Math.random());
        const angle=(i/roleCount)*Math.PI*2+layer*.8;
        roleData.push({radius,angle,speed:(.12+.08*Math.random())*(i%2?-1:1),y:(Math.random()-.5)*.55,phase:Math.random()*6.28});
        dummy.position.set(Math.cos(angle)*radius,roleData[i].y+Math.sin(roleData[i].phase)*.12,Math.sin(angle)*radius*.62);
        dummy.scale.setScalar(.7+.45*Math.random()); dummy.updateMatrix(); roleMesh.setMatrixAt(i,dummy.matrix);
      }
      roleMesh.instanceMatrix.needsUpdate=true; network.add(roleMesh);

      // Workflow beams connect a sparse subset of the workforce to the operating core.
      const beamCount=mobile()?7:12, beamPos=new Float32Array(beamCount*6);
      const beamPhase=[];
      for(let i=0;i<beamCount;i++){
        const a=(i/beamCount)*Math.PI*2;
        const r=1.7+Math.random()*.7;
        beamPos[i*6]=Math.cos(a)*r; beamPos[i*6+1]=(Math.random()-.5)*.45; beamPos[i*6+2]=Math.sin(a)*r*.62;
        beamPos[i*6+3]=Math.cos(a)*.55; beamPos[i*6+4]=(Math.random()-.5)*.18; beamPos[i*6+5]=Math.sin(a)*.55*.62;
        beamPhase.push(Math.random()*6.28);
      }
      const beamGeo=new THREE.BufferGeometry(); beamGeo.setAttribute('position',new THREE.BufferAttribute(beamPos,3));
      const beams=new THREE.LineSegments(beamGeo,new THREE.LineBasicMaterial({color:0x39b9e9,transparent:true,opacity:.18,blending:THREE.AdditiveBlending}));
      network.add(beams);

      // Background field uses one draw call for predictable mobile performance.
      const particleCount=mobile()?300:720, p=new Float32Array(particleCount*3);
      for(let i=0;i<particleCount;i++){p[i*3]=(Math.random()-.5)*10;p[i*3+1]=(Math.random()-.5)*6;p[i*3+2]=(Math.random()-.5)*7;}
      const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(p,3));
      const particles=new THREE.Points(pg,new THREE.PointsMaterial({color:0x54c8ef,size:mobile()?.018:.024,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false}));
      scene.add(particles);

      const pointer={x:0,y:0,tx:0,ty:0};
      const onPointer=e=>{pointer.tx=(e.clientX/innerWidth-.5)*2;pointer.ty=(e.clientY/innerHeight-.5)*2};
      addEventListener('pointermove',onPointer,{passive:true});

      let lenis=null;
      if(!reduced()){
        lenis=new Lenis({duration:1.05,smoothWheel:true,touchMultiplier:1.25});
        const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)}; requestAnimationFrame(raf);
      }

      const resize=()=>{
        const r=hero.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);
        camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);composer.setSize(w,h);
      };
      resize(); addEventListener('resize',resize,{passive:true});

      let last=performance.now();
      const animate=now=>{
        const dt=Math.min(34,now-last); last=now; const t=now*.001;
        pointer.x+=(pointer.tx-pointer.x)*.045; pointer.y+=(pointer.ty-pointer.y)*.045;

        const hr=hero.getBoundingClientRect(), vh=innerHeight||1;
        const scroll=Math.max(0,Math.min(1,(vh-hr.top)/(vh+hr.height)));
        network.rotation.y=t*.045+pointer.x*.035;
        network.rotation.x=pointer.y*.055+Math.sin(t*.16)*.018;
        network.position.x=pointer.x*.24; network.position.y=-pointer.y*.12;
        core.rotation.x=t*.2; core.rotation.y=t*.3;
        coreWire.rotation.x=-t*.12; coreWire.rotation.z=t*.19;
        coreGroup.scale.setScalar(1+Math.sin(t*1.1)*.025+scroll*.07);

        rings.forEach((r,i)=>{r.rotation.z+=dt*.00005*(i%2?-1:1);r.rotation.x+=dt*.000025*(i+1);});
        for(let i=0;i<roleCount;i++){
          const d=roleData[i],a=d.angle+t*d.speed;
          dummy.position.set(Math.cos(a)*d.radius,d.y+Math.sin(t*.7+d.phase)*.12,Math.sin(a)*d.radius*.62);
          dummy.scale.setScalar(.72+.32*(.5+.5*Math.sin(t*1.5+d.phase)));
          dummy.updateMatrix(); roleMesh.setMatrixAt(i,dummy.matrix);
        }
        roleMesh.instanceMatrix.needsUpdate=true;
        for(let i=0;i<beamCount;i++){
          const phase=(t*1.2+beamPhase[i])%(Math.PI*2), pulse=.5+.5*Math.sin(phase);
          beamPos[i*6+1]+=Math.sin(t*.8+i)*.00012;
          beamPos[i*6+4]=beamPos[i*6+4]*.92+Math.sin(t*.7+i)*.0008;
        }
        beamGeo.attributes.position.needsUpdate=true;
        beams.material.opacity=.11+.09*(.5+.5*Math.sin(t*1.4));
        particles.rotation.y=t*.009; particles.rotation.x=Math.sin(t*.11)*.035;

        camera.position.x+=(pointer.x*.28-camera.position.x)*.025;
        camera.position.y+=((.1+pointer.y*.18)-camera.position.y)*.025;
        camera.position.z+=(8.4-scroll*.5-camera.position.z)*.025;

        composer.render(); requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);

      if(!reduced()){
        gsap.fromTo(stage,{opacity:0,scale:.975},{opacity:1,scale:1,duration:1.1,ease:'power3.out',delay:.08});
        gsap.to(core.scale,{x:1.045,y:1.045,z:1.045,duration:2.2,repeat:-1,yoyo:true,ease:'sine.inOut'});
        gsap.to(blue,{intensity:22,duration:2.5,repeat:-1,yoyo:true,ease:'sine.inOut'});
      }
      root.dataset.liveReady='ready';
    }catch(err){console.warn('[ENJAZ_LIVE_EXPERIENCE]',err);root.dataset.liveReady='fallback';}
  }

  const watch=()=>{const root=document.getElementById('enjaz-public');if(root)boot(root)};
  new MutationObserver(watch).observe(document.body,{childList:true,subtree:true}); watch();
})();