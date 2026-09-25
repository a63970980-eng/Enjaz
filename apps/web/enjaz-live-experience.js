/* ENJAZ LIVE EXPERIENCE — isolated public presentation layer */
(()=> {
  const BOOT_KEY = '__ENJAZ_LIVE_EXPERIENCE__';
  if (window[BOOT_KEY]) return;
  window[BOOT_KEY] = true;

  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';
  const GSAP_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.14.0/+esm';
  const LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.3.26/+esm';
  const POST_URL = 'https://cdn.jsdelivr.net/npm/postprocessing@6.37.8/+esm';

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => window.matchMedia('(max-width: 900px)').matches;

  async function boot(publicRoot) {
    if (!publicRoot || publicRoot.dataset.liveReady) return;
    publicRoot.dataset.liveReady = 'loading';

    try {
      const [{default:THREE},{gsap},{default:Lenis},{EffectComposer,RenderPass,BloomEffect,EffectPass}] =
        await Promise.all([
          import(THREE_URL),
          import(GSAP_URL),
          import(LENIS_URL),
          import(POST_URL)
        ]);

      if (!document.getElementById('enjaz-live-canvas')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'enjaz-live-canvas';
        canvas.setAttribute('aria-hidden','true');
        publicRoot.querySelector('.sf-hero')?.prepend(canvas);
      }

      const canvas = document.getElementById('enjaz-live-canvas');
      const hero = publicRoot.querySelector('.sf-hero');
      const stage = publicRoot.querySelector('.sf-hero-stage');
      if (!canvas || !hero || !stage) throw new Error('Live hero mount unavailable');

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xeef8ff, 0.035);

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.15, 8.5);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha:true,
        antialias:false,
        powerPreference:'high-performance'
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, mobile()?1.35:1.8));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene,camera));
      const bloom = new BloomEffect({
        intensity: mobile()?0.85:1.25,
        luminanceThreshold:0.28,
        luminanceSmoothing:0.7,
        mipmapBlur:true
      });
      composer.addPass(new EffectPass(camera,bloom));

      const root3d = new THREE.Group();
      scene.add(root3d);

      const ambient = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambient);
      const key = new THREE.PointLight(0x17a8e8, 18, 12, 2);
      key.position.set(-3,2,4);
      scene.add(key);
      const green = new THREE.PointLight(0x2e9b61, 13, 10, 2);
      green.position.set(3,-2,3);
      scene.add(green);

      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.05,3),
        new THREE.MeshPhysicalMaterial({
          color:0x0b75c9, emissive:0x0b75c9, emissiveIntensity:1.9,
          roughness:.18, metalness:.35, transparent:true, opacity:.92
        })
      );
      root3d.add(core);

      const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(.7,2),
        new THREE.MeshBasicMaterial({color:0x8ee8ff,transparent:true,opacity:.13,wireframe:true})
      );
      root3d.add(inner);

      const ringMat = new THREE.MeshBasicMaterial({
        color:0x1aa9df,transparent:true,opacity:.42,side:THREE.DoubleSide,
        blending:THREE.AdditiveBlending
      });
      [1.45,1.9,2.35].forEach((radius,i)=>{
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius,.008+i*.002,8,160),ringMat.clone());
        ring.rotation.set(i*.42, i*.7, i*.35);
        root3d.add(ring);
      });

      const nodeCount = mobile()?48:92;
      const positions = new Float32Array(nodeCount*3);
      const nodeObjects=[];
      for(let i=0;i<nodeCount;i++){
        const r=2.2+Math.random()*2.8;
        const a=Math.random()*Math.PI*2;
        const z=(Math.random()-.5)*4.8;
        positions[i*3]=Math.cos(a)*r;
        positions[i*3+1]=Math.sin(a)*r*.55;
        positions[i*3+2]=z;
        const n=new THREE.Mesh(
          new THREE.SphereGeometry(.025+Math.random()*.035,8,8),
          new THREE.MeshBasicMaterial({color:i%5===0?0x2e9b61:0x20b6ec,transparent:true,opacity:.7})
        );
        n.position.set(positions[i*3],positions[i*3+1],positions[i*3+2]);
        root3d.add(n); nodeObjects.push(n);
      }

      const linePositions=[];
      for(let i=0;i<nodeCount;i++){
        for(let j=i+1;j<nodeCount;j++){
          const dx=positions[i*3]-positions[j*3];
          const dy=positions[i*3+1]-positions[j*3+1];
          const dz=positions[i*3+2]-positions[j*3+2];
          if(dx*dx+dy*dy+dz*dz < 3.1) {
            linePositions.push(
              positions[i*3],positions[i*3+1],positions[i*3+2],
              positions[j*3],positions[j*3+1],positions[j*3+2]
            );
          }
        }
      }
      const lineGeo=new THREE.BufferGeometry();
      lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(linePositions,3));
      const lines=new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({
        color:0x5cc9ef,transparent:true,opacity:.12,blending:THREE.AdditiveBlending
      }));
      root3d.add(lines);

      const particleCount=mobile()?350:850;
      const particlePos=new Float32Array(particleCount*3);
      const particleVel=new Float32Array(particleCount*3);
      for(let i=0;i<particleCount;i++){
        particlePos[i*3]=(Math.random()-.5)*10;
        particlePos[i*3+1]=(Math.random()-.5)*6;
        particlePos[i*3+2]=(Math.random()-.5)*7;
        particleVel[i*3]=(Math.random()-.5)*.001;
        particleVel[i*3+1]=(Math.random()-.5)*.001;
        particleVel[i*3+2]=(Math.random()-.5)*.001;
      }
      const pGeo=new THREE.BufferGeometry();
      pGeo.setAttribute('position',new THREE.BufferAttribute(particlePos,3));
      const particles=new THREE.Points(pGeo,new THREE.PointsMaterial({
        color:0x54c8ef,size:mobile()?.018:.025,transparent:true,opacity:.42,
        blending:THREE.AdditiveBlending,depthWrite:false
      }));
      root3d.add(particles);

      const pointer={x:0,y:0,tx:0,ty:0};
      const onPointer=e=>{
        pointer.tx=(e.clientX/innerWidth-.5)*2;
        pointer.ty=(e.clientY/innerHeight-.5)*2;
      };
      window.addEventListener('pointermove',onPointer,{passive:true});

      let scrollProgress=0;
      let lenis=null;
      if(!reduced()){
        lenis=new Lenis({duration:1.15,smoothWheel:true,touchMultiplier:1.35});
        lenis.on('scroll',({progress})=>{scrollProgress=progress});
        const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};
        requestAnimationFrame(raf);
      }

      const resize=()=>{
        const r=hero.getBoundingClientRect();
        const w=Math.max(1,r.width),h=Math.max(1,r.height);
        camera.aspect=w/h;camera.updateProjectionMatrix();
        renderer.setSize(w,h,false);
        composer.setSize(w,h);
      };
      resize();
      addEventListener('resize',resize,{passive:true});

      let last=performance.now();
      const animate=now=>{
        const dt=Math.min(32,now-last);last=now;
        pointer.x+=(pointer.tx-pointer.x)*.045;
        pointer.y+=(pointer.ty-pointer.y)*.045;
        const t=now*.001;

        root3d.rotation.y += .0011;
        root3d.rotation.x = pointer.y*.08 + Math.sin(t*.18)*.035;
        root3d.rotation.y += pointer.x*.0018;
        core.rotation.x=t*.22;core.rotation.y=t*.31;
        inner.rotation.x=-t*.15;inner.rotation.z=t*.23;
        root3d.position.x=pointer.x*.32;
        root3d.position.y=-pointer.y*.18;
        camera.position.x+=(pointer.x*.32-camera.position.x)*.025;
        camera.position.y+=((.15+pointer.y*.22)-camera.position.y)*.025;

        nodeObjects.forEach((n,i)=>{
          n.position.y += Math.sin(t*.65+i)*.00045;
          n.material.opacity=.38+.25*(.5+.5*Math.sin(t*1.2+i));
        });
        particles.rotation.y=t*.012;
        particles.rotation.x=Math.sin(t*.1)*.04;

        const heroRect=hero.getBoundingClientRect();
        const vh=innerHeight||1;
        const local=Math.max(0,Math.min(1,(vh-heroRect.top)/(vh+heroRect.height)));
        root3d.scale.setScalar(1+local*.09);
        camera.position.z=8.5-local*.65;

        composer.render();
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);

      if(!reduced()){
        gsap.fromTo(stage,{opacity:0,scale:.96},{opacity:1,scale:1,duration:1.15,ease:'power3.out',delay:.12});
        gsap.to(core.scale,{x:1.06,y:1.06,z:1.06,duration:2.2,repeat:-1,yoyo:true,ease:'sine.inOut'});
        gsap.to(key,{intensity:23,duration:2.4,repeat:-1,yoyo:true,ease:'sine.inOut'});
      }

      publicRoot.dataset.liveReady='ready';
    } catch(error) {
      console.warn('[ENJAZ_LIVE_EXPERIENCE]',error);
      publicRoot.dataset.liveReady='fallback';
    }
  }

  const watch=()=>{
    const root=document.getElementById('enjaz-public');
    if(root) boot(root);
  };
  new MutationObserver(watch).observe(document.body,{childList:true,subtree:true});
  watch();
})();