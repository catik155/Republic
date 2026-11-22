import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas=document.querySelector('#city3d');
const mapHost=canvas.parentElement;
const initialWidth=Math.max(1,canvas.clientWidth||mapHost.clientWidth||window.innerWidth);
const initialHeight=Math.max(1,canvas.clientHeight||mapHost.clientHeight||window.innerHeight-60);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setSize(initialWidth,initialHeight,false);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;

const scene=new THREE.Scene();
scene.background=new THREE.Color('#080e15');
scene.fog=new THREE.Fog('#080e15',85,155);
const camera=new THREE.PerspectiveCamera(42,initialWidth/initialHeight,.1,280);
camera.position.set(48,62,68);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,0,0);controls.enableDamping=true;controls.dampingFactor=.06;controls.maxPolarAngle=Math.PI*.46;controls.minDistance=28;controls.maxDistance=145;
scene.add(new THREE.HemisphereLight(0x9bb8d5,0x182019,2.1));
const sun=new THREE.DirectionalLight(0xb8d0e9,2.6);sun.position.set(-35,55,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;scene.add(sun);
const city=new THREE.Group();scene.add(city);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(148,148),new THREE.MeshStandardMaterial({color:'#101923',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.5;floor.receiveShadow=true;city.add(floor);
const districts=[
{name:'Старый город',type:'civic',pts:[[-42,-42],[-14,-42],[-14,-14],[-42,-14]],color:'#526e83'},
{name:'Центральный',type:'business',pts:[[-14,-42],[14,-42],[14,-14],[-14,-14]],color:'#557866'},
{name:'Северный',type:'residential',pts:[[14,-42],[42,-42],[42,-14],[14,-14]],color:'#607b8a'},
{name:'Речной',type:'residential',pts:[[-42,-14],[-14,-14],[-14,14],[-42,14]],color:'#52796f'},
{name:'Промышленный',type:'industrial',pts:[[-14,-14],[14,-14],[14,14],[-14,14]],color:'#65746d'},
{name:'Южный',type:'residential',pts:[[14,-14],[42,-14],[42,14],[14,14]],color:'#54786d'},
{name:'Западный',type:'residential',pts:[[-42,14],[-14,14],[-14,42],[-42,42]],color:'#687d6a'},
{name:'Восточный',type:'residential',pts:[[-14,14],[14,14],[14,42],[-14,42]],color:'#617a6e'},
{name:'Пригород',type:'residential',pts:[[14,14],[42,14],[42,42],[14,42]],color:'#4d7167'}
];
const politicalColors=['#3e83e6','#bd4f5c','#c6a14b','#8962bf','#6d8395'];
let showDistricts=true, selectedDistrict=null;
function shapeFromPolygon(points){const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();return shape}
function makeLabel(text){
 const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.font='bold 42px Segoe UI';g.textAlign='center';g.fillStyle='#d3deeb';g.shadowColor='#080c11';g.shadowBlur=8;g.fillText(text,256,75);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});const spr=new THREE.Sprite(mat);spr.scale.set(18,4.5,1);return spr
}
const districtMeshes=[];
districts.forEach((d,i)=>{
 const geom=new THREE.ExtrudeGeometry(shapeFromPolygon(d.pts),{depth:.7,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.25,bevelThickness:.18});
 geom.rotateX(-Math.PI/2);
 const mat=new THREE.MeshStandardMaterial({color:d.color,roughness:.95,transparent:true,opacity:.72});
 const mesh=new THREE.Mesh(geom,mat);mesh.position.y=.03;mesh.receiveShadow=true;mesh.userData.district=d;city.add(mesh);districtMeshes.push(mesh);
 const edges=new THREE.EdgesGeometry(geom);const outline=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:'#708797',transparent:true,opacity:.45}));outline.position.copy(mesh.position);city.add(outline);
 const center=d.pts.reduce((acc,p)=>[acc[0]+p[0]/d.pts.length,acc[1]+p[1]/d.pts.length],[0,0]);const label=makeLabel(d.name);label.position.set(center[0],1.8,center[1]);city.add(label);
});
const asphalt=new THREE.MeshStandardMaterial({color:'#222c36',roughness:1});
const sidewalkMat=new THREE.MeshStandardMaterial({color:'#39444f',roughness:1});
function road(x1,z1,x2,z2,width=3.1){const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),cx=(x1+x2)/2,cz=(z1+z2)/2;const m=new THREE.Mesh(new THREE.BoxGeometry(width,.12,len),asphalt);m.position.set(cx,.06,cz);m.rotation.y=angle;m.receiveShadow=true;city.add(m);const curbW=.18,walkW=1.25;for(const side of [-1,1]){const walk=new THREE.Mesh(new THREE.BoxGeometry(walkW,.09,len),sidewalkMat);walk.position.set(cx,.13,cz);walk.rotation.y=angle;walk.translateX(side*(width/2+curbW+walkW/2));walk.receiveShadow=true;city.add(walk);const curb=new THREE.Mesh(new THREE.BoxGeometry(curbW,.16,len),sidewalkMat);curb.position.set(cx,.12,cz);curb.rotation.y=angle;curb.translateX(side*(width/2+curbW/2));city.add(curb)}}
// Organic road plan: staggered arterials, angled links and short curved-like segmented streets.
// Regular connected street grid: restore straight, aligned roads and clear intersections.
const avenuePaths=[
 [[-43,-30],[43,-30]],
 [[-43,-10],[43,-10]],
 [[-43,10],[43,10]],
 [[-43,30],[43,30]],
 [[-30,-43],[-30,43]],
 [[-10,-43],[-10,43]],
 [[10,-43],[10,43]],
 [[30,-43],[30,43]]
];
avenuePaths.forEach(path=>path.slice(0,-1).forEach((p,j)=>road(p[0],p[1],path[j+1][0],path[j+1][1],3.8)));
// City block/building placement: deterministic, fixed seed list, no random map generation.
const blockCenters=[
[-35,-28],[-25,-28],[-15,-27],[-2,-27],[7,-27],[24,-27],[36,-27],
[-37,-10],[-24,-10],[-14,-10],[0,-10],[7,-10],[24,-10],[37,-10],
[-37,8],[-24,8],[-14,8],[0,8],[7,8],[24,8],[37,8],
[-34,28],[-23,28],[-14,28],[0,28],[7,28],[24,28],[36,28],
[-32,38],[-22,38],[-12,38],[0,38],[8,38],[23,38],[35,38]
];
const partyHeadquarters=[
{name:'Развитие',color:politicalColors[0],x:-22,z:-8},
{name:'Социал-демократы',color:politicalColors[1],x:2,z:-40},
{name:'Национальный союз',color:politicalColors[2],x:24,z:-8},
{name:'Зелёные',color:politicalColors[3],x:-16,z:10},
{name:'Гражданская партия',color:politicalColors[4],x:2,z:40}
];
const bldgs=[];
function distanceToSegment(px,pz,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz||1;const t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/den));return Math.hypot(px-(a[0]+dx*t),pz-(a[1]+dz*t))}
function nearRoad(px,pz,buildingRadius=1.7){for(let pathIndex=0;pathIndex<avenuePaths.length;pathIndex++){const path=avenuePaths[pathIndex],width=pathIndex%3===0?3.6:2.8;for(let seg=0;seg<path.length-1;seg++){const safeDistance=width/2+.18+1.25+buildingRadius+.35;if(distanceToSegment(px,pz,path[seg],path[seg+1])<safeDistance)return true}}return false}
blockCenters.forEach(([baseX,baseZ],idx)=>{
 const bx=baseX+Math.sin(idx*12.9898)*1.6,bz=baseZ+Math.cos(idx*7.233)*1.5;
 const district=districts.find(d=>pointInPolygon([bx,bz],d.pts))||districts[4];
 const variations=[[-2.3,-1.8],[2.1,-1.4],[-1.7,2.1],[2.4,1.9],[-4.0,-2.8],[4.0,-2.6],[-3.8,3.7],[4.1,3.8],[-5.2,0],[5.2,0],[0,-5.2],[0,5.2]];
 variations.forEach(([dx,dz],k)=>{
  const x=bx+dx,z=bz+dz;if(Math.abs(x)>41||Math.abs(z)>43)return;
  let floors=1+((idx*3+k*5)%6);if(district.type==='business')floors+=3;if(district.type==='industrial')floors=1+((idx+k)%3);
  const w=2.4+(idx%3)*.25,h=2.2+(k%2)*.3;
  if((Math.abs(x)<7&&Math.abs(z)<7)||nearRoad(x,z,Math.max(w,h)/2)||partyHeadquarters.some(hq=>Math.abs(x-hq.x)<4.5&&Math.abs(z-hq.z)<4.2))return;
  const color=district.type==='business'?'#566777':district.type==='industrial'?'#4b5b61':['#485563','#3f4c59','#53616e'][(idx+k)%3];
  const geom=new THREE.BoxGeometry(w,floors*1.25,h),mat=new THREE.MeshStandardMaterial({color,roughness:.84});
  const mesh=new THREE.Mesh(geom,mat);mesh.position.set(x,floors*.625+.12,z);mesh.castShadow=true;mesh.receiveShadow=true;city.add(mesh);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.18,.14,h+.18),new THREE.MeshStandardMaterial({color:'#657586',roughness:.85}));roof.position.set(x,floors*1.25+.2,z);roof.castShadow=true;city.add(roof);
  if(floors>2){const winMat=new THREE.MeshStandardMaterial({color:'#92a9ba',emissive:'#26394a',emissiveIntensity:.22,roughness:.45});for(let floor=1;floor<floors;floor++){const strip=new THREE.Mesh(new THREE.BoxGeometry(w*.65,.12,.035),winMat);strip.position.set(x,floor*1.22,z-h/2-.02);city.add(strip)}}
  const nearestStreet=[-30,-10,10,30].reduce((best,coord)=>{const candidate=[Math.abs(x-coord),Math.abs(z-coord)];return candidate[0]+candidate[1]<best.dist?{dist:candidate[0]+candidate[1],dx:candidate[0],dz:candidate[1],sx:coord,sz:coord}:best},{dist:Infinity,dx:Infinity,dz:Infinity,sx:0,sz:0});const side=nearestStreet.dx<nearestStreet.dz?'x': 'z';const sign=side==='x'?(nearestStreet.sx<x?-1:1):(nearestStreet.sz<z?-1:1);const entryX=x+(side==='x'?sign*(w/2+.55):0),entryZ=z+(side==='z'?sign*(h/2+.55):0);const door=new THREE.Mesh(new THREE.BoxGeometry(.55,.9,.08),new THREE.MeshStandardMaterial({color:'#263342',roughness:.9}));door.position.set(entryX,.5,entryZ);if(side==='x')door.rotation.y=Math.PI/2;city.add(door);bldgs.push({mesh,district,floors,kind:district.type,x,z,w,h,entryX,entryZ});
 });
});
// Political party headquarters: distinct landmarks placed in city blocks, not on the road corridors.

