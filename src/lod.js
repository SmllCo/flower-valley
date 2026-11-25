// Hysteresis avoids flickering when the camera hovers near the LOD boundary.
export function detailFor(distance,previous){
 if(previous===0)return distance>15?1:0;
 if(previous===1)return distance<12?0:1;
 return distance<13.5?0:1;
}
