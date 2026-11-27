import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = id => document.getElementById(id);
const root = $('game-root');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x899ca1);
scene.fog = new THREE.FogExp2(0x899ca1, 0.0038);
const camera = new THREE.PerspectiveCamera(67, innerWidth / innerHeight, .1, 700);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xb7d8df,0x26373d,2.1));
const sun = new THREE.DirectionalLight(0xffdfbd,3.2); sun.position.set(-80,120,45); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-140;sun.shadow.camera.right=140;sun.shadow.camera.top=140;sun.shadow.camera.bottom=-140; scene.add(sun);
const fill = new THREE.DirectionalLight(0x58a9bc,1.3);fill.position.set(80,35,-90);scene.add(fill);
const mats={road:new THREE.MeshStandardMaterial({color:0x303b40,roughness:.92}),side:new THREE.MeshStandardMaterial({color:0x8c9995,roughness:.92}),ground:new THREE.MeshStandardMaterial({color:0x39464a,roughness:1}),water:new THREE.MeshStandardMaterial({color:0x14586c,roughness:.2,metalness:.25,transparent:true,opacity:.93}),line:new THREE.MeshBasicMaterial({color:0xd9cdb2}),glass:new THREE.MeshStandardMaterial({color:0x233d4b,roughness:.28,metalness:.35}),window:new THREE.MeshStandardMaterial({color:0xf4c879,emissive:0xd99538,emissiveIntensity:.42}),windowOff:new THREE.MeshStandardMaterial({color:0x273c44,roughness:.4}),brick:new THREE.MeshStandardMaterial({color:0x8d7465,roughness:.9}),concrete:new THREE.MeshStandardMaterial({color:0x9a9d91,roughness:.92}),steel:new THREE.MeshStandardMaterial({color:0x3e555a,metalness:.65,roughness:.45})};
const rand=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)], clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function box(parent,x,y,z,sx,sy,sz,mat,cast=false,receive=true){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=receive;parent.add(m);return m;}
function cylinder(parent,x,y,z,r1,r2,h,mat,segments=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
const world = new THREE.Group();scene.add(world);
// waterfront + city blocks
box(world,0,-.55,0,410,1,410,mats.ground);
const water=new THREE.Mesh(new THREE.PlaneGeometry(340,420,32,32),mats.water); water.rotation.x=-Math.PI/2; water.position.set(390,-.9,0); scene.add(water);
const shore=box(world,208,-.34,0,5,.65,410,mats.side);
const waterEdge=box(world,211,-.2,0,.7,.25,410,new THREE.MeshStandardMaterial({color:0x477f83}));
const roadSize=22, blockSize=34, step=roadSize+blockSize;
// city surface and avenue grid
for(let i=-5;i<=5;i++){
  const p=i*step;
  box(world,p,.01,0,roadSize,.12,390,mats.road);
  box(world,0,.01,p,390,.12,roadSize,mats.road);
  for(const off of [-roadSize/2+1.4,roadSize/2-1.4]){
    const v=box(world,p+off,.08,0,.12,.02,380,mats.line);v.material=new THREE.MeshBasicMaterial({color:0x756e5f,transparent:true,opacity:.5});
    const h=box(world,0,.08,p+off,380,.02,.12,v.material);
  }
  // dashed lane lines
  for(let z=-185;z<190;z+=12) box(world,p,.09,z,.13,.025,5,mats.line);
  for(let x=-185;x<190;x+=12) box(world,x,.09,p,5,.025,.13,mats.line);
}
const buildingPositions=[];
const facadeMats=[mats.brick,mats.concrete,mats.glass,new THREE.MeshStandardMaterial({color:0x786c5e,roughness:.9}),new THREE.MeshStandardMaterial({color:0x64787a,roughness:.8})];
for(let gx=-5;gx<=5;gx++)for(let gz=-5;gz<=5;gz++){
 const bx=gx*step,bz=gz*step;
 if(bx>190)continue;
 if(Math.abs(bx)<27&&Math.abs(bz)<27)continue;
 const count=(Math.abs(bx)<40||Math.abs(bz)<40)?2:1;
 for(let k=0;k<count;k++){
  const x=bx+rand(-9,9),z=bz+rand(-9,9),w=rand(17,29),d=rand(17,29),h=rand(20,68)*(Math.random()<.13?1.8:1);
  if(x>15&&x<43)continue;
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  const body=box(g,0,h/2,0,w,h,d,pick(facadeMats),true);buildingPositions.push({x,z,w,d,h});
  box(g,0,h+.5,0,w*.85,1,d*.85,mats.steel,true);
  // facade window ribbons on all four sides
  const cols=Math.max(2,Math.floor(w/3.6)), rows=Math.floor(h/4.5);
  for(let r=1;r<rows;r++)for(let c=0;c<cols;c++){
    const wx=-w/2+1.6+c*(w-3.2)/Math.max(1,cols-1),wy=r*4.2;
    if(Math.random()<.14)continue;
    const wm=Math.random()<.44?mats.window:mats.windowOff;
    box(g,wx,wy,d/2+.025,.85,1.35,.07,wm);box(g,wx,wy,-d/2-.025,.85,1.35,.07,wm);
  }
  const rowsD=Math.floor(d/4),colsD=Math.max(2,Math.floor(d/3.6));
  for(let r=1;r<rowsD;r++)for(let c=0;c<colsD;c++){
   if(Math.random()<.2)continue;const wz=-d/2+1.5+c*(d-3)/Math.max(1,colsD-1),wy=r*4.2,wm=Math.random()<.5?mats.window:mats.windowOff;
   box(g,w/2+.03,wy,wz,.07,1.3,.8,wm);box(g,-w/2-.03,wy,wz,.07,1.3,.8,wm);
  }
  if(Math.random()<.22){box(g,0,h+2,0,rand(3,8),3,rand(3,7),mats.brick,true);cylinder(g,0,h+4,0,1.3,1.3,1.5,mats.steel);}
 }
}
// road furniture, lamps, benches and rooftop beacons
for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++){
 const x=i*step+roadSize/2-1,z=j*step+roadSize/2-1;
 if(Math.abs(x)>190||Math.abs(z)>190)continue;
 cylinder(world,x,3,z,.12,.16,6,mats.steel,7);box(world,x,6,z,.6,.14,.5,mats.window);
}
// water ripples
const ripples=[];for(let i=0;i<30;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(rand(1,5),.05,4,24),new THREE.MeshBasicMaterial({color:0x75b8b9,transparent:true,opacity:.3}));m.rotation.x=Math.PI/2;m.position.set(rand(55,370),-.25,rand(-190,190));scene.add(m);ripples.push({m,s:rand(.8,2.5),phase:rand(0,6)});}

