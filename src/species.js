// Stable spatial colonies with a little mixing at their borders.
export function chooseSpecies(x,z,random){
 const wave=Math.sin(x*.29+z*.23)*.54+Math.sin(z*.41-x*.17)*.29+Math.cos(x*.63+z*.11)*.17;
 const p=Math.max(0,Math.min(.999999,.5+wave*.46+(random-.5)*.46));
 return p<.23?0:p<.43?1:p<.62?2:p<.81?3:4;
}
export function prefixCounts(items,n,types=5){const counts=Array(types).fill(0);for(let i=0;i<Math.min(n,items.length);i++)counts[items[i].species]++;return counts;}
