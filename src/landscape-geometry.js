// Deterministic geometry generators, independent of WebGL.
const fract=x=>x-Math.floor(x);
const hash=(i,k)=>fract(Math.sin(i*127.1+k*311.7+57.1)*43758.5453);
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function noise(x,z,seed){const i=Math.floor(x),j=Math.floor(z),u=smooth(x-i),v=smooth(z-j);const h=(a,b)=>hash(a*173+b*769,seed);return mix(mix(h(i,j),h(i+1,j),u),mix(h(i,j+1),h(i+1,j+1),u),v);}
function fbm(x,z,s){return .55*noise(x,z,s)+.27*noise(x*2.08,z*2.08,s+1)+.12*noise(x*4.13,z*4.13,s+2)+.06*noise(x*8.21,z*8.21,s+3);}

// Branches are small, asymmetric 3D clusters, not stacked conical skirts.
// Y is normalized; each instance scales the whole tree to its world height.
export function pineData(variant=0){
 const position=[],color=[],index=[];let serial=0;
 function vertex(x,y,z,shade,wood=false){position.push(x,y,z);color.push(...(wood?[shade*.70,shade*.55,shade*.39]:[shade*.77,shade,shade*.92]));return position.length/3-1;}
 const bend=y=>(variant-1)*.022*y*y+.010*Math.sin(y*6+variant)*y;
 // A tapered trunk, exposed at the base and occasionally through the canopy.
 const rings=[0,.19,.43,.72,1.035].map((y,k)=>{const r=[.022,.016,.011,.006,.0015][k];return Array.from({length:7},(_,j)=>{const a=j*2*Math.PI/7;return vertex(bend(y)+Math.cos(a)*r,y,Math.sin(a)*r,.54+.11*Math.cos(a),true);});});
 for(let k=0;k<rings.length-1;k++)for(let j=0;j<7;j++){const n=(j+1)%7,a=rings[k],b=rings[k+1];index.push(a[j],b[j],a[n],a[n],b[j],b[n]);}
 function branch(y,a,len,width,thick,drop,seed){
  const cx=Math.cos(a),cz=Math.sin(a),sx=-cz,sz=cx;
  const baseX=bend(y), tipY=y+drop, sides=5;
  const start=vertex(baseX,y,0,.50);
  const ring=(t,w,h)=>Array.from({length:sides},(_,j)=>{const ang=2*Math.PI*j/sides, irregular=.82+.34*hash(seed+j,23+t*10),r=len*t;
   return vertex(baseX+cx*r+sx*Math.cos(ang)*w*irregular,y+drop*t-.023*Math.sin(t*Math.PI)+Math.sin(ang)*h*irregular,cz*r+sz*Math.cos(ang)*w*irregular,.48+.28*Math.max(0,Math.sin(ang))+.12*hash(seed+j,32));});
  const r1=ring(.36,width,thick),r2=ring(.72,width*.63,thick*.67);
  const end=vertex(baseX+cx*len,tipY,cz*len,.78);
  for(let j=0;j<sides;j++){const k=(j+1)%sides;index.push(start,r1[k],r1[j],r1[j],r1[k],r2[j],r1[k],r2[k],r2[j],r2[j],r2[k],end);}
  // Two independently sized lateral needle clusters break the long straight edge.
  for(const side of [-1,1]){const t=.44+.19*hash(seed,side+45),r=len*t,yy=y+drop*t-.014;
   const root=[baseX+cx*r,yy,cz*r], reach=width*(1.7+.8*hash(seed,side+51)),forward=len*(.12+.11*hash(seed,side+55));
   const tip=[root[0]+cx*forward+sx*side*reach,yy+drop*.20+.012,root[2]+cz*forward+sz*side*reach];
   const k=vertex(...root,.52),l=vertex(root[0]-cx*len*.11+sx*side*reach*.44,yy-.009,root[2]-cz*len*.11+sz*side*reach*.44,.62),m=vertex(...tip,.73),n=vertex(root[0]+cx*len*.15+sx*side*reach*.43,yy+.014,root[2]+cz*len*.15+sz*side*reach*.43,.68),o=vertex((root[0]+tip[0])*.5,yy+thick*.75,(root[2]+tip[2])*.5,.79);
   index.push(k,l,o,l,m,o,m,n,o,n,k,o);
  }
 }
 const levels=variant===1?10:9;
 for(let level=0;level<levels;level++){
  const t=level/(levels-1), y=.18+t*.78, count=level>=levels-2?3:4+(level%3===0?1:0);
  const profile=Math.pow(1-t,.80)*(variant===1?.192:variant===2?.244:.225)+.015;
  for(let j=0;j<count;j++){const seed=variant*1000+serial++,a=j*2*Math.PI/count+level*2.399+variant+(hash(seed,9)-.5)*.72;
   const yy=y+(hash(seed,4)-.5)*.054, len=profile*(.73+hash(seed,5)*.46),width=len*(.17+hash(seed,6)*.12),thick=.013+len*.10;
   branch(yy,a,len,width,thick,(hash(seed,7)-.75)*.085+t*.035,seed);
  }
 }
 // Upright leader at the crown, without a flat cap.
 for(let j=0;j<3;j++)branch(.975,j*2.094+variant,.035,.012,.012,.041,9000+variant*10+j);
 return {position,color,index};
}

// Each distant massif is an actual folded heightfield, with depth and a lit slope.
export const MOUNTAIN_LAYERS=[
 {center:-193,depth:50,width:210,base:12,amplitude:13,seed:17},
 {center:-245,depth:64,width:235,base:22,amplitude:20,seed:43},
 {center:-294,depth:54,width:255,base:35,amplitude:24,seed:79}
];
export function mountainHeight(x,z,layer){const s=layer.seed, v=(z-layer.center)/(layer.depth*.5);const broad=fbm(x*.020+s,1.6,s);const peaks=Math.pow(broad,1.75);const gullies=fbm(x*.065,z*.065,s+11);const ridge=Math.max(0,1-Math.abs(v+.18*(noise(x*.027,2,s)-.5)));const envelope=Math.pow(ridge, .72);return -5+envelope*(layer.base+layer.amplitude*(peaks*1.65+.32*(gullies-.5)))+envelope*(gullies-.5)*4;}
export function mountainData(layer,nx=208,nz=18){const position=[],shade=[],index=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=(i/nx*2-1)*layer.width,z=layer.center+(j/nz-.5)*layer.depth,y=mountainHeight(x,z,layer);
  const dx=(mountainHeight(x+.5,z,layer)-mountainHeight(x-.5,z,layer)),dz=(mountainHeight(x,z+.5,layer)-mountainHeight(x,z-.5,layer));
  const norm=Math.hypot(dx,1,dz),light=Math.max(0,(dx*.62+.56+dz*.54)/norm),rock=fbm(x*.09,z*.09,layer.seed+23);
  position.push(x,y,z);shade.push(Math.max(0,Math.min(1,.18+light*.60+(rock-.5)*.30)));
  if(i<nx&&j<nz){const a=j*(nx+1)+i,b=a+nx+1;index.push(a,b,a+1,a+1,b,b+1);}
 }
 return {position,shade,index};
}
