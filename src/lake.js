import * as T from 'three';
import {LAKE,shoreShape} from './lake-layout.js';
import {lakeLife} from './lake-life-layout.js';
import rippleMap from './assets/water-ripples.png';
import {createPlanarReflection} from './planar-reflection.js';

function rng(seed=911){return ()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};}
function insideLake(a,r){const shape=shoreShape(a)*r;return [LAKE.x+Math.cos(a)*LAKE.rx*shape,LAKE.z+Math.sin(a)*LAKE.rz*shape];}

// One opaque surface, analytic sky/moon reflection: no second scene render,
// render targets, or expensive screen-space ray marching.
export function makeLake(scene,moon,forestMask){
 const positions=[LAKE.x,LAKE.y,LAKE.z],indices=[];const n=160;
 for(let i=0;i<=n;i++){
  const a=i*2*Math.PI/n,r=shoreShape(a)*1.015;
  positions.push(LAKE.x+Math.cos(a)*LAKE.rx*r,LAKE.y,LAKE.z+Math.sin(a)*LAKE.rz*r);
  if(i<n)indices.push(0,i+2,i+1);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 const ripples=new T.TextureLoader().load(rippleMap);ripples.wrapS=ripples.wrapT=T.RepeatWrapping;ripples.colorSpace=T.NoColorSpace;ripples.anisotropy=2;
 const uniforms={time:{value:0},opening:{value:0},moonPosition:{value:moon.position},fogTint:{value:new T.Color(0x30465e)},ripples:{value:ripples},forestMask:{value:forestMask},planarMap:{value:null},planarMatrix:{value:new T.Matrix4()},planarWeight:{value:0}};
 const mat=new T.ShaderMaterial({uniforms,depthWrite:true,side:T.DoubleSide,vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
 fragmentShader:`
 varying vec3 vWorld;uniform float time;uniform float opening;uniform vec3 moonPosition;uniform vec3 fogTint;uniform sampler2D ripples;uniform sampler2D forestMask;uniform sampler2D planarMap;uniform mat4 planarMatrix;uniform float planarWeight;
 void main(){
  vec2 p=vWorld.xz;
  vec3 wave=texture2D(ripples,p*vec2(.073,.105)+vec2(time*.006,-time*.009)).rgb;
  vec2 q=mat2(.80,-.60,.60,.80)*p;
  vec3 fine=texture2D(ripples,q*vec2(.158,.21)+vec2(-time*.011,time*.008)).rgb;
  vec2 n=(wave.rg-.5)*vec2(.080,.15)+(fine.rg-.5)*.058;
  vec3 N=normalize(vec3(n.x,1.,n.y));
  vec3 V=normalize(cameraPosition-vWorld);vec3 R=reflect(-V,N);
  vec3 M=normalize(moonPosition-vWorld);
  float horizon=clamp(R.y,0.,1.);
  float fresnel=.13+.87*pow(1.-max(dot(N,V),0.),4.2);
  vec3 sky=mix(vec3(.030,.055,.100),vec3(.008,.016,.033),smoothstep(0.,.58,horizon));
  float angle=max(0.,dot(R,M));
  float disc=smoothstep(.9962,.99955,angle);
  float halo=pow(angle,110.);
  float sideways=R.x-M.x;
  float vertical=R.y-M.y;
  float broken=smoothstep(.30,.69,wave.b*.62+fine.b*.38);
  float pathGlow=exp(-sideways*sideways*240.-vertical*vertical*15.)*(.30+.70*broken);
  float glints=pow(angle,240.)*broken;
  // Reflection of distant forest, projected onto a fixed plane; no scene redraw.
  float planeDist=(-145.-vWorld.z)/min(-.02,R.z);
  vec3 hit=vWorld+R*planeDist;
  vec2 maskUV=vec2((hit.x+70.)/140.,(hit.y+2.)/22.);
  float valid=step(R.z,-.02)*step(0.,planeDist)*step(0.,maskUV.x)*step(maskUV.x,1.)*step(0.,maskUV.y)*step(maskUV.y,1.);
  float trees=texture2D(forestMask,clamp(maskUV,0.,1.)).a*valid;
  float az=atan(R.x,-R.z);
  float silhouette=.045+.025*abs(sin(az*5.2+.7))+.008*sin(az*13.1);
  float hills=1.-smoothstep(silhouette-.010,silhouette+.016,horizon);
  sky=mix(sky,vec3(.006,.015,.025),max(hills*.72,trees*.83));
  vec3 reflected=sky+vec3(.88,.94,1.)*(disc*.56+halo*.095+glints*.28+pathGlow*(.15+.11*opening))*(1.-trees*.90);
  if(planarWeight>.001){
   vec4 projected=planarMatrix*vec4(vWorld,1.);
   vec2 uv=projected.xy/max(.0001,projected.w)+n*.075;
   float validUv=smoothstep(0.,.035,uv.x)*smoothstep(0.,.035,uv.y)*(1.-smoothstep(.965,1.,uv.x))*(1.-smoothstep(.965,1.,uv.y))*step(.0001,projected.w);
   vec3 realReflection=texture2D(planarMap,clamp(uv,.001,.999)).rgb;
   reflected=mix(reflected,realReflection,planarWeight*validUv);
  }
  vec3 water=mix(vec3(.010,.025,.032),reflected,fresnel);
  float edgeAngle=atan((p.y+108.)/31.,p.x/29.);
  float shore=1.+.085*sin(edgeAngle*3.+.8)+.042*cos(edgeAngle*5.-1.2)+.018*sin(edgeAngle*9.+1.1);
  float r=length(vec2(p.x/29.,(p.y+108.)/31.))/shore;
  float shallow=smoothstep(.80,1.,r);
  float edgeDark=smoothstep(.92,1.05,r);
  water=mix(water,vec3(.030,.044,.041),shallow*.52);
  water=mix(water,vec3(.012,.022,.024),edgeDark*.65);
  water+=vec3(.003,.004,.006)*(wave.b-.5);
  float distanceToEye=length(cameraPosition-vWorld);
  float haze=1.-exp(-.000085*distanceToEye*distanceToEye);
  water=mix(water,fogTint*.60,haze*.46);
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
   float alpha=edge*clamp((.010+.023*n+.010*streak)*(.9+.25*opening),0.,.14);
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

 // Soft glints / motes hovering over the water. Extra points are biased towards the moon path.
 const moteCount=220,motePos=new Float32Array(moteCount*3),moteSize=new Float32Array(moteCount),motePhase=new Float32Array(moteCount),moteTint=new Float32Array(moteCount*3);
 const tintA=new T.Color('#dbe6ff'), tintB=new T.Color('#b7dfff'), tintC=new T.Color('#efe7ff');
 for(let i=0;i<moteCount;i++){
  const path=i<40;
  let x,z;
  if(path){
   z=LAKE.z+4-rand()*20;
   x=LAKE.x+(rand()-.5)*(2.2+Math.abs(z-LAKE.z)*.08);
  }else{
   const a=rand()*Math.PI*2, band=.50+Math.pow(rand(),.8)*.43;
   [x,z]=insideLake(a,band);
  }
  motePos[i*3]=x; motePos[i*3+1]=LAKE.y+.18+rand()*.40; motePos[i*3+2]=z;
  moteSize[i]=path?(8+rand()*9):(6+rand()*8); motePhase[i]=rand()*Math.PI*2;
  const t=(i%3===0?tintA:i%3===1?tintB:tintC);
  moteTint.set([t.r,t.g,t.b],i*3);
 }
 const moteGeo=new T.BufferGeometry();
 moteGeo.setAttribute('position',new T.BufferAttribute(motePos,3));
 moteGeo.setAttribute('moteSize',new T.BufferAttribute(moteSize,1));
 moteGeo.setAttribute('phase',new T.BufferAttribute(motePhase,1));
 moteGeo.setAttribute('tint',new T.BufferAttribute(moteTint,3));
 const moteUniforms={time:{value:0},pixelHeight:{value:600},opening:{value:0},arrival:{value:0},isFinal:{value:0}};
 const motes=new T.Points(moteGeo,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:moteUniforms,
  vertexShader:`attribute float moteSize;attribute float phase;attribute vec3 tint;uniform float time;uniform float pixelHeight;uniform float opening;uniform float arrival;uniform float isFinal;varying vec3 vTint;varying float vAlpha;void main(){
   vec3 p=position;float delay=clamp((-position.z-77.)/55.,0.,1.)*4.2+phase*.23;float age=max(0.,arrival-delay);float rise=smoothstep(0.,4.5,age)*isFinal;float veil=smoothstep(0.,.8,age)*(1.-smoothstep(6.,13.,age))*isFinal;
   p.x+=sin(time*.22+phase)*(.15+rise*.52)+sin(phase+age*.35)*veil*.34;p.z+=cos(time*.19+phase)*(.14+rise*.33);p.y+=sin(time*.22+phase)*.08+rise*(.7+2.8*fract(phase*1.45));
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pixelHeight*.009*(moteSize/10.)/max(1.,-mv.z),1.,7.);
   vTint=tint*(1.+veil*.65);float twinkle=.28+.72*pow(.5+.5*sin(time*.85+phase*2.),2.);vAlpha=(.12+.35*opening+.38*veil)*twinkle;
  }`,
  fragmentShader:`varying vec3 vTint;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;float a=exp(-d*d*5.5)*(1.-smoothstep(.66,1.,d))*vAlpha;gl_FragColor=vec4(vTint,a);}`
 }));
 motes.frustumCulled=false;scene.add(motes);

 const mistTint=new T.Color(0xaab7c7);
 const reflection=createPlanarReflection(mesh,mist,uniforms);
 return {
  mesh,reflection,
  setQuality(mistOn,low,pixelHeight){mist.visible=mistOn&&!low;moteUniforms.pixelHeight.value=pixelHeight;},
  update(time,opening,fogColor,arrival=0,final=false){
   uniforms.time.value=time;uniforms.opening.value=opening;uniforms.fogTint.value.copy(fogColor);
   mistUniforms.time.value=time;mistUniforms.opening.value=opening;mistUniforms.fogTint.value.copy(fogColor).lerp(mistTint,.18+.22*opening);
   moteUniforms.time.value=time;moteUniforms.opening.value=opening;moteUniforms.arrival.value=arrival;moteUniforms.isFinal.value=final?1:0;

  }
 };
}
