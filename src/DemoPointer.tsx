import {useEffect,useState} from 'react'
import {motion,useMotionValue,useSpring} from 'motion/react'
export function DemoPointer(){
 const x=useMotionValue(30),y=useMotionValue(30),sx=useSpring(x,{stiffness:250,damping:32}),sy=useSpring(y,{stiffness:250,damping:32})
 const [click,setClick]=useState<{x:number;y:number;id:number}|null>(null)
 useEffect(()=>{const move=(e:PointerEvent)=>{x.set(e.clientX);y.set(e.clientY)};const down=(e:PointerEvent)=>setClick({x:e.clientX,y:e.clientY,id:Date.now()});window.addEventListener('pointermove',move);window.addEventListener('pointerdown',down);return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',down)}},[x,y])
 return <><motion.div aria-hidden="true" style={{position:'fixed',left:sx,top:sy,zIndex:9999,pointerEvents:'none',width:25,height:31,filter:'drop-shadow(0 2px 2px #0003)'}}><svg width="25" height="31" viewBox="0 0 25 31"><path d="M2 2v23l6-5 5 10 5-3-5-9h9Z" fill="#fff" stroke="#25251f" strokeWidth="1.6" strokeLinejoin="round"/></svg></motion.div>{click&&<motion.div key={click.id} aria-hidden="true" initial={{opacity:.7,scale:.3}} animate={{opacity:0,scale:1.3}} transition={{duration:.75}} style={{position:'fixed',left:click.x-21,top:click.y-21,width:42,height:42,border:'2px solid #FF6A3D',background:'#FF6A3D15',borderRadius:'50%',zIndex:9998,pointerEvents:'none'}}/>}</>
}