// Original hero and supporting cast: simple, expressive low-poly silhouettes.
const redMat=new THREE.MeshStandardMaterial({color:0xd54c45,roughness:.72}), suitMat=new THREE.MeshStandardMaterial({color:0x192a38,roughness:.68}), trimMat=new THREE.MeshStandardMaterial({color:0x79d5c8,metalness:.25,roughness:.5}), eyeMat=new THREE.MeshStandardMaterial({color:0xe9f6ec,emissive:0x618f92,emissiveIntensity:.3}), skinMat=new THREE.MeshStandardMaterial({color:0xc98668}), hairMat=new THREE.MeshStandardMaterial({color:0x382a29}), villainMat=new THREE.MeshStandardMaterial({color:0x262538,metalness:.35,roughness:.55}), glowMat=new THREE.MeshStandardMaterial({color:0xe76149,emissive:0xff371d,emissiveIntensity:1.2});
function makeHero(){const g=new THREE.Group();
 cylinder(g,0,1.05,0,.33,.31,.76,suitMat,9);const chest=box(g,0,1.14,.29,.45,.48,.12,redMat,true);chest.rotation.z=-.08;
 const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),redMat);head.position.y=1.65;head.castShadow=true;g.add(head);
 for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.105,10,8),eyeMat);eye.scale.set(1.25,.62,.3);eye.position.set(side*.13,1.68,.22);g.add(eye);
  const arm=cylinder(g,side*.4,1.12,0,.12,.17,.62,side<0?suitMat:redMat,8);arm.rotation.z=side*-.35;
  const leg=cylinder(g,side*.17,.46,0,.13,.16,.78,suitMat,8);leg.rotation.z=side*.035;
  box(g,side*.17,.08,.08,.24,.14,.4,redMat,true);
 }
 // mint chest sigil, unique four-point web-star motif
 for(let a=0;a<4;a++){const ray=box(g,0,1.16,.365,.035,.28,.018,trimMat);ray.rotation.z=a*Math.PI/2;}
 const belt=box(g,0,.73,0,.55,.09,.38,redMat);g.add(belt);return g;}
