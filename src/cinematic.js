// Shared controls for optional cinematography. No shader recompilation on toggle.
export const cinema={plants:{value:1},rays:{value:1}};
export function reflectionSize(w,h){const k=Math.min(1,480/Math.max(w,h));return {width:Math.max(1,Math.round(w*k)),height:Math.max(1,Math.round(h*k))};}
export function reflectionDue(now,last,enabled,reveal){return enabled&&reveal>.76&&now-last>=.16;}
export function focusAmount(station,final,reduced,enabled){return enabled&&!reduced&&station>=0?(final?.22:.52):0;}
// Vertex lighting intentionally avoids engine-specific lighting chunks; only
// the common begin_vertex and opaque_fragment insertion points are used.
export function addBotanicalLight(shader,kind){
 shader.uniforms.botanicalAmount=cinema.plants;
 shader.vertexShader='varying vec2 vBotanicalLight;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec3 botanicalNormal=normal;
 vec4 botanicalPoint=vec4(position,1.);
 #ifdef USE_INSTANCING
  mat3 bm=mat3(instanceMatrix);
  botanicalNormal=bm*(normal/max(vec3(.00001),vec3(dot(bm[0],bm[0]),dot(bm[1],bm[1]),dot(bm[2],bm[2]))));
  botanicalPoint=instanceMatrix*botanicalPoint;
 #endif
 vec3 botanicalWorld=(modelMatrix*botanicalPoint).xyz;
 vec3 bn=normalize(mat3(modelMatrix)*botanicalNormal);
 vec3 bl=normalize(vec3(-.13,.32,-.94));
 vec3 bv=normalize(-(modelViewMatrix*botanicalPoint).xyz);
 vec3 lightView=normalize(mat3(viewMatrix)*bl);
 float incidence=abs(dot(bn,bl));
 float back=pow(max(0.,dot(-bv,lightView)),2.);
 vBotanicalLight=vec2(incidence,back*(.25+.75*incidence));`);
 shader.fragmentShader='uniform float botanicalAmount; varying vec2 vBotanicalLight;\n'+shader.fragmentShader;
 const light=kind==='grass'?`outgoingLight*=mix(1.,.68+.34*vBotanicalLight.x,botanicalAmount); outgoingLight+=diffuseColor.rgb*vec3(.47,.65,.88)*vBotanicalLight.y*.36*botanicalAmount;`:`outgoingLight+=diffuseColor.rgb*vec3(.64,.79,1.)*vBotanicalLight.y*.48*botanicalAmount;`;
 shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',light+'\n#include <opaque_fragment>');
}
