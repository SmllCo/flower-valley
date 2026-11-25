import {shorePoint,LAKE} from './lake-layout.js';
const TAU=Math.PI*2;
export function lakeLife(seed=812){
 const rnd=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const pads=[],reeds=[];
 // Four asymmetrical colonies, biased towards the near banks in the final view.
 for(const [angle,band,count] of [[.79,.77,17],[2.22,.77,18],[.26,.78,12],[2.83,.76,11],[-1.05,.77,9]]){
  for(let i=0;i<count;i++){
   const a=angle+(rnd()-.5)*.27, r=band+(rnd()-.5)*.16;
   const [x,z]=shorePoint(a,r);pads.push({x,z,scale:.34+rnd()*.44,angle:rnd()*TAU,bloom:i%4===0});
  }
 }
 // Tall silhouettes on both sides of the approach; leave the centre open.
 for(const [angle,count] of [[1.03,19],[2.02,23],[.52,15],[2.65,14],[-.5,10],[-2.6,11]]){
  for(let i=0;i<count;i++){
   const a=angle+(rnd()-.5)*.18,[x,z]=shorePoint(a,1.00+rnd()*.075);
   if(Math.abs(x)<4.8&&z>LAKE.z)continue;
   reeds.push({x,z,height:.85+rnd()*1.25,angle:rnd()*TAU,scale:.7+rnd()*.6});
  }
 }
 return {pads,reeds};
}
