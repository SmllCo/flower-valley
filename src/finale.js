// Pure cinematic framing, independent of renderer and screen refresh rate.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function ease(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
export function finaleFrame(progress,portrait,settled=0){
 const reveal=ease(.70,.985,progress);
 const lift=ease(.77,1,progress);
 const rest=clamp(settled,0,1)*lift;
 return {reveal,extraHeight:lift*(1.55+portrait*.35)+rest*.18,
  targetY:3.2+portrait*.55-rest*.08,
  targetZ:-118, retreat:lift*4.3, pointerStrength:1-reveal*.92};
}
// The verse remains until the visitor chooses to dismiss it, or the cinematic
// hold has elapsed. A manual choice always wins until the station is left.
export function finaleVerseVisible(elapsed,override=null,reduced=false){
 return override===null?(reduced||elapsed<9):override;
}
