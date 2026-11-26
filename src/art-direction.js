// Art direction is kept separate from the journey and graphics quality controls.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const fract=v=>v-Math.floor(v);
const hash=(i,k)=>fract(Math.sin(i*127.1+k*311.7)*43758.5453);
// Reserve a small fraction of the existing flower budget for the opening shot.
// This is independent of the world RNG, so count presets retain stable prefixes.
export function openingFlower(i){
 if(i>=2000||i%20!==0)return null;
 const k=i/20,side=k%2===0?-1:1;
 const group=Math.floor(k/2)%5;
 const z=14-group*3.25+(hash(k,1)-.5)*2.8;
 const offset=side*(1.18+group*.17+hash(k,2)*1.45);
 return {z,offset,scale:.98+hash(k,3)*.30};
}
export function artFrame(progress,portrait){
 const opening=1-ease(0,.16,progress),mid=ease(.06,.55,progress),end=ease(.71,.99,progress);
 return {cameraDrop:opening*(.21+.11*portrait),lookDrop:opening*.52,
  ambient:1.04+mid*.09-end*.14,moonlight:1.77+mid*.04+end*.09,
  halo:.115+mid*.035+end*.065};
}
// Broad mottling and narrow irregular edge, baked into the existing terrain colors.
export function groundDetail(x,z,distance){
 const verge=ease(.7,1.8,distance)*(1-ease(2.2,4.4,distance));
 const patch=.5+.5*Math.sin(x*.71+z*.36)*Math.sin(z*.49-x*.38);
 return {verge,shade:1-verge*(.08+.12*patch)};
}