const hero=makeHero();hero.position.set(0,0,0);scene.add(hero);
function makePerson({color=0x638d8d,hair=0x382a29,scale=1}={}){const g=new THREE.Group(),clothes=new THREE.MeshStandardMaterial({color,roughness:.9}),hairM=new THREE.MeshStandardMaterial({color:hair});
 cylinder(g,0,.72,0,.16,.19,.52,clothes,7);const head=new THREE.Mesh(new THREE.SphereGeometry(.145,9,8),skinMat);head.position.y=1.12;g.add(head);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.151,9,6,0,Math.PI*2,0,Math.PI*.52),hairM);cap.position.y=1.16;g.add(cap);
 for(const s of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.018,5,5),eyeMat);eye.position.set(s*.05,1.14,.131);g.add(eye);const leg=cylinder(g,s*.085,.28,0,.055,.07,.45,suitMat,6);leg.rotation.z=s*.07;}
 g.scale.setScalar(scale);return g;}
const civilians=[];const pedestrianColors=[0x476879,0x92815a,0x73545f,0x516b58,0xb06e50,0x45535e];
for(let i=0;i<36;i++){let x,z;do{x=rand(-180,180);z=rand(-180,180)}while(Math.abs((x%step))<roadSize/2+1&&Math.abs((z%step))<roadSize/2+1);
 const model=makePerson({color:pick(pedestrianColors),scale:rand(.88,1.12)});model.position.set(x,0,z);scene.add(model);civilians.push({model,angle:rand(0,6.28),speed:rand(.35,.8),origin:new THREE.Vector3(x,0,z)});}
// Simple traffic loops. Vehicles stay on roads and use original generated geometry.
const cars=[];const carColors=[0xd09d69,0x455a66,0xb35e56,0x728a7c,0x303f4b,0xc0c1ad];
function makeCar(color){const g=new THREE.Group(),body=new THREE.MeshStandardMaterial({color,metalness:.2,roughness:.52});box(g,0,.65,0,3.8,.85,1.8,body,true);box(g,0,1.22,-.12,2.05,.48,1.5,mats.glass,true);
 for(const x of [-1.25,1.25])for(const z of [-1,1]){const w=cylinder(g,x,.32,z*.72,.31,.31,.18,new THREE.MeshStandardMaterial({color:0x172025}),10);w.rotation.z=Math.PI/2;}
 for(const z of [-.7,.7])box(g,1.92,.76,z,.08,.24,.22,new THREE.MeshBasicMaterial({color:z>0?0xff594c:0xffd69a}));return g;}
for(let i=0;i<18;i++){const vertical=Math.random()<.5,lane=pick([-4,4]),road=rand(-175,175),g=makeCar(pick(carColors));if(vertical){g.position.set(lane,0,road);g.rotation.y=Math.PI/2;}else g.position.set(road,0,lane);scene.add(g);cars.push({g,vertical,speed:rand(6,12),dir:Math.random()<.5?1:-1,lane});}

