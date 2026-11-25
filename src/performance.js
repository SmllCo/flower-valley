// A small HDR buffer is enough for a deliberately subtle halo.
export const BLOOM_SCALE=.36;
export function bloomDimensions(width,height){return {width:Math.max(1,Math.round(width*BLOOM_SCALE)),height:Math.max(1,Math.round(height*BLOOM_SCALE))};}
export const MIST_BANKS=5;
export function mistBankPositions(trailLength){return Array.from({length:MIST_BANKS},(_,i)=>8-i*trailLength*(7/8)/(MIST_BANKS-1));}
