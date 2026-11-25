// A portrait camera sees more of the banks without changing the shared world.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function framing(width,height){
 const aspect=Math.max(.1,width/Math.max(1,height));
 const portrait=clamp((1.15-aspect)/.68,0,1);
 return {portrait,fov:57+portrait*23,lookStrength:1-portrait*.45};
}
export function pixelRatio(width,height,dpr,low,scale){
 const {portrait}=framing(width,height);
 const cap=low?.8:1+portrait*.5;
 const budget=Math.sqrt(1900000/Math.max(1,width*height));
 return Math.max(.35,Math.min(dpr,cap,budget)*(low?1:scale));
}