partyHeadquarters.forEach((hq,i)=>{
 const baseMat=new THREE.MeshStandardMaterial({color:'#253443',roughness:.8});
 const colorMat=new THREE.MeshStandardMaterial({color:hq.color,roughness:.5,emissive:hq.color,emissiveIntensity:.18});
 const base=new THREE.Mesh(new THREE.BoxGeometry(5.6,.55,4.8),baseMat);base.position.set(hq.x,.28,hq.z);base.castShadow=true;base.receiveShadow=true;city.add(base);
 const main=new THREE.Mesh(new THREE.BoxGeometry(4.4,4.2,3.7),new THREE.MeshStandardMaterial({color:['#526172','#46586a','#596571','#485d60','#566270'][i],roughness:.78}));
 main.position.set(hq.x,2.65,hq.z);main.castShadow=true;main.receiveShadow=true;city.add(main);
 const tower=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.3,1.4),colorMat);tower.position.set(hq.x,5.85,hq.z);tower.castShadow=true;city.add(tower);
 const marker=new THREE.Mesh(new THREE.BoxGeometry(3.4,.24,.08),colorMat);marker.position.set(hq.x,4.4,hq.z-1.9);city.add(marker);
 const label=makeLabel('Штаб: '+hq.name);label.scale.set(13,3.2,1);label.position.set(hq.x,7.2,hq.z);city.add(label);
});
// Permanent central government landmark (built once with the city scene, not on each game month).
const government=new THREE.Group();government.position.set(0,0,0);city.add(government);
const govBase=new THREE.Mesh(new THREE.BoxGeometry(9.2,.7,8.4),new THREE.MeshStandardMaterial({color:'#354454',roughness:.75}));govBase.position.y=.35;govBase.castShadow=true;govBase.receiveShadow=true;government.add(govBase);
const govBody=new THREE.Mesh(new THREE.BoxGeometry(7.2,5.8,6.4),new THREE.MeshStandardMaterial({color:'#7a8791',roughness:.72}));govBody.position.y=3.25;govBody.castShadow=true;govBody.receiveShadow=true;government.add(govBody);
const govWing=new THREE.Mesh(new THREE.BoxGeometry(8.4,1.05,7.5),new THREE.MeshStandardMaterial({color:'#a6b3bc',roughness:.6}));govWing.position.y=6.35;govWing.castShadow=true;government.add(govWing);
const govRoof=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2.8,1.4,12),new THREE.MeshStandardMaterial({color:'#465a6c',roughness:.7}));govRoof.position.y=7.5;government.add(govRoof);
const govDome=new THREE.Mesh(new THREE.SphereGeometry(1.5,16,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:'#758999',roughness:.55}));govDome.position.y=8.2;government.add(govDome);
for(let col=-2;col<=2;col++){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.45,3.8,.55),new THREE.MeshStandardMaterial({color:'#d2dbe2',roughness:.48}));pillar.position.set(col*1.25,3.0,-3.25);pillar.castShadow=true;government.add(pillar)}
const govSign=makeLabel('ПРАВИТЕЛЬСТВО');govSign.scale.set(17,4,1);govSign.position.set(0,10.3,0);city.add(govSign);
// Parks are deliberate landscaped spaces in the static city plan
const parkMat=new THREE.MeshStandardMaterial({color:'#233d32',roughness:1});
const parkShapes=[[[-39,-33],[-34,-35],[-32,-30],[-35,-25],[-40,-26]],[[-4,-35],[2,-35],[5,-32],[1,-28],[-4,-30]],[[16,29],[20,27],[23,31],[21,36],[17,35]]];
parkShapes.forEach(points=>{const g=new THREE.Shape();points.forEach(([x,z],i)=>i?g.lineTo(x,-z):g.moveTo(x,-z));g.closePath();const geom=new THREE.ShapeGeometry(g);geom.rotateX(-Math.PI/2);const m=new THREE.Mesh(geom,parkMat);m.position.y=.14;city.add(m)});
function pointInPolygon([x,z],pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,zi]=pts[i],[xj,zj]=pts[j];if(((zi>z)!=(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))inside=!inside}return inside}
// Pedestrians roam along connected road intersections, with gentle lateral weaving.
const people=new THREE.Group();scene.add(people);
const pedestrianPalette=['#4a91ff','#d35a66','#d9b65c','#a681df','#86a0b9'];
const pedestrianRecords=[];
const walkNodes=[];const grid=[-30,-10,10,30];
grid.forEach(z=>grid.forEach(x=>walkNodes.push([x,z])));
const walkAdj=walkNodes.map(()=>[]);
const walkLinks=[];
for(let row=0;row<4;row++)for(let col=0;col<4;col++){const i=row*4+col;if(col<3)walkLinks.push([i,i+1]);if(row<3)walkLinks.push([i,i+4])}
walkLinks.forEach(([a,b])=>{walkAdj[a].push(b);walkAdj[b].push(a)});
function nearestWalkNode(x,z){let best=0,bestD=Infinity;walkNodes.forEach(([nx,nz],i)=>{const d=Math.hypot(x-nx,z-nz);if(d<bestD){bestD=d;best=i}});return best}const homeBuildings=bldgs.filter(b=>b.kind==='residential');const homeNodes=homeBuildings.map(b=>nearestWalkNode(b.x,b.z));function seededValue(seed){const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n)}
function nodeDistance(a,b){const [ax,az]=walkNodes[a],[bx,bz]=walkNodes[b];return Math.abs(ax-bx)+Math.abs(az-bz)}
function pickNextNode(current,previous,seed=0,destination=current){const options=walkAdj[current].filter(i=>i!==previous);if(!options.length)return walkAdj[current][0]??current;const best=options.filter(i=>nodeDistance(i,destination)<=nodeDistance(current,destination));const pool=best.length?best:options;return pool[Math.floor(seededValue(seed+current*17.3)*pool.length)]}
function makeDotTexture(color){const c=document.createElement('canvas');c.width=64;c.height=64;const g=c.getContext('2d');g.beginPath();g.arc(32,32,25,0,Math.PI*2);g.fillStyle=color;g.fill();g.lineWidth=4;g.strokeStyle='#e8f0fa';g.stroke();g.beginPath();g.arc(32,32,7,0,Math.PI*2);g.fillStyle='#fff';g.fill();return new THREE.CanvasTexture(c)}
const dotMaterials=pedestrianPalette.map(color=>new THREE.SpriteMaterial({map:makeDotTexture(color),transparent:true,depthWrite:false}));const talkTexture=(()=>{const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d');g.fillStyle='#f4f8ff';g.beginPath();g.roundRect(10,8,108,65,20);g.fill();g.beginPath();g.moveTo(38,70);g.lineTo(30,86);g.lineTo(56,70);g.fill();g.fillStyle='#243548';g.font='48px sans-serif';g.textAlign='center';g.fillText('…',64,58);return new THREE.CanvasTexture(c)})();const talkMaterial=new THREE.SpriteMaterial({map:talkTexture,transparent:true,depthWrite:false});
for(let k=0;k<90;k++){const start=k%walkNodes.length,dot=new THREE.Sprite(dotMaterials[k%5].clone());dot.scale.set(.95,.95,1);dot.position.y=.48;people.add(dot);const bubble=new THREE.Sprite(talkMaterial.clone());bubble.scale.set(1.3,.95,1);bubble.position.y=1.7;bubble.visible=false;dot.add(bubble);const homeBuilding=Math.floor(seededValue(k+71)*homeBuildings.length),dest=homeNodes[homeBuilding]??Math.floor(seededValue(k+71)*walkNodes.length);pedestrianRecords.push({dot,bubble,node:start,previous:-1,homeBuilding,destination:dest,target:pickNextNode(start,-1,k+91,dest),progress:seededValue(k+5)*.45,speed:.32+seededValue(k+19)*.28,offset:seededValue(k+23)*3.4-1.7,offsetCurrent:seededValue(k+23)*3.4-1.7,phase:seededValue(k+37)*Math.PI*2,seed:k,lastTime:0,life:'walking',homeUntil:0,talkUntil:0,opacity:1})}
function movePedestrians(time){pedestrianRecords.forEach(p=>{const dt=Math.max(0,time-(p.lastTime??time));p.lastTime=time;if(p.life==='inside'){p.dot.visible=false;p.bubble.visible=false;if(time>=p.homeUntil){p.life='walking';p.dot.visible=true;p.opacity=0;p.dot.material.opacity=0;const [exitX,exitZ]=walkNodes[p.node];p.dot.position.set(exitX,.48,exitZ);p.homeBuilding=Math.floor(seededValue(p.seed+time*29+5)*homeBuildings.length);p.destination=homeNodes[p.homeBuilding]??Math.floor(seededValue(p.seed+time*29+5)*walkNodes.length);p.target=pickNextNode(p.node,-1,p.seed+Math.floor(time*3),p.destination);p.progress=0;p.offset=0;p.offsetCurrent=0}return}if(p.life==='entering'){p.bubble.visible=false;p.opacity=Math.max(0,p.opacity-dt*.72);p.dot.material.opacity=p.opacity;if(time>=p.homeUntil){p.life='inside';p.homeUntil=time+2.5+seededValue(p.seed+time*7)*7;p.dot.visible=false;return}return}if(p.life==='talking'&&time<p.talkUntil){p.progress=0;p.bubble.visible=true;return}else if(p.life==='talking'){p.life='walking';p.bubble.visible=false}p.progress+=p.speed*dt*1.6;p.offsetCurrent+=(p.offset-p.offsetCurrent)*Math.min(1,dt*2.4);if(p.opacity<1){p.opacity=Math.min(1,p.opacity+dt*2.5);p.dot.material.opacity=p.opacity}if(p.progress>=1){p.progress%=1;p.previous=p.node;p.node=p.target;if(p.node===p.destination){p.life='entering';const home=homeBuildings[p.homeBuilding];if(home){p.dot.position.set(home.entryX,.48,home.entryZ);p.bubble.visible=false}p.homeUntil=time+1.4;p.progress=0}else{p.target=pickNextNode(p.node,p.previous,p.seed+Math.floor(time*3),p.destination);p.offset=seededValue(p.seed+time*2)*3.4-1.7}}if(p.life==='entering'&&time>=p.homeUntil){p.life='inside';p.homeUntil=time+2.5+seededValue(p.seed+time*7)*7;p.dot.material.opacity=0;p.dot.visible=false;return}const a=walkNodes[p.node],b=walkNodes[p.target],t=p.progress,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;const wave=Math.sin(time*2.2+p.phase)*.42+Math.sin(time*4.1+p.phase*.7)*.13;const lateral=Math.max(-1.72,Math.min(1.72,p.offsetCurrent+wave));const x=a[0]+dx*t-dz/len*lateral,z=a[1]+dz*t+dx/len*lateral;p.dot.position.set(x,.48,z);p.bubble.visible=false});for(let i=0;i<pedestrianRecords.length;i++){const a=pedestrianRecords[i];if(a.life!=='walking'||a.dot.visible===false)continue;for(let j=i+1;j<pedestrianRecords.length;j++){const b=pedestrianRecords[j];if(b.life!=='walking'||!b.dot.visible)continue;if(Math.hypot(a.dot.position.x-b.dot.position.x,a.dot.position.z-b.dot.position.z)<1.25){a.life=b.life='talking';a.talkUntil=b.talkUntil=time+1.5+seededValue(a.seed+b.seed+time)*2.8;a.bubble.visible=b.bubble.visible=true;break}}}}
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width*2-1;mouse.y=-((e.clientY-r.top)/r.height*2-1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(districtMeshes,false);if(hits.length){selectedDistrict=hits[0].object.userData.district;document.querySelector('#districtName').textContent=selectedDistrict.name;const localBuildings=bldgs.filter(b=>b.district===selectedDistrict),capacity=b=>b.floors*(b.kind==='residential'?3:b.kind==='business'?1.5:b.kind==='industrial'?2:1),allCapacity=bldgs.reduce((sum,b)=>sum+capacity(b),0)||1,districtCapacity=localBuildings.reduce((sum,b)=>sum+capacity(b),0),population=Math.round(((window.republicState?.people??8.7)*1000)*districtCapacity/allCapacity),residential=localBuildings.filter(b=>b.kind==='residential').length,commercial=localBuildings.filter(b=>b.kind==='business').length,roadAccess=walkNodes.filter(([x,z])=>pointInPolygon([x,z],selectedDistrict.pts)).length,greenSpace=parkShapes.filter(points=>pointInPolygon(points.reduce((a,p)=>[a[0]+p[0]/points.length,a[1]+p[1]/points.length],[0,0]),selectedDistrict.pts)).length,economy=Math.min(95,Math.round(40+commercial*1.2+localBuildings.length*.3)),infrastructure=Math.min(95,Math.round(35+roadAccess*9+localBuildings.length*.45)),ecology=Math.max(20,Math.min(95,Math.round(64+greenSpace*12-residential*0.18)));document.querySelector('#inspect').innerHTML=`<strong>${selectedDistrict.name}</strong><br>Тип: ${selectedDistrict.type==='business'?'деловой':selectedDistrict.type==='industrial'?'промышленный':selectedDistrict.type==='civic'?'административный':'жилой'}<br>Население: ${population.toLocaleString('ru-RU')} тыс.<br>Здания: ${localBuildings.length} (жилые ${residential})<br>Коммерческие: ${commercial}<br>Экономика: ${economy}%<br>Инфраструктура: ${infrastructure}%<br>Экология: ${ecology}%<br>Политический лидер: ${politicalWinnerForDistrict(districtMeshes.indexOf(hits[0].object)).name} (${politicalWinnerForDistrict(districtMeshes.indexOf(hits[0].object)).share.toFixed(1)}%)`;districtMeshes.forEach(m=>m.material.opacity=(m.userData.district===selectedDistrict)?0.85:0.56)}});
function setLayer(id,fn){document.getElementById(id).addEventListener('change',fn)}
setLayer('showPeople',()=>people.visible=document.getElementById('showPeople').checked);
const layerIds=['political','economic','infrastructure','ecology'];
const layerColors={political:politicalColors,economic:['#344d64','#426e61','#7d633d','#3d6d69','#66513e'],infrastructure:['#324d70','#416d83','#588b75','#716c58'],ecology:['#406c52','#5b8762','#83a66a','#a3bd7d']};
function politicalWinnerForDistrict(i){const state=window.republicState,support=state?.support||[32,28,20,12,8],colors=state?.partyColors||politicalColors,scores=support.map((v,p)=>Math.max(0,v+Math.sin((i+1)*8.17+(p+1)*3.91)*6)),winner=scores.reduce((best,v,p)=>v>scores[best]?p:best,0),total=scores.reduce((a,b)=>a+b,0)||1;return{winner,color:colors[winner]||politicalColors[winner%politicalColors.length],name:state?.partyNames?.[winner]||'Партия',share:scores[winner]/total*100}}function applyLayer(){const active=layerIds.find(id=>document.getElementById(id).checked)||null;districtMeshes.forEach((m,i)=>{const color=active==='political'?politicalWinnerForDistrict(i).color:active?layerColors[active][i%layerColors[active].length]:districts[i].color;m.material.color.set(color)})}
layerIds.forEach(id=>document.getElementById(id).addEventListener('change',()=>{if(document.getElementById(id).checked)layerIds.filter(other=>other!==id).forEach(other=>document.getElementById(other).checked=false);applyLayer()}));
document.querySelector('#toggleDistrict').onclick=()=>{showDistricts=!showDistricts;districtMeshes.forEach(m=>m.visible=showDistricts);toast(showDistricts?'Районы отображены':'Заливка районов скрыта')};
document.querySelector('#resetCamera').onclick=()=>{camera.position.set(48,62,68);controls.target.set(0,0,0);controls.update()};
function fitCanvas(){const r=canvas.getBoundingClientRect();const w=Math.max(1,r.width||canvas.parentElement?.clientWidth||window.innerWidth);const h=Math.max(1,r.height||canvas.parentElement?.clientHeight||window.innerHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',fitCanvas);if(typeof ResizeObserver!=='undefined'){const mapResizeObserver=new ResizeObserver(()=>fitCanvas());mapResizeObserver.observe(canvas.parentElement)}requestAnimationFrame(fitCanvas);
const clock=new THREE.Clock();let lastLayerRefresh=0;function animate(){requestAnimationFrame(animate);const elapsed=clock.getElapsedTime();movePedestrians(elapsed);if(elapsed-lastLayerRefresh>1){applyLayer();lastLayerRefresh=elapsed}controls.update();renderer.render(scene,camera)}animate();
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.style.display='block';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.display='none',2100)}
// Menu creation/opening is handled in index.html independently of WebGL.
// Campaign, law proposals and calendar advancement are implemented in src/game.js.
