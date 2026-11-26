import * as T from 'three';
import {LAKE,shoreShape} from './lake-layout.js';
import {lakeLife} from './lake-life-layout.js';

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
  // Elongated moon path, modulated by the same waves, rather than a flat stripe.
  float sideways=R.x-M.x;
  float vertical=R.y-M.y;
  float pathGlow=exp(-sideways*sideways*350.-vertical*vertical*18.)*(.55+.45*cos(b+c));
  float pathCore=exp(-sideways*sideways*620.-vertical*vertical*40.);
  float az=atan(R.x,-R.z);
  float silhouette=.054+.039*abs(sin(az*5.2+.7))+.012*sin(az*13.1);
  float hills=1.-smoothstep(silhouette-.011,silhouette+.014,horizon);
  sky=mix(sky,vec3(.011,.022,.036),hills*.76);
  vec3 reflected=sky+vec3(.76,.86,1.)*(disc*.40+halo*.12+glints*.26+pathGlow*(.14+.08*opening)+pathCore*(.10+.08*opening));
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
 const mistUniforms={time:{value:0},fogTint:{value:new T.Color(0x5f7086)},opening:{value:0}};
 const mistMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,uniforms:mistUniforms,
  vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
  fragmentShader:`
  varying vec3 vWorld;uniform float time;uniform vec3 fogTint;uniform float opening;
  void main(){
   vec2 q=(vWorld.xz-vec2(${LAKE.x.toFixed(3)},${LAKE.z.toFixed(3)}))/vec2(${LAKE.rx.toFixed(3)},${LAKE.rz.toFixed(3)});
   float radius=length(q);
   float edge=1.-smoothstep(.60,1.02,radius);
   float n=.55+.45*sin(vWorld.x*.13+time*.15)+.35*sin(vWorld.z*.17-time*.11)+.22*sin((vWorld.x+vWorld.z)*.21+time*.09);
   float streak=.5+.5*sin(vWorld.x*.42-time*.24);
   float alpha=edge*clamp((.014+.040*n+.015*streak)*(.9+.32*opening),0.,.14);
   gl_FragColor=vec4(mix(fogTint,vec3(.86,.9,.95),.22),alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const mist=new T.Mesh(geo,mistMat);mist.position.y=.16;scene.add(mist);

 // Notched, horizontal lily leaves and sculpted open blossoms in grouped colonies.
 const life=lakeLife(), dummy=new T.Object3D(), rand=rng(1441);
 const leafVertices=[0,0,0],leafIndices=[];
 for(let i=0;i<=16;i++){const a=.20+i*(Math.PI*2-.40)/16;const r=1+.035*Math.sin(a*5.);leafVertices.push(Math.cos(a)*r,.012*Math.sin(a*2.),Math.sin(a)*r);if(i<16)leafIndices.push(0,i+2,i+1);}
 const padGeo=new T.BufferGeometry();padGeo.setAttribute('position',new T.Float32BufferAttribute(leafVertices,3));padGeo.setIndex(leafIndices);padGeo.computeVertexNormals();
 const padMat=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide,emissive:0x122016,emissiveIntensity:.22});
 const pads=new T.InstancedMesh(padGeo,padMat,life.pads.length);
 const padColors=['#687e52','#465e43','#80936a'].map(v=>new T.Color(v));
 const blooms=life.pads.filter(v=>v.bloom);
 // A single low-poly geometry for all water lilies, two rings of raised petals.
 const vertices=[],lilyIndices=[];
 for(let ring=0;ring<2;ring++)for(let j=0;j<8;j++){
  const a=j*Math.PI/4+ring*.32,cs=Math.cos(a),sn=Math.sin(a),r=ring?.47:.72,h=ring?.40:.25,w=ring?.13:.18,k=vertices.length/3;
  const point=(u,y,v)=>[u*cs-v*sn,y,u*sn+v*cs];
  vertices.push(...point(.04,.02,0),...point(r*.53,h*.38,-w),...point(r,h,0),...point(r*.53,h*.38,w),...point(r*.52,h*.68,0));
  lilyIndices.push(k,k+1,k+4,k+1,k+2,k+4,k+2,k+3,k+4,k+3,k,k+4);
 }
 const lilyGeo=new T.BufferGeometry();lilyGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));lilyGeo.setIndex(lilyIndices);lilyGeo.computeVertexNormals();
 const lilies=new T.InstancedMesh(lilyGeo,new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide,emissive:0x9a97a9,emissiveIntensity:.13}),blooms.length);
 const centers=new T.InstancedMesh(new T.IcosahedronGeometry(.10,0),new T.MeshLambertMaterial({color:0xe5c59c,emissive:0x775f31,emissiveIntensity:.18}),blooms.length);
 life.pads.forEach((p,i)=>{dummy.position.set(p.x,LAKE.y+.035+i*.00012,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();pads.setMatrixAt(i,dummy.matrix);pads.setColorAt(i,padColors[i%3]);});
 blooms.forEach((p,i)=>{dummy.position.set(p.x,LAKE.y+.10,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(p.scale*.91);dummy.updateMatrix();lilies.setMatrixAt(i,dummy.matrix);lilies.setColorAt(i,new T.Color(i%3===0?'#e0bbd6':'#eee9df'));dummy.position.y+=p.scale*.20;dummy.updateMatrix();centers.setMatrixAt(i,dummy.matrix);});
 for(const batch of [pads,lilies,centers]){batch.instanceMatrix.needsUpdate=true;if(batch.instanceColor)batch.instanceColor.needsUpdate=true;scene.add(batch);}

 // Foreground silhouettes: taller reeds frame the lake and make the ending feel composed.
 const reedBlade=new T.PlaneGeometry(.34,4.8,1,4);
 const reedMat=new T.MeshLambertMaterial({color:0x172114,emissive:0x0b1208,emissiveIntensity:.18,side:T.DoubleSide});
 const foregroundReeds=new T.InstancedMesh(reedBlade,reedMat,48);
 const edgeAngles=[Math.PI*.86,Math.PI*.90,Math.PI*.94,Math.PI*1.06,Math.PI*1.10,Math.PI*1.14];
 let idx=0;
 for(const side of [-1,1])for(let j=0;j<24;j++){
  const a=(side<0?edgeAngles[j%6]:Math.PI-edgeAngles[j%6])+(rand()-.5)*.06;
  const [x,z]=insideLake(a,.94+rand()*.10);
  const shift=side*(2.1+rand()*3.9);
  dummy.position.set(x+shift,LAKE.y+.22,z+rand()*2.2);
  dummy.rotation.set((rand()-.5)*.18,rand()*Math.PI,(rand()-.5)*.26);
  const s=1.0+rand()*1.1;
  dummy.scale.setScalar(s);
  dummy.updateMatrix();
  foregroundReeds.setMatrixAt(idx++,dummy.matrix);
 }
 foregroundReeds.instanceMatrix.needsUpdate=true;scene.add(foregroundReeds);

 // Soft glints / motes hovering over the water. Extra points are biased towards the moon path.
 const moteCount=84,motePos=new Float32Array(moteCount*3),moteSize=new Float32Array(moteCount),motePhase=new Float32Array(moteCount),moteTint=new Float32Array(moteCount*3);
 const tintA=new T.Color('#dbe6ff'), tintB=new T.Color('#b7dfff'), tintC=new T.Color('#efe7ff');
 for(let i=0;i<moteCount;i++){
  const path=i<moteCount*0.45;
  let x,z;
  if(path){
   z=LAKE.z+4-rand()*20;
   x=LAKE.x+(rand()-.5)*(2.2+Math.abs(z-LAKE.z)*.08);
  }else{
   const a=rand()*Math.PI*2, band=.18+Math.pow(rand(),.7)*.74;
   [x,z]=insideLake(a,band);
  }
  motePos[i*3]=x; motePos[i*3+1]=LAKE.y+.18+rand()*.40; motePos[i*3+2]=z;
  moteSize[i]=path?(8+rand()*11):(5+rand()*8); motePhase[i]=rand()*Math.PI*2;
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
  vertexShader:`attribute float moteSize;attribute float phase;attribute vec3 tint;uniform float time;uniform float pixelHeight;uniform float opening;varying vec3 vTint;varying float vAlpha;void main(){vec3 p=position;float drift=sin(time*.18+phase);p.x+=sin(time*.12+phase)*.18;p.z+=cos(time*.09+phase)*.15;p.y+=drift*.04;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pixelHeight*.0016*(moteSize*(.9+.4*opening))/max(1.,-mv.z),1.,8.);vTint=tint;vAlpha=(.35+.65*(.5+.5*sin(time*.7+phase)))*(.75+.35*opening);}`,
  fragmentShader:`varying vec3 vTint;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;float a=exp(-d*d*5.5)*(1.-smoothstep(.66,1.,d))*vAlpha;gl_FragColor=vec4(vTint,a);}`
 }));
 motes.frustumCulled=false;scene.add(motes);

 // Cheap moonbeams sitting high in the air: enough to feel theatrical, not enough to hurt.
 const beamGeo=new T.PlaneGeometry(58,26,1,1);
 const beamUniforms={time:{value:0},opening:{value:0}};
 const beams=new T.Mesh(beamGeo,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:beamUniforms,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float time;uniform float opening;void main(){float x=vUv.x-.5;float y=vUv.y;float shafts=exp(-x*x*9.)*(.35+.65*sin((x*18.+time*.08))*sin((x*9.-time*.06)));float top=smoothstep(.18,.88,y)*(1.-smoothstep(.82,1.,y));float alpha=max(0.,shafts)*top*(.05+.10*opening);gl_FragColor=vec4(.74,.84,.98,alpha);}`
 }));
 beams.position.set(LAKE.x,8.7,LAKE.z-18);beams.rotation.x=-Math.PI/2.7;scene.add(beams);

 const mistTint=new T.Color(0xaab7c7);
 return {
  mesh,
  setQuality(mistOn,low,pixelHeight){mist.visible=mistOn&&!low;beams.visible=!low;moteUniforms.pixelHeight.value=pixelHeight;},
  update(time,opening,fogColor){
   uniforms.time.value=time;uniforms.opening.value=opening;uniforms.fogTint.value.copy(fogColor);
   mistUniforms.time.value=time;mistUniforms.opening.value=opening;mistUniforms.fogTint.value.copy(fogColor).lerp(mistTint,.18+.22*opening);
   moteUniforms.time.value=time;moteUniforms.opening.value=opening;
   beamUniforms.time.value=time;beamUniforms.opening.value=opening;
  }
 };
}
