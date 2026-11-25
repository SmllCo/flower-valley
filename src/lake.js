import * as T from 'three';
import {LAKE,shoreShape} from './lake-layout.js';

function rng(seed=911){return ()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};}
function insideLake(a,r){const shape=shoreShape(a)*r;return [LAKE.x+Math.cos(a)*LAKE.rx*shape,LAKE.z+Math.sin(a)*LAKE.rz*shape];}

// One opaque surface, analytic sky/moon reflection: no second scene render,
// render targets, or expensive screen-space ray marching.
export function makeLake(scene,moon){
 const positions=[LAKE.x,LAKE.y,LAKE.z],indices=[];const n=160;
 for(let i=0;i<=n;i++){
  const a=i*2*Math.PI/n,r=shoreShape(a)*1.015;
  positions.push(LAKE.x+Math.cos(a)*LAKE.rx*r,LAKE.y,LAKE.z+Math.sin(a)*LAKE.rz*r);
  if(i<n)indices.push(0,i+2,i+1);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 const uniforms={time:{value:0},opening:{value:0},moonPosition:{value:moon.position},fogTint:{value:new T.Color(0x30465e)}};
 const mat=new T.ShaderMaterial({uniforms,depthWrite:true,side:T.DoubleSide,vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
 fragmentShader:`
 varying vec3 vWorld;uniform float time;uniform float opening;uniform vec3 moonPosition;uniform vec3 fogTint;
 void main(){
  vec2 p=vWorld.xz;
  float a=p.x*.72+p.y*1.35-time*.33;
  float b=p.x*1.38-p.y*2.48+time*.27;
  float c=p.x*3.91+p.y*5.83-time*.54;
  float d=p.x*.26+p.y*.39+time*.19;
  float e=p.x*6.2-p.y*4.1+time*.43;
  vec3 N=normalize(vec3(.008*cos(a)+.004*cos(b)+.002*cos(c)+.002*cos(e),1.,.010*cos(a)-.008*cos(b)+.005*cos(c)+.005*cos(d)));
  vec3 V=normalize(cameraPosition-vWorld);vec3 R=reflect(-V,N);
  vec3 M=normalize(moonPosition-vWorld);
  float horizon=clamp(R.y,0.,1.);
  float fresnel=.14+.86*pow(1.-max(dot(N,V),0.),4.4);
  vec3 sky=mix(vec3(.05,.083,.125),vec3(.008,.018,.041),smoothstep(0.,.60,horizon));
  float angle=max(0.,dot(R,M));
  float disc=smoothstep(.9964,.99945,angle);
  float halo=pow(angle,120.);
  float glints=pow(angle,300.)*(.55+.45*sin(c+b+e));
  float az=atan(R.x,-R.z);
  float silhouette=.054+.039*abs(sin(az*5.2+.7))+.012*sin(az*13.1);
  float hills=1.-smoothstep(silhouette-.011,silhouette+.014,horizon);
  sky=mix(sky,vec3(.011,.022,.036),hills*.76);
  vec3 reflected=sky+vec3(.76,.86,1.)*(disc*.34+halo*.10+glints*.20);
  vec3 water=mix(vec3(.014,.033,.042),reflected,fresnel);
  float edgeAngle=atan((p.y+108.)/31.,p.x/29.);
  float shore=1.+.085*sin(edgeAngle*3.+.8)+.042*cos(edgeAngle*5.-1.2)+.018*sin(edgeAngle*9.+1.1);
  float r=length(vec2(p.x/29.,(p.y+108.)/31.))/shore;
  float shallow=smoothstep(.80,1.,r);
  float edgeDark=smoothstep(.92,1.05,r);
  water=mix(water,vec3(.030,.044,.041),shallow*.52);
  water=mix(water,vec3(.012,.022,.024),edgeDark*.65);
  water+=vec3(.004,.006,.008)*(.5+.5*cos(c+d+e));
  float distanceToEye=length(cameraPosition-vWorld);
  float haze=1.-exp(-.000085*distanceToEye*distanceToEye);
  water=mix(water,fogTint*.72,haze*.75);
  gl_FragColor=vec4(water,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(geo,mat);scene.add(mesh);

 // Thin drifting mist above the water keeps the finale from looking too empty.
 const mistUniforms={time:{value:0},fogTint:{value:new T.Color(0x5f7086)}};
 const mistMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:mistUniforms,
  vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
  fragmentShader:`
  varying vec3 vWorld;uniform float time;uniform vec3 fogTint;
  void main(){
   vec2 q=(vWorld.xz-vec2(${LAKE.x.toFixed(3)},${LAKE.z.toFixed(3)}))/vec2(${LAKE.rx.toFixed(3)},${LAKE.rz.toFixed(3)});
   float radius=length(q);
   float edge=1.-smoothstep(.62,1.02,radius);
   float n=.55+.45*sin(vWorld.x*.13+time*.15)+.35*sin(vWorld.z*.17-time*.11)+.22*sin((vWorld.x+vWorld.z)*.21+time*.09);
   float streak=.5+.5*sin(vWorld.x*.42-time*.24);
   float alpha=edge*(.018+.045*n+.018*streak);
   gl_FragColor=vec4(mix(fogTint,vec3(.86,.9,.95),.22),alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const mist=new T.Mesh(geo,mistMat);mist.position.y=LAKE.y+.09;scene.add(mist);

 // Lily pads near the edges add context cheaply.
 const padGeo=new T.CircleGeometry(1,9);
 const padMat=new T.MeshLambertMaterial({color:0x5a6a42,emissive:0x10150b,emissiveIntensity:.12,side:T.DoubleSide});
 const pads=new T.InstancedMesh(padGeo,padMat,28);const dummy=new T.Object3D();
 const rand=rng(1441);
 for(let i=0;i<28;i++){
  const a=rand()*Math.PI*2;
  const band=.60+rand()*.28;
  const [x,z]=insideLake(a,band);
  const avoid=Math.abs(x)<6&&z>LAKE.z-2;
  const scale=(avoid?.38:1)*(.22+rand()*.24);
  dummy.position.set(x,LAKE.y+.012+rand()*.015,z);
  dummy.rotation.set(-Math.PI/2,rand()*Math.PI*2,rand()*.2);
  dummy.scale.setScalar(scale);
  dummy.updateMatrix();
  pads.setMatrixAt(i,dummy.matrix);
 }
 pads.instanceMatrix.needsUpdate=true;scene.add(pads);

 // Soft glints / motes hovering over the water.
 const moteCount=54,motePos=new Float32Array(moteCount*3),moteSize=new Float32Array(moteCount),motePhase=new Float32Array(moteCount),moteTint=new Float32Array(moteCount*3);
 const tintA=new T.Color('#dbe6ff'), tintB=new T.Color('#b7dfff'), tintC=new T.Color('#efe7ff');
 for(let i=0;i<moteCount;i++){
  const a=rand()*Math.PI*2, band=.18+Math.pow(rand(),.7)*.74;
  const [x,z]=insideLake(a,band);
  motePos[i*3]=x; motePos[i*3+1]=LAKE.y+.18+rand()*.34; motePos[i*3+2]=z;
  moteSize[i]=6+rand()*8; motePhase[i]=rand()*Math.PI*2;
  const t=(i%3===0?tintA:i%3===1?tintB:tintC);
  moteTint.set([t.r,t.g,t.b],i*3);
 }
 const moteGeo=new T.BufferGeometry();
 moteGeo.setAttribute('position',new T.BufferAttribute(motePos,3));
 moteGeo.setAttribute('moteSize',new T.BufferAttribute(moteSize,1));
 moteGeo.setAttribute('phase',new T.BufferAttribute(motePhase,1));
 moteGeo.setAttribute('tint',new T.BufferAttribute(moteTint,3));
 const moteUniforms={time:{value:0},pixelHeight:{value:600},opening:{value:0}};
 const motes=new T.Points(moteGeo,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:moteUniforms,
  vertexShader:`attribute float moteSize;attribute float phase;attribute vec3 tint;uniform float time;uniform float pixelHeight;varying vec3 vTint;varying float vAlpha;void main(){vec3 p=position;float drift=sin(time*.18+phase);p.x+=sin(time*.12+phase)*.18;p.z+=cos(time*.09+phase)*.15;p.y+=drift*.04;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pixelHeight*moteSize/max(90.,-mv.z),1.,9.);vTint=tint;vAlpha=.35+.65*(.5+.5*sin(time*.7+phase));}`,
  fragmentShader:`varying vec3 vTint;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;float a=exp(-d*d*5.5)*(1.-smoothstep(.66,1.,d))*vAlpha;gl_FragColor=vec4(vTint,a);}`
 }));
 motes.frustumCulled=false;scene.add(motes);

 return {
  mesh,
  update(time,opening,fogColor){
   uniforms.time.value=time;uniforms.opening.value=opening;uniforms.fogTint.value.copy(fogColor);
   mistUniforms.time.value=time;mistUniforms.fogTint.value.copy(fogColor).lerp(new T.Color(0xaab7c7),.18+.22*opening);
   moteUniforms.time.value=time;moteUniforms.opening.value=opening;
  }
 };
}
