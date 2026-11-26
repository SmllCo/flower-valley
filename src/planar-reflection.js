import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {reflectionSize,reflectionDue} from './cinematic.js';
import {LAKE} from './lake-layout.js';
// Use Three's oblique near-plane clipping and reflected camera. The helper is
// never added to the scene; only the real water samples its texture.
export function createPlanarReflection(mesh,mist,uniforms){
 let helper=null,last=-Infinity,enabled=false,failed=false;
 const inverse=new T.Matrix4();
 function init(){
  if(helper)return;
  helper=new Reflector(new T.PlaneGeometry(1,1),{textureWidth:480,textureHeight:270,clipBias:.003,multisample:0});
  helper.rotation.x=-Math.PI/2;helper.position.set(LAKE.x,LAKE.y,LAKE.z);helper.updateMatrixWorld(true);
  inverse.copy(helper.matrixWorld).invert();
  uniforms.planarMap.value=helper.getRenderTarget().texture;
 }
 return {
  setEnabled(on){if(!on)failed=false;enabled=on&&!failed;if(!enabled){uniforms.planarWeight.value=0;last=-Infinity;}},
  get active(){return uniforms.planarWeight.value>0;},
  get failed(){return failed;},
  update(renderer,scene,camera,now,reveal){
   if(!enabled||reveal<=.76){uniforms.planarWeight.value=0;last=-Infinity;return;}
   if(!reflectionDue(now,last,enabled,reveal))return;
   try{
    init();const rt=helper.getRenderTarget();const s=reflectionSize(renderer.domElement.width,renderer.domElement.height);
    if(rt.width!==s.width||rt.height!==s.height)rt.setSize(s.width,s.height);
    const waterVisible=mesh.visible,mistVisible=mist.visible;
    const previousTarget=renderer.getRenderTarget(),previousXR=renderer.xr.enabled,previousShadow=renderer.shadowMap.autoUpdate;
    mesh.visible=false;mist.visible=false;
    try{helper.onBeforeRender(renderer,scene,camera);}
    finally{mesh.visible=waterVisible;mist.visible=mistVisible;renderer.xr.enabled=previousXR;renderer.shadowMap.autoUpdate=previousShadow;renderer.setRenderTarget(previousTarget);}
    uniforms.planarMatrix.value.multiplyMatrices(helper.material.uniforms.textureMatrix.value,inverse);
    uniforms.planarWeight.value=.67;last=now;
   }catch(error){console.warn('Planar reflection unavailable; using analytic water.',error);enabled=false;failed=true;uniforms.planarWeight.value=0;last=now;}
  }
 };
}