const targets=[];
// Original super-villains and MJ. These are distinct procedural characters,
// with voiced, mission-specific dialogue from the in-game cast.
const villainRoster={
  venom:{name:'Vex the Symbiote',color:0x171526,accent:0xf4f2d2,lines:['We are Vex. This city has nowhere left to hide.','Run, hero. Every shadow belongs to us now.','You cannot separate us from this place.']},
  sandman:{name:'Sandstorm',color:0xb09a70,accent:0xd9c58f,lines:['This whole town can be ground into dust.','The blocks are shifting. Try to keep up!','You found me—but sand remembers every shape.']},
  goblin:{name:'Green Jackal',color:0x6aa66f,accent:0xb9ff62,lines:['A little fear makes the wheels spin, hero!','The rooftop is my throne tonight!','You dropped the punchline, web-head!']},
  undertow:{name:'The Undertow',color:0x284c63,accent:0x65d6e4,lines:['The harbor rises for no one.','A flood remembers every street.','The pump will swallow this block!']},
  viper:{name:'Volt Viper',color:0x8a4e9c,accent:0xe3a5ff,lines:['The grid is mine. I wrote the circuit.','Your spark is almost gone.','One surge, and this bridge goes dark!']},
  krill:{name:'Doctor Krill',color:0x41685e,accent:0xffb44e,lines:['Evolution does not ask permission.','The harbor will choose a new life tonight.','Your city is an experiment, and you are the variable!']}
};
function makeVillain(kind,x,z){
  const data=villainRoster[kind]||villainRoster.undertow;
  const g=new THREE.Group();
  const body=new THREE.MeshStandardMaterial({color:data.color,roughness:.62,metalness:kind==='venom'?0.15:.08});
  cylinder(g,0,.95,0,.42,.34,1.25,body,10);
  const head=new THREE.Mesh(new THREE.SphereGeometry(kind==='sandman'?0.5:.34,12,10),kind==='venom'?new THREE.MeshStandardMaterial({color:data.color,roughness:.3}):body);
  head.position.y=1.72;head.castShadow=true;g.add(head);
  if(kind==='venom'||kind==='goblin'||kind==='viper'){
    for(const s of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshBasicMaterial({color:data.accent}));eye.scale.set(1.3,.55,.25);eye.position.set(s*.13,1.78,.29);g.add(eye);}
  }
  if(kind==='sandman'){for(let i=0;i<9;i++)cylinder(g,(Math.random()-.5)*1.2, .55+Math.random()*1.5,(Math.random()-.5)*1.0,.09,.18,.75,new THREE.MeshStandardMaterial({color:data.accent,roughness:1}),7);}
  if(kind==='goblin'){const blade=box(g,0,1.15,.62,.06,.06,1.1,new THREE.MeshStandardMaterial({color:data.accent,emissive:0x295e24,emissiveIntensity:.7},true));blade.rotation.x=.5;}
  if(kind==='viper')for(let i=-1;i<=1;i++)cylinder(g,i*.4,1.15,.28,.07,.13,.85,new THREE.MeshStandardMaterial({color:data.accent,emissive:0x7d368e,emissiveIntensity:1}),6);
  g.position.set(x,0,z);g.scale.setScalar(1.45);scene.add(g);return g;
}
function makeMJ(){
  const g=makePerson({color:0xb55767,hair:0x7a3b29,scale:1.02});
  g.position.set(-18,0,36);g.userData.name='MJ';g.userData.interacted=false;scene.add(g);return g;
}
const mj=makeMJ();
const npcDialogue=[
  ['Rook','You keep the skyline moving, even when the lights do not.'],
  ['Mara','The old harbor stairs are safest. The water is rising strangely.'],
  ['Theo','My delivery bot got scared by the thunder. Have you seen a blue box?'],
  ['Jun','If you need a fast route, follow the tram rails—they run above the grid.']
];
const npcs=[];
for(let i=0;i<8;i++){const z=pick([-132,-84,-38,43,91,141]);let x=pick([-150,-102,-54,8,54,102,148]);const p=makePerson({color:pick(pedestrianColors),scale:1.02});p.position.set(x,0,z);scene.add(p);const info=pick(npcDialogue);npcs.push({model:p,name:info[0],line:info[1],cooldown:0});}
function makeBeacon(x,z,type='signal'){const g=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(type==='boss'?2.5:1.35,.1,8,32),new THREE.MeshBasicMaterial({color:type==='rescue'?0x7dffd0:type==='boss'?0xff6558:0xc8f05d}));ring.position.y=1.1;g.add(ring);const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(type==='boss'?1.1:.55,1),new THREE.MeshStandardMaterial({color:type==='boss'?0xff6a58:0xc8f05d,emissive:type==='boss'?0x8e1710:0x567018,emissiveIntensity:1.5}));orb.position.y=1.1;g.add(orb);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.02,.8,4,12,1,true),new THREE.MeshBasicMaterial({color:type==='boss'?0xff6558:0xc8f05d,transparent:true,opacity:.12,side:THREE.DoubleSide}));beam.position.y=2;g.add(beam);g.position.set(x,0,z);scene.add(g);targets.push({g,x,z,type,active:true,hp:type==='boss'?5:1});return g;}
const webLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xe8f2de,transparent:true,opacity:.9}));scene.add(webLine);webLine.visible=false;
const missions=[
  {title:'A CITY IN STATIC',brief:'A burst of strange interference is crawling through downtown.',objective:'Find 3 signal traces',type:'collect',count:3,places:[[-72,-70],[75,-106],[-110,80]],voice:'Dispatch says the whole east grid just blinked. Follow those little green flares. Something is pulling power from the blocks.'},
  {title:'THE LONG WAY HOME',brief:'Three neighbors are stranded after the blackout.',objective:'Check on 3 neighbors',type:'rescue',count:3,places:[[-132,-23],[104,31],[-40,111]],voice:'Hey, web-head. I see people waving from the sidewalks. Make sure everyone gets somewhere safe.'},
  {title:'VENOM: BLACK HORIZON',brief:'Vex the Symbiote is hunting in the old pump tunnels.',objective:'Defeat Vex the Symbiote',type:'boss',count:1,places:[[12,15]],villain:'venom',voice:'Vex the Symbiote is closing in beneath the harbor. We are Vex, he says. That is never a good sign.'},
  {title:'NIGHT SHIFT',brief:'A stolen courier drone is cutting across the rooftops.',objective:'Recover 4 data drops',type:'collect',count:4,places:[[110,-84],[-147,-112],[73,118],[-54,40]],voice:'I caught a second signal. Someone is using that drone to map every response route. Bring its data back.'},
  {title:'SAND WITHOUT SHORE',brief:'Sandstorm is dismantling the waterfront warehouses.',objective:'Stop Sandstorm',type:'boss',count:1,places:[[141,76]],villain:'sandman',voice:'Sandstorm has swallowed the warehouse district. Stay high, web-head—he turns every street into a desert.'},
  {title:'GREEN JACKAL RISING',brief:'Green Jackal is attacking the central tram line.',objective:'Defeat Green Jackal',type:'boss',count:1,places:[[3,-11]],villain:'goblin',voice:'Green Jackal is riding the tram line. Look out for gliders, and do not let him drag you off the bridge.'},
  {title:'THE UNDERTOW',brief:'The masked saboteur is flooding the old harbor.',objective:'Stop The Undertow',type:'boss',count:1,places:[[210,-55]],villain:'undertow',voice:'The Undertow controls the pumps beyond the seawall. Keep your feet dry and shut it down.'},
  {title:'AFTERLIGHT',brief:'Volt Viper and Doctor Krill are converging on the rooftop beacon.',objective:'Break the final alliance',type:'boss',count:2,places:[[-24,-174],[132,-140]],villain:['viper','krill'],voice:'Last chance for a quiet skyline. Volt Viper and Doctor Krill are linked at the last beacon. Split the signal and finish this.'}
];

