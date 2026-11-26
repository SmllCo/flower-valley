import * as T from 'three';
import {finaleForest} from './finale-layout.js';
// Low-poly volumetric conifers: ragged radial branches, several tiers, not billboards.
function pineGeometry(variant){
 const vertices=[],colors=[],indices=[];
 const c=new T.Color();
 function ring(y,r,n,shift,tips){
  const start=vertices.length/3;
  for(let j=0;j<n;j++){
   const a=j/n*Math.PI*2+shift;
   const radial=r*(tips?(j%2===0?1:.60):1)*(1+.12*Math.sin(a*5+variant));
   const dy=tips?(.026*Math.sin(a*7+variant)+(j%2===0?-.025:.026)):0;
   vertices.push(Math.cos(a)*radial,y+dy,Math.sin(a)*radial);
   const shade=tips?(j%2===0?.78:.54):.90;
   c.setRGB(shade*.83,shade,shade*.95);colors.push(c.r,c.g,c.b);
  }return start;
 }
 const n=12;
 for(let t=0;t<6;t++){
  const y=.17+t*.125, r=(.225-t*.029)*(variant===1?.83:1),h=.26-t*.018,shift=t*.64+variant;
  const bottom=ring(y+.035,r*.34,n,shift,false),outer=ring(y,r,n,shift,true),upper=ring(y+h,r*.07,n,shift,false);
  for(let j=0;j<n;j++){const k=(j+1)%n;indices.push(bottom+j,outer+k,outer+j,bottom+j,bottom+k,outer+k,outer+j,upper+j,outer+k,outer+k,upper+j,upper+k);}
 }
 // narrow trunk as part of the same geometry
 const start=vertices.length/3;
 for(let y of [0,.42])for(let j=0;j<6;j++){const a=j*Math.PI/3;vertices.push(Math.cos(a)*.018,y,Math.sin(a)*.018);colors.push(.31,.29,.26);}
 for(let j=0;j<6;j++){let k=(j+1)%6;indices.push(start+j,start+k,start+6+j,start+k,start+6+k,start+6+j);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function makeFinaleForest(scene,height){
 const trees=finaleForest().map(t=>({...t,y:height(t.x,t.z)-.04}));
 const mat=new T.MeshLambertMaterial({vertexColors:true,color:0xffffff,side:T.DoubleSide});
 const shades=['#243c39','#2c4140','#304645','#33494c','#293d42'].map(c=>new T.Color(c));
 const o=new T.Object3D();
 for(let v=0;v<2;v++){
  const list=trees.filter((_,i)=>i%2===v),batch=new T.InstancedMesh(pineGeometry(v),mat,list.length);
  list.forEach((t,i)=>{o.position.set(t.x,t.y,t.z);o.rotation.set(0,t.angle,0);o.scale.set(t.h*t.w,t.h,t.h*t.w);o.updateMatrix();batch.setMatrixAt(i,o.matrix);batch.setColorAt(i,shades[(i+t.row)%shades.length]);});
  batch.instanceMatrix.needsUpdate=true;batch.instanceColor.needsUpdate=true;batch.computeBoundingSphere();scene.add(batch);
 }
 // A cheap reflection mask: project the far-bank silhouettes onto a vertical plane.
 // It is an approximation, not a second render of the scene.
 const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const ctx=cv.getContext('2d');
 const X=x=>(x+70)/140*cv.width,Y=y=>cv.height-(y+2)/22*cv.height;
 ctx.fillStyle='white';
 for(const t of trees.filter(t=>t.z< -137)){
  const x=t.x, w=t.h*t.w*.225;ctx.beginPath();ctx.moveTo(X(x-w*.22),Y(t.y));
  for(let i=0;i<6;i++){const y=t.y+t.h*(.17+i*.125),r=w*(1-i*.13);ctx.lineTo(X(x-r),Y(y));ctx.lineTo(X(x-r*.24),Y(y+t.h*.12));}
  ctx.lineTo(X(x),Y(t.y+t.h*1.02));
  for(let i=5;i>=0;i--){const y=t.y+t.h*(.17+i*.125),r=w*(1-i*.13);ctx.lineTo(X(x+r*.24),Y(y+t.h*.12));ctx.lineTo(X(x+r),Y(y));}
  ctx.lineTo(X(x+w*.22),Y(t.y));ctx.closePath();ctx.fill();
 }
 const mask=new T.CanvasTexture(cv);mask.generateMipmaps=true;mask.minFilter=T.LinearMipmapLinearFilter;return mask;
}
