// World-space shoreline. No renderer dependencies: the layout can be tested in Node.
export const LAKE={x:0,z:-108,rx:29,rz:31,y:-.78};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export function shoreShape(angle){return 1+.045*Math.sin(angle*3+.8)+.025*Math.cos(angle*5-1.2);}
export function lakeRadius(x,z){const u=(x-LAKE.x)/LAKE.rx,v=(z-LAKE.z)/LAKE.rz;return Math.hypot(u,v)/shoreShape(Math.atan2(v,u));}
export function lakeTerrain(x,z,original){const r=lakeRadius(x,z);if(r>=1.21)return original;
 const basin=LAKE.y-1.65+2.16*smooth(.65,1.02,r);
 return basin+(original-basin)*smooth(1.02,1.21,r);
}
// Move plants out of the basin; no random numbers consumed, so the rest of
// the existing deterministic garden remains stable.
export function dryPosition(x,z){const r=lakeRadius(x,z);if(r>=1.09)return [x,z];
 const angle=Math.atan2((z-LAKE.z)/LAKE.rz,(x-LAKE.x)/LAKE.rx);
 const jitter=.025+.11*(.5+.5*Math.sin(x*12.31+z*7.13));
 const radius=(1.09+jitter)*shoreShape(angle);
 return [LAKE.x+Math.cos(angle)*LAKE.rx*radius,LAKE.z+Math.sin(angle)*LAKE.rz*radius];
}
export function lakeReveal(progress){return smooth(.71,.99,progress);}
