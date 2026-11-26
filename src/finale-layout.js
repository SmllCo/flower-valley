import {LAKE,lakeRadius,shorePoint} from './lake-layout.js';
const fract=x=>x-Math.floor(x);
const hash=(i,k)=>fract(Math.sin(i*127.1+k*311.7+57.1)*43758.5453);
// Trees form two irregular banks and a distant forest, keeping the central view open.
export function finaleForest(){
 const trees=[];
 for(let i=0;i<132;i++){
  const row=Math.floor(i/44),j=i%44;
  const x=-57+j*(114/43)+(hash(i,1)-.5)*2.5;
  const z=-143-row*7+(hash(i,2)-.5)*4;
  if(lakeRadius(x,z)<1.13)continue;
  const valley=.72+.28*Math.min(1,Math.abs(x)/24);
  trees.push({x,z,h:(4.2+hash(i,3)*6.8)*valley*(1+row*.04),w:.74+hash(i,4)*.40,angle:hash(i,5)*6.283,row});
 }
 for(let i=0;i<54;i++){
  const side=i%2?1:-1,k=Math.floor(i/2);
  const z=-87-k*.95+(hash(i,6)-.5)*2.0;
  const x=side*(25+hash(i,7)*14);
  if(lakeRadius(x,z)<1.15)continue;
  trees.push({x,z,h:5+hash(i,8)*7.2,w:.82+hash(i,9)*.4,angle:hash(i,10)*6.283,row:0});
 }
 return trees;
}
// Reallocate existing flowers, not extra instances. Keep the foreground open at its centre.
export function finaleFlower(i){
 if(i%10!==5)return null;
 const k=(i-5)/10,side=k%2?1:-1;
 if(k%5===0){const a=side===1?.72:Math.PI-.72;const [x,z]=shorePoint(a+(hash(k,11)-.5)*.55,1.13+hash(k,12)*.11);return{x,z,scale:1.0+hash(k,13)*.4};}
 const z=-66.8-hash(k,14)*9.0;
 const x=side*(2.2+Math.pow(hash(k,15),1.35)*9.5)-2.2;
 if(lakeRadius(x,z)<1.09)return null;
 return{x,z,scale:1.12+hash(k,16)*.55};
}
export function finaleBank(x,z){
 const r=lakeRadius(x,z);if(r<1.08||z>-61)return 0;
 const a=Math.atan2((z-LAKE.z)/LAKE.rz,(x-LAKE.x)/LAKE.rx);
 const farSide=Math.max(0,-Math.sin(a));
 const hill=Math.exp(-Math.pow((r-1.30)/.24,2));
 const side=Math.min(1,Math.abs(x)/17);
 return hill*(farSide*2.3+side*.85)*(.75+.25*Math.sin(x*.31+z*.17));
}
