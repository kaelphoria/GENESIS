'use client';
import {useEffect,useRef,useState} from 'react';

type OrbitWorld={id:string;title:string;description:string;_count?:{actions:number;memories:number}};
const TINTS=['#a9bccd','#b8c4d6','#c2b4b0','#a9c7bb','#c6c2d4','#b0c2cf','#cfc8b4','#a2b8c4','#b6aeb6'];
const SIZES=[26,20,17,24,16,19,15,21,18];
const GOLD=2.399963;
const radiusOf=(i:number,n:number)=>n<=1?0.6:0.34+0.62*(i/(n-1));

export default function UniverseOrbit<W extends OrbitWorld>({worlds,onSelect}:{worlds:W[];onSelect:(world:W)=>void}){
  const wrapRef=useRef<HTMLDivElement>(null);
  const fieldRef=useRef<HTMLDivElement>(null);
  const planetsRef=useRef<(HTMLButtonElement|null)[]>([]);
  const [active,setActive]=useState<string|null>(null);
  const [reduced,setReduced]=useState(false);
  const [hint,setHint]=useState(true);

  useEffect(()=>{
    const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange=()=>setReduced(mq.matches);
    mq.addEventListener?.('change',onChange);
    return()=>mq.removeEventListener?.('change',onChange);
  },[]);

  useEffect(()=>{
    if(reduced)return;
    const wrap=wrapRef.current,field=fieldRef.current;
    if(!wrap||!worlds.length)return;
    const n=worlds.length;
    const bodies=worlds.map((_,i)=>({R:radiusOf(i,n),a:(i*GOLD)%(Math.PI*2),w:0.000065/Math.sqrt(radiusOf(i,n))}));
    const dust=Array.from({length:26},()=>({a:Math.random()*Math.PI*2,R:0.2+Math.random()*0.75,w:0.000045*(0.4+Math.random()),s:Math.random()<0.5?1:-1,o:0.12+Math.random()*0.25}));
    const dustEls=dust.map(()=>document.createElement('i'));
    dustEls.forEach(el=>{el.className='uo-dust';wrap.appendChild(el);});
    let raf=0,last=performance.now(),tiltX=0,tiltY=0,tgtX=0,tgtY=0,hintHidden=false;
    const onMove=(e:PointerEvent)=>{
      const r=wrap.getBoundingClientRect();
      tgtX=((e.clientX-r.left)/r.width-0.5)*10;
      tgtY=((e.clientY-r.top)/r.height-0.5)*10;
    };
    const onLeave=()=>{tgtX=0;tgtY=0};
    wrap.addEventListener('pointermove',onMove);
    wrap.addEventListener('pointerleave',onLeave);
    const step=(t:number)=>{
      const dt=Math.min(t-last,50);last=t;
      tiltX+=(tgtX-tiltX)*0.06;tiltY+=(tgtY-tiltY)*0.06;
      if(!document.hidden){
        const half=wrap.clientWidth/2;
        if(field)field.style.transform='translate('+tiltX*0.5+'px,'+tiltY*0.5+'px)';
        bodies.forEach((p,i)=>{
          p.a=(p.a+p.w*dt)%(Math.PI*2);
          const depth=(Math.sin(p.a)+1)/2;
          const x=Math.cos(p.a)*p.R*half*0.92;
          const y=Math.sin(p.a)*p.R*half*0.40;
          const el=planetsRef.current[i];
          if(el){
            el.style.transform='translate(-50%,-50%) translate('+(x+tiltX*(0.4+depth))+'px,'+(y+tiltY*(0.4+depth))+'px) scale('+(0.8+0.35*depth).toFixed(3)+')';
            el.style.zIndex=depth>0.52?'12':'2';
          }
        });
        dust.forEach((d,i)=>{
          d.a=(d.a+d.w*d.s*dt)%(Math.PI*2);
          const el=dustEls[i];
          if(el){
            el.style.opacity=String(d.o);
            el.style.transform='translate(-50%,-50%) translate('+(Math.cos(d.a)*d.R*half*0.9)+'px,'+(Math.sin(d.a)*d.R*half*0.36)+'px) scale('+(d.s>0?1:0.7)+')';
          }
        });
        if(!hintHidden&&t>4500){hintHidden=true;setHint(false);}
      }
      raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
    return()=>{
      cancelAnimationFrame(raf);
      wrap.removeEventListener('pointermove',onMove);
      wrap.removeEventListener('pointerleave',onLeave);
      dustEls.forEach(el=>el.remove());
    };
  },[worlds,reduced]);

  const choose=(w:W)=>{
    if(active)return;
    setActive(w.id);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    window.setTimeout(()=>onSelect(w),340);
  };

  if(reduced)return(
    <div className="world-grid large-grid">
      {worlds.map(w=><button key={w.id} className="world-tile" onClick={()=>onSelect(w)}>
        <div className="world-name">{w.title}</div><p>{w.description}</p>
        <div className="world-bottom"><span>{w._count?.actions||0} ACTIONS · {w._count?.memories||0} NOTES</span></div>
      </button>)}
    </div>
  );

  return(
    <div className="universe-orbit" ref={wrapRef}>
      <div className="uo-field" ref={fieldRef} aria-hidden="true">
        <div className="uo-stars"/><div className="uo-glow"/>
        {worlds.map((w,i)=>{
          const R=radiusOf(i,worlds.length);
          return <div key={w.id} aria-hidden="true" className={'uo-ring'+(active===w.id?' lit':'')}
            style={{width:(R*92)+'%',height:(R*92)+'%'}}/>;
        })}
      </div>
      <div className="uo-core" aria-hidden="true"><span/></div>
      <div className="uo-halo" aria-hidden="true"/>
      {worlds.map((w,i)=>{
        const R=radiusOf(i,worlds.length);
        const a=(i*GOLD)%(Math.PI*2);
        const depth=(Math.sin(a)+1)/2;
        const x=Math.cos(a)*R*46,y=Math.sin(a)*R*20;
        const tint=TINTS[i%TINTS.length];
        const hasLife=(w._count?.actions||0)+(w._count?.memories||0)>0;
        return <button key={w.id} ref={el=>{planetsRef.current[i]=el}}
          className={'uo-planet'+(active===w.id?' is-active':'')+(hasLife?' lived':'')}
          style={{'--size':SIZES[i%SIZES.length]+'px','--tint':tint,'--enter-delay':(300+i*90)+'ms',
            transform:'translate(-50%,-50%) translate('+x+'%,'+y+'%) scale('+(0.8+0.35*depth).toFixed(3)+')',
            zIndex:depth>0.52?12:2} as React.CSSProperties}
          onClick={()=>choose(w)} aria-label={w.title+'. '+(w._count?.actions||0)+' действий, '+(w._count?.memories||0)+' записей'}>
          <span className="uo-surface" aria-hidden="true"/>
          {hasLife&&<span className="uo-life" aria-hidden="true"/>}
          <span className="uo-tag" aria-hidden="true"><b>{w.title}</b><small>{w._count?.actions||0} · {w._count?.memories||0}</small></span>
        </button>;
      })}
      {hint&&<p className="uo-hint" aria-hidden="true">Выбери мир — он откликнется</p>}
    </div>
  );
}
