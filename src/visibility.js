// Conservative frustum test: allow motion, turning, wind and plant extents
// between batch rebuilds. This is not a distance-based LOD or asset swap.
export function potentiallyVisible(planes,x,y,z,eyeX,eyeY,eyeZ){
 const margin=3.5+.14*Math.hypot(x-eyeX,y-eyeY,z-eyeZ);
 return planes.every(p=>p.normal.x*x+p.normal.y*y+p.normal.z*z+p.constant>=-margin);
}
// Discrete resolution changes, with hysteresis. Never changes flower density.
export function nextResolution(scale,fps){
 if(fps<29)return Math.max(.76,Math.round((scale-.08)*100)/100);
 if(fps>46)return Math.min(1,Math.round((scale+.08)*100)/100);
 return scale;
}
