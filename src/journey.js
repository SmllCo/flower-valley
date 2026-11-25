import {queueTravel,advanceTravel} from './travel.js';
export const STATIONS=[
 {at:.19,chapter:'I / ÉVEIL',fr:'Votre âme est un paysage choisi',en:'Your soul is a chosen landscape.'},
 {at:.44,chapter:'II / LE VAL',fr:'Et leur chanson se mêle au clair de lune',en:'And their song mingles with the moonlight.'},
 {at:.70,chapter:'III / LA LUMIÈRE',fr:'Au calme clair de lune triste et beau',en:'In the quiet moonlight, sad and beautiful.'},
 {at:1,chapter:'IV / LE PRÉ',fr:'Qui fait rêver les oiseaux dans les arbres',en:'That makes the birds dream in the trees.'}
];
export const HOLD=2.2, QUIET=.28;
// A station is a hard travel boundary, but approaching it is eased by advanceTravel.
// A deliberate new gesture after the reading pause is required to leave it.
export function createJourney(){
 let progress=0,target=0,station=-1,arrivedAt=-Infinity,lastInput=-Infinity;
 function reset(p=0){progress=target=p;station=p===1?STATIONS.length-1:-1;arrivedAt=-Infinity;lastInput=-Infinity;}
 function ready(t){return station>=0&&t-arrivedAt>=HOLD;}
 function leave(direction,t){if(station<0||!ready(t)||(direction>0&&station===STATIONS.length-1))return false;station=-1;lastInput=t;return true;}
 function input(delta,t,explicit=false){if(!Number.isFinite(delta)||!delta)return;const dir=Math.sign(delta),gap=t-lastInput;lastInput=t;if(station>=0){if(!ready(t)||(!explicit&&gap<QUIET))return;if(!leave(dir,t))return;}
 const boundary=dir>0?(STATIONS.find(s=>s.at>progress+1e-6)?.at??1):([...STATIONS].reverse().find(s=>s.at<progress-1e-6)?.at??0);
 target=explicit?boundary:queueTravel(progress,target,delta);target=dir>0?Math.min(target,boundary):Math.max(target,boundary);
 }
 function update(dt,t){if(station>=0)return;progress=advanceTravel(progress,target,dt);const i=STATIONS.findIndex(s=>Math.abs(progress-s.at)<1e-5&&Math.abs(target-s.at)<1e-5);if(i>=0){progress=target=STATIONS[i].at;station=i;arrivedAt=t;}}
 return {reset,input,update,ready,get progress(){return progress;},get station(){return station;}};
}
