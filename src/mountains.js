import * as T from 'three';
import {mountainData,MOUNTAIN_LAYERS} from './landscape-geometry.js';
// Bake directional lighting into vertex colors. Atmospheric distance separates
// the layers without a shadow pass or an expensive per-pixel mountain shader.
export function makeMountains(scene){
 const shadow=['#132b37','#253e52','#365266'];
 const lit=['#354b53','#425c70','#526d84'];
 const haze=['#233a4d','#344d64','#425b73'];
 MOUNTAIN_LAYERS.forEach((layer,i)=>{
  const data=mountainData(layer), colors=[],dark=new T.Color(shadow[i]),light=new T.Color(lit[i]),air=new T.Color(haze[i]),c=new T.Color();
  for(let j=0;j<data.shade.length;j++){
   const y=data.position[j*3+1];c.copy(dark).lerp(light,data.shade[j]);
   c.lerp(air,.11+i*.10+.17*(1-T.MathUtils.smoothstep(y,-3,16)));colors.push(c.r,c.g,c.b);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.position,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(data.index);g.computeVertexNormals();
  const mountain=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,fog:false}));scene.add(mountain);
 });
}
