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
// Avenues sit on multiples of `step`; buildings belong in the 34 m blocks
// between them, with a clear setback from every curb.
for(let gx=-3;gx<=2;gx++)for(let gz=-3;gz<=2;gz++){
 const bx=gx*step+step/2,bz=gz*step+step/2;
 if(bx>168||bx< -168||Math.abs(bx)<42&&Math.abs(bz)<42)continue;
 const count=(Math.abs(bx)<40||Math.abs(bz)<40)?2:1;
 for(let k=0;k<count;k++){
  const x=bx+(count===2?(k===0?-8:8):0)+rand(-1,1),z=bz+rand(-1.5,1.5);
  const w=count===2?rand(13,15):rand(20,28),d=count===2?rand(19,24):rand(20,28),h=rand(20,68)*(Math.random()<.13?1.8:1);
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  box(g,0,h/2,0,w,h,d,pick(facadeMats),true);buildingPositions.push({x,z,w,d,h});
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
// Roadside fixtures sit beside the lanes and are solid at street level.
const objectColliders=[];
for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++){
 const x=i*step+roadSize/2-1,z=j*step+roadSize/2-1;
 if(Math.abs(x)>190||Math.abs(z)>190)continue;
 cylinder(world,x,3,z,.12,.16,6,mats.steel,7);box(world,x,6,z,.6,.14,.5,mats.window);
 objectColliders.push({x,z,r:.55});
}
// Small street-level storefronts in the open central square; the generated avenue grid
// around them gives the district its street-and-sidewalk layout.
const shops=[];
function makeShop(name,x,z,color){const g=new THREE.Group(),paint=new THREE.MeshStandardMaterial({color,roughness:.82}),signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=128;const ctx=signCanvas.getContext('2d');ctx.fillStyle='#10212a';ctx.fillRect(0,0,512,128);ctx.fillStyle='#d9f3dd';ctx.font='bold 54px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name.toUpperCase(),256,64);const signMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(signCanvas)});
 box(g,0,1.8,0,7,3.6,5,paint,true);box(g,0,3.72,.1,7.8,.34,5.6,new THREE.MeshStandardMaterial({color:color,roughness:.55}),true);box(g,0,2.95,2.56,6.8,.92,.16,signMat);box(g,-2.05,1.15,2.58,1.15,1.8,.12,mats.glass);box(g,0,1.05,2.6,1.25,2,.18,new THREE.MeshStandardMaterial({color:0x344c50,roughness:.4}));box(g,2.05,1.15,2.58,1.15,1.8,.12,mats.glass);box(g,0,.12,3,7.6,.24,.65,new THREE.MeshStandardMaterial({color:0x8c9995}));g.position.set(x,0,z);scene.add(g);shops.push({name,x,z,g});objectColliders.push({x,z:z+.25,w:4.1,d:3.1});}
makeShop('Corner Supply',-19,-19,0xc58a4d);makeShop('Afterlight Cafe',19,-19,0x538f82);makeShop('Web & Wheel',-19,19,0x667ca4);makeShop('Harbor Goods',19,19,0x9b6870);
// water ripples
const ripples=[];for(let i=0;i<30;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(rand(1,5),.05,4,24),new THREE.MeshBasicMaterial({color:0x75b8b9,transparent:true,opacity:.3}));m.rotation.x=Math.PI/2;m.position.set(rand(55,370),-.25,rand(-190,190));scene.add(m);ripples.push({m,s:rand(.8,2.5),phase:rand(0,6)});}

// Original hero and supporting cast: simple, expressive low-poly silhouettes.
const redMat=new THREE.MeshStandardMaterial({color:0xd54c45,roughness:.72}), suitMat=new THREE.MeshStandardMaterial({color:0x192a38,roughness:.68}), trimMat=new THREE.MeshStandardMaterial({color:0x79d5c8,metalness:.25,roughness:.5}), eyeMat=new THREE.MeshStandardMaterial({color:0xe9f6ec,emissive:0x618f92,emissiveIntensity:.3}), skinMat=new THREE.MeshStandardMaterial({color:0xc98668}), hairMat=new THREE.MeshStandardMaterial({color:0x382a29}), villainMat=new THREE.MeshStandardMaterial({color:0x262538,metalness:.35,roughness:.55}), glowMat=new THREE.MeshStandardMaterial({color:0xe76149,emissive:0xff371d,emissiveIntensity:1.2});
const blackSuitMat=new THREE.MeshStandardMaterial({color:0x080d13,roughness:.34,metalness:.18}), blackAccentMat=new THREE.MeshStandardMaterial({color:0x293d49,roughness:.3,metalness:.28,emissive:0x10232a,emissiveIntensity:.35});
function makeHero(){const g=new THREE.Group();g.userData.suitParts=[];g.userData.attackArms=[];g.userData.animation={arms:[],legs:[]};
 const suitPart=(mesh,normal,black)=>{mesh.userData.suitNormal=normal;mesh.userData.suitBlack=black;g.userData.suitParts.push(mesh);return mesh;};
 suitPart(cylinder(g,0,1.05,0,.33,.31,.76,suitMat,9),suitMat,blackSuitMat);const chest=suitPart(box(g,0,1.14,.29,.45,.48,.12,redMat,true),redMat,blackSuitMat);chest.rotation.z=-.08;
 const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),redMat);head.position.y=1.65;head.castShadow=true;g.add(head);suitPart(head,redMat,blackSuitMat);
 for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.105,10,8),eyeMat);eye.scale.set(1.25,.62,.3);eye.position.set(side*.13,1.68,.22);g.add(eye);
  const arm=suitPart(cylinder(g,side*.4,1.12,0,.12,.17,.62,side<0?suitMat:redMat,8),side<0?suitMat:redMat,blackSuitMat);arm.rotation.z=side*-.35;g.userData.attackArms.push(arm);g.userData.animation.arms.push(arm);
  const leg=suitPart(cylinder(g,side*.17,.46,0,.13,.16,.78,suitMat,8),suitMat,blackSuitMat);leg.rotation.z=side*.035;g.userData.animation.legs.push(leg);
  const gloveMat=side<0?suitMat:redMat;const hand=suitPart(new THREE.Mesh(new THREE.SphereGeometry(.115,9,7),gloveMat),gloveMat,blackSuitMat);hand.scale.set(.82,.72,.72);hand.position.set(side*.4,.77,.025);hand.castShadow=true;g.add(hand);
   const thumb=suitPart(new THREE.Mesh(new THREE.SphereGeometry(.052,7,6),gloveMat),gloveMat,blackSuitMat);thumb.scale.set(.7,1.3,.8);thumb.position.set(side*.49,.79,.045);thumb.castShadow=true;g.add(thumb);
   suitPart(box(g,side*.17,.08,.08,.24,.14,.4,redMat,true),redMat,blackSuitMat);
 }
 // Mint chest sigil shifts to a pale blue mark on the bonded suit.
 for(let a=0;a<4;a++){const ray=suitPart(box(g,0,1.16,.365,.035,.28,.018,trimMat),trimMat,blackAccentMat);ray.rotation.z=a*Math.PI/2;}
 suitPart(box(g,0,.73,0,.55,.09,.38,redMat),redMat,blackSuitMat);return g;}
