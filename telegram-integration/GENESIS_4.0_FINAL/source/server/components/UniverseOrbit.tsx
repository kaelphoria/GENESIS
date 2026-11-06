'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
type W={id:string;title:string;description:string;slug?:string;_count?:{actions:number;memories:number}};
const S=[
['ABUNDANCE','#e7bd79','#8e6136','#3a2418',8.5,.15,'rocky'],
['KNOWLEDGE','#b7ddf5','#397ca4','#132c47',11,-.11,'ice'],
['CONNECTION','#d0a9ee','#8256a7','#302044',13.6,.09,'rocky'],
['PHYSICAL','#a8e0bd','#388c68','#153c35',16.3,-.075,'ocean'],
['POWER','#ef967a','#a84735','#431a1b',19.2,.061,'volcanic'],
['CREATIVITY','#e1e8f0','#8495a6','#354353',22.2,-.052,'rocky'],
['HARMONY','#9ce2dc','#3c9c9b','#17464e',25.5,.043,'gas'],
['LOVE','#e9a9c4','#a4547b','#411e39',29,-.036,'gas'],
['FREEDOM','#b9d9f4','#587f9f','#1b304b',32.5,.03,'ice']
] as const;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const ease=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function texture(i:number,kind:string,light:string,mid:string,dark:string){
 const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d')!;
 const bg=g.createLinearGradient(0,0,0,512);bg.addColorStop(0,light);bg.addColorStop(.52,mid);bg.addColorStop(1,dark);g.fillStyle=bg;g.fillRect(0,0,1024,512);
 let seed=i*12347+99;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let n=0;n<(kind==='gas'?100:260);n++){const x=rnd()*1024,y=rnd()*512;g.globalAlpha=.05+rnd()*.22;g.fillStyle=n%3?light:dark;g.beginPath();g.ellipse(x,y,kind==='gas'?100+rnd()*220:8+rnd()*90,kind==='gas'?2+rnd()*18:4+rnd()*35,rnd()*2,0,Math.PI*2);g.fill();}
 if(kind==='volcanic'){for(let n=0;n<42;n++){g.globalAlpha=.7;g.strokeStyle='#ffc27c';g.lineWidth=1+rnd()*2;g.beginPath();let x=rnd()*1024,y=rnd()*512;g.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*60;y+=(rnd()-.5)*55;g.lineTo(x,y)}g.stroke();}}
 g.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function glow(color:string){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{glowColor:{value:new THREE.Color(color)}},vertexShader:'varying vec3 n; varying vec3 v; void main(){n=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);v=-p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 glowColor; varying vec3 n; varying vec3 v; void main(){float f=pow(1.0-max(dot(normalize(n),normalize(v)),0.0),2.3);gl_FragColor=vec4(glowColor,f*.58);}'})}
