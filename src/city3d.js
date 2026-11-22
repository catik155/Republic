import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas=document.querySelector('#city3d');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;

const scene=new THREE.Scene();
scene.background=new THREE.Color('#080e15');
scene.fog=new THREE.Fog('#080e15',85,155);
const camera=new THREE.PerspectiveCamera(42,canvas.clientWidth/canvas.clientHeight,.1,250);
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
function road(x1,z1,x2,z2,width=3.1){const len=Math.hypot(x2-x1,z2-z1);const m=new THREE.Mesh(new THREE.BoxGeometry(width,.12,len),asphalt);m.position.set((x1+x2)/2,.06,(z1+z2)/2);m.rotation.y=-Math.atan2(x2-x1,z2-z1);m.receiveShadow=true;city.add(m);const curbW=.4;for(const off of [-width/2-curbW/2,width/2+curbW/2]){const curb=new THREE.Mesh(new THREE.BoxGeometry(curbW,.15,len),sidewalkMat);curb.position.set((x1+x2)/2,.12,(z1+z2)/2);curb.rotation.y=m.rotation.y;city.add(curb)}}
// Organic road plan: staggered arterials, angled links and short curved-like segmented streets.
const avenuePaths=[
[[-43,-20],[-28,-17],[-12,-21],[3,-16],[18,-19],[33,-16],[43,-20]],
[[-43,1],[-27,4],[-12,0],[4,3],[20,0],[34,4],[43,1]],
[[-40,20],[-25,17],[-9,22],[7,18],[22,21],[37,18],[43,20]],
[[-31,-44],[-29,-27],[-33,-10],[-28,8],[-32,24],[-29,43]],
[[-10,-43],[-7,-26],[-12,-9],[-7,9],[-11,26],[-8,43]],
[[13,-43],[17,-25],[11,-8],[16,10],[12,26],[16,43]],
[[32,-43],[28,-26],[34,-8],[29,10],[35,27],[31,43]],
[[-43,-34],[-31,-28],[-18,-31],[-4,-28],[12,-31],[27,-27],[43,-34]],
[[-42,34],[-29,29],[-15,33],[0,29],[16,34],[31,30],[43,34]]
];
avenuePaths.forEach((path,i)=>path.slice(0,-1).forEach((p,j)=>road(p[0],p[1],path[j+1][0],path[j+1][1],i%3===0?3.6:2.8)));
// City block/building placement: deterministic, fixed seed list, no random map generation.
const blockCenters=[
[-35,-28],[-25,-28],[-15,-27],[-2,-27],[7,-27],[24,-27],[36,-27],
[-37,-10],[-24,-10],[-14,-10],[0,-10],[7,-10],[24,-10],[37,-10],
[-37,8],[-24,8],[-14,8],[0,8],[7,8],[24,8],[37,8],
[-34,28],[-23,28],[-14,28],[0,28],[7,28],[24,28],[36,28],
[-32,38],[-22,38],[-12,38],[0,38],[8,38],[23,38],[35,38]
];
const bldgs=[];
blockCenters.forEach(([baseX,baseZ],idx)=>{
 // Stable pseudo-random offsets vary block placements from one another without moving them onto road edges.
 const bx=baseX+Math.sin(idx*12.9898)*1.6,bz=baseZ+Math.cos(idx*7.233)*1.5;
 const district=districts.find(d=>pointInPolygon([bx,bz],d.pts))||districts[4];
 // block groups with controlled offsets, avoid randomness entirely
 const variations=[[-2.3,-1.8],[2.1,-1.4],[-1.7,2.1],[2.4,1.9]];
 variations.forEach(([dx,dz],k)=>{
  const x=bx+dx,z=bz+dz; if(Math.abs(x)>41||Math.abs(z)>43)return;
  let floors=1+((idx*3+k*5)%6);if(district.type==='business')floors+=3;if(district.type==='industrial')floors=1+((idx+k)%3);
  const w=2.4+(idx%3)*.25,h=2.2+(k%2)*.3;
  const color=district.type==='business'?'#566777':district.type==='industrial'?'#4b5b61':['#485563','#3f4c59','#53616e'][(idx+k)%3];
  const geom=new THREE.BoxGeometry(w,floors*1.25,h);const mat=new THREE.MeshStandardMaterial({color,roughness:.84});
  const mesh=new THREE.Mesh(geom,mat);mesh.position.set(x,floors*.625+.12,z);mesh.castShadow=true;mesh.receiveShadow=true;city.add(mesh);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.18,.14,h+.18),new THREE.MeshStandardMaterial({color:'#657586',roughness:.85}));roof.position.set(x,floors*1.25+.2,z);roof.castShadow=true;city.add(roof);
  // Window strips as inset facade panels
  if(floors>2){const winMat=new THREE.MeshStandardMaterial({color:'#92a9ba',emissive:'#26394a',emissiveIntensity:.22,roughness:.45});for(let floor=1;floor<floors;floor++){const strip=new THREE.Mesh(new THREE.BoxGeometry(w*.65,.12,.035),winMat);strip.position.set(x,floor*1.22,z-h/2-.02);city.add(strip)}}
  bldgs.push({mesh,district,floors,kind:district.type});
 });
});
// Parks are deliberate landscaped spaces in the static city plan
const parkMat=new THREE.MeshStandardMaterial({color:'#233d32',roughness:1});
const parkShapes=[[[-39,-33],[-34,-35],[-32,-30],[-35,-25],[-40,-26]],[[-4,-35],[2,-35],[5,-32],[1,-28],[-4,-30]],[[16,29],[20,27],[23,31],[21,36],[17,35]]];
parkShapes.forEach(points=>{const g=new THREE.Shape();points.forEach(([x,z],i)=>i?g.lineTo(x,-z):g.moveTo(x,-z));g.closePath();const geom=new THREE.ShapeGeometry(g);geom.rotateX(-Math.PI/2);const m=new THREE.Mesh(geom,parkMat);m.position.y=.14;city.add(m)});
function pointInPolygon([x,z],pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,zi]=pts[i],[xj,zj]=pts[j];if(((zi>z)!=(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))inside=!inside}return inside}
// Pedestrians have individual destinations and wander between street waypoints; no vehicles.
const people=new THREE.Group();scene.add(people);
const pedestrianPalette=['#4a91ff','#d35a66','#d9b65c','#a681df','#86a0b9'];
const pedestrianRecords=[];
const dotGeo=new THREE.SphereGeometry(.22,10,8);
// A connected, uneven street network gives pedestrians route choices and keeps them on-road.
const walkNodes=[[-40,-19],[-27,-17],[-14,-20],[0,-16],[14,-18],[29,-17],[40,-20],
 [-38,1],[-24,3],[-11,0],[3,2],[18,0],[33,3],[41,1],
 [-36,20],[-22,18],[-8,22],[8,19],[23,21],[37,19],
 [-30,39],[-16,36],[-1,40],[15,37],[30,39]];
