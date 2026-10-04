import {useRef} from 'react';
import type {CSSProperties,ReactNode} from 'react';

type Props={children:ReactNode;className?:string;radius?:number};

export default function SpotlightCard({children,className='',radius=32}:Props){
 const ref=useRef<HTMLDivElement>(null);
 const move=(e:React.PointerEvent<HTMLDivElement>)=>{
  const el=ref.current;if(!el)return;
  const r=el.getBoundingClientRect();
  el.style.setProperty('--spot-x',`${e.clientX-r.left}px`);
  el.style.setProperty('--spot-y',`${e.clientY-r.top}px`);
 };
 return <div ref={ref} onPointerMove={move} className={`ejx-spotlight-card ${className}`} style={{'--spot-radius':`${radius}px`} as CSSProperties}>{children}</div>;
}
