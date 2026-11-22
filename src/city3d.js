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
const camera=new THREE.PerspectiveCamera(42,initialWidth/initialHeight,.1,250);
camera.position.set(48,62,68);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,0,0);controls.enableDamping=true;controls.dampingFactor=.06;controls.maxPolarAngle=Math.PI*.46;controls.minDistance=28;controls.maxDistance=115;
scene.add(new THREE.HemisphereLight(0x9bb8d5,0x182019,2.1));
const sun=new THREE.DirectionalLight(0xb8d0e9,2.6);sun.position.set(-35,55,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;scene.add(sun);
const city=new THREE.Group();scene.add(city);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:'#101923',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.5;floor.receiveShadow=true;city.add(floor);
const districts=[
{name:'Старый город',type:'civic',pts:[[-34,-23],[-19,-30],[-7,-25],[-9,-11],[-24,-7],[-37,-13]],color:'#526e83'},
{name:'Центральный',type:'business',pts:[[-8,-29],[11,-30],[19,-20],[16,-8],[0,-7],[-12,-15]],color:'#557866'},
{name:'Северный',type:'residential',pts:[[19,-26],[36,-24],[41,-10],[35,-1],[22,-4],[17,-14]],color:'#607b8a'},
{name:'Речной',type:'residential',pts:[[-39,-4],[-23,-6],[-17,7],[-22,21],[-35,22],[-42,10]],color:'#52796f'},
{name:'Промышленный',type:'industrial',pts:[[-17,-6],[4,-7],[12,6],[8,22],[-9,25],[-19,12]],color:'#65746d'},
{name:'Южный',type:'residential',pts:[[14,-4],[35,-2],[41,11],[35,25],[19,22],[10,10]],color:'#54786d'},
{name:'Западный',type:'residential',pts:[[-29,23],[-13,22],[-6,33],[-12,42],[-26,42],[-35,32]],color:'#687d6a'},
{name:'Восточный',type:'residential',pts:[[-9,25],[9,23],[16,34],[10,43],[-7,42],[-15,33]],color:'#617a6e'},
{name:'Пригород',type:'residential',pts:[[17,25],[34,24],[41,34],[35,43],[20,43],[13,34]],color:'#4d7167'}
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
 const variations=[[-2.3,-1.8],[2.1,-1.4],[-1.7,2.1],[2.4,1.9]];
 variations.forEach(([dx,dz],k)=>{
  const x=bx+dx,z=bz+dz;if(Math.abs(x)>41||Math.abs(z)>43)return;
  let floors=1+((idx*3+k*5)%6);if(district.type==='business')floors+=3;if(district.type==='industrial')floors=1+((idx+k)%3);
  const w=2.4+(idx%3)*.25,h=2.2+(k%2)*.3;
  if(nearRoad(x,z,Math.max(w,h)/2)||partyHeadquarters.some(hq=>Math.abs(x-hq.x)<4.5&&Math.abs(z-hq.z)<4.2))return;
  const color=district.type==='business'?'#566777':district.type==='industrial'?'#4b5b61':['#485563','#3f4c59','#53616e'][(idx+k)%3];
  const geom=new THREE.BoxGeometry(w,floors*1.25,h),mat=new THREE.MeshStandardMaterial({color,roughness:.84});
  const mesh=new THREE.Mesh(geom,mat);mesh.position.set(x,floors*.625+.12,z);mesh.castShadow=true;mesh.receiveShadow=true;city.add(mesh);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.18,.14,h+.18),new THREE.MeshStandardMaterial({color:'#657586',roughness:.85}));roof.position.set(x,floors*1.25+.2,z);roof.castShadow=true;city.add(roof);
  if(floors>2){const winMat=new THREE.MeshStandardMaterial({color:'#92a9ba',emissive:'#26394a',emissiveIntensity:.22,roughness:.45});for(let floor=1;floor<floors;floor++){const strip=new THREE.Mesh(new THREE.BoxGeometry(w*.65,.12,.035),winMat);strip.position.set(x,floor*1.22,z-h/2-.02);city.add(strip)}}
  bldgs.push({mesh,district,floors,kind:district.type});
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
// Parks are deliberate landscaped spaces in the static city plan
const parkMat=new THREE.MeshStandardMaterial({color:'#233d32',roughness:1});
const parkShapes=[[[-39,-33],[-34,-35],[-32,-30],[-35,-25],[-40,-26]],[[-4,-35],[2,-35],[5,-32],[1,-28],[-4,-30]],[[16,29],[20,27],[23,31],[21,36],[17,35]]];
parkShapes.forEach(points=>{const g=new THREE.Shape();points.forEach(([x,z],i)=>i?g.lineTo(x,-z):g.moveTo(x,-z));g.closePath();const geom=new THREE.ShapeGeometry(g);geom.rotateX(-Math.PI/2);const m=new THREE.Mesh(geom,parkMat);m.position.y=.14;city.add(m)});
function pointInPolygon([x,z],pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,zi]=pts[i],[xj,zj]=pts[j];if(((zi>z)!=(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))inside=!inside}return inside}
// Pedestrians are flat camera-facing dots, walking freely across the full roadway.
const people=new THREE.Group();scene.add(people);
const pedestrianPalette=['#4a91ff','#d35a66','#d9b65c','#a681df','#86a0b9'];
const pedestrianRecords=[];
const walkNodes=[];const grid=[-30,-10,10,30];
grid.forEach(z=>grid.forEach(x=>walkNodes.push([x,z])));
const walkAdj=walkNodes.map(()=>[]);
const walkLinks=[];
for(let row=0;row<4;row++)for(let col=0;col<4;col++){
 const i=row*4+col;
 if(col<3)walkLinks.push([i,i+1]);
 if(row<3)walkLinks.push([i,i+4]);
}
walkLinks.forEach(([a,b])=>{walkAdj[a].push(b);walkAdj[b].push(a)});
function seededValue(seed){const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n)}
function pickNextNode(current,previous,seed=0){const options=walkAdj[current].filter(i=>i!==previous);return options.length?options[Math.floor(seededValue(seed+current*17.3)*options.length)]:walkAdj[current][0]??current}
function makeDotTexture(color){
 const c=document.createElement('canvas');c.width=64;c.height=64;const g=c.getContext('2d');
 g.beginPath();g.arc(32,32,25,0,Math.PI*2);g.fillStyle=color;g.fill();g.lineWidth=4;g.strokeStyle='#e8f0fa';g.stroke();
 g.beginPath();g.arc(32,32,7,0,Math.PI*2);g.fillStyle='#fff';g.fill();
 return new THREE.CanvasTexture(c);
}
const dotMaterials=pedestrianPalette.map(color=>new THREE.SpriteMaterial({map:makeDotTexture(color),transparent:true,depthWrite:false}));
for(let k=0;k<90;k++){
 const start=k%walkNodes.length, dot=new THREE.Sprite(dotMaterials[k%5]);
 dot.scale.set(.95,.95,1);dot.position.y=.48;people.add(dot);
 pedestrianRecords.push({dot,node:start,previous:-1,target:pickNextNode(start,-1,k+91),progress:seededValue(k+5)*.45,speed:.12+seededValue(k+19)*.16,offset:seededValue(k+23)*2.2-1.1,phase:seededValue(k+37)*Math.PI*2,seed:k});
}
function movePedestrians(time){
 pedestrianRecords.forEach(p=>{
  const a=walkNodes[p.node],b=walkNodes[p.target];
  p.progress+=p.speed;
  if(p.progress>=1){p.previous=p.node;p.node=p.target;p.target=pickNextNode(p.node,p.previous,p.seed+Math.floor(time*3));p.progress=0;p.offset=seededValue(p.seed+time*2)*2.4-1.2}
  const t=p.progress,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
  // Offset is randomized within the full road width, not on a narrow sidewalk line.
  p.dot.position.set(x-dz/len*p.offset,.48,z+dx/len*p.offset);
 });
}
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width*2-1;mouse.y=-((e.clientY-r.top)/r.height*2-1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(districtMeshes,false);if(hits.length){selectedDistrict=hits[0].object.userData.district;document.querySelector('#districtName').textContent=selectedDistrict.name;document.querySelector('#inspect').innerHTML=`<strong>${selectedDistrict.name}</strong><br>Район: ${selectedDistrict.type==='business'?'деловой':selectedDistrict.type==='industrial'?'промышленный':selectedDistrict.type==='civic'?'административный':'жилой'}<br>Население: ${(220+selectedDistrict.pts.length*86)} тыс.<br>Экономика: ${61+selectedDistrict.pts.length}%<br>Инфраструктура: ${54+selectedDistrict.pts.length*3}%<br>Экология: ${70-selectedDistrict.pts.length*2}%`;districtMeshes.forEach(m=>m.material.opacity=(m.userData.district===selectedDistrict)?0.85:0.56)}});
function setLayer(id,fn){document.getElementById(id).addEventListener('change',fn)}
setLayer('showPeople',()=>people.visible=document.getElementById('showPeople').checked);
const layerIds=['political','economic','infrastructure','ecology'];
const layerColors={political:politicalColors,economic:['#344d64','#426e61','#7d633d','#3d6d69','#66513e'],infrastructure:['#324d70','#416d83','#588b75','#716c58'],ecology:['#406c52','#5b8762','#83a66a','#a3bd7d']};
function applyLayer(){const active=layerIds.find(id=>document.getElementById(id).checked)||null;districtMeshes.forEach((m,i)=>{m.material.color.set(active?layerColors[active][i%layerColors[active].length]:districts[i].color)})}
layerIds.forEach(id=>document.getElementById(id).addEventListener('change',()=>{if(document.getElementById(id).checked)layerIds.filter(other=>other!==id).forEach(other=>document.getElementById(other).checked=false);applyLayer()}));
document.querySelector('#toggleDistrict').onclick=()=>{showDistricts=!showDistricts;districtMeshes.forEach(m=>m.visible=showDistricts);toast(showDistricts?'Районы отображены':'Заливка районов скрыта')};
document.querySelector('#resetCamera').onclick=()=>{camera.position.set(48,62,68);controls.target.set(0,0,0);controls.update()};
function fitCanvas(){const r=canvas.getBoundingClientRect();const w=Math.max(1,r.width||canvas.parentElement?.clientWidth||window.innerWidth);const h=Math.max(1,r.height||canvas.parentElement?.clientHeight||window.innerHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',fitCanvas);if(typeof ResizeObserver!=='undefined'){const mapResizeObserver=new ResizeObserver(()=>fitCanvas());mapResizeObserver.observe(canvas.parentElement)}requestAnimationFrame(fitCanvas);
const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const elapsed=clock.getElapsedTime();movePedestrians(elapsed);controls.update();renderer.render(scene,camera)}animate();
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.style.display='block';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.display='none',2100)}
// Menu creation/opening is handled in index.html independently of WebGL.
// Campaign, law proposals and calendar advancement are implemented in src/game.js.