let active=false,paused=false,missionIndex=0,missionProgress=0,health=100,air=100,onWater=false,gameEnded=false,swingTime=0,jumpVelocity=0,coyote=0,attackCooldown=0,bossAttack=0,playerSpeed=0,yaw=0,pitch=.12,elapsed=0,missionTargets=[],heroLines=[];
const velocity=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),desired=new THREE.Vector3(),cameraGoal=new THREE.Vector3();
const keys={};
function say(text){$('subtitle').textContent=text;$('subtitle').classList.add('show');if('speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.96;u.pitch=.95;u.volume=.8;speechSynthesis.speak(u);}clearTimeout(say.timer);say.timer=setTimeout(()=>$('subtitle').classList.remove('show'),5600);}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2400);}
function prepareMission(){const m=missions[missionIndex];missionProgress=0;missionTargets=[];targets.forEach(t=>{scene.remove(t.g);});targets.length=0;
 $('mission-title').textContent=m.title;$('mission-objective').textContent=m.objective;$('mission-bar').style.width='0%';$('mission-complete').classList.remove('show');
 m.places.forEach(([px,pz],i)=>{const x=Math.round(px/step)*step,z=pz;const kind=m.type==='boss'?'boss':m.type==='rescue'?'rescue':'signal';const g=makeBeacon(x,z,kind);g.userData.index=i;
  if(kind==='boss'){const key=Array.isArray(m.villain)?m.villain[i]:m.villain||'undertow';const b=makeVillain(key,x,z);g.userData.villain=b;g.userData.villainKind=key;}
  if(kind==='rescue'){const person=makePerson({color:pick(pedestrianColors),scale:1.2});person.position.set(x,0,z);scene.add(person);g.userData.person=person;}
  missionTargets.push({g,x,z,type:kind,hp:kind==='boss'?5:1,done:false,lastHit:0});
 });
 $('mission-objective').textContent=m.objective+' · 0/'+m.count;$('mission-bar').style.width='0%';
 say(m.voice);toast(`THREAD ${String(missionIndex+1).padStart(2,'0')} · ${m.title}`);
}
function updateMission(){const m=missions[missionIndex];missionProgress++;const pct=Math.min(100,missionProgress/m.count*100);$('mission-bar').style.width=pct+'%';$('mission-objective').textContent=`${m.objective} · ${missionProgress}/${m.count}`;
 if(missionProgress>=m.count){$('mission-complete').classList.add('show');$('complete-title').textContent=m.title;$('complete-copy').textContent='The skyline feels a little safer. Keep the patrol going.';say('That is one more thread mended. Take a second, then we keep moving.');active=false;}
}
function interact(){if(!active||paused||gameEnded)return;let nearest=null,dist=Infinity;for(const t of missionTargets){if(t.done)continue;const d=Math.hypot(hero.position.x-t.x,hero.position.z-t.z);if(d<dist){dist=d;nearest=t;}}
 if(!nearest||dist>5){const md=Math.hypot(hero.position.x-mj.position.x,hero.position.z-mj.position.z);if(md<4){say(pick(['MJ: The skyline is beautiful from here. Please come home safely.','MJ: Every light you brought back matters.','MJ: There is still so much left to save.']));toast('MJ · CONVERSATION');return;}for(const npc of npcs){const nd=Math.hypot(hero.position.x-npc.model.position.x,hero.position.z-npc.model.position.z);if(nd<4){say(npc.name+': '+npc.line);toast(npc.name+' · CONVERSATION');return;}}toast('Move closer to the highlighted signal or a person');return;}
 if(nearest.type==='boss'){damageBoss(nearest);return;}
 nearest.done=true;nearest.g.visible=false;if(nearest.g.userData.person)nearest.g.userData.person.visible=false;updateMission();}
function damageBoss(t){if(!t||t.done)return;t.hp--;t.lastHit=elapsed;t.g.scale.setScalar(1.25);setTimeout(()=>t.g.scale.setScalar(1),100);toast(`WEB STRIKE · ${Math.max(0,t.hp)} LEFT`);say(t.g.userData.villainKind?villainRoster[t.g.userData.villainKind].lines[Math.floor(Math.random()*villainRoster[t.g.userData.villainKind].lines.length)]:pick(['Got you!','You are done terrorizing this block.','Not letting you near the water pumps again.']));if(t.hp<=0){t.done=true;t.g.visible=false;if(t.g.userData.villain)t.g.userData.villain.visible=false;updateMission();}else bossAttack=1.5;}
function beginGame(){if(!active&&missionIndex===0&&missionProgress===0&&hero.position.length()<.1){}if(missionTargets.length===0)prepareMission();active=true;paused=false;gameEnded=false;$('menu').classList.remove('visible');$('pause-screen').classList.remove('visible');$('hud').classList.remove('hidden');$('game-over').classList.remove('show');renderer.domElement.requestPointerLock?.();}
function pauseGame(){if(!active&&!paused)return;active=false;paused=true;document.exitPointerLock?.();$('pause-screen').classList.add('visible');}
function resumeGame(){paused=false;active=true;$('pause-screen').classList.remove('visible');renderer.domElement.requestPointerLock?.();}
function restart(){hero.position.set(0,0,0);hero.rotation.set(0,0,0);velocity.set(0,0,0);health=100;air=100;missionIndex=0;missionProgress=0;gameEnded=false;onWater=false;$('game-over').classList.remove('show');prepareMission();active=true;paused=false;$('pause-screen').classList.remove('visible');$('menu').classList.remove('visible');$('hud').classList.remove('hidden');renderer.domElement.requestPointerLock?.();}
$('start-btn').onclick=()=>beginGame();$('continue-btn').onclick=()=>resumeGame();$('resume-btn').onclick=()=>resumeGame();$('restart-btn').onclick=()=>restart();$('retry-btn').onclick=()=>restart();$('menu-btn').onclick=()=>pauseGame();$('next-mission').onclick=()=>{missionIndex=(missionIndex+1)%missions.length;hero.position.set(0,0,0);velocity.set(0,0,0);prepareMission();active=true;renderer.domElement.requestPointerLock?.();};
$('return-menu-btn').onclick=()=>{gameEnded=false;missionTargets.forEach(t=>{t.g.visible=false;if(t.g.userData.villain)t.g.userData.villain.visible=false;if(t.g.userData.person)t.g.userData.person.visible=false;});$('game-over').classList.remove('show');$('hud').classList.add('hidden');$('menu').classList.add('visible');};
$('credits-btn').onclick=()=>$('credits-screen').classList.add('visible');$('pause-credits-btn').onclick=()=>$('credits-screen').classList.add('visible');$('close-credits').onclick=()=>$('credits-screen').classList.remove('visible');
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='escape'&&active){pauseGame();return;}if(k==='escape'&&paused){resumeGame();return;}if(k==='e')interact();if(k===' '&&active&&coyote>0){jumpVelocity=10.4;coyote=0;say('Up we go.');}if(k==='shift')keys.shift=true;});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
let lastMouseX=0,lastMouseY=0;document.addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.0022;pitch=clamp(pitch+e.movementY*.0015,-.05,.48);}});
renderer.domElement.addEventListener('click',()=>{if(!active||paused)return;if(document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();if(swingTime<=0){swingTime=1.7;velocity.y=Math.max(velocity.y,7);velocity.add(forward.clone().multiplyScalar(5));toast('WEB LINE ATTACHED');}const boss=missionTargets.find(t=>!t.done&&t.type==='boss'&&Math.hypot(hero.position.x-t.x,hero.position.z-t.z)<13);if(boss&&attackCooldown<=0){damageBoss(boss);attackCooldown=.55;}});
for(const el of document.querySelectorAll('[data-key]')){const key=el.dataset.key;el.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;});for(const name of ['pointerup','pointercancel','pointerleave'])el.addEventListener(name,()=>keys[key]=false);}
for(const el of document.querySelectorAll('[data-action]')){const action=el.dataset.action;el.addEventListener('pointerdown',e=>{e.preventDefault();if(action==='swing'&&active){swingTime=1.7;velocity.y=Math.max(velocity.y,7);velocity.add(forward.clone().multiplyScalar(5));}if(action==='jump'&&active&&coyote>0){jumpVelocity=10.4;coyote=0;}if(action==='interact')interact();});}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