function setSuit(isBlack){hero.userData.suitParts.forEach(part=>part.material=isBlack?part.userData.suitBlack:part.userData.suitNormal);$('suit-name').textContent=isBlack?'BONDED':'AFTERLIGHT';$('suit-toggle').classList.toggle('bonded',isBlack);}
function toggleSuit(){if(!bonded){toast('THE SHARD IS STILL DORMANT');return;}blackSuit=!blackSuit;setSuit(blackSuit);toast(blackSuit?'BONDED SUIT ACTIVE':'AFTERLIGHT SUIT ACTIVE');}
const hero=makeHero();hero.position.set(0,0,0);scene.add(hero);
function makePerson({color=0x638d8d,hair=0x382a29,scale=1,gender=pick(['woman','man']),longHair=gender==='woman'}={}){
  const g=new THREE.Group(),clothes=new THREE.MeshStandardMaterial({color,roughness:.9}),hairM=new THREE.MeshStandardMaterial({color:hair,roughness:.86});g.userData.animation={arms:[],legs:[]};
 cylinder(g,0,.72,0,.16,.19,.52,clothes,7);
  for(const s of [-1,1]){const sleeve=cylinder(g,s*.22,.77,0,.055,.07,.4,clothes,7);sleeve.rotation.z=s*-.38;g.userData.animation.arms.push(sleeve);const palm=new THREE.Mesh(new THREE.SphereGeometry(.062,8,6),skinMat);palm.scale.set(.78,.92,.58);palm.position.set(s*.31,.53,.025);palm.castShadow=true;g.add(palm);for(let f=-1;f<=1;f++){const finger=cylinder(g,s*.31+f*.025,.475,.035,.012,.014,.075,skinMat,5);finger.rotation.z=s*f*.1;}const thumb=new THREE.Mesh(new THREE.SphereGeometry(.027,7,5),skinMat);thumb.scale.set(.75,1.3,.7);thumb.position.set(s*.36,.535,.035);g.add(thumb);}
  const head=new THREE.Mesh(new THREE.SphereGeometry(.145,12,10),skinMat);head.position.y=1.12;g.add(head);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.153,12,8,0,Math.PI*2,0,Math.PI*.56),hairM);cap.position.set(0,1.17,-.012);g.add(cap);
  // Hair silhouettes vary by person; MJ's auburn style falls past her shoulders.
  if(longHair){
    const back=new THREE.Mesh(new THREE.SphereGeometry(.125,9,8),hairM);back.scale.set(1,.95,.72);back.position.set(0,1.08,-.075);g.add(back);
    for(const s of [-1,1]){const lock=cylinder(g,s*.119,.94,.015,.045,.06,.47,hairM,7);lock.rotation.z=s*.08;}
    const fringe=new THREE.Mesh(new THREE.SphereGeometry(.078,8,6),hairM);fringe.scale.set(1,.42,.55);fringe.position.set(0,1.22,.09);g.add(fringe);
  }else{
    const tuft=new THREE.Mesh(new THREE.SphereGeometry(.085,8,6),hairM);tuft.scale.set(1,.55,.72);tuft.position.set(-.045,1.25,.025);tuft.rotation.z=-.22;g.add(tuft);
    for(const s of [-1,1]){const side=new THREE.Mesh(new THREE.SphereGeometry(.045,7,6),hairM);side.scale.set(.7,1,.65);side.position.set(s*.126,1.11,-.005);g.add(side);}
  }
 const whites=new THREE.MeshStandardMaterial({color:0xf5eee8,roughness:.5}),irises=new THREE.MeshBasicMaterial({color:0x26373a}),mouth=new THREE.MeshStandardMaterial({color:0x754d49,roughness:.9});
 for(const s of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),whites);eye.scale.set(1,.72,.48);eye.position.set(s*.05,1.14,.132);g.add(eye);const iris=new THREE.Mesh(new THREE.SphereGeometry(.009,6,5),irises);iris.position.set(s*.05,1.14,.143);g.add(iris);const brow=box(g,s*.05,1.177,.139,.043,.012,.014,hairM);brow.rotation.z=s*-.08;const ear=new THREE.Mesh(new THREE.SphereGeometry(.027,7,6),skinMat);ear.scale.set(.55,1,.65);ear.position.set(s*.143,1.115,0);g.add(ear);const leg=cylinder(g,s*.085,.28,0,.055,.07,.45,suitMat,6);leg.rotation.z=s*.07;g.userData.animation.legs.push(leg);}
 const nose=new THREE.Mesh(new THREE.SphereGeometry(.018,7,6),skinMat);nose.scale.set(.72,1,.8);nose.position.set(0,1.105,.147);g.add(nose);box(g,0,1.075,.14,.035,.008,.009,mouth);
 g.userData.gender=gender;g.scale.setScalar(scale);return g;}
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
const thugs=[];
// Original super-villains and MJ. These are distinct procedural characters,
// with voiced, mission-specific dialogue from the in-game cast.
const villainRoster={
  vex:{name:'Vex the Symbiote',color:0x171526,accent:0xf4f2d2,lines:['We are Vex. This city has nowhere left to hide.','Run, hero. Every shadow belongs to us now.','You cannot separate us from this place.']},
  venom:{name:'Venom',color:0x090b10,accent:0xe9eff0,lines:['We are Venom. Your city will learn our name.','You took a piece of us. Now we take everything.','The bond is not yours to control!']}, 
  sandman:{name:'Sandstorm',color:0xb09a70,accent:0xd9c58f,lines:['This whole town can be ground into dust.','The blocks are shifting. Try to keep up!','You found me—but sand remembers every shape.']},
  goblin:{name:'Green Jackal',color:0x6aa66f,accent:0xb9ff62,lines:['A little fear makes the wheels spin, hero!','The rooftop is my throne tonight!','You dropped the punchline, web-head!']},
  undertow:{name:'The Undertow',color:0x284c63,accent:0x65d6e4,lines:['The harbor rises for no one.','A flood remembers every street.','The pump will swallow this block!']},
  viper:{name:'Volt Viper',color:0x8a4e9c,accent:0xe3a5ff,lines:['The grid is mine. I wrote the circuit.','Your spark is almost gone.','One surge, and this bridge goes dark!']},
  krill:{name:'Doctor Krill',color:0x41685e,accent:0xffb44e,lines:['Evolution does not ask permission.','The harbor will choose a new life tonight.','Your city is an experiment, and you are the variable!']}
};
function makeVillain(kind,x,z){
  const data=villainRoster[kind]||villainRoster.undertow;
  const g=new THREE.Group();
  g.userData.animation={arms:[],legs:[]};const body=new THREE.MeshStandardMaterial({color:data.color,roughness:kind==='venom'?.22:.62,metalness:kind==='venom'?.2:.08});
  cylinder(g,0,.95,0,.42,.34,1.25,body,10);
   for(const s of [-1,1]){const arm=cylinder(g,s*.46,1.04,0,.105,.14,.82,body,8);arm.rotation.z=s*-.16;g.userData.animation.arms.push(arm);const palm=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),body);palm.scale.set(.82,1,.68);palm.position.set(s*.51,.57,.03);palm.castShadow=true;g.add(palm);for(let f=-1;f<=1;f++){const finger=cylinder(g,s*.51+f*.039,.48,.06,.021,.024,.13,body,6);finger.rotation.z=s*f*.1;}const thumb=new THREE.Mesh(new THREE.SphereGeometry(.052,7,5),body);thumb.position.set(s*.61,.59,.075);thumb.rotation.z=s*.5;g.add(thumb);}
  for(const s of [-1,1]){const leg=cylinder(g,s*.2,.32,0,.13,.16,.62,body,8);g.userData.animation.legs.push(leg);}
   const head=new THREE.Mesh(new THREE.SphereGeometry(kind==='sandman'?0.5:.34,12,10),kind==='venom'?new THREE.MeshStandardMaterial({color:data.color,roughness:.3}):body);
  head.position.y=1.72;head.castShadow=true;g.add(head);
  if(kind==='venom'||kind==='vex'||kind==='goblin'||kind==='viper'){ 
    for(const s of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshBasicMaterial({color:data.accent}));eye.scale.set(1.3,.55,.25);eye.position.set(s*.13,1.78,.29);g.add(eye);}
  }
  if(kind==='sandman'){for(let i=0;i<9;i++)cylinder(g,(Math.random()-.5)*1.2, .55+Math.random()*1.5,(Math.random()-.5)*1.0,.09,.18,.75,new THREE.MeshStandardMaterial({color:data.accent,roughness:1}),7);}
  if(kind==='goblin'){const blade=box(g,0,1.15,.62,.06,.06,1.1,new THREE.MeshStandardMaterial({color:data.accent,emissive:0x295e24,emissiveIntensity:.7},true));blade.rotation.x=.5;}
  if(kind==='viper')for(let i=-1;i<=1;i++)cylinder(g,i*.4,1.15,.28,.07,.13,.85,new THREE.MeshStandardMaterial({color:data.accent,emissive:0x7d368e,emissiveIntensity:1}),6);
  if(kind==='venom'){for(let s of [-1,1]){const tendril=new THREE.Mesh(new THREE.TorusGeometry(.42,.055,6,16,Math.PI),new THREE.MeshStandardMaterial({color:0x07090d,roughness:.2}));tendril.position.set(s*.48,1.05,-.08);tendril.rotation.z=s*.7;g.add(tendril);}}
  g.position.set(x,0,z);g.scale.setScalar(kind==='venom'?1.9:1.45);scene.add(g);return g;
}
function makeThug(x,z,index){
  const colors=[0x55474a,0x354d55,0x68533f,0x4c4a60];
  const g=makePerson({color:colors[index%colors.length],hair:[0x241d1c,0x473026,0x252a30][index%3],gender:index%2?'man':'woman',longHair:false});
  g.scale.setScalar(1.13);g.position.set(x,0,z);
  const vest=new THREE.MeshStandardMaterial({color:index%2?0x292d32:0x493b3b,roughness:.88});
  box(g,0,.79,.17,.34,.39,.09,vest,true);
  const patch=new THREE.MeshStandardMaterial({color:0xc8784e,emissive:0x34150b,emissiveIntensity:.25});
  box(g,.08,.91,.222,.09,.08,.015,patch);
  const barBack=new THREE.Mesh(new THREE.BoxGeometry(.52,.055,.025),new THREE.MeshBasicMaterial({color:0x111820}));barBack.position.set(0,1.94,.04);g.add(barBack);
  const hpFill=new THREE.Mesh(new THREE.BoxGeometry(.48,.032,.03),new THREE.MeshBasicMaterial({color:0xff676b}));hpFill.position.set(0,1.94,.06);g.add(hpFill);
  scene.add(g);
  return {g,hp:2,maxHp:2,hpFill,attackCooldown:rand(.9,1.7),attackWindup:0,stagger:0,walkPhase:rand(0,6.28),alive:true};
}
function makeMJ(){
  const g=makePerson({color:0xb55767,hair:0x7a3b29,scale:1.02,gender:'woman',longHair:true});
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
// Restrained, ground-hugging impact bursts: a brief hot core, expanding dust,
// and a few heavy fragments rather than a cartoony fireball.
const impactEffects=[];
const impactGeometries={core:new THREE.SphereGeometry(1,10,8),dust:new THREE.SphereGeometry(1,8,6),ring:new THREE.TorusGeometry(1,.035,5,24),fragment:new THREE.OctahedronGeometry(1,0)};
function makeImpact(position,power=1){
 const group=new THREE.Group();group.position.copy(position);group.position.y=Math.max(0,group.position.y);scene.add(group);
 const core=new THREE.Mesh(impactGeometries.core,new THREE.MeshBasicMaterial({color:0xffd5a0,transparent:true,opacity:.82,depthWrite:false}));core.scale.setScalar(.28*power);core.position.y=.9*power;group.add(core);
 const dust=new THREE.Mesh(impactGeometries.dust,new THREE.MeshBasicMaterial({color:0x555650,transparent:true,opacity:.5,depthWrite:false}));dust.scale.set(.55*power,.18*power,.55*power);dust.position.y=.18*power;group.add(dust);
 const ring=new THREE.Mesh(impactGeometries.ring,new THREE.MeshBasicMaterial({color:0xb98a63,transparent:true,opacity:.72,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.12;ring.scale.setScalar(.25*power);group.add(ring);
 const fragments=[];
 const count=power>1?7:3;
 for(let i=0;i<count;i++){
  const angle=(i/count)*Math.PI*2+rand(-.3,.3),speed=rand(2.2,4.4)*power;
  const piece=new THREE.Mesh(impactGeometries.fragment,new THREE.MeshStandardMaterial({color:pick([0x343b3c,0x62584d,0x895d43]),roughness:1,flatShading:true}));
  piece.scale.set(rand(.09,.17)*power,rand(.13,.25)*power,rand(.08,.15)*power);piece.position.set(0,.3,0);group.add(piece);
  fragments.push({mesh:piece,vx:Math.cos(angle)*speed,vy:rand(2.8,4.6)*power,vz:Math.sin(angle)*speed,spin:rand(-8,8)});
 }
 impactEffects.push({group,core,dust,ring,fragments,age:0,duration:1.05*power});
}
function updateImpacts(dt){
 for(let i=impactEffects.length-1;i>=0;i--){const fx=impactEffects[i];fx.age+=dt;const t=fx.age/fx.duration;
  if(t>=1){scene.remove(fx.group);fx.group.traverse(o=>{if(o.material)o.material.dispose();});impactEffects.splice(i,1);continue;}
  const ease=1-Math.pow(1-t,2);fx.core.material.opacity=Math.max(0,1-fx.age/.14);fx.core.scale.setScalar((.28+fx.age*3.2)*Math.max(.05,1-fx.age/.14));
  fx.dust.scale.set((.55+ease*2.7),( .18+ease*.48)*Math.max(.08,1-t*.72),(.55+ease*2.7));fx.dust.material.opacity=.5*(1-t);
  fx.ring.scale.setScalar(.25+ease*4.2);fx.ring.material.opacity=.72*(1-t);
  for(const p of fx.fragments){p.vy-=11*dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y=Math.max(.08,p.mesh.position.y+p.vy*dt);p.mesh.position.z+=p.vz*dt;p.mesh.rotation.x+=p.spin*dt;p.mesh.rotation.z+=p.spin*.7*dt;if(p.mesh.position.y<=.08){p.vx*=.78;p.vz*=.78;p.vy=Math.max(0,p.vy)*-.22;}}
 }
}
const missions=[
  {title:'A CITY IN STATIC',brief:'A burst of strange interference is crawling through downtown.',objective:'Find 3 signal traces',type:'collect',count:3,places:[[-72,-70],[75,-106],[-110,80]],voice:'Dispatch says the whole east grid just blinked. Follow those little green flares. Something is pulling power from the blocks.'},
  {title:'THE LONG WAY HOME',brief:'Three neighbors are stranded after the blackout.',objective:'Check on 3 neighbors',type:'rescue',count:3,places:[[-132,-23],[104,31],[-40,111]],voice:'Hey, web-head. I see people waving from the sidewalks. Make sure everyone gets somewhere safe.'},
  {title:'UNDERPASS AMBUSH',brief:'A crew is shaking down the blackout shelters. Clear the streets before the next rescue run.',objective:'Defeat 5 street thugs',type:'thug',count:5,places:[[0,56]],voice:'MJ: I have five hostile heat signatures near the underpasses. They are cornering people while the lights are down. Get them off the streets.'},
  {title:'VEX: BLACK HORIZON',brief:'Vex the Symbiote is hunting in the old pump tunnels.',objective:'Defeat Vex the Symbiote',type:'boss',count:1,places:[[12,15]],villain:'vex',voice:'Vex the Symbiote is closing in beneath the harbor. We are Vex, he says. That is never a good sign.'},
  {title:'FIRST CONTACT: THE LIVING SHARD',brief:'A second symbiote appears at the seawall. Tear free a fragment and survive its bond.',objective:'Defeat Venom · claim the living shard',type:'boss',count:1,places:[[182,12]],villain:'venom',bossHp:3,firstBond:true,voice:'A new shape is waiting at the seawall. It calls itself Venom. Stay sharp—and if a piece breaks free, do not let it reach the water.'},
  {title:'NIGHT SHIFT',brief:'A stolen courier drone is cutting across the rooftops.',objective:'Recover 4 data drops',type:'collect',count:4,places:[[110,-84],[-147,-112],[73,118],[-54,40]],voice:'I caught a second signal. Someone is using that drone to map every response route. Bring its data back.'},
  {title:'SAND WITHOUT SHORE',brief:'Sandstorm is dismantling the waterfront warehouses.',objective:'Stop Sandstorm',type:'boss',count:1,places:[[141,76]],villain:'sandman',voice:'Sandstorm has swallowed the warehouse district. Stay high, web-head—he turns every street into a desert.'},
  {title:'GREEN JACKAL RISING',brief:'Green Jackal is attacking the central tram line.',objective:'Defeat Green Jackal',type:'boss',count:1,places:[[3,-11]],villain:'goblin',voice:'Green Jackal is riding the tram line. Look out for gliders, and do not let him drag you off the bridge.'},
  {title:'THE UNDERTOW',brief:'The masked saboteur is flooding the old harbor.',objective:'Stop The Undertow',type:'boss',count:1,places:[[210,-55]],villain:'undertow',voice:'The Undertow controls the pumps beyond the seawall. Keep your feet dry and shut it down.'},
  {title:'AFTERLIGHT',brief:'Volt Viper and Doctor Krill are converging on the rooftop beacon.',objective:'Break the final alliance',type:'boss',count:2,places:[[-24,-174],[132,-140]],villain:['viper','krill'],voice:'Last chance for a quiet skyline. Volt Viper and Doctor Krill are linked at the last beacon. Split the signal and finish this.'},
  {title:'VENOM: THE LAST BOND',brief:'Venom has emerged at the old harbor. Face him head-on and reclaim the city.',objective:'Defeat Venom · 8 strikes',type:'boss',count:1,places:[[182,12]],villain:'venom',bossHp:8,finalBoss:true,voice:'The shard you carry is reacting. Venom is waiting beyond the seawall. This time, we end it together.'}
];
const storyScenes={
 'A CITY IN STATIC':[
  {speaker:'DISPATCH',text:'2:17 a.m. The harbor district has gone dark, block by block. Every emergency channel is talking over every other one.'},
  {speaker:'MJ',text:'I can see the green flashes from the roof. Start with the people closest to you. We can figure out the signal after.'},
  {speaker:'AFTERLIGHT',text:'Three traces. One city holding its breath. Find the source.'}
 ],
 'THE LONG WAY HOME':[
  {speaker:'DISPATCH',text:'The blackout knocked out the street lifts. Three residents are stranded on the lower avenues.'},
  {speaker:'ROOK',text:'Nobody needs a grand entrance. Just show up, listen, and get us somewhere safe.'},
  {speaker:'AFTERLIGHT',text:'The city is more than its skyline. Bring these neighbors home.'}
 ],
 'UNDERPASS AMBUSH':[
  {speaker:'MJ',text:'I have five hostile heat signatures under the tram bridge. They are keeping families away from the shelter.'},
  {speaker:'ROOK',text:'Those are people, too. If you can stop this without making it worse, do it.'},
  {speaker:'AFTERLIGHT',text:'Keep your guard up. Close the distance and press F or PUNCH to strike.'}
 ],
 'VEX: BLACK HORIZON':[
  {speaker:'MJ',text:'The interference is coming from beneath the old pump tunnels. I am seeing movement down there.'},
  {speaker:'VEX',text:'We are Vex. The dark is not empty. It is waiting for you.'},
  {speaker:'AFTERLIGHT',text:'The first hunter has found you. Keep moving, keep your distance, and break its hold on the tunnels.'}
 ],
 'FIRST CONTACT: THE LIVING SHARD':[
  {speaker:'DISPATCH',text:'Unknown life-form at the seawall. It is pulling itself together from the shadow under the pier.'},
  {speaker:'VENOM',text:'We remember you. You will not leave this shore with everything you came with.'},
  {speaker:'AFTERLIGHT',text:'It is stronger than Vex. Hit hard. If a fragment comes loose, do not let it sink.'}
 ],
 'NIGHT SHIFT':[
  {speaker:'THEO',text:'That drone has been mapping response routes all night. Someone wanted to know where we would go first.'},
  {speaker:'MJ',text:'Its data drops are scattering across the rooftops. Recover them before whoever sent it comes back.'},
  {speaker:'AFTERLIGHT',text:'A trail of breadcrumbs above the city. Bring the stolen map home.'}
 ],
 'SAND WITHOUT SHORE':[
  {speaker:'MARA',text:'The waterfront is changing shape. The warehouses are disappearing under a moving wall of sand.'},
  {speaker:'SANDSTORM',text:'Stone, steel, streets—it all returns to dust. You will too.'},
  {speaker:'AFTERLIGHT',text:'Sandstorm is holding the waterfront. Stay light on your feet and stop the collapse.'}
 ],
 'GREEN JACKAL RISING':[
  {speaker:'DISPATCH',text:'The central tram line is still live. A masked rider is using it as a launch rail.'},
  {speaker:'GREEN JACKAL',text:'Look up, hero! The whole skyline is my track tonight!'},
  {speaker:'AFTERLIGHT',text:'Green Jackal is fast, but he has to come down sometime. Take the opening.'}
 ],
 'THE UNDERTOW':[
  {speaker:'JUN',text:'The seawall pumps are running backward. Water is climbing the old harbor stairs.'},
  {speaker:'THE UNDERTOW',text:'The harbor remembers what the city buried. Let it rise.'},
  {speaker:'AFTERLIGHT',text:'Stop the pumps before the flood reaches the homes uphill.'}
 ],
 'AFTERLIGHT':[
  {speaker:'MJ',text:'Volt Viper and Doctor Krill are feeding the same beacon. The entire grid is one spark away from going dark again.'},
  {speaker:'VOLT VIPER',text:'I have the whole city on one wire. You are standing on it.'},
  {speaker:'DOCTOR KRILL',text:'When the lights return, nothing living here will be the same.'},
  {speaker:'AFTERLIGHT',text:'Two targets. One signal. Break their alliance and bring the lights back.'}
 ],
 'VENOM: THE LAST BOND':[
  {speaker:'MJ',text:'The shard is reacting again. Venom is back at the seawall, and it knows the bond is with you now.'},
  {speaker:'VENOM',text:'You took a piece of us. We will take the rest of you.'},
  {speaker:'AFTERLIGHT',text:'That fragment stayed with you through every fight. Let it be your choice—not your weakness.'},
  {speaker:'MJ',text:'I am here. Whatever happens out there, you are not facing it alone.'},
  {speaker:'AFTERLIGHT',text:'One last fight at the edge of the city. Eight strikes. Make them count.'}
 ]
};
let active=false,paused=false,missionIndex=0,missionProgress=0,health=100,air=100,onWater=false,gameEnded=false,swingTime=0,jumpVelocity=0,coyote=0,attackCooldown=0,playerSpeed=0,yaw=0,pitch=.12,elapsed=0,missionTargets=[],heroLines=[],blackSuit=false,bonded=false,shopCooldown=0,cinematicActive=false,cinematicScenes=[],cinematicIndex=0,heroAttackTime=0,heroAttackClock=0,heroAttackTarget=null,heroAttackResolved=false,missionCancelled=false,cinematicNext=()=>{},cinematicSkip=()=>{};
const velocity=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),desired=new THREE.Vector3(),cameraGoal=new THREE.Vector3();
const keys={};
function say(text){$('subtitle').textContent=text;$('subtitle').classList.add('show');if('speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.96;u.pitch=.95;u.volume=.8;speechSynthesis.speak(u);}clearTimeout(say.timer);say.timer=setTimeout(()=>$('subtitle').classList.remove('show'),5600);}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2400);}
function showCinematicLine(){const line=cinematicScenes[cinematicIndex];if(!line)return;const m=missions[missionIndex];$('cinematic-chapter').textContent=m?`THREAD ${String(missionIndex+1).padStart(2,'0')} · ${m.title}`:'AFTERLIGHT · EPILOGUE';$('cinematic-count').textContent=`${String(cinematicIndex+1).padStart(2,'0')} / ${String(cinematicScenes.length).padStart(2,'0')}`;$('cinematic-speaker').textContent=line.speaker;$('cinematic-text').textContent=line.text;if('speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(line.text);u.rate=.94;u.pitch=.95;u.volume=.8;speechSynthesis.speak(u);}}
function finishCinematic(){cinematicActive=false;$('cinematic').classList.remove('visible');$('cinematic').setAttribute('aria-hidden','true');if('speechSynthesis'in window)speechSynthesis.cancel();cinematicDone?.();}
let cinematicDone=()=>{};
function playCinematic(lines,onDone=()=>{}){if(!lines?.length){onDone();return;}cinematicScenes=lines;cinematicIndex=0;cinematicDone=onDone;cinematicActive=true;cinematicNext=()=>{cinematicIndex++;if(cinematicIndex>=cinematicScenes.length){finishCinematic();return;}showCinematicLine();};cinematicSkip=finishCinematic;showCinematicLine();$('cinematic').classList.add('visible');$('cinematic').setAttribute('aria-hidden','false');}
function prepareMission(){missionCancelled=false;const m=missions[missionIndex];missionProgress=0;missionTargets=[];targets.forEach(t=>{if(t.g.userData.villain)scene.remove(t.g.userData.villain);if(t.g.userData.person)scene.remove(t.g.userData.person);scene.remove(t.g);});targets.length=0;thugs.forEach(t=>scene.remove(t.g));thugs.length=0;active=false;gameEnded=false;$('game-over').classList.remove('show');
 $('mission-title').textContent=m.title;$('mission-objective').textContent=m.objective;$('mission-bar').style.width='0%';$('mission-complete').classList.remove('show');
 m.places.forEach(([px,pz],i)=>{const x=Math.round(px/step)*step,z=pz;const kind=m.type==='boss'?'boss':m.type==='rescue'?'rescue':m.type==='thug'?'thug':'signal';const g=makeBeacon(x,z,kind);g.userData.index=i;if(m.type==='thug'){const offsets=[[-3,0],[3,2],[0,-3],[-4,3],[4,-2]];for(let n=0;n<offsets.length;n++){const thug=makeThug(x+offsets[n][0],z+offsets[n][1],n);thugs.push(thug);}}
  if(kind==='boss'){const key=Array.isArray(m.villain)?m.villain[i]:m.villain||'undertow';const b=makeVillain(key,x,z);g.userData.villain=b;g.userData.villainKind=key;}
  if(kind==='rescue'){const person=makePerson({color:pick(pedestrianColors),scale:1.2});person.position.set(x,0,z);scene.add(person);g.userData.person=person;}
  missionTargets.push({g,x,z,type:kind,hp:kind==='boss'?(m.bossHp||5):1,done:false,lastHit:0,attackCooldown:rand(1,2),attackWindup:0,stagger:0,finalBoss:!!m.finalBoss});
 });
 $('mission-objective').textContent=m.objective+' · 0/'+m.count;$('mission-bar').style.width='0%';
 toast(`THREAD ${String(missionIndex+1).padStart(2,'0')} · ${m.title}`);
 const sceneLines=storyScenes[m.title];
 if(sceneLines)playCinematic(sceneLines,()=>{if(!gameEnded&&!missionCancelled&&!$('mission-complete').classList.contains('show')){active=true;paused=false;}});
 else active=true;
}
function updateMission(){const m=missions[missionIndex];missionProgress++;const pct=Math.min(100,missionProgress/m.count*100);$('mission-bar').style.width=pct+'%';$('mission-objective').textContent=`${m.objective} · ${missionProgress}/${m.count}`;
 if((m.firstBond||m.finalBoss)&&!bonded){bonded=true;blackSuit=true;setSuit(true);$('suit-toggle').classList.remove('locked');$('suit-toggle').title='Switch suit (Q)';$('bond-status').textContent='VENOM SHARD BONDED · IT STAYS WITH YOU';toast('LIVING SHARD BONDED · PRESS Q TO SHIFT');say('You tear a living fragment from Venom. It wraps around your arm and bonds to you. You will carry it from this night forward—and it will answer when you call.');}
  if(missionProgress>=m.count){active=false;$('mission-complete').classList.add('show');$('complete-title').textContent=m.title;$('complete-copy').textContent='The skyline feels a little safer. Keep the patrol going.';say('That is one more thread mended. Take a second, then we keep moving.');active=false;}
}
function attack(){
 if(!active||paused||cinematicActive||gameEnded||attackCooldown>0||heroAttackTime>0)return;
 attackCooldown=.55;heroAttackTime=.38;heroAttackClock=0;heroAttackResolved=false;heroAttackTarget=null;
 const thug=thugs.filter(t=>t.alive).map(t=>({t,d:Math.hypot(hero.position.x-t.g.position.x,hero.position.z-t.g.position.z)})).filter(v=>v.d<3.6).sort((a,b)=>a.d-b.d)[0];
 if(thug)heroAttackTarget={type:'thug',target:thug.t};
 else{const boss=missionTargets.filter(t=>!t.done&&t.type==='boss').map(t=>({t,d:Math.hypot(hero.position.x-(t.g.userData.villain?.position.x??t.x),hero.position.z-(t.g.userData.villain?.position.z??t.z))})).filter(v=>v.d<4.4).sort((a,b)=>a.d-b.d)[0];if(boss)heroAttackTarget={type:'boss',target:boss.t};else toast('NO THREAT IN REACH');}
}
function resolveHeroAttack(){
 if(heroAttackResolved)return;heroAttackResolved=true;const hit=heroAttackTarget;if(!hit)return;
 if(hit.type==='thug'){
  const thug=hit.target;if(!thug.alive||Math.hypot(hero.position.x-thug.g.position.x,hero.position.z-thug.g.position.z)>4)return;
  const perfect=thug.attackWindup>.12;if(perfect)toast('PERFECT COUNTER · THUG STAGGERED');
  thug.hp-=perfect?2:1;thug.hpFill.scale.x=Math.max(.02,.48*thug.hp/thug.maxHp);thug.hpFill.position.x=-.24+(.24*thug.hp/thug.maxHp);thug.attackWindup=0;if(perfect){thug.stagger=.58;thug.attackCooldown=Math.max(thug.attackCooldown,.8);}thug.g.rotation.y=Math.atan2(hero.position.x-thug.g.position.x,hero.position.z-thug.g.position.z);
  if(thug.hp<=0){thug.alive=false;thug.g.visible=false;makeImpact(thug.g.position.clone(),.48);updateMission();}else toast(`PUNCH · ${thug.hp} HIT${thug.hp===1?'':'S'} LEFT`);return;
 }
 const boss=hit.target,bossPos=boss.g.userData.villain?.position||boss.g.position;if(Math.hypot(hero.position.x-bossPos.x,hero.position.z-bossPos.z)>4.8)return;const perfect=boss.attackWindup>.12;if(perfect){boss.attackWindup=0;boss.stagger=.6;boss.attackCooldown=Math.max(boss.attackCooldown,.8);toast('PERFECT COUNTER · BOSS STAGGERED');}
 damageBoss(boss,perfect?2:1);
}
function interact(){if(!active||paused||cinematicActive||gameEnded)return;let nearest=null,dist=Infinity;for(const t of missionTargets){if(t.done)continue;const d=Math.hypot(hero.position.x-t.x,hero.position.z-t.z);if(d<dist){dist=d;nearest=t;}}
 if(!nearest||dist>5){const shop=shops.find(s=>Math.hypot(hero.position.x-s.x,hero.position.z-s.z)<8);if(shop){if(shopCooldown>elapsed){toast('SHOP · THANKS FOR VISITING');return;}health=Math.min(100,health+35);shopCooldown=elapsed+18;$('health-value').textContent=Math.ceil(health);$('health-bar').style.width=health+'%';say(`${shop.name}: Fresh supplies. Take care out there.`);toast(`${shop.name.toUpperCase()} · +35 VITALS`);return;}const md=Math.hypot(hero.position.x-mj.position.x,hero.position.z-mj.position.z);if(md<4){say(pick(['MJ: The skyline is beautiful from here. Please come home safely.','MJ: Every light you brought back matters.','MJ: There is still so much left to save.']));toast('MJ · CONVERSATION');return;}for(const npc of npcs){const nd=Math.hypot(hero.position.x-npc.model.position.x,hero.position.z-npc.model.position.z);if(nd<4){say(npc.name+': '+npc.line);toast(npc.name+' · CONVERSATION');return;}}toast('Move closer to the highlighted signal or a person');return;}
 if(nearest.type==='boss'){attack();return;}
 nearest.done=true;nearest.g.visible=false;if(nearest.g.userData.person)nearest.g.userData.person.visible=false;updateMission();}
function damageBoss(t,damage=1){if(!t||t.done)return;t.hp-=damage;t.lastHit=elapsed;t.g.scale.setScalar(1.25);setTimeout(()=>{if(t.g)t.g.scale.setScalar(1);},100);toast(`WEB STRIKE · ${Math.max(0,t.hp)} LEFT`);say(t.g.userData.villainKind?villainRoster[t.g.userData.villainKind].lines[Math.floor(Math.random()*villainRoster[t.g.userData.villainKind].lines.length)]:pick(['Got you!','You are done terrorizing this block.','Not letting you near the water pumps again.']));if(t.hp<=0){t.done=true;t.g.visible=false;if(t.g.userData.villain){t.g.userData.villain.visible=false;makeImpact(t.g.userData.villain.position.clone(),1.55);}else makeImpact(new THREE.Vector3(t.x,0,t.z),1.25);updateMission();}}
function beginGame(){if(!active&&missionIndex===0&&missionProgress===0&&hero.position.length()<.1){}if(missionTargets.length===0)prepareMission();active=!cinematicActive;paused=false;gameEnded=false;$('menu').classList.remove('visible');$('pause-screen').classList.remove('visible');$('hud').classList.remove('hidden');$('game-over').classList.remove('show');renderer.domElement.requestPointerLock?.();}
function pauseGame(){if(!active&&!paused)return;active=false;paused=true;document.exitPointerLock?.();$('pause-screen').classList.add('visible');}
function resumeGame(){paused=false;active=!cinematicActive;$('pause-screen').classList.remove('visible');if(active)renderer.domElement.requestPointerLock?.();}
function restart(){hero.position.set(0,0,0);hero.rotation.set(0,0,0);velocity.set(0,0,0);health=100;air=100;missionIndex=0;missionProgress=0;gameEnded=false;onWater=false;$('game-over').classList.remove('show');prepareMission();active=!cinematicActive;paused=false;$('pause-screen').classList.remove('visible');$('menu').classList.remove('visible');$('hud').classList.remove('hidden');if(active)renderer.domElement.requestPointerLock?.();}
$('cinematic-next').onclick=()=>cinematicNext();$('cinematic-skip').onclick=()=>cinematicSkip();
$('start-btn').onclick=()=>{ $('menu').classList.remove('visible'); $('intro-screen').classList.add('visible'); };
$('intro-start').onclick=()=>{$('intro-screen').classList.remove('visible');beginGame();};$('continue-btn').onclick=()=>resumeGame();$('resume-btn').onclick=()=>resumeGame();$('restart-btn').onclick=()=>restart();$('retry-btn').onclick=()=>{hero.position.set(0,0,0);velocity.set(0,0,0);health=100;air=100;gameEnded=false;onWater=false;$('game-over').classList.remove('show');prepareMission();};$('menu-btn').onclick=()=>pauseGame();$('suit-toggle').onclick=toggleSuit;$('next-mission').onclick=()=>{missionIndex=Math.min(missionIndex+1,missions.length-1);hero.position.set(0,0,0);velocity.set(0,0,0);prepareMission();renderer.domElement.requestPointerLock?.();};
$('cancel-mission-btn').onclick=()=>{gameEnded=false;missionCancelled=true;active=false;health=100;air=100;onWater=false;$('game-over').classList.remove('show');$('hud').classList.add('hidden');$('menu').classList.add('visible');};$('return-menu-btn').onclick=()=>{gameEnded=false;missionCancelled=true;active=false;missionTargets.forEach(t=>{t.g.visible=false;if(t.g.userData.villain)t.g.userData.villain.visible=false;if(t.g.userData.person)t.g.userData.person.visible=false;});thugs.forEach(t=>{t.g.visible=false;t.alive=false;});$('game-over').classList.remove('show');$('hud').classList.add('hidden');$('menu').classList.add('visible');};
$('credits-btn').onclick=()=>$('credits-screen').classList.add('visible');$('pause-credits-btn').onclick=()=>$('credits-screen').classList.add('visible');$('close-credits').onclick=()=>$('credits-screen').classList.remove('visible');
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(cinematicActive){if(k==='enter')cinematicNext();if(k==='escape')cinematicSkip();return;}if(k==='escape'&&active){pauseGame();return;}if(k==='escape'&&paused){resumeGame();return;}if(k==='e')interact();if(k==='f')attack();if(k==='q')toggleSuit();if(k===' '&&active&&coyote>0){jumpVelocity=10.4;coyote=0;say('Up we go.');}if(k==='shift')keys.shift=true;});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
let lastMouseX=0,lastMouseY=0;document.addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.0022;pitch=clamp(pitch+e.movementY*.0015,-.05,.48);}});
renderer.domElement.addEventListener('click',()=>{if(!active||paused||cinematicActive)return;if(document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();if(swingTime<=0){swingTime=1.7;velocity.y=Math.max(velocity.y,7);velocity.add(forward.clone().multiplyScalar(5));toast('WEB LINE ATTACHED');}});
for(const el of document.querySelectorAll('[data-key]')){const key=el.dataset.key;el.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;});for(const name of ['pointerup','pointercancel','pointerleave'])el.addEventListener(name,()=>keys[key]=false);}
for(const el of document.querySelectorAll('[data-action]')){const action=el.dataset.action;el.addEventListener('pointerdown',e=>{e.preventDefault();if(action==='swing'&&active&&!cinematicActive){swingTime=1.7;velocity.y=Math.max(velocity.y,7);velocity.add(forward.clone().multiplyScalar(5));}if(action==='jump'&&active&&!cinematicActive&&coyote>0){jumpVelocity=10.4;coyote=0;}if(action==='interact')interact();if(action==='attack')attack();if(action==='suit')toggleSuit();});}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

function hitsBox(x,z,cx,cz,halfX,halfZ,radius=.48){const qx=clamp(x,cx-halfX,cx+halfX),qz=clamp(z,cz-halfZ,cz+halfZ);return (x-qx)**2+(z-qz)**2<radius*radius;}
function blocked(x,z,y){
 const feet=Math.max(0,y);
 for(const b of buildingPositions){if(feet+1.65>=b.h)continue;if(hitsBox(x,z,b.x,b.z,b.w/2,b.d/2))return true;}
 if(feet<2.1){for(const c of objectColliders){if(c.r){if(Math.hypot(x-c.x,z-c.z)<c.r+.48)return true;}else if(hitsBox(x,z,c.x,c.z,c.w,c.d))return true;}
  for(const car of cars){const p=car.g.position,co=Math.cos(car.g.rotation.y),si=Math.sin(car.g.rotation.y),dx=x-p.x,dz=z-p.z,lx=co*dx-si*dz,lz=si*dx+co*dz;if(hitsBox(lx,lz,0,0,2.05,1.05,.55))return true;}
 }
 return false;
}
function animateCharacter(g,phase,motion=0,rightArmPose=null){const rig=g.userData.animation;if(!rig)return;rig.legs.forEach((limb,i)=>limb.rotation.x=Math.sin(phase+i*Math.PI)*.62*motion);rig.arms.forEach((limb,i)=>limb.rotation.x=Math.sin(phase+i*Math.PI+Math.PI)*.42*motion);if(rightArmPose!==null&&rig.arms[1])rig.arms[1].rotation.x=rightArmPose;}
function nearestObjective(){let best=null,d=Infinity;for(const t of missionTargets){if(t.done)continue;const n=Math.hypot(hero.position.x-t.x,hero.position.z-t.z);if(n<d){best=t;d=n;}}return {target:best,distance:d};}
function update(dt){elapsed+=dt;updateImpacts(dt);attackCooldown=Math.max(0,attackCooldown-dt);
 for(const c of civilians){c.angle+=Math.sin(elapsed*.35+c.origin.x)*dt*.12;const x=c.origin.x+Math.sin(elapsed*.18+c.angle)*2,z=c.origin.z+Math.cos(elapsed*.18+c.angle)*2;c.model.position.set(x,0,z);c.model.rotation.y=c.angle;}
 for(const car of cars){const p=car.g.position;if(car.vertical){p.z+=car.speed*car.dir*dt;if(p.z>190)p.z=-190;if(p.z< -190)p.z=190;}else{p.x+=car.speed*car.dir*dt;if(p.x>190)p.x=-190;if(p.x< -190)p.x=190;}}
 for(const r of ripples){r.phase+=dt*r.s;r.m.scale.setScalar(.85+Math.sin(r.phase)*.18);r.m.material.opacity=.16+Math.sin(r.phase)*.08;}
 for(const t of missionTargets){if(t.done)continue;t.g.children[0].rotation.z+=dt*.7;t.g.children[1].rotation.y+=dt*1.1;t.g.position.y=.2+Math.sin(elapsed*2+t.x)*.18;}
 if(active&&!paused&&!gameEnded&&!cinematicActive){
  let heroArmPose=null;if(heroAttackTime>0){heroAttackClock+=dt;heroAttackTime=Math.max(0,heroAttackTime-dt);heroArmPose=heroAttackClock<.14?-1.18:heroAttackClock<.3?.38:0;if(!heroAttackResolved&&heroAttackClock>=.18)resolveHeroAttack();}else{heroAttackClock=0;heroAttackTarget=null;heroAttackResolved=false;}
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

  }
  if(missionTargets.some(t=>t.type==='thug'&&!t.done)){for(const thug of thugs){if(!thug.alive)continue;const dx=hero.position.x-thug.g.position.x,dz=hero.position.z-thug.g.position.z,d=Math.hypot(dx,dz);thug.stagger=Math.max(0,thug.stagger-dt);if(thug.stagger>0){animateCharacter(thug.g,thug.walkPhase,0,-.8);continue;}if(d>1.45&&thug.attackWindup===0){const step=Math.min(dt*2.35,d-1.45);thug.g.position.x+=dx/d*step;thug.g.position.z+=dz/d*step;thug.g.rotation.y=Math.atan2(dx,dz);thug.walkPhase+=dt*8;animateCharacter(thug.g,thug.walkPhase,1);}else{thug.g.rotation.y=Math.atan2(dx,dz);thug.attackCooldown-=dt;if(thug.attackWindup>0){thug.attackWindup+=dt;animateCharacter(thug.g,elapsed*9,0,thug.attackWindup<.28?-.95:.28);if(thug.attackWindup>=.52){thug.attackWindup=0;thug.attackCooldown=1.35;health=Math.max(0,health-4);toast('THUG STRIKE · COUNTER WITH F');if(health<=0){gameEnded=true;active=false;$('game-over').classList.add('show');say('I am going to need a minute.');}}}else if(d<=2.4&&thug.attackCooldown<=0){thug.attackWindup=.001;toast('THUG WINDUP · COUNTER NOW');}else animateCharacter(thug.g,elapsed*2,0);}}}
   for(const target of missionTargets){if(target.done||target.type!=='boss')continue;const villain=target.g.userData.villain;if(!villain)continue;const dx=hero.position.x-villain.position.x,dz=hero.position.z-villain.position.z,d=Math.hypot(dx,dz);target.stagger=Math.max(0,target.stagger-dt);villain.rotation.y=Math.atan2(dx,dz);if(target.stagger>0){animateCharacter(villain,elapsed*8,0,-.85);continue;}if(d<11){target.attackCooldown-=dt;if(target.attackWindup>0){target.attackWindup+=dt;animateCharacter(villain,elapsed*8,0,target.attackWindup<.42?-1.05:.42);if(target.attackWindup>=.78){target.attackWindup=0;target.attackCooldown=2.15;health=Math.max(0,health-9);toast('BOSS STRIKE · F TO COUNTER');if(health<=0){gameEnded=true;active=false;$('game-over').classList.add('show');say('I am going to need a minute.');}}}else if(target.attackCooldown<=0){target.attackWindup=.001;toast('BOSS WINDUP · COUNTER NOW');}else animateCharacter(villain,elapsed*2.2,.08);}else animateCharacter(villain,elapsed*1.8,.12);}
  $('health-value').textContent=Math.ceil(health);$('health-bar').style.width=health+'%';$('air-value').textContent=Math.ceil(air);$('air-bar').style.width=air+'%';
 }
 // Camera follows with smooth third-person shoulder framing.
 forward.set(Math.sin(yaw),0,Math.cos(yaw));cameraGoal.set(hero.position.x-forward.x*7.5+right.x*1.1,hero.position.y+4.4+pitch*3,hero.position.z-forward.z*7.5+right.z*1.1);camera.position.lerp(cameraGoal,1-Math.exp(-dt*5));
 const look=new THREE.Vector3(hero.position.x+forward.x*4,hero.position.y+1.6+pitch*2,hero.position.z+forward.z*4);camera.lookAt(look);
 if(swingTime>0&&active){const anchor=new THREE.Vector3(hero.position.x-forward.x*2,hero.position.y+18,hero.position.z-forward.z*2);webLine.geometry.setFromPoints([hero.position.clone().add(new THREE.Vector3(0,1.3,0)),anchor]);webLine.visible=true;}else webLine.visible=false;
}
let previous=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min(.035,(now-previous)/1000);previous=now;update(dt);renderer.render(scene,camera);}requestAnimationFrame(frame);
