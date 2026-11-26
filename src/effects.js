import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { bloomDimensions } from './performance.js';

const vertexShader=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const shader=(uniforms,fragmentShader)=>new T.ShaderMaterial({uniforms,vertexShader,fragmentShader,depthTest:false,depthWrite:false,toneMapped:false});
// Extract HDR highlights, blur at low resolution, then grade and composite in
// one fullscreen pass. No mip pyramid or separate fullscreen grade pass.
class SoftLightPass extends Pass {
 constructor(){super();this.needsSwap=true;
  const target=()=>new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
  this.a=target();this.b=target();
  this.extract=shader({source:{value:null},offset:{value:new T.Vector2()},threshold:{value:.93}},`uniform sampler2D source;uniform vec2 offset;uniform float threshold;varying vec2 vUv;
   vec3 highlight(vec2 uv){vec3 c=texture2D(source,uv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));return c*smoothstep(threshold,threshold+.22,l);}
   void main(){vec3 c=(highlight(vUv+offset)+highlight(vUv-offset)+highlight(vUv+vec2(offset.x,-offset.y))+highlight(vUv+vec2(-offset.x,offset.y)))*.25;gl_FragColor=vec4(c,1.);}`);
  this.blur=shader({source:{value:null},direction:{value:new T.Vector2()}},`uniform sampler2D source;uniform vec2 direction;varying vec2 vUv;
   void main(){vec3 c=texture2D(source,vUv).rgb*.227027; c+=(texture2D(source,vUv+direction*1.384615).rgb+texture2D(source,vUv-direction*1.384615).rgb)*.316216; c+=(texture2D(source,vUv+direction*3.230769).rgb+texture2D(source,vUv-direction*3.230769).rgb)*.070270;gl_FragColor=vec4(c,1.);}`);
  this.mix=shader({source:{value:null},glow:{value:null},strength:{value:.19},opening:{value:0},time:{value:0},depthMap:{value:null},focus:{value:0},focusDistance:{value:12},cameraNear:{value:.12},cameraFar:{value:430},texel:{value:new T.Vector2(1,1)}},`uniform sampler2D source;uniform sampler2D glow;uniform float strength;uniform float opening;uniform float time;uniform sampler2D depthMap;uniform float focus;uniform float focusDistance;uniform float cameraNear;uniform float cameraFar;uniform vec2 texel;varying vec2 vUv;
   float eyeDepth(vec2 uv){float d=texture2D(depthMap,uv).r;return cameraNear*cameraFar/max(.0001,cameraFar-d*(cameraFar-cameraNear));}
   vec3 focusedColor(){vec3 c=texture2D(source,vUv).rgb;if(focus<.001)return c;float d=eyeDepth(vUv);float coc=smoothstep(.13,1.25,abs(d-focusDistance)/max(1.,focusDistance))*focus; if(d>cameraFar*.92)return c; vec2 r=texel*(1.+coc*6.);vec3 sum=c;float w=1.;for(int i=0;i<4;i++){vec2 off=i==0?vec2(r.x,0.):i==1?vec2(-r.x,0.):i==2?vec2(0.,r.y):vec2(0.,-r.y);vec2 uv=clamp(vUv+off,0.,1.);float delta=abs(eyeDepth(uv)-d);float weight=1.-smoothstep(max(.25,d*.06),max(.5,d*.20),delta);sum+=texture2D(source,uv).rgb*weight;w+=weight;}return mix(c,sum/w,coc);}
   void main(){vec3 c=focusedColor()+texture2D(glow,vUv).rgb*strength;float d=length((vUv-.5)*vec2(1.,.85));float vignette=1.-smoothstep(.25,.74,d)*mix(.36,.20,opening);c*=vignette*mix(vec3(.96,1.,1.035),vec3(.97,1.015,1.04),opening);c=mix(c,c*c/(c+vec3(.075))*1.075,.18);float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+floor(time*12.))*43758.5453)-.5;gl_FragColor=vec4(max(vec3(0.),c+grain*.003),1.);}`);
  this.quad=new FullScreenQuad(this.extract);
 }
 setSize(w,h){const {width,height}=bloomDimensions(w,h);this.a.setSize(width,height);this.b.setSize(width,height);this.extract.uniforms.offset.value.set(.7/Math.max(1,w),.7/Math.max(1,h));this.mix.uniforms.texel.value.set(1/Math.max(1,w),1/Math.max(1,h));}
 draw(renderer,target,material){this.quad.material=material;renderer.setRenderTarget(target);this.quad.render(renderer);}
 render(renderer,writeBuffer,readBuffer){
  this.extract.uniforms.source.value=readBuffer.texture;this.draw(renderer,this.a,this.extract);
  this.blur.uniforms.source.value=this.a.texture;this.blur.uniforms.direction.value.set(1/this.a.width,0);this.draw(renderer,this.b,this.blur);
  this.blur.uniforms.source.value=this.b.texture;this.blur.uniforms.direction.value.set(0,1/this.b.height);this.draw(renderer,this.a,this.blur);
  this.mix.uniforms.source.value=readBuffer.texture;this.mix.uniforms.depthMap.value=readBuffer.depthTexture;this.mix.uniforms.glow.value=this.a.texture;this.draw(renderer,this.renderToScreen?null:writeBuffer,this.mix);
 }
 dispose(){this.a.dispose();this.b.dispose();this.extract.dispose();this.blur.dispose();this.mix.dispose();this.quad.dispose();}
}
export function makeEffects(renderer,scene,camera){
 const composer=new EffectComposer(renderer),light=new SoftLightPass();
 // Allocate optional depth attachments only when DOF is first requested.
 // The normal path keeps the previous V19 render-target configuration.
 function ensureDepth(){for(const target of [composer.renderTarget1,composer.renderTarget2]){
  if(!target.depthTexture){target.dispose();target.depthTexture=new T.DepthTexture(target.width,target.height,T.UnsignedIntType);target.depthTexture.minFilter=target.depthTexture.magFilter=T.NearestFilter;}
  else if(target.depthTexture.image.width!==target.width||target.depthTexture.image.height!==target.height){target.depthTexture.image.width=target.width;target.depthTexture.image.height=target.height;target.depthTexture.needsUpdate=true;}
 }}
 light.mix.uniforms.cameraNear.value=camera.near;light.mix.uniforms.cameraFar.value=camera.far;
 composer.addPass(new RenderPass(scene,camera));composer.addPass(light);composer.addPass(new OutputPass());
 let lastW=0,lastH=0,lastRatio=renderer.getPixelRatio();
 return {resize(w,h,ratio){if(ratio!==lastRatio){composer.setPixelRatio(ratio);lastRatio=ratio;}if(w!==lastW||h!==lastH){composer.setSize(w,h);lastW=w;lastH=h;}},render(dt,opening,time,focus=0,distance=12){if(focus>.001||composer.renderTarget1.depthTexture)ensureDepth();light.mix.uniforms.focus.value=focus;light.mix.uniforms.focusDistance.value=distance;light.mix.uniforms.opening.value=opening;light.mix.uniforms.time.value=time;light.mix.uniforms.strength.value=.25+opening*.055;composer.render(dt);}};
}
