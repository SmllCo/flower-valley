import * as T from 'three';
import {LAKE,shoreShape} from './lake-layout.js';
// One opaque surface, analytic sky/moon reflection: no second scene render,
// render targets, or expensive screen-space ray marching.
export function makeLake(scene,moon){
 const positions=[LAKE.x,LAKE.y,LAKE.z],indices=[];const n=160;
 for(let i=0;i<=n;i++){const a=i*2*Math.PI/n,r=shoreShape(a)*1.015;positions.push(LAKE.x+Math.cos(a)*LAKE.rx*r,LAKE.y,LAKE.z+Math.sin(a)*LAKE.rz*r);if(i<n)indices.push(0,i+2,i+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
 const uniforms={time:{value:0},opening:{value:0},moonPosition:{value:moon.position},fogTint:{value:new T.Color(0x30465e)}};
 const mat=new T.ShaderMaterial({uniforms,depthWrite:true,side:T.DoubleSide,vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,fragmentShader:`
 varying vec3 vWorld;uniform float time;uniform float opening;uniform vec3 moonPosition;uniform vec3 fogTint;
 void main(){
  vec2 p=vWorld.xz;
  float a=p.x*.72+p.y*1.35-time*.39;
  float b=p.x*1.38-p.y*2.48+time*.31;
  float c=p.x*3.91+p.y*5.83-time*.61;
  float d=p.x*.26+p.y*.39+time*.21;
  vec3 N=normalize(vec3(.009*cos(a)+.005*cos(b)+.003*cos(c),1.,.012*cos(a)-.010*cos(b)+.006*cos(c)+.007*cos(d)));
  vec3 V=normalize(cameraPosition-vWorld);vec3 R=reflect(-V,N);
  vec3 M=normalize(moonPosition-vWorld);
  float horizon=clamp(R.y,0.,1.);
  float fresnel=.13+.87*pow(1.-max(dot(N,V),0.),4.);
  vec3 sky=mix(vec3(.052,.083,.126),vec3(.009,.019,.043),smoothstep(0.,.58,horizon));
  float angle=max(0.,dot(R,M));
  float disc=smoothstep(.9962,.9995,angle);
  float halo=pow(angle,110.);
  float glints=pow(angle,280.)*(.62+.38*sin(c+b));
  // Approximate dark reflected ridgelines without an additional scene render.
  float az=atan(R.x,-R.z);float silhouette=.055+.037*abs(sin(az*5.2+.7))+.012*sin(az*13.1);
  float hills=1.-smoothstep(silhouette-.012,silhouette+.014,horizon);
  sky=mix(sky,vec3(.012,.023,.037),hills*.72);
  vec3 reflected=sky+vec3(.72,.83,1.)*(disc*.43+halo*.13+glints*.27);
  vec3 water=mix(vec3(.014,.035,.043),reflected,fresnel);
  float edgeAngle=atan((p.y+108.)/31.,p.x/29.);
  float shore=1.+.085*sin(edgeAngle*3.+.8)+.042*cos(edgeAngle*5.-1.2)+.018*sin(edgeAngle*9.+1.1);
  float r=length(vec2(p.x/29.,(p.y+108.)/31.))/shore;
  float shallow=smoothstep(.83,1.,r);
  water=mix(water,vec3(.031,.045,.041),shallow*.50);
  water+=vec3(.004,.006,.008)*(.5+.5*cos(c+d));
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