const walkLinks=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[14,15],[15,16],[16,17],[17,18],[18,19],[20,21],[21,22],[22,23],[23,24],[0,7],[1,8],[2,9],[3,10],[4,11],[5,12],[7,14],[8,15],[9,16],[10,17],[11,18],[12,19],[14,20],[15,21],[16,22],[17,23],[18,24]];
const walkAdj=walkNodes.map(()=>[]);
walkLinks.forEach(([a,b])=>{walkAdj[a].push(b);walkAdj[b].push(a)});
function pickNextNode(current,previous){const options=walkAdj[current].filter(i=>i!==previous);return options.length?options[Math.floor(Math.random()*options.length)]:walkAdj[current][0]??current}
for(let k=0;k<90;k++){
 const start=k%walkNodes.length, dot=new THREE.Mesh(dotGeo,new THREE.MeshStandardMaterial({color:pedestrianPalette[k%5],roughness:.8}));
 dot.position.y=.24;people.add(dot);
 const target=pickNextNode(start,-1);
 pedestrianRecords.push({dot,node:start,previous:-1,target,progress:Math.random(),speed:.7+Math.random()*.65,side:(Math.random()-.5)*1.5,phase:Math.random()*Math.PI*2});
}
function movePedestrians(time){pedestrianRecords.forEach(p=>{
 const a=walkNodes[p.node],b=walkNodes[p.target];
 p.progress+=p.speed*.004;
 if(p.progress>=1){p.previous=p.node;p.node=p.target;p.target=pickNextNode(p.node,p.previous);p.progress=0}
 const t=p.progress, x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
 // Gentle lateral sway and a small random drift so walking doesn't look like a rigid line.
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
 const sway=Math.sin(time*1.6+p.phase)*.65+p.side;
 p.dot.position.set(x-dz/len*sway,.24,z+dx/len*sway);
})}
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width*2-1;mouse.y=-((e.clientY-r.top)/r.height*2-1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(districtMeshes,false);if(hits.length){selectedDistrict=hits[0].object.userData.district;document.querySelector('#districtName').textContent=selectedDistrict.name;document.querySelector('#inspect').innerHTML=`<strong>${selectedDistrict.name}</strong><br>Район: ${selectedDistrict.type==='business'?'деловой':selectedDistrict.type==='industrial'?'промышленный':selectedDistrict.type==='civic'?'административный':'жилой'}<br>Население: ${(220+selectedDistrict.pts.length*86)} тыс.<br>Экономика: ${61+selectedDistrict.pts.length}%<br>Инфраструктура: ${54+selectedDistrict.pts.length*3}%<br>Экология: ${70-selectedDistrict.pts.length*2}%`;districtMeshes.forEach(m=>m.material.opacity=m.userData.district===selectedDistrict?.85:.56)}});
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
