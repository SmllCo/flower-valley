import * as T from 'three';
import {mistBankPositions} from './performance.js';
import {LAKE} from './lake-layout.js';

// A small, tileable noise texture is generated once. Clouds and ground haze
// reuse it instead of evaluating several octaves of noise in every pixel.
export function makeNoiseTexture(size=256){
 let seed=87431;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const octaves=[4,8,16,32,64].map(n=>({n,v:Float32Array.from({length:n*n},rand)}));
 function sample(o,x,y){const n=o.n;let fx=x*n,fy=y*n,ix=Math.floor(fx),iy=Math.floor(fy),a=fx-ix,b=fy-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);const v=(i,j)=>o.v[(j%n)*n+i%n];return (v(ix,iy)*(1-a)+v(ix+1,iy)*a)*(1-b)+(v(ix,iy+1)*(1-a)+v(ix+1,iy+1)*a)*b;}
 const bytes=new Uint8Array(size*size*4),weights=[.48,.26,.14,.08,.04];
 function noise(x,y){let val=0;for(let i=0;i<octaves.length;i++)val+=weights[i]*sample(octaves[i],x-Math.floor(x),y-Math.floor(y));return val;}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size,large=noise(u,v),detail=noise(u*2+.41,v*2+.23),p=(y*size+x)*4;bytes[p]=Math.round((large*.78+detail*.22)*255);bytes[p+1]=Math.round(detail*255);bytes[p+2]=Math.round((large*.72+detail*.28)*255);bytes[p+3]=255;}
 const t=new T.DataTexture(bytes,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export const air={time:{value:0},opening:{value:0},mist:{value:1},clouds:{value:1},eyeHeight:{value:1.85},noise:{value:null}};

export function makeClouds(scene){
 if(!air.noise.value)air.noise.value=makeNoiseTexture();
 const mat=new T.ShaderMaterial({side:T.BackSide,transparent:true,depthWrite:false,uniforms:{noiseMap:air.noise,time:air.time,opening:air.opening,cloudAmount:air.clouds},vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vDir;uniform sampler2D noiseMap;uniform float time;uniform float opening;uniform float cloudAmount;
 void main(){vec3 d=normalize(vDir);float horizon=smoothstep(.075,.26,d.y);if(horizon<.001)discard;
 vec2 p=d.xz/max(.18,d.y)*vec2(.25,.40);vec2 drift=vec2(time*.0025,time*.0007);
 vec2 cloud=texture2D(noiseMap,p+drift).rg;float detail=cloud.g;
 float density=smoothstep(.40,.65,cloud.r);float wisps=smoothstep(.36,.62,detail)*smoothstep(.35,.54,cloud.r)*.13;
 float a=clamp(density*.82+wisps,0.,.76)*horizon*cloudAmount;if(a<.006)discard;
 float m=max(0.,dot(d,vec3(.01961,.19608,-.98039)));float m2=m*m;float m4=m2*m2;float moon=m4*m4*m;
 vec3 c=mix(vec3(.018,.029,.055),vec3(.19,.25,.35),moon*.82);c*=(.70+detail*.55)*(1.-opening*.34);
 gl_FragColor=vec4(c,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const cloud=new T.Mesh(new T.SphereGeometry(305,32,16,0,Math.PI*2,0,Math.acos(.06)),mat);cloud.position.set(0,0,-48);cloud.frustumCulled=false;cloud.renderOrder=-4;scene.add(cloud);return cloud;
}

// A few soft, terrain-following ribbons add visible drifting banks above the
// grass. Each ribbon is subdivided so its base follows the valley floor.
export function makeMistBanks(scene,height,pathX,trailLength){
 const pos=[],uv=[],phase=[],indices=[];const segments=24,locations=mistBankPositions(trailLength);
 for(let bank=0;bank<locations.length;bank++){
  const z0=locations[bank],overLake=false,width=overLake?44:23+bank*3.5,h=overLake?.65:1.4+(bank%3)*.42,base=pos.length/3;
  for(let i=0;i<=segments;i++){
   const u=i/segments,x=pathX(z0)+(u-.5)*width,z=z0+Math.sin(u*5+bank)*1.6,ground=overLake?Math.max(LAKE.y,height(x,z)):height(x,z);
   for(let j=0;j<2;j++){pos.push(x,ground+.08+j*h,z);uv.push(u,j);phase.push(bank*.27);}
   if(i<segments){const k=base+i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('aPhase',new T.Float32BufferAttribute(phase,1));g.setIndex(indices);
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,uniforms:{noiseMap:air.noise,time:air.time,amount:air.mist,opening:air.opening},vertexShader:`attribute float aPhase;varying vec2 vUv;varying float vPhase;varying float vDepth;void main(){vUv=uv;vPhase=aPhase;vec4 p=modelViewMatrix*vec4(position,1.);vDepth=-p.z;gl_Position=projectionMatrix*p;}`,fragmentShader:`uniform sampler2D noiseMap;uniform float time;uniform float amount;uniform float opening;varying vec2 vUv;varying float vPhase;varying float vDepth;
 void main(){float n=texture2D(noiseMap,vec2(vUv.x*.85-time*.007+vPhase,vUv.y*.30+vPhase)).b;
 float xfade=smoothstep(0.,.19,vUv.x)*(1.-smoothstep(.81,1.,vUv.x));float yfade=smoothstep(0.,.18,vUv.y)*(1.-smoothstep(.33,.94,vUv.y));float depthFade=smoothstep(2.0,7.0,vDepth)*(1.-smoothstep(58.,110.,vDepth));
 float a=xfade*yfade*depthFade*smoothstep(.30,.69,n)*(.15+opening*.045)*amount;if(a<.003)discard;
 gl_FragColor=vec4(mix(vec3(.16,.23,.35),vec3(.27,.35,.47),opening),a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const banks=new T.Mesh(g,mat);banks.renderOrder=-1;scene.add(banks);return banks;
}