export default function UniverseOrbit<W extends WBase>({worlds,onSelect}:{worlds:W[];onSelect:(world:W)=>void}){
 const host=useRef<HTMLDivElement>(null),api=useRef<{select:(i:number)=>void;reset:()=>void}|null>(null),[intro,setIntro]=useState(false),[active,setActive]=useState<string|null>(null),[label,setLabel]=useState('');
 onSelectRef.current=onSelect;useEffect(()=>{const el=host.current;if(!el)return;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'})}catch{return}
 let dead=false,raf=0;const mobile=matchMedia('(max-width:700px)').matches,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.3:1.7));renderer.setSize(el.clientWidth,el.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;el.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#03060b');scene.fog=new THREE.FogExp2('#07101a',.0018);
 const camera=new THREE.PerspectiveCamera(42,el.clientWidth/el.clientHeight,.1,800);camera.position.set(0,8,88);
 const root=new THREE.Group();scene.add(root);scene.add(new THREE.AmbientLight('#8196ad',.62));
 const sun=new THREE.PointLight('#f0d7b0',420,150,1.7);sun.position.set(-16,18,20);scene.add(sun);
 const blue=new THREE.PointLight('#8cb9df',170,140,2);blue.position.set(30,-10,-20);scene.add(blue);
 // ENTITY and accretion disc.
 const core=new THREE.Group();root.add(core);core.add(new THREE.Mesh(new THREE.SphereGeometry(2.15,64,48),new THREE.MeshBasicMaterial({color:'#000104'})));
 const disk=new THREE.Mesh(new THREE.TorusGeometry(3.1,.34,16,180),new THREE.MeshBasicMaterial({color:'#d6a875',transparent:true,opacity:.75,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));disk.rotation.x=1.18;disk.rotation.z=-.22;core.add(disk);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(2.65,.09,10,160),new THREE.MeshBasicMaterial({color:'#b8d8ef',transparent:true,opacity:.68,blending:THREE.AdditiveBlending}));inner.rotation.copy(disk.rotation);core.add(inner);
 core.add(new THREE.Mesh(new THREE.SphereGeometry(2.45,48,40),glow('#a5c9e4')));
 const planets:THREE.Group[]=[];const clickable:THREE.Object3D[]=[];
 const geo=new THREE.SphereGeometry(1,64,48);
 S.forEach((s,i)=>{const [name,light,mid,dark,orbit,speed,kind]=s;
  const curve=new THREE.EllipseCurve(0,0,orbit,orbit*.61,0,Math.PI*2,false,0);const pts=curve.getPoints(240).map(p=>new THREE.Vector3(p.x,0,p.y));const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#9db6cc',transparent:true,opacity:.17}));line.rotation.y=(i-4)*.025;root.add(line);
  const group=new THREE.Group();group.rotation.y=(i-4)*.025;
  const material=new THREE.MeshStandardMaterial({map:texture(i,kind,light,mid,dark),roughness:.91,metalness:.015});const ball=new THREE.Mesh(geo,material);const size=[.9,.78,.85,1.02,1.16,.84,1.42,1.03,1.24][i];ball.scale.setScalar(size);group.add(ball);clickable.push(ball);
  const clouds=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:light,transparent:true,opacity:kind==='gas'?.16:.055,roughness:1,depthWrite:false}));clouds.scale.setScalar(size*1.018);group.add(clouds);
  group.add(new THREE.Mesh(new THREE.SphereGeometry(size*1.1,40,32),glow(light)));
  if([0,7,8].includes(i)){const ring=new THREE.Mesh(new THREE.RingGeometry(size*1.35,size*2,128),new THREE.MeshBasicMaterial({color:light,side:THREE.DoubleSide,transparent:true,opacity:.42,depthWrite:false}));ring.rotation.x=Math.PI/2.25;ring.rotation.z=.18;group.add(ring)}
  if([3,6].includes(i)){const moon=new THREE.Group();const m=new THREE.Mesh(new THREE.SphereGeometry(size*.13,20,16),new THREE.MeshStandardMaterial({color:'#c8d0d6'}));m.position.x=size*1.9;moon.add(m);group.add(moon);(group as any).moon=moon}
  group.userData={world:worlds[i],index:i};root.add(group);planets.push(group);
 });
 // Deep star field, sparse drifting dust and distant nebula.
 const count=mobile?850:1800,pos=new Float32Array(count*3),col=new Float32Array(count*3);for(let i=0;i<count;i++){const r=90+Math.random()*240,a=Math.random()*Math.PI*2,u=Math.random()*2-1;pos.set([r*Math.sqrt(1-u*u)*Math.cos(a),r*u,r*Math.sqrt(1-u*u)*Math.sin(a)],i*3);const c=new THREE.Color(i%17===0?'#e5c89d':i%5===0?'#a6c9e8':'#9aacc0');col.set([c.r,c.g,c.b],i*3)}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));sg.setAttribute('color',new THREE.BufferAttribute(col,3));const stars=new THREE.Points(sg,new THREE.PointsMaterial({size:.75,vertexColors:true,transparent:true,opacity:.8}));scene.add(stars);
 const dustN=mobile?100:260,dp=new Float32Array(dustN*3);for(let i=0;i<dustN;i++)dp.set([(Math.random()-.5)*90,(Math.random()-.5)*40,(Math.random()-.5)*90],i*3);const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));const dust=new THREE.Points(dg,new THREE.PointsMaterial({color:'#b5cce0',size:.12,transparent:true,opacity:.38}));scene.add(dust);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let chosen=-1,selectAt=0,start=performance.now(),last=start,elapsed=0,yaw=0,targetYaw=0,pitch=0,targetPitch=0,down=false,moved=false,x0=0,y0=0,downX=0,downY=0;
 const choose=(e:PointerEvent)=>{if(moved)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(clickable,false)[0];if(hit){const i=planets.findIndex(p=>p===hit.object.parent);if(i>=0)begin(i)}};
 const begin=(i:number)=>{if(chosen>=0)return;chosen=i;selectAt=performance.now();setActive(worlds[i]?.id||'');setLabel(worlds[i]?.title||S[i][0]);window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium')};
 const reset=()=>{chosen=-1;start=performance.now();setActive(null);setIntro(false)};
 api.current={select:begin,reset};
 const onDown=(e:PointerEvent)=>{down=true;moved=false;x0=e.clientX;y0=e.clientY;downX=e.clientX;downY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)};const onMove=(e:PointerEvent)=>{if(down&&chosen<0){if(Math.hypot(e.clientX-downX,e.clientY-downY)>7)moved=true;targetYaw+=(e.clientX-x0)*.003;targetPitch=clamp(targetPitch+(e.clientY-y0)*.002,-.4,.4);x0=e.clientX;y0=e.clientY}};const onUp=()=>{down=false};
 renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointermove',onMove);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointercancel',onUp);renderer.domElement.addEventListener('click',choose);renderer.domElement.style.touchAction='pan-y';renderer.domElement.style.cursor='grab';
 const ro=new ResizeObserver(()=>{if(!el.clientWidth||!el.clientHeight)return;camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)});ro.observe(el);
 const tick=(now:number)=>{if(dead)return;raf=requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;
  planets.forEach((p,i)=>{const s=S[i],a=elapsed*s[5]+i*.68;p.position.set(Math.cos(a)*s[4],Math.sin(a*.75+i)*.24,Math.sin(a)*s[4]*.61);p.rotation.y+=dt*(.07+i*.008);const m=(p as any).moon as THREE.Group|undefined;if(m)m.rotation.y+=dt*.28});
  disk.rotation.z+=dt*.035;inner.rotation.z-=dt*.025;core.rotation.y+=dt*.025;stars.rotation.y+=dt*.0006;dust.rotation.y-=dt*.008;
  if(chosen<0){yaw+=(targetYaw-yaw)*.04;pitch+=(targetPitch-pitch)*.04;root.rotation.y=yaw;root.rotation.x=pitch;const t=reduced?1:clamp((now-start)/6200,0,1);const z=reduced?58:14+44*ease(t);camera.position.lerp(new THREE.Vector3(Math.sin(yaw)*z,8+pitch*15,z*Math.cos(yaw)),.025);camera.lookAt(0,0,0);if(t>=1)setIntro(true)}
  else{const p=planets[chosen],target=new THREE.Vector3();p.getWorldPosition(target);const dir=new THREE.Vector3().subVectors(camera.position,target).normalize();camera.position.lerp(target.clone().add(dir.multiplyScalar(5.4)).add(new THREE.Vector3(0,1,0)),.026);camera.lookAt(target);if(now-selectAt>1900){const w=p.userData.world as W;chosen=-1;onSelectRef.current?.(w)}}
  renderer.render(scene,camera);
 };raf=requestAnimationFrame(tick);
 return()=>{dead=true;cancelAnimationFrame(raf);ro.disconnect();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointercancel',onUp);renderer.domElement.removeEventListener('click',choose);scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points||o instanceof THREE.LineLoop){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(v=>v.dispose());else m.dispose()}});renderer.dispose();renderer.domElement.remove()};
 },[worlds]);
 return <section className={'eh-universe'+(intro?' intro-done':'')} aria-label="GENESIS orbital universe"><div className="eh-three-host" ref={host}/><div className="eh-vignette"/><div className="eh-topline"><span>GENESIS / DEEP SPACE OBSERVATORY</span><span>SECTOR 09 · PRIVATE</span></div><div className="eh-core-label"><i/> ENTITY <small>GRAVITATIONAL CORE</small></div><div className="eh-title"><span>THE LIVING UNIVERSE</span><b>Beyond the known.</b><p>Девять миров. Одна система. Твоя собственная вселенная.</p></div><div className="eh-world-index">{worlds.map((w,i)=><button key={w.id} onClick={()=>api.current?.select(i)} disabled={!!active}><span>{String(i+1).padStart(2,'0')}</span>{S[i]?.[0]||w.title.toUpperCase()}</button>)}</div><div className="eh-bottomline"><span><i/> ORBITAL SYSTEM ONLINE</span><span>DRAG TO ROTATE · SELECT A PLANET</span></div>{active&&<div className="eh-transition"><span>ENTERING WORLD</span><b>{label}</b><i/></div>}{!intro&&!active&&<button className="eh-skip-intro" onClick={()=>setIntro(true)}>SKIP INTRO ↗</button>}<button className="eh-replay" onClick={()=>api.current?.reset()} aria-label="Повторить раскрытие вселенной">↺</button></section>;
}
const onSelectRef:{current:((w:any)=>void)|null}={current:null};
type WBase={id:string;title:string;description:string;slug?:string;_count?:{actions:number;memories:number}};
