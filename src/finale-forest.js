import * as T from 'three';
import {finaleForest} from './finale-layout.js';
import {pineData} from './landscape-geometry.js';
export function makeFinaleForest(scene,height){
 const trees=finaleForest().map((t,i)=>({...t,y:height(t.x,t.z)-.04,variant:i%3}));
 const mat=new T.MeshLambertMaterial({vertexColors:true,color:0xffffff,side:T.DoubleSide,emissive:0x152a29,emissiveIntensity:.18});
 const shades=['#40534a','#344942','#44594b','#3a5050','#34464a'].map(c=>new T.Color(c));
 const o=new T.Object3D(), models=[0,1,2].map(pineData);
 for(let v=0;v<3;v++){
  const data=models[v],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.position,3));g.setAttribute('color',new T.Float32BufferAttribute(data.color,3));g.setIndex(data.index);g.computeVertexNormals();
  const list=trees.filter(t=>t.variant===v),batch=new T.InstancedMesh(g,mat,list.length);
  list.forEach((t,i)=>{o.position.set(t.x,t.y,t.z);o.rotation.set(0,t.angle,0);o.scale.set(t.h*t.w,t.h,t.h*t.w);o.updateMatrix();batch.setMatrixAt(i,o.matrix);batch.setColorAt(i,shades[(i+t.row+v)%shades.length]);});
  batch.instanceMatrix.needsUpdate=true;batch.instanceColor.needsUpdate=true;batch.computeBoundingSphere();scene.add(batch);
 }
 // Bake the actual branch silhouettes into the existing lightweight reflection mask.
 const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const ctx=cv.getContext('2d');
 const X=x=>(x+70)/140*cv.width,Y=y=>cv.height-(y+2)/22*cv.height;
 ctx.fillStyle='white';
 for(const t of trees.filter(t=>t.z< -137)){
  const g=models[t.variant],cs=Math.cos(t.angle),sn=Math.sin(t.angle),scale=t.h*t.w,projected=[];
  for(let k=0;k<g.position.length;k+=3)projected.push(X(t.x+(g.position[k]*cs+g.position[k+2]*sn)*scale),Y(t.y+g.position[k+1]*t.h));
  ctx.beginPath();
  for(let k=0;k<g.index.length;k+=3){let a=g.index[k]*2,b=g.index[k+1]*2,c=g.index[k+2]*2;
   // Use consistent projected winding so overlapping triangles never cancel.
   if((projected[b]-projected[a])*(projected[c+1]-projected[a+1])-(projected[b+1]-projected[a+1])*(projected[c]-projected[a])<0){const tmp=b;b=c;c=tmp;}
   ctx.moveTo(projected[a],projected[a+1]);ctx.lineTo(projected[b],projected[b+1]);ctx.lineTo(projected[c],projected[c+1]);ctx.closePath();
  }ctx.fill();
 }
 const mask=new T.CanvasTexture(cv);mask.generateMipmaps=true;mask.minFilter=T.LinearMipmapLinearFilter;return mask;
}
