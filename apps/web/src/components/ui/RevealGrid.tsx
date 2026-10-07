import type {ReactNode} from 'react';

export function RevealGrid({children,className=''}:{children:ReactNode;className?:string}){
 return <div className={`ejx-reveal-grid ${className}`}>{children}</div>;
}
