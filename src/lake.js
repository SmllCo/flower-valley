import * as T from 'three';
import {LAKE,shoreShape} from './lake-layout.js';
// One opaque surface, analytic sky/moon reflection: no second scene render,
// render targets, or expensive screen-space ray marching.
export function makeLake(scene,moon){
 const positions=[LAKE.x,LAKE.y,LAKE.z],indices=[];const n=96;
 for(let i=0;i<=n;i++){const a=i*2*Math.PI/n,r=shoreShape(a);positions.push(LAKE.x+Math.cos(a)*LAKE.rx*r,LAKE.y,LAKE.z+Math.sin(a)*LAKE.rz*r);if(i<n)indices.push(0,i+2,i+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
 const uniforms={time:{value:0},opening:{value:0},moonPosition:{value:moon.position},fogTint:{value:new T.Color(0x30465e)}};
 const mat=new T.ShaderMaterial({uniforms,depthWrite:true,side:T.DoubleSide,vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,fragmentShader:`
 varying vec3 vWorld;uniform float time;uniform float opening;uniform vec3 moonPosition;uniform vec3 fogTint;
 void main(){
  vec2 p=vWorld.xz;
  float a=p.x*1.18+p.y*.85-time*.66;
  float b=p.x*.48-p.y*2.15+time*.49;
  float c=p.x*2.9+p.y*3.8-time*.82;
  float d=p.x*.26+p.y*.39+time*.21;
  vec3 N=normalize(vec3(.013*cos(a)+.009*cos(b)+.004*cos(c),1.,.023*cos(a)-.023*cos(b)+.008*cos(c)+.015*cos(d)));
  vec3 V=normalize(cameraPosition-vWorld);vec3 R=reflect(-V,N);
  vec3 M=normalize(moonPosition-vWorld);
  float horizon=clamp(R.y,0.,1.);
  float fresnel=.13+.87*pow(1.-max(dot(N,V),0.),4.);
  vec3 sky=mix(vec3(.052,.083,.126),vec3(.009,.019,.043),smoothstep(0.,.58,horizon));
  float angle=max(0.,dot(R,M));
  float disc=smoothstep(.9948,.9985,angle);
  float halo=pow(angle,110.);
  float glints=pow(angle,380.)*(.55+.45*sin(a+b));
  vec3 reflected=sky+vec3(.72,.83,1.)*(disc*.85+halo*.12+glints*.45);
  vec3 water=mix(vec3(.014,.035,.043),reflected,fresnel);
  water+=vec3(.012,.018,.023)*(.5+.5*cos(a+b));
  float distanceToEye=length(cameraPosition-vWorld);
  float haze=1.-exp(-.000085*distanceToEye*distanceToEye);
  water=mix(water,fogTint*.72,haze*.75);
  gl_FragColor=vec4(water,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(geo,mat);scene.add(mesh);
 return {mesh,update(time,opening,fogColor){uniforms.time.value=time;uniforms.opening.value=opening;uniforms.fogTint.value.copy(fogColor);}};
}
