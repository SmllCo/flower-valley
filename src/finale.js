// Pure cinematic framing, independent of renderer and screen refresh rate.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function ease(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
export function finaleFrame(progress,portrait,settled=0){
 const reveal=ease(.71,.99,progress);
 const lift=ease(.79,1,progress);
 const rest=clamp(settled,0,1)*lift;
 return {reveal,extraHeight:lift*(3.05+portrait*.65)+rest*.32,
  targetY:1.75+portrait*.75-rest*.18,
  targetZ:-109, pointerStrength:1-reveal*.84};
}
// The verse remains until the visitor chooses to dismiss it, or the cinematic
// hold has elapsed. A manual choice always wins until the station is left.
export function finaleVerseVisible(elapsed,override=null,reduced=false){
 return override===null?(reduced||elapsed<9):override;
}
