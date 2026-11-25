import * as T from 'three';
import { TRAIL_LENGTH } from './travel.js';
import {makeClouds,makeMistBanks} from './atmosphere.js';
import earthColor from './assets/earth-color.png';
import earthHeight from './assets/earth-height.png';
import {makeBotany,chooseSpecies} from './botany.js';
export const GRASS_COUNT=26000, GRASS_LOW=13000;
import {detailFor} from './lod.js';
import {potentiallyVisible} from './visibility.js';
import petalTexture from './assets/petal-veins.png';
import {LAKE,lakeRadius,lakeTerrain,dryPosition,shorePoint} from './lake-layout.js';
import {makeLake} from './lake.js';
export const clamp=T.MathUtils.clamp;
export const smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
export const pathX=z=>Math.sin((18-z)*.064)*3.1+Math.sin((18-z)*.115)*.85;
export function height(x,z){
 const open=smooth(.48,.90,(18-z)/TRAIL_LENGTH), side=x-pathX(z);
 const ridge=(1-Math.exp(-side*side/155))*(1-open);
 return lakeTerrain(x,z,.44*Math.sin(z*.13)+.32*Math.sin(x*.29+z*.11)+.28*Math.cos(x*.25-z*.09)+ridge*(3.4+1.5*Math.sin(z*.075+ x*.06))*(1+.22*Math.cos(x*.21)));
}
export function rng(seed=173){return ()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};}
function texture(size,paint){const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
// The same wind field is evaluated on the GPU for all plants, with no CPU matrix updates.
export const wind={time:{value:0},strength:{value:1}};
const windGLSL=`uniform float windTime; uniform float windStrength;
vec3 plantWind(vec2 root,float h){
 float a=sin(windTime*1.2+root.x*.42+root.y*.22);
 float b=sin(windTime*.74-root.y*.31+root.x*.16);
 return vec3((a*.12+b*.055)*h*h,0.,(b*.10+a*.035)*h*h)*windStrength;
}`;
function windy(material,tip=false){
 material.onBeforeCompile=shader=>{shader.uniforms.windTime=wind.time;shader.uniforms.windStrength=wind.strength;
 shader.vertexShader=windGLSL+'\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 mvPosition=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
   float plantScale=length(instanceMatrix[0].xyz);
   mvPosition=instanceMatrix*mvPosition;
   mvPosition.xyz+=plantWind(instanceMatrix[3].xz,${tip?'0.65*plantScale':'max(0.,transformed.y*plantScale)'});
 #endif
 mvPosition=modelViewMatrix*mvPosition;
 gl_Position=projectionMatrix*mvPosition;`);};
 material.customProgramCacheKey=()=>tip?'valley-wind-tip':'valley-wind-blade';return material;
}
export function buildWorld(scene){
 const cloud=makeClouds(scene);
 const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{opening:{value:0}},vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vDir;uniform float opening;void main(){vec3 d=normalize(vDir);float h=smoothstep(-.09,.72,d.y);vec3 horizon=mix(vec3(.035,.065,.12),vec3(.075,.135,.22),opening);vec3 zenith=vec3(.004,.008,.025);vec3 col=mix(horizon,zenith,h);float m=pow(max(0.,dot(d,normalize(vec3(.02,.20,-1.)))),24.);col+=vec3(.045,.07,.13)*m;gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const sky=new T.Mesh(new T.SphereGeometry(325,24,16),skyMat);sky.position.set(0,0,-48);sky.renderOrder=-20;sky.frustumCulled=false;scene.add(sky);
 // Layered silhouettes beyond the walk; no expensive mountain models or shadows.
 const ridgeRandom=rng(492);
 for(let layer=0;layer<3;layer++){
  const vertices=[],indices=[],cols=[],z=-145-layer*42;
  const bottom=-12,base=4+layer*1.8;
  const topColor=new T.Color(['#26394b','#34475a','#40546a'][layer]);
  const bottomColor=new T.Color(['#131d2a','#233344','#304255'][layer]);
  for(let i=0;i<=96;i++){const x=-155+i*310/96;
   const y=base+Math.abs(Math.sin(x*.028+layer*1.9))*6+Math.sin(x*.076+layer)*2+Math.sin(x*.17+layer*.9)*1.3+ridgeRandom()*.7;
   vertices.push(x,bottom,z,x,y,z);cols.push(...bottomColor.toArray(),...topColor.toArray());
   if(i<96){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}
  const meshGeo=new T.BufferGeometry();meshGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));meshGeo.setAttribute('color',new T.Float32BufferAttribute(cols,3));meshGeo.setIndex(indices);
  const ridge=new T.Mesh(meshGeo,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,fog:false}));scene.add(ridge);
 }
 const random=rng(87), geo=new T.PlaneGeometry(160,210,160,196);geo.rotateX(-Math.PI/2);geo.translate(0,0,-62);
 const p=geo.attributes.position, colors=[], dark=new T.Color('#253029'), light=new T.Color('#515c43'), pathColor=new T.Color('#817262'), c=new T.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,height(x,z));const m=clamp(.22+smooth(.45,.94,(18-z)/TRAIL_LENGTH)*.23+.14*Math.sin(x*.6+z*.3)+.10*Math.sin(z*1.2-x*.81)+.14*random(),0,1);c.copy(dark).lerp(light,m);const border=.14*Math.sin(z*1.8)+.10*Math.sin(x*4.1+z*3.2);const path=1-smooth(.30,1.45,Math.abs(x-pathX(z))+border);c.lerp(pathColor,path*.74);c.multiplyScalar(.87+.13*Math.sin(x*.23-z*.38)**2);const lr=lakeRadius(x,z),shore=smooth(.82,.95,lr)*(1-smooth(1.01,1.15,lr));c.lerp(pathColor,shore*.55).multiplyScalar(1-shore*.42);colors.push(c.r,c.g,c.b);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 // A seamless soil albedo and micro-relief map, generated locally, not downloaded.
 const loader=new T.TextureLoader();
 const earthMap=loader.load(earthColor), earthBump=loader.load(earthHeight);
 for(const tex of [earthMap,earthBump]){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(80,105);tex.anisotropy=2;}
 earthMap.colorSpace=T.SRGBColorSpace;
 scene.add(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,map:earthMap,bumpMap:earthBump,bumpScale:.042,roughness:.89})));
 // Tiny scattered stones break the silhouette of the path without a shadow pass.
 const gravel=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshLambertMaterial({color:0xffffff}),900), stone=new T.Object3D();
 const stoneColors=['#4a4843','#69675b','#3b403e','#777064'].map(v=>new T.Color(v));
 for(let i=0;i<gravel.count;i++){let z=23-random()*(TRAIL_LENGTH+25),x=pathX(z)+(random()-.5)*3.6;const r=.012+random()**2*.052;[x,z]=dryPosition(x,z);stone.position.set(x,height(x,z)+.008,z);stone.rotation.set(random(),random()*6.28,random());stone.scale.set(r,r*(.3+random()*.35),r*(.6+random()*.6));stone.updateMatrix();gravel.setMatrixAt(i,stone.matrix);gravel.setColorAt(i,stoneColors[Math.floor(random()*4)]);}
 gravel.instanceMatrix.needsUpdate=true;gravel.instanceColor.needsUpdate=true;scene.add(gravel);
 const ambient=new T.HemisphereLight(0xb9cced,0x454b3d,1.18);scene.add(ambient);const sun=new T.DirectionalLight(0xd9e5ff,1.58);sun.position.set(-20,32,-85);scene.add(sun);
 // An original procedural moon texture, with softly shaded craters.
 const moonTex=texture(256,(ctx,s)=>{const g=ctx.createRadialGradient(105,97,5,128,128,120);g.addColorStop(0,'#fffaf0');g.addColorStop(.82,'#ddeaff');g.addColorStop(1,'#a7c1de');ctx.save();ctx.beginPath();ctx.arc(128,128,120,0,Math.PI*2);ctx.clip();ctx.fillStyle=g;ctx.fillRect(0,0,s,s);for(let i=0;i<160;i++){let x=random()*256,y=random()*256,r=2+random()*24;let cg=ctx.createRadialGradient(x,y,0,x,y,r);cg.addColorStop(0,'rgba(66,91,124,.15)');cg.addColorStop(1,'rgba(66,91,124,0)');ctx.fillStyle=cg;ctx.fillRect(x-r,y-r,r*2,r*2);}ctx.restore();});
 const haloTex=texture(128,(ctx,s)=>{let g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(170,206,255,.45)');g.addColorStop(.24,'rgba(135,178,245,.19)');g.addColorStop(1,'rgba(90,140,220,0)');ctx.fillStyle=g;ctx.fillRect(0,0,s,s);});
 const moon=new T.Sprite(new T.SpriteMaterial({map:moonTex,color:new T.Color(.81,.86,.95),transparent:true,depthWrite:false,fog:false,toneMapped:false}));moon.scale.set(19,19,1);moon.position.set(1,27,-170);moon.renderOrder=-7;scene.add(moon);const lake=makeLake(scene,moon);
 const halo=new T.Sprite(new T.SpriteMaterial({map:haloTex,transparent:true,depthWrite:false,fog:false,blending:T.AdditiveBlending}));halo.position.copy(moon.position);halo.position.z-=1;halo.scale.set(48,48,1);halo.renderOrder=-6;scene.add(halo);
 const stars=[],starColors=[];for(let i=0;i<900;i++){const a=random()*Math.PI*2,e=.09+random()*1.4,r=260;stars.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r+8,Math.sin(a)*Math.cos(e)*r-75);const b=.25+random()*.65;starColors.push(b*.75,b*.85,b);}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(stars,3));sg.setAttribute('color',new T.Float32BufferAttribute(starColors,3));const starField=new T.Points(sg,new T.PointsMaterial({size:1.15,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.68,fog:false,depthWrite:false}));starField.renderOrder=-8;scene.add(starField);
 // Four irregular ribbon blades, two with 3 segments and two with 2.
 // 16 triangles per tuft x 26,000 tufts: slightly fewer than V6.
 const gg=new T.BufferGeometry(),gv=[],gc=[];
 for(let blade=0;blade<4;blade++){
  const a=blade*2.399+.4,cs=Math.cos(a),sn=Math.sin(a),h=[.34,.49,.26,.38][blade],lean=[.16,.19,.21,.24][blade],root=.025+blade*.008,steps=blade<2?3:2;
  const point=(t,side)=>{const w=[.017,.014,.019,.012][blade]*Math.pow(1-t,.8)*(.8+.48*Math.sin(Math.PI*t)),bend=root+lean*t*t;const y=h*(t-.11*t*t*t);return [bend*cs-side*w*sn,y,bend*sn+side*w*cs];};
  const push=(v,t,side)=>{gv.push(...v);const shade=.35+.61*Math.pow(t,1.2);gc.push(shade*(side>0?.86:1),shade,shade*1.02);};
  for(let k=0;k<steps;k++){const u=k/steps,v=(k+1)/steps;push(point(u,-1),u,-1);push(point(u,1),u,1);push(point(v,-1),v,-1);if(k<steps-1){push(point(u,1),u,1);push(point(v,1),v,1);push(point(v,-1),v,-1);}}
 }
 gg.setAttribute('position',new T.Float32BufferAttribute(gv,3));gg.setAttribute('color',new T.Float32BufferAttribute(gc,3));gg.computeVertexNormals();
 // Unlit vertex shading deliberately keeps the very thin blades legible at night.
 // The fog still gives distance cues, and the gradient mimics silver-lit tips.
 const grass=new T.InstancedMesh(gg,windy(new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide})),GRASS_COUNT), dummy=new T.Object3D();
 const greens=['#34483c','#46594a','#58634e','#3d504a','#62735e'].map(v=>new T.Color(v));
 for(let i=0;i<grass.count;i++){
  let z,x,dist,patch;
  // Rejection sampling leaves a soft path and gives irregular clumps, not a uniform carpet.
  for(let attempt=0;attempt<24;attempt++){
   z=24-random()*(TRAIL_LENGTH+48);const side=random()<.5?-1:1;dist=.25+Math.pow(random(),2.2)*32;x=pathX(z)+side*dist;
   patch=.5+.23*Math.sin(x*.61+z*.37)+.20*Math.sin(z*.91-x*.73);
   const acceptance=(.035+.965*smooth(.55,1.6,dist))*(.27+.73*smooth(.10,.85,patch));
   if(random()<acceptance)break;
  }
  [x,z]=dryPosition(x,z);
  const edge=smooth(.7,2.6,dist),scale=(.78+random()*.7)*(.65+edge*.35);
  dummy.position.set(x,height(x,z)-.025,z);dummy.rotation.set(0,random()*6.28,0);dummy.scale.set(scale,.50+random()*.82+patch*.32,scale);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);
  c.copy(greens[Math.floor(random()*greens.length)]).multiplyScalar(.80+random()*.34);grass.setColorAt(i,c);
 }
 grass.instanceMatrix.needsUpdate=true;grass.instanceColor.needsUpdate=true;scene.add(grass);
 // Small clumps of reeds and shore stones frame the lake, leaving a clear view at arrival.
 const shoreRandom=rng(1841), reeds=new T.InstancedMesh(gg,windy(new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide})),720);
 const shoreStones=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshLambertMaterial({color:0xffffff}),180);
 for(let i=0;i<720;i++){
  const clump=i%36, a=clump/36*Math.PI*2+(shoreRandom()-.5)*.11;
  const [x,z]=shorePoint(a,1.025+shoreRandom()*.11);
  const gap=Math.abs(x)<3.6&&z>LAKE.z;
  const r=(.55+shoreRandom()*.85)*(gap?.38:1);
  dummy.position.set(x,height(x,z)-.025,z);dummy.rotation.set(0,shoreRandom()*6.28,0);dummy.scale.set(r,.9+r*2.0,r);dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);reeds.setColorAt(i,c.copy(greens[i%greens.length]).multiplyScalar(.78+shoreRandom()*.35));
 }
 for(let i=0;i<180;i++){
  const a=i/180*Math.PI*2+(shoreRandom()-.5)*.14,[x,z]=shorePoint(a,1.005+shoreRandom()*.11),r=.035+shoreRandom()**2*.23;
  dummy.position.set(x,height(x,z)+r*.10,z);dummy.rotation.set(shoreRandom(),shoreRandom()*6.28,shoreRandom());dummy.scale.set(r,r*.49,r*(.7+shoreRandom()*.5));dummy.updateMatrix();shoreStones.setMatrixAt(i,dummy.matrix);shoreStones.setColorAt(i,stoneColors[i%stoneColors.length]);
 }
 for(const mesh of [reeds,shoreStones]){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;scene.add(mesh);}
 const banks=makeMistBanks(scene,height,pathX,TRAIL_LENGTH);
 return {moon,halo,grass,skyMat,cloud,banks,lake,ambient,sun};
}
export function buildFlowers(scene,max=5000){
 const random=rng(), dummy=new T.Object3D(), specs=makeBotany(), items=[], positions=new Float32Array(max*3), colors=new Float32Array(max*3), pulse=new Float32Array(max), sizes=new Float32Array(max), bases=new Float32Array(max);
 const counts=specs.map(()=>0);
 for(let i=0;i<max;i++){
  let z=23-random()*(TRAIL_LENGTH+37);const open=smooth(.53,.94,(18-z)/TRAIL_LENGTH),side=random()<.5?-1:1,dist=.65+Math.pow(random(),i<2000?2.12:1.8)*(15+open*17);let x=pathX(z)+side*dist;[x,z]=dryPosition(x,z);
  const species=chooseSpecies(x,z,random()),spec=specs[species],slot=counts[species]++, scale=(.58+random()*.55)*spec.scale, y=height(x,z)-.025, a=random()*Math.PI*2;
  const color=new T.Color(spec.colors[Math.floor(random()*spec.colors.length)]).multiplyScalar(.85+random()*.24);
  const top=y+.65*scale;items.push({x,y:top,z,ground:y,a,scale,species,slot,tilt:(random()-.5)*.36,roll:(random()-.5)*.32,last:-Infinity,base:color});
  positions.set([x,top+.035,z],i*3);colors.set([color.r,color.g,color.b],i*3);sizes[i]=scale*spec.glowSize;bases[i]=spec.glow*(.22+random()*.14);
 }
 const batch=(geo,mat,n)=>{const o=new T.InstancedMesh(geo,mat,Math.max(1,n));o.frustumCulled=false;scene.add(o);return o;};
 const stemsMat=windy(new T.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide}));
 const petalMap=new T.TextureLoader().load(petalTexture);petalMap.colorSpace=T.SRGBColorSpace;petalMap.anisotropy=2;
 const petalMat=windy(new T.MeshLambertMaterial({map:petalMap,vertexColors:true,side:T.DoubleSide,emissive:0x222b40,emissiveIntensity:.16}),true);
 const centerMat=windy(new T.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide}),true);
 const farMat=windy(new T.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide}));
 const batches=specs.map((s,i)=>({stems:batch(s.stem,stemsMat,counts[i]),petals:batch(s.petals,petalMat,counts[i]),centers:batch(s.center,centerMat,counts[i]),far:batch(s.far,farMat,counts[i])}));
 for(const b of batches){for(const mesh of Object.values(b)){mesh.count=0;mesh.visible=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);}}
 const tint=new T.Color();let lastX=NaN,lastZ=NaN,nearCount=0,visibleCount=0,lastCamera=null,lastAspect=0,culling=false;
 const frustum=new T.Frustum(),clip=new T.Matrix4(),lastQuat=new T.Quaternion();
 function setFlowerColor(f,i){if(f.renderSlot<0)return;const b=batches[f.species],v=pulse[i];if(f.detail===0){b.petals.setColorAt(f.renderSlot,tint.copy(f.base).multiplyScalar(1+v*.55));b.petals.instanceColor.needsUpdate=true;}else if(f.detail===1){b.far.setColorAt(f.renderSlot,tint.setRGB(1+v*.40,1+v*.40,1+v*.40));b.far.instanceColor.needsUpdate=true;}}
 function refreshLOD(x,z,force=false,camera=lastCamera){
 if(!force&&Number.isFinite(lastX)&&Math.hypot(x-lastX,z-lastZ)<(culling?1.6:2.3)&&(!culling||!camera||(lastCamera&&lastQuat.angleTo(camera.quaternion)<.055&&lastAspect===camera.aspect)))return;
 lastX=x;lastZ=z;nearCount=0;visibleCount=0;lastCamera=camera;
 if(camera&&culling){lastQuat.copy(camera.quaternion);lastAspect=camera.aspect;clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(clip);}
 const near=specs.map(()=>0),far=specs.map(()=>0);
 for(let i=0;i<count;i++){const f=items[i],b=batches[f.species];f.detail=detailFor(Math.hypot(f.x-x,f.z-z),f.detail);
 if(culling&&camera&&!potentiallyVisible(frustum.planes,f.x,f.y,f.z,camera.position.x,camera.position.y,camera.position.z)){f.renderSlot=-1;continue;}
 visibleCount++;const slot=f.renderSlot=f.detail===0?near[f.species]++:far[f.species]++;
 dummy.position.set(f.x,f.ground,f.z);dummy.rotation.set(0,f.a,0);dummy.scale.setScalar(f.scale);dummy.updateMatrix();
 if(f.detail===0){nearCount++;b.stems.setMatrixAt(slot,dummy.matrix);dummy.position.y=f.y;dummy.rotation.set(f.tilt,f.a,f.roll,'YXZ');dummy.updateMatrix();b.petals.setMatrixAt(slot,dummy.matrix);b.centers.setMatrixAt(slot,dummy.matrix);}else b.far.setMatrixAt(slot,dummy.matrix);setFlowerColor(f,i);
 }
 batches.forEach((b,i)=>{for(const key of ['stems','petals','centers','far']){const mesh=b[key];mesh.count=key==='far'?far[i]:near[i];mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}});
 }
 const glowGeo=new T.BufferGeometry();glowGeo.setAttribute('position',new T.BufferAttribute(positions,3));glowGeo.setAttribute('tint',new T.BufferAttribute(colors,3));glowGeo.setAttribute('pulse',new T.BufferAttribute(pulse,1).setUsage(T.DynamicDrawUsage));glowGeo.setAttribute('flowerSize',new T.BufferAttribute(sizes,1));glowGeo.setAttribute('glowBase',new T.BufferAttribute(bases,1));
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{pixelHeight:{value:600},time:wind.time,windTime:wind.time,windStrength:wind.strength},vertexShader:windGLSL+`attribute vec3 tint;attribute float pulse;attribute float flowerSize;attribute float glowBase;varying float vBase;uniform float pixelHeight;uniform float time;varying vec3 vTint;varying float vPulse;varying float vFog;void main(){vec4 p=modelViewMatrix*vec4(position+plantWind(position.xz,.65*flowerSize),1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(pixelHeight*(.09+pulse*.11)*flowerSize/max(1.,-p.z),1.,28.);vTint=tint;vBase=glowBase;vPulse=pulse;vFog=exp(-.00022*p.z*p.z);}`,fragmentShader:`varying float vBase;varying vec3 vTint;varying float vPulse;varying float vFog;void main(){float d=length(gl_PointCoord-.5)*2.;float a=exp(-d*d*5.)*(1.-smoothstep(.65,1.,d));gl_FragColor=vec4(vTint*(1.7+vPulse*1.6),a*(vBase+vPulse*.23)*vFog);}`});

 const glow=new T.Points(glowGeo,mat);glow.frustumCulled=false;scene.add(glow);let count=0;const active=new Map();
 function setCount(n){for(const [i] of active)pulse[i]=0;active.clear();glowGeo.attributes.pulse.needsUpdate=true;count=Math.max(0,Math.min(n,max));glowGeo.setDrawRange(0,count);refreshLOD(Number.isFinite(lastX)?lastX:0,Number.isFinite(lastZ)?lastZ:18,true);}
 function trigger(i,t){const f=items[i];if(i<0||i>=count||t-f.last<2.0)return false;f.last=t;active.set(i,t);return true;}
 function update(t){if(!active.size)return;for(const [i,start] of active){const f=items[i],age=t-start; pulse[i]=age>2.2?0:age<.13?age/.13:Math.exp(-(age-.13)*2.8);setFlowerColor(f,i);if(age>2.2)active.delete(i);}glowGeo.attributes.pulse.needsUpdate=true;}
 return {items,setCount,trigger,update,refreshLOD,mat,get count(){return count;},get nearCount(){return nearCount;},get visibleCount(){return visibleCount;},setCulling(value){culling=value;refreshLOD(Number.isFinite(lastX)?lastX:0,Number.isFinite(lastZ)?lastZ:18,true);}};
}