function blocked(x,z,y){if(y>3)return false;for(const b of buildingPositions){if(y>b.h-.8)continue;if(Math.abs(x-b.x)<b.w/2+.45&&Math.abs(z-b.z)<b.d/2+.45)return true;}return false;}
function nearestObjective(){let best=null,d=Infinity;for(const t of missionTargets){if(t.done)continue;const n=Math.hypot(hero.position.x-t.x,hero.position.z-t.z);if(n<d){best=t;d=n;}}return {target:best,distance:d};}
function update(dt){elapsed+=dt;attackCooldown=Math.max(0,attackCooldown-dt);bossAttack=Math.max(0,bossAttack-dt);
 for(const c of civilians){c.angle+=Math.sin(elapsed*.35+c.origin.x)*dt*.12;const x=c.origin.x+Math.sin(elapsed*.18+c.angle)*2,z=c.origin.z+Math.cos(elapsed*.18+c.angle)*2;c.model.position.set(x,0,z);c.model.rotation.y=c.angle;}
 for(const car of cars){const p=car.g.position;if(car.vertical){p.z+=car.speed*car.dir*dt;if(p.z>190)p.z=-190;if(p.z< -190)p.z=190;}else{p.x+=car.speed*car.dir*dt;if(p.x>190)p.x=-190;if(p.x< -190)p.x=190;}}
 for(const r of ripples){r.phase+=dt*r.s;r.m.scale.setScalar(.85+Math.sin(r.phase)*.18);r.m.material.opacity=.16+Math.sin(r.phase)*.08;}
 for(const t of missionTargets){if(t.done)continue;t.g.children[0].rotation.z+=dt*.7;t.g.children[1].rotation.y+=dt*1.1;t.g.position.y=.2+Math.sin(elapsed*2+t.x)*.18;}
 if(active&&!paused&&!gameEnded){
  forward.set(Math.sin(yaw),0,Math.cos(yaw));right.set(Math.cos(yaw),0,-Math.sin(yaw));desired.set(0,0,0);
  if(keys.w||keys.arrowup)desired.add(forward);if(keys.s||keys.arrowdown)desired.sub(forward);if(keys.d||keys.arrowright)desired.add(right);if(keys.a||keys.arrowleft)desired.sub(right);if(desired.lengthSq()>0)desired.normalize();
  const sprint=keys.shift?1.55:1, speed=onWater?4.1:keys.shift?13.5:8.5;desired.multiplyScalar(speed*sprint);
  velocity.x=THREE.MathUtils.damp(velocity.x,desired.x,desired.lengthSq()?5.5:3.4,dt);velocity.z=THREE.MathUtils.damp(velocity.z,desired.z,desired.lengthSq()?5.5:3.4,dt);
  if(swingTime>0){swingTime=Math.max(0,swingTime-dt);velocity.y-=8*dt;velocity.addScaledVector(forward,dt*5.2);velocity.y=Math.min(18,velocity.y+3*dt);}
  else if(hero.position.y>0||jumpVelocity>0){jumpVelocity-=24*dt;hero.position.y+=jumpVelocity*dt;if(hero.position.y<=0){hero.position.y=0;jumpVelocity=0;coyote=.13;}}else coyote=.13;
  if(hero.position.y<=0&&jumpVelocity===0)coyote=Math.min(.13,coyote+dt);
  let nx=hero.position.x+velocity.x*dt,nz=hero.position.z+velocity.z*dt;
  nx=clamp(nx,-195,460);nz=clamp(nz,-195,195);
  const climbFace=blocked(nx,hero.position.z,hero.position.y)||blocked(hero.position.x,nz,hero.position.y);
  if(climbFace&&hero.position.y<30&&(keys.w||keys.arrowup)){hero.position.y+=3.2*dt;velocity.y=Math.max(velocity.y,2);toast('WALL CLIMB');}
  if(!blocked(nx,hero.position.z,hero.position.y))hero.position.x=nx;else velocity.x=0;
  if(!blocked(hero.position.x,nz,hero.position.y))hero.position.z=nz;else velocity.z=0;
  onWater=hero.position.x>212;
  if(onWater){hero.position.y=THREE.MathUtils.damp(hero.position.y,-.35,2.4,dt);jumpVelocity=Math.min(0,jumpVelocity);air=Math.max(0,air-18*dt);$('air-wrap').classList.remove('hidden');if(air<=0){health=Math.max(0,health-28*dt);$('status-message').textContent='DROWNING · GET BACK TO SHORE';}else $('status-message').textContent='IN THE WATER · HOLD W TO SWIM';
   if(health<=0){gameEnded=true;active=false;$('game-over').classList.add('show');say('Hold on. The city still needs you.');}}
  else{hero.position.y=THREE.MathUtils.damp(hero.position.y,0,5,dt);air=Math.min(100,air+35*dt);$('air-wrap').classList.add('hidden');}
  hero.rotation.y=yaw;
  // nearest mission marker and boss threat
  const {target,distance}=nearestObjective();if(target){const angle=Math.atan2(target.x-hero.position.x,target.z-hero.position.z);const names=['N','NE','E','SE','S','SW','W','NW'];const cardinal=names[Math.round(((angle+Math.PI*2)%(Math.PI*2))/(Math.PI/4))%8];if(!onWater)$('status-message').textContent=`${cardinal} · ${Math.round(distance)}m TO THREAD`;
   if(target.type==='boss'&&distance<16){bossAttack-=dt;if(bossAttack<=0){health=Math.max(0,health-9);bossAttack=2.3;toast('INCOMING · WEB STRIKE TO COUNTER');}if(health<=0){gameEnded=true;active=false;$('game-over').classList.add('show');say('I am going to need a minute.');}}
  }
  $('health-value').textContent=Math.ceil(health);$('health-bar').style.width=health+'%';$('air-value').textContent=Math.ceil(air);$('air-bar').style.width=air+'%';
 }
 // Camera follows with smooth third-person shoulder framing.
 forward.set(Math.sin(yaw),0,Math.cos(yaw));cameraGoal.set(hero.position.x-forward.x*7.5+right.x*1.1,hero.position.y+4.4+pitch*3,hero.position.z-forward.z*7.5+right.z*1.1);camera.position.lerp(cameraGoal,1-Math.exp(-dt*5));
 const look=new THREE.Vector3(hero.position.x+forward.x*4,hero.position.y+1.6+pitch*2,hero.position.z+forward.z*4);camera.lookAt(look);
 if(swingTime>0&&active){const anchor=new THREE.Vector3(hero.position.x-forward.x*2,hero.position.y+18,hero.position.z-forward.z*2);webLine.geometry.setFromPoints([hero.position.clone().add(new THREE.Vector3(0,1.3,0)),anchor]);webLine.visible=true;}else webLine.visible=false;
}
let previous=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min(.035,(now-previous)/1000);previous=now;update(dt);renderer.render(scene,camera);}requestAnimationFrame(frame);
