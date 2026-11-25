// Only the final piano recording remains. Flowers are intentionally silent.
const remote='https://upload.wikimedia.org/wikipedia/commons/b/be/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg';
export function makeAudio(status){
 let enabled=false,final=false,loading=false,sourceReady=false,localURL='',serial=0;
 const track=new Audio();track.preload='none';track.volume=0;
 async function selectTrack(){if(sourceReady)return true;if(loading)return false;loading=true;const id=++serial;try{let src=localURL;if(!src){try{const r=await fetch(`${import.meta.env.BASE_URL}audio/clair-de-lune.ogg`,{method:'HEAD'});if(r.ok&&/audio|ogg|octet-stream/i.test(r.headers.get('content-type')||''))src=`${import.meta.env.BASE_URL}audio/clair-de-lune.ogg`;}catch{}}if(id!==serial)return false;track.src=src||remote;sourceReady=true;return true;}finally{if(id===serial)loading=false;}}
 async function playFinal(){if(!enabled||!final)return;try{if(!await selectTrack()||!enabled||!final)return;await track.play();if(!enabled||!final)track.pause();else {status('');if(track.paused){try{track.currentTime=0;}catch{}}}}catch{status('Music unavailable. Tap Retry or add a recording.');}}
 async function toggle(){enabled=!enabled;if(!enabled){track.pause();status('');}else if(final)void playFinal();return enabled;}
 function setFinal(v){if(v===final)return;final=v;if(v){void playFinal();}else status('');}
 function update(dt){const target=enabled&&final?.58:0;track.volume+=(target-track.volume)*(1-Math.exp(-dt*1.4));if(!final&&track.volume<.01&&!track.paused){track.pause();try{track.currentTime=0;}catch{}}}
 function setFile(file){if(!file)return;if(localURL)URL.revokeObjectURL(localURL);localURL=URL.createObjectURL(file);serial++;loading=false;sourceReady=false;track.pause();track.volume=0;void playFinal();}
 track.addEventListener('error',()=>{if(final&&enabled)status('Music unavailable. Add a local recording.');});
 return {toggle,setFinal,update,setFile,retry:playFinal,get enabled(){return enabled;}};
}
