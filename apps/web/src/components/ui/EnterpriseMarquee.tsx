import type {CSSProperties,ReactNode} from 'react';

type Props={children:ReactNode;duration?:number;className?:string};

export default function EnterpriseMarquee({children,duration=30,className=''}:Props){
 return <div className={`ejx-marquee ${className}`} style={{'--marquee-duration':`${duration}s`} as CSSProperties}>
  <div className="ejx-marquee-track">{children}{children}</div>
 </div>;
}
