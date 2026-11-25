// Distances are world units; progress is a fraction of the trail.
export const TRAIL_LENGTH=88;
export const SPEED_UNITS=3.3;
export const MAX_SPEED=SPEED_UNITS/TRAIL_LENGTH;
export const MAX_QUEUE=9/TRAIL_LENGTH;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function queueTravel(progress,target,delta){return clamp(target+delta,Math.max(0,progress-MAX_QUEUE),Math.min(1,progress+MAX_QUEUE));}
export function advanceTravel(progress,target,dt){const diff=target-progress;if(Math.abs(diff)<0.00001)return target;const step=clamp(diff*(1-Math.exp(-dt*2.4)), -MAX_SPEED*dt,MAX_SPEED*dt);return clamp(progress+step,0,1);}
