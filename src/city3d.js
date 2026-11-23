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
camera.position.set(54,66,68);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,0,0);controls.enableDamping=true;controls.dampingFactor=.06;controls.maxPolarAngle=Math.PI*.46;controls.minDistance=28;controls.maxDistance=145;
scene.add(new THREE.HemisphereLight(0x9bb8d5,0x182019,2.1));
const sun=new THREE.DirectionalLight(0xb8d0e9,2.6);sun.position.set(-35,55,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;scene.add(sun);
const city=new THREE.Group();scene.add(city);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(160,144),new THREE.MeshStandardMaterial({color:'#101923',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.5;floor.receiveShadow=true;city.add(floor);
// The urban footprint is deliberately wider than it is deep, with tapered corners
// and subtly irregular shared block corners instead of a perfect square grid.
const districtXBounds=[-48,-30,-10,10,30,48];
const districtZBounds=[-48,-30,-10,10,30,48];
const districtVertex=(row,col)=>{
 const x=districtXBounds[col],z=districtZBounds[row];
 const cornerTaper=1-.17*Math.pow(Math.abs(z)/40,4);
 const depthTaper=1-.13*Math.pow(Math.abs(x)/48,4);
 const edgeX=x*cornerTaper,edgeZ=z*depthTaper;
 const edge=(row===0||row===5||col===0||col===5);
 const n=Math.sin((row*17+col*31+20261123)*.71);
 return [edgeX+(edge?0:n*1.05),edgeZ+(edge?0:Math.cos((row*29+col*13+20261123)*.63)*.9)];
};
function districtCellPolygon(r0,r1,c0,c1){
 const points=[];
 for(let c=c0;c<=c1;c++)points.push(districtVertex(r0,c));
 for(let r=r0+1;r<=r1;r++)points.push(districtVertex(r,c1));
 for(let c=c1-1;c>=c0;c--)points.push(districtVertex(r1,c));
 for(let r=r1-1;r>r0;r--)points.push(districtVertex(r,c0));
 return points;
}
const districtNames=[
 ['Северо-западный','Северный','Северо-восточный','Северный окраинный','Верхний восточный'],
 ['Западный','Северо-центральный','Центральный север','Восточный центр','Восточный'],
 ['Западный центр','Старый город','Центральный','Деловой центр','Восточный центр'],
 ['Юго-западный','Западный южный','Южный центр','Восточный южный','Юго-восточный'],
 ['Нижний запад','Южный запад','Южный','Южный окраинный','Нижний восток']
];
const districts=[];
const districtMerges=[
 {rows:[0,1],cols:[0,1],name:'Северо-западный округ'},
 {rows:[1,2],cols:[3,4],name:'Восточный округ'},
 {rows:[3,4],cols:[0,1],name:'Юго-западный округ'},
 {rows:[3,4],cols:[3,4],name:'Юго-восточный округ'},
 {rows:[0,1],cols:[2,2],name:'Северный центральный округ'}
];
const covered=new Set();
districtMerges.forEach(m=>m.rows.forEach(r=>m.cols.forEach(c=>covered.add(r*5+c))));
const mergeByStart=new Map(districtMerges.map(m=>[m.rows[0]*5+m.cols[0],m]));
for(let row=0;row<5;row++)for(let col=0;col<5;col++){
 const key=row*5+col;if(covered.has(key)&&!mergeByStart.has(key))continue;
 const merge=mergeByStart.get(key),rows=merge?.rows??[row],cols=merge?.cols??[col];
 const r0=rows[0],r1=rows[rows.length-1]+1,c0=cols[0],c1=cols[cols.length-1]+1;
 const central=rows.includes(2)&&cols.includes(2),business=(row===1&&col===2)||(row===2&&col===3),industrial=rows.includes(3)&&cols.includes(2),civic=rows.includes(2)&&cols.includes(1);
 const type=central||business?'business':industrial?'industrial':civic?'civic':'residential';
 const colors=['#526e83','#557866','#607b8a','#52796f','#65746d','#54786d','#687d6a','#617a6e','#4d7167'];
 const name=merge?.name??(central?'Центральный':districtNames[row][col]);
 districts.push({name,type,pts:districtCellPolygon(r0,r1,c0,c1),color:colors[(row*5+col)%colors.length],cells:rows.length*cols.length});
}
const politicalColors=['#3e83e6','#bd4f5c','#c6a14b','#8962bf','#6d8395'];
let showDistricts=true, selectedDistrict=null;
function shapeFromPolygon(points){const shape=new THREE.Shape();if(!Array.isArray(points)||points.length<3)throw new Error('Invalid district polygon: expected at least 3 points');points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));const [firstX,firstZ]=points[0];shape.lineTo(firstX,-firstZ);return shape}
function makeLabel(text){
 const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.font='bold 42px Segoe UI';g.textAlign='center';g.fillStyle='#d3deeb';g.shadowColor='#080c11';g.shadowBlur=8;g.fillText(text,256,75);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});const spr=new THREE.Sprite(mat);spr.scale.set(18,4.5,1);return spr
}
const districtMeshes=[];
districts.forEach((d,i)=>{
 const geom=new THREE.ExtrudeGeometry(shapeFromPolygon(d.pts),{depth:.7,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.25,bevelThickness:.18});
 geom.rotateX(-Math.PI/2);
 const mat=new THREE.MeshStandardMaterial({color:d.color,roughness:.95,transparent:true,opacity:.62,depthWrite:false});
 const mesh=new THREE.Mesh(geom,mat);mesh.position.y=.03;mesh.receiveShadow=true;mesh.renderOrder=2;mesh.userData.district=d;city.add(mesh);districtMeshes.push(mesh);
 const edges=new THREE.EdgesGeometry(geom);const outline=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:'#708797',transparent:true,opacity:.45}));outline.position.copy(mesh.position);city.add(outline);
 const center=d.pts.reduce((acc,p)=>[acc[0]+p[0]/d.pts.length,acc[1]+p[1]/d.pts.length],[0,0]);const label=makeLabel(d.name);label.position.set(center[0],1.8,center[1]);city.add(label);
});
const asphalt=new THREE.MeshStandardMaterial({color:'#222c36',roughness:1});
const avenueAsphalt=new THREE.MeshStandardMaterial({color:'#29343e',roughness:1});
function road(x1,z1,x2,z2,width=3.1){const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),cx=(x1+x2)/2,cz=(z1+z2)/2;const m=new THREE.Mesh(new THREE.BoxGeometry(width,.12,len),width>=4?avenueAsphalt:asphalt);m.position.set(cx,.06,cz);m.rotation.y=angle;m.receiveShadow=true;city.add(m)}
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
avenuePaths.forEach((path,pathIndex)=>path.slice(0,-1).forEach((p,j)=>{
 const arterial=pathIndex===1||pathIndex===2||pathIndex===5||pathIndex===6;
 road(p[0],p[1],path[j+1][0],path[j+1][1],arterial?4.6:3.0);
}));
// City block/building placement: deterministic, fixed seed list, no random map generation.
const parkShapes=[[[-39,-23],[-35,-24],[-33,-20],[-35,-17],[-39,-18]],[[-6,-23],[-2,-24],[0,-20],[-2,-17],[-6,-18]],[[33,18],[37,17],[39,21],[37,24],[33,23]]];
const CITY_LAYOUT_SEED=20261123;
function layoutNoise(index,axis){const n=Math.sin((CITY_LAYOUT_SEED+index*91.7+axis*173.3)*.0174533)*43758.5453;return(n-Math.floor(n))*2-1}
const blockCenters=[
[-35,-28],[-25,-28],[-15,-27],[-2,-27],[7,-27],[24,-27],[36,-27],
[-37,-10],[-24,-10],[-14,-10],[0,-10],[7,-10],[24,-10],[37,-10],
[-37,8],[-24,8],[-14,8],[0,8],[7,8],[24,8],[37,8],
[-34,28],[-23,28],[-14,28],[0,28],[7,28],[24,28],[36,28],
[-32,38],[-22,38],[-12,38],[0,38],[8,38],[23,38],[35,38]
];
const partyHeadquarters=[
{name:'Развитие',color:politicalColors[0],x:-20,z:-20},
{name:'Социал-демократы',color:politicalColors[1],x:20,z:-20},
{name:'Национальный союз',color:politicalColors[2],x:20,z:20},
{name:'Зелёные',color:politicalColors[3],x:-20,z:20},
{name:'Гражданская партия',color:politicalColors[4],x:-20,z:0}
];
const bldgs=[];
function distanceToSegment(px,pz,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz||1;const t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/den));return Math.hypot(px-(a[0]+dx*t),pz-(a[1]+dz*t))}
function nearRoad(px,pz,buildingRadius=1.7){for(let pathIndex=0;pathIndex<avenuePaths.length;pathIndex++){const path=avenuePaths[pathIndex],width=pathIndex%3===0?3.6:2.8;for(let seg=0;seg<path.length-1;seg++){const safeDistance=width/2+.18+1.25+buildingRadius+.35;if(distanceToSegment(px,pz,path[seg],path[seg+1])<safeDistance)return true}}return false}
blockCenters.forEach(([baseX,baseZ],idx)=>{
 const bx=baseX+Math.sin(idx*12.9898)*1.6+layoutNoise(idx,1)*1.15,bz=baseZ+Math.cos(idx*7.233)*1.5+layoutNoise(idx,2)*1.15;
 const district=districts.find(d=>pointInPolygon([bx,bz],d.pts))||districts[4];
 const variations=[[-2.3,-1.8],[2.1,-1.4],[-1.7,2.1],[2.4,1.9],[-4.0,-2.8],[4.0,-2.6],[-3.8,3.7],[4.1,3.8],[-5.2,0],[5.2,0],[0,-5.2],[0,5.2],[-6.0,-4.5],[6.0,-4.5],[-6.0,4.5],[6.0,4.5],[-2.8,-6.2],[2.8,6.2]];
 variations.forEach(([dx,dz],k)=>{
  const x=bx+dx,z=bz+dz;if(Math.abs(x)>41||Math.abs(z)>43)return;
  let floors=1+((idx*3+k*5)%6);if(district.type==='business')floors+=3;if(district.type==='industrial')floors=1+((idx+k)%3);if(district.type==='residential'&&((idx*5+k*3)%7===0))floors+=2;
  const footprintBand=(idx*11+k*7)%6;
  const w=2.8+footprintBand*.27+(k%3===0?.22:0),h=2.55+((idx*2+k*5)%6)*.23+(k%4===1?.18:0);
  // Keep building footprints clear of roads, neighboring buildings and civic/party landmarks.
  const roadClear=!nearRoad(x,z,Math.max(w,h)/2+.28);
  const buildingClear=bldgs.every(b=>Math.abs(x-b.x)>=(w+b.w)/2+.35||Math.abs(z-b.z)>=(h+b.h)/2+.35);
  const hqClear=partyHeadquarters.every(hq=>Math.abs(x-hq.x)>=w/2+3.1||Math.abs(z-hq.z)>=h/2+2.7);
  const govClear=Math.abs(x)>=w/2+5.0||Math.abs(z)>=h/2+4.6;
  const parkClear=parkShapes.every(points=>{const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);return x+w/2+.8<minX||x-w/2-.8>maxX||z+h/2+.8<minZ||z-h/2-.8>maxZ});
  if((Math.abs(x)<7&&Math.abs(z)<7)||!roadClear||!buildingClear||!hqClear||!govClear||!parkClear)return;
  const color=district.type==='business'?'#566777':district.type==='industrial'?'#4b5b61':['#485563','#3f4c59','#53616e','#655c56','#5a6570'][(idx+k)%5];
  const variant=(idx*7+k*3)%4,mat=new THREE.MeshStandardMaterial({color,roughness:.84});
  const geom=new THREE.BoxGeometry(w,floors*1.25,h),mesh=new THREE.Mesh(geom,mat);mesh.position.set(x,floors*.625+.12,z);mesh.castShadow=true;mesh.receiveShadow=true;city.add(mesh);
  const roofMat=new THREE.MeshStandardMaterial({color:['#657586','#465563','#596b76','#6b6258'][variant],roughness:.85});
  let roof;
  if(variant===1){roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,h)*.68,.9,4),roofMat);roof.rotation.y=Math.PI/4;roof.scale.set(w/Math.max(w,h),1,h/Math.max(w,h));}
  else if(variant===2){const g=new THREE.Group();const ridge=new THREE.Mesh(new THREE.BoxGeometry(w+.18,.18,.18),roofMat);ridge.position.y=.45;g.add(ridge);const slope=new THREE.Mesh(new THREE.BoxGeometry(w+.22,.12,h*.72),roofMat);slope.rotation.x=.42;slope.position.set(0,.25,-h*.18);g.add(slope);const slope2=slope.clone();slope2.rotation.x=-.42;slope2.position.set(0,.25,h*.18);g.add(slope2);roof=g;}
  else roof=new THREE.Mesh(new THREE.BoxGeometry(w+.18,.14,h+.18),roofMat);
  roof.position.set(x,floors*1.25+.2,z);roof.castShadow=true;city.add(roof);
  // Locate nearest street and orient the front facade directly toward it.
  const streetCoords=[-30,-10,10,30];
  const nearestVertical=streetCoords.reduce((best,coord)=>Math.abs(x-coord)<Math.abs(x-best)?coord:best,streetCoords[0]);
  const nearestHorizontal=streetCoords.reduce((best,coord)=>Math.abs(z-coord)<Math.abs(z-best)?coord:best,streetCoords[0]);
  // Compare true perpendicular distances independently; avoid picking one diagonal grid cell.
  const frontAxis=Math.abs(x-nearestVertical)<=Math.abs(z-nearestHorizontal)?'x':'z';
  const frontSign=frontAxis==='x'?(nearestVertical<x?-1:1):(nearestHorizontal<z?-1:1);
  const facadeMat=new THREE.MeshStandardMaterial({color:['#92a9ba','#d1b78d','#9bb8a7','#b4a2c7'][variant],emissive:'#26394a',emissiveIntensity:.22,roughness:.45});
  const windowsPerFloor=Math.max(2,Math.floor(Math.max(w,h)/.65));
  for(let floor=1;floor<floors;floor++)for(let wi=0;wi<windowsPerFloor;wi++){
   const win=new THREE.Mesh(new THREE.BoxGeometry(.42,.32,.045),facadeMat),t=(wi-(windowsPerFloor-1)/2)*.62;
   if(frontAxis==='x'){win.position.set(x+frontSign*(w/2+.026),floor*1.22,z+t);win.rotation.y=frontSign>0?-Math.PI/2:Math.PI/2;}
   else{win.position.set(x+t,floor*1.22,z+frontSign*(h/2+.026));win.rotation.y=frontSign>0?Math.PI:0;}
   city.add(win);
   if(variant===3&&wi%2===0){const sideWin=win.clone();if(frontAxis==='x'){sideWin.position.set(x-frontSign*(w/2+.026),floor*1.22,z+t);sideWin.rotation.y=-frontSign*Math.PI/2;}else{sideWin.position.set(x+t,floor*1.22,z-frontSign*(h/2+.026));sideWin.rotation.y=frontSign>0?0:Math.PI;}city.add(sideWin);}
  }
  const side=frontAxis,sign=frontSign;
  const entryX=x+(side==='x'?sign*(w/2+.55):0),entryZ=z+(side==='z'?sign*(h/2+.55):0);const door=new THREE.Mesh(new THREE.BoxGeometry(.55,.9,.08),new THREE.MeshStandardMaterial({color:'#263342',roughness:.9}));door.position.set(entryX,.5,entryZ);if(side==='x')door.rotation.y=sign>0?-Math.PI/2:Math.PI/2;city.add(door);bldgs.push({mesh,district,floors,kind:district.type,x,z,w,h,entryX,entryZ,variant,frontAxis,frontSign});
 });
});
// Fine city detailing is static and deterministic: windows, roof equipment, crossings, and street lighting.
// Instanced facade windows add visual density without hundreds of separate draw calls.
const facadeWindowMat=new THREE.MeshStandardMaterial({color:'#93adbf',emissive:'#293f52',emissiveIntensity:.24,roughness:.38});
const facadeWindowGeo=new THREE.BoxGeometry(.34,.42,.07);
const facadeSideGeo=new THREE.BoxGeometry(.07,.42,.34);
const facadeWindowFront=new THREE.InstancedMesh(facadeWindowGeo,facadeWindowMat,1200);
const facadeWindowSide=new THREE.InstancedMesh(facadeSideGeo,facadeWindowMat,1200);
const windowDummy=new THREE.Object3D();let frontWindowCount=0,sideWindowCount=0;
bldgs.forEach((b,bi)=>{
 const floorCount=Math.max(1,b.floors-1),cols=Math.max(1,Math.floor((b.frontAxis==='x'?b.h:b.w)/.65));
 for(let f=1;f<=floorCount;f++){
  const y=f*1.22;
  for(let c=0;c<cols;c++){
   const t=(c-(cols-1)/2)*.62;
   if(frontWindowCount<facadeWindowFront.count){
    if(b.frontAxis==='x'){windowDummy.position.set(b.x+b.frontSign*(b.w/2+.045),y,b.z+t);windowDummy.rotation.y=b.frontSign>0?Math.PI/2:-Math.PI/2;}
    else{windowDummy.position.set(b.x+t,y,b.z+b.frontSign*(b.h/2+.045));windowDummy.rotation.y=b.frontSign>0?0:Math.PI;}
    windowDummy.updateMatrix();facadeWindowFront.setMatrixAt(frontWindowCount++,windowDummy.matrix);
   }
   if(b.variant===3&&sideWindowCount<facadeWindowSide.count){
    if(b.frontAxis==='x'){windowDummy.position.set(b.x-b.frontSign*(b.w/2+.045),y,b.z+t);windowDummy.rotation.y=-b.frontSign*Math.PI/2;}
    else{windowDummy.position.set(b.x+t,y,b.z-b.frontSign*(b.h/2+.045));windowDummy.rotation.y=b.frontSign>0?Math.PI:0;}
    windowDummy.updateMatrix();facadeWindowSide.setMatrixAt(sideWindowCount++,windowDummy.matrix);
   }
  }
 }
 // Deterministic district storefront canopies and civic entrance details.
 if(b.kind==='business'){
  const canopyColors=['#526d83','#80634b','#4c776e','#76596c'];
  const canopyMat=new THREE.MeshStandardMaterial({color:canopyColors[bi%canopyColors.length],roughness:.72});
  const frontX=b.x+(b.frontAxis==='x'?b.frontSign*(b.w/2+.42):0),frontZ=b.z+(b.frontAxis==='z'?b.frontSign*(b.h/2+.42):0);
  const canopyGeom=b.frontAxis==='x'?new THREE.BoxGeometry(.72,.24,b.h+.22):new THREE.BoxGeometry(b.w+.22,.24,.72);
  const canopy=new THREE.Mesh(canopyGeom,canopyMat);canopy.position.set(frontX,Math.min(2.15,b.floors*1.15),frontZ);canopy.castShadow=true;city.add(canopy);
  const supportMat=new THREE.MeshStandardMaterial({color:'#344553',roughness:.7});
  for(const offset of [-(b.frontAxis==='x'?b.h:b.w)*.34,(b.frontAxis==='x'?b.h:b.w)*.34]){
   const support=new THREE.Mesh(new THREE.BoxGeometry(.08,.72,.08),supportMat);
   support.position.set(b.frontAxis==='x'?frontX:b.x+offset,1.5,b.frontAxis==='x'?b.z+offset:frontZ);city.add(support)
  }
 }
 if(b.kind==='civic'){
  const columnMat=new THREE.MeshStandardMaterial({color:'#73818b',roughness:.82});
  const frontX=b.x+(b.frontAxis==='x'?b.frontSign*(b.w/2+.22):0),frontZ=b.z+(b.frontAxis==='z'?b.frontSign*(b.h/2+.22):0);
  for(const offset of [-(b.frontAxis==='x'?b.h:b.w)*.3,0,(b.frontAxis==='x'?b.h:b.w)*.3]){
   const column=new THREE.Mesh(new THREE.BoxGeometry(.18,1.7,.18),columnMat);column.position.set(b.frontAxis==='x'?frontX:b.x+offset,1.02,b.frontAxis==='x'?b.z+offset:frontZ);column.castShadow=true;city.add(column)
  }
  const lintelGeom=b.frontAxis==='x'?new THREE.BoxGeometry(.26,.22,b.h*.72):new THREE.BoxGeometry(b.w*.72,.22,.26);
  const lintel=new THREE.Mesh(lintelGeom,columnMat);lintel.position.set(frontX,1.92,frontZ);city.add(lintel);
 }
 // Deterministic rooftop HVAC/vent details on selected buildings.
 if(bi%4===0){const roofY=b.floors*1.25+.32;const ventMat=new THREE.MeshStandardMaterial({color:'#293744',roughness:.88});const vent=new THREE.Mesh(new THREE.BoxGeometry(.65,.45,.55),ventMat);vent.position.set(b.x+b.w*.22,roofY,b.z+b.h*.12);vent.castShadow=true;city.add(vent);const ventCap=new THREE.Mesh(new THREE.BoxGeometry(.75,.08,.65),new THREE.MeshStandardMaterial({color:'#5c6a75',roughness:.8}));ventCap.position.set(vent.position.x,roofY+.25,vent.position.z);city.add(ventCap);}
});
facadeWindowFront.count=frontWindowCount;facadeWindowSide.count=sideWindowCount;facadeWindowFront.instanceMatrix.needsUpdate=true;facadeWindowSide.instanceMatrix.needsUpdate=true;city.add(facadeWindowFront,facadeWindowSide);
// Warm street lamps live along sidewalks rather than in the carriageway.
const lampMetal=new THREE.MeshStandardMaterial({color:'#344553',roughness:.7}),lampGlow=new THREE.MeshStandardMaterial({color:'#e4c98b',emissive:'#e4c98b',emissiveIntensity:.75});
const lampPoleGeo=new THREE.CylinderGeometry(.07,.11,3.4,6),lampHeadGeo=new THREE.BoxGeometry(.45,.16,.32);
const lampCandidates=[];[-30,-10,10,30].forEach(x=>[-30,-10,10,30].forEach(z=>{lampCandidates.push([x-3.1,z-3.1],[x+3.1,z+3.1])}));
const lampLocations=[];
lampCandidates.forEach(([x,z])=>{
 const clearOfBuildings=bldgs.every(b=>Math.abs(x-b.x)>b.w/2+.65||Math.abs(z-b.z)>b.h/2+.65);
 const clearOfHQ=partyHeadquarters.every(h=>Math.abs(x-h.x)>3.25||Math.abs(z-h.z)>2.85);
 const clearOfGovernment=Math.abs(x)>5.25||Math.abs(z)>4.65;
 const clearOfParks=parkShapes.every(points=>!pointInPolygon([x,z],points));
 const clearOfLamps=lampLocations.every(([lx,lz])=>Math.hypot(x-lx,z-lz)>2.8);
 if(clearOfBuildings&&clearOfHQ&&clearOfGovernment&&clearOfParks&&clearOfLamps)lampLocations.push([x,z]);
});
lampLocations.forEach(([x,z])=>{const pole=new THREE.Mesh(lampPoleGeo,lampMetal);pole.position.set(x,1.7,z);pole.castShadow=true;city.add(pole);const head=new THREE.Mesh(lampHeadGeo,lampGlow);head.position.set(x,3.45,z);city.add(head);});
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
const parkFixtures=[];

parkShapes.forEach((points,parkIndex)=>{const g=new THREE.Shape();if(!Array.isArray(points)||points.length<3)throw new Error('Invalid park polygon: expected at least 3 points');points.forEach(([x,z],i)=>i?g.lineTo(x,-z):g.moveTo(x,-z));const [firstX,firstZ]=points[0];g.lineTo(firstX,-firstZ);const geom=new THREE.ShapeGeometry(g);geom.rotateX(-Math.PI/2);const m=new THREE.Mesh(geom,parkMat);m.position.y=.14;city.add(m);
 // Fixed park furniture: benches and trees are part of the persistent city scene.
 const center=points.reduce((sum,p)=>[sum[0]+p[0]/points.length,sum[1]+p[1]/points.length],[0,0]);
 const benchWood=new THREE.MeshStandardMaterial({color:'#695342',roughness:.9}),benchMetal=new THREE.MeshStandardMaterial({color:'#313e49',roughness:.85});
 const bench=new THREE.Group();bench.position.set(center[0]+(parkIndex-1)*.6,.18,center[1]);bench.rotation.y=parkIndex*.7;
 const seat=new THREE.Mesh(new THREE.BoxGeometry(2.2,.16,.58),benchWood);seat.position.y=.62;bench.add(seat);
 const back=new THREE.Mesh(new THREE.BoxGeometry(2.2,.65,.12),benchWood);back.position.set(0,.98,-.24);bench.add(back);
 for(const lx of [-.85,.85])for(const lz of [-.18,.18]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.12,.62,.12),benchMetal);leg.position.set(lx,.31,lz);bench.add(leg)}
 city.add(bench);
 parkFixtures.push({kind:'bench',x:bench.position.x,z:bench.position.z,w:2.8,h:1.5,park:parkIndex});
 const treeMaterial=new THREE.MeshStandardMaterial({color:'#253c32',roughness:1}),trunkMaterial=new THREE.MeshStandardMaterial({color:'#54483b',roughness:1});
 for(let t=0;t<2;t++){const tx=points[t][0],tz=points[t][1];parkFixtures.push({kind:'tree',x:tx,z:tz,w:2.1,h:2.1,park:parkIndex});const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,1.2,6),trunkMaterial);trunk.position.set(tx,.6,tz);city.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(1.05,2.3,7),treeMaterial);crown.position.set(tx,2,tz);crown.castShadow=true;city.add(crown)}
});
function auditCityLayout(){
 const issues=[],overlap=(a,b,pad=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+pad&&Math.abs(a.z-b.z)<(a.h+b.h)/2+pad;
 const insideAnyPark=(x,z)=>parkShapes.some(points=>pointInPolygon([x,z],points)||points.some((p,i)=>{const q=points[(i+1)%points.length],dx=q[0]-p[0],dz=q[1]-p[1],t=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-(p[0]+t*dx),z-(p[1]+t*dz))<.12}));
 const governmentFootprint={x:0,z:0,w:9.2,h:8.4};
 for(let i=0;i<bldgs.length;i++)for(let j=i+1;j<bldgs.length;j++)if(overlap(bldgs[i],bldgs[j],.08))issues.push('building:'+i+'/'+j);
 bldgs.forEach((b,i)=>{
  if(nearRoad(b.x,b.z,Math.max(b.w,b.h)/2+.28))issues.push('building-road:'+i);
  if(partyHeadquarters.some(h=>Math.abs(b.x-h.x)<(b.w+5.6)/2+.35&&Math.abs(b.z-h.z)<(b.h+4.8)/2+.35))issues.push('building-hq:'+i);
  if(overlap(b,governmentFootprint,.25))issues.push('building-government:'+i);
  if(parkShapes.some(points=>{const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);return !(b.x+b.w/2<Math.min(...xs)||b.x-b.w/2>Math.max(...xs)||b.z+b.h/2<Math.min(...zs)||b.z-b.h/2>Math.max(...zs))}))issues.push('building-park:'+i);
 });
 partyHeadquarters.forEach((h,i)=>{
  if(parkShapes.some(points=>{const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);return !(h.x+2.8<Math.min(...xs)||h.x-2.8>Math.max(...xs)||h.z+2.4<Math.min(...zs)||h.z-2.4>Math.max(...zs))}))issues.push('hq-park:'+i);
  if(nearRoad(h.x,h.z,3.0))issues.push('hq-road:'+i);
  if(overlap({x:h.x,z:h.z,w:5.6,h:4.8},governmentFootprint,.25))issues.push('hq-government:'+i);
  for(let j=i+1;j<partyHeadquarters.length;j++){const other=partyHeadquarters[j];if(overlap({x:h.x,z:h.z,w:5.6,h:4.8},{x:other.x,z:other.z,w:5.6,h:4.8},.25))issues.push('hq-hq:'+i+'/'+j)}
 });
 parkFixtures.forEach((p,i)=>{
  if(!insideAnyPark(p.x,p.z))issues.push('park-fixture-outside:'+i);
  if(bldgs.some(b=>overlap(p,b,.2)))issues.push('park-fixture-building:'+i);
  if(partyHeadquarters.some(h=>overlap(p,{x:h.x,z:h.z,w:5.6,h:4.8},.2)))issues.push('park-fixture-hq:'+i);
  if(overlap(p,governmentFootprint,.2))issues.push('park-fixture-government:'+i);
  for(let j=i+1;j<parkFixtures.length;j++)if(overlap(p,parkFixtures[j],.12))issues.push('park-fixture-fixture:'+i+'/'+j);
 });
 lampLocations.forEach(([x,z],i)=>{
  if(bldgs.some(b=>Math.abs(x-b.x)<b.w/2+.65&&Math.abs(z-b.z)<b.h/2+.65))issues.push('lamp-building:'+i);
  if(partyHeadquarters.some(h=>Math.abs(x-h.x)<3.25&&Math.abs(z-h.z)<2.85))issues.push('lamp-hq:'+i);
  if(Math.abs(x)<5.25&&Math.abs(z)<4.65)issues.push('lamp-government:'+i);
  if(insideAnyPark(x,z))issues.push('lamp-park:'+i);
  for(let j=i+1;j<lampLocations.length;j++)if(Math.hypot(x-lampLocations[j][0],z-lampLocations[j][1])<2.8)issues.push('lamp-lamp:'+i+'/'+j);
 });
 const count=prefix=>issues.filter(v=>v.startsWith(prefix)).length;
 const report={seed:CITY_LAYOUT_SEED,buildings:bldgs.length,parks:parkShapes.length,parkFixtures:parkFixtures.length,streetLamps:lampLocations.length,partyHQs:partyHeadquarters.length,buildingOverlaps:count('building:'),roadConflicts:count('building-road:')+count('hq-road:'),landmarkConflicts:count('building-hq:')+count('building-park:')+count('hq-park:')+count('building-government:')+count('hq-government:')+count('hq-hq:'),decorationConflicts:count('park-fixture-')+count('lamp-'),issues};
 window.cityMapAudit=report;console.info('[Republic map audit]',report);return report;
}
function pointInPolygon([x,z],pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,zi]=pts[i],[xj,zj]=pts[j];if(((zi>z)!=(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))inside=!inside}return inside}
// Pedestrians roam along connected road intersections, with gentle lateral weaving.
const people=new THREE.Group();scene.add(people);
const pedestrianPalette=['#4a91ff','#d35a66','#d9b65c','#a681df','#86a0b9'];
const pedestrianRecords=[];
const walkNodes=[];const grid=[-30,-10,10,30];
// Road-centered waypoints with slight deterministic irregularity; pedestrians are not restricted to sidewalk paths.
grid.forEach((z,row)=>grid.forEach((x,col)=>{const seed=row*4+col,ox=Math.sin(seed*17.31+2.7)*.72,oz=Math.cos(seed*9.17+1.4)*.72;walkNodes.push([x+ox,z+oz])}));
const walkAdj=walkNodes.map(()=>[]);
const walkLinks=[];
for(let row=0;row<4;row++)for(let col=0;col<4;col++){const i=row*4+col;if(col<3)walkLinks.push([i,i+1]);if(row<3)walkLinks.push([i,i+4])}
walkLinks.forEach(([a,b])=>{walkAdj[a].push(b);walkAdj[b].push(a)});
function nearestWalkNode(x,z){let best=0,bestD=Infinity;walkNodes.forEach(([nx,nz],i)=>{const d=Math.hypot(x-nx,z-nz);if(d<bestD){bestD=d;best=i}});return best}const homeBuildings=bldgs.filter(b=>b.kind==='residential');const homeNodes=homeBuildings.map(b=>nearestWalkNode(b.x,b.z));const parkNodes=parkShapes.map(points=>nearestWalkNode(points.reduce((a,p)=>[a[0]+p[0]/points.length,a[1]+p[1]/points.length],[0,0]).map((v,i)=>v)));function seededValue(seed){const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n)}const shopBuildings=bldgs.filter(b=>b.kind==='business'),shopNodes=shopBuildings.map(b=>nearestWalkNode(b.x,b.z));const civicBuildings=bldgs.filter(b=>b.kind==='civic'),civicNodes=civicBuildings.map(b=>nearestWalkNode(b.x,b.z)),partyHQNodes=partyHeadquarters.map(hq=>nearestWalkNode(hq.x,hq.z));function chooseOuting(homeNode,seed){if(seededValue(seed)>=.34)return{outing:false,destination:homeNode,activity:'home'};const roll=seededValue(seed+13),activity=roll<.52?'park':roll<.86?'shop':roll<.94?'civic':'party',nodes=activity==='park'?parkNodes:activity==='shop'?shopNodes:activity==='civic'?civicNodes:partyHQNodes;if(!nodes.length)return{outing:false,destination:homeNode,activity:'home'};const eligible=nodes.filter(node=>nodeDistance(homeNode,node)>=2);const candidates=eligible.length?eligible:nodes.filter(node=>node!==homeNode);if(!candidates.length)return{outing:false,destination:homeNode,activity:'home'};const pick=Math.floor(seededValue(seed+29)*candidates.length);const destination=candidates[pick];return{outing:true,destination,activity}}
function nodeDistance(a,b){const [ax,az]=walkNodes[a],[bx,bz]=walkNodes[b];return Math.abs(ax-bx)+Math.abs(az-bz)}
const pathDistanceCache=new Map();function streetDistances(destination){if(pathDistanceCache.has(destination))return pathDistanceCache.get(destination);const distances=Array(walkNodes.length).fill(Infinity),queue=[destination];distances[destination]=0;for(let q=0;q<queue.length;q++){const node=queue[q];walkAdj[node].forEach(next=>{if(distances[next]===Infinity){distances[next]=distances[node]+1;queue.push(next)}})}pathDistanceCache.set(destination,distances);return distances}function pickNextNode(current,previous,seed=0,destination=current){const distances=streetDistances(destination);let options=walkAdj[current].filter(i=>distances[i]<distances[current]);if(options.length>1&&previous>=0)options=options.filter(i=>i!==previous);if(!options.length)return walkAdj[current][0]??current;const min=Math.min(...options.map(i=>distances[i]));const best=options.filter(i=>distances[i]===min);return best[Math.floor(seededValue(seed+current*17.3)*best.length)]}
function makeDotTexture(color){const c=document.createElement('canvas');c.width=64;c.height=64;const g=c.getContext('2d');g.beginPath();g.arc(32,32,25,0,Math.PI*2);g.fillStyle=color;g.fill();g.lineWidth=4;g.strokeStyle='#e8f0fa';g.stroke();g.beginPath();g.arc(32,32,7,0,Math.PI*2);g.fillStyle='#fff';g.fill();return new THREE.CanvasTexture(c)}
const dotMaterials=pedestrianPalette.map(color=>new THREE.SpriteMaterial({map:makeDotTexture(color),transparent:true,depthWrite:false}));const talkTexture=(()=>{const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d');g.fillStyle='#f4f8ff';g.beginPath();g.roundRect(10,8,108,65,20);g.fill();g.beginPath();g.moveTo(38,70);g.lineTo(30,86);g.lineTo(56,70);g.fill();g.fillStyle='#243548';g.font='48px sans-serif';g.textAlign='center';g.fillText('…',64,58);return new THREE.CanvasTexture(c)})();const talkMaterial=new THREE.SpriteMaterial({map:talkTexture,transparent:true,depthWrite:false});
const pedestrianAdmin={count:110,talkChance:.12,talkDistance:.9,talkCooldown:25};
for(let k=0;k<150;k++){const start=Math.floor(seededValue(k+123)*walkNodes.length),dot=new THREE.Sprite(dotMaterials[k%5].clone());dot.scale.set(.95,.95,1);dot.position.y=.48;dot.visible=k<pedestrianAdmin.count;people.add(dot);const bubble=new THREE.Sprite(talkMaterial.clone());bubble.scale.set(1.3,.95,1);bubble.position.y=1.7;bubble.visible=false;dot.add(bubble);const homeBuilding=Math.floor(seededValue(k+71)*homeBuildings.length),homeNode=homeNodes[homeBuilding]??Math.floor(seededValue(k+71)*walkNodes.length),routine=chooseOuting(homeNode,k+97),outing=routine.outing,dest=routine.destination;pedestrianRecords.push({dot,bubble,node:start,previous:-1,homeBuilding,homeNode,outing,activity:routine.activity,destination:dest,target:pickNextNode(start,-1,k+91,dest),progress:seededValue(k+5)*.45,speed:.32+seededValue(k+19)*.28,offset:seededValue(k+23)*3.4-1.7,offsetCurrent:seededValue(k+23)*3.4-1.7,phase:seededValue(k+37)*Math.PI*2,seed:k,lastTime:0,life:'walking',homeUntil:0,talkUntil:0,nextTalkAt:0,opacity:1})}
function movePedestrians(time){pedestrianRecords.forEach(p=>{const dt=Math.max(0,time-(p.lastTime??time));p.lastTime=time;if(p.life==='inside'){p.dot.visible=false;p.bubble.visible=false;if(time>=p.homeUntil){p.homeBuilding=Math.floor(seededValue(p.seed+time*29+5)*homeBuildings.length);const home=homeBuildings[p.homeBuilding],node=homeNodes[p.homeBuilding]??Math.floor(seededValue(p.seed+time*29+5)*walkNodes.length);p.homeNode=node;p.node=node;p.previous=-1;const routine=chooseOuting(node,p.seed+time*31);p.outing=routine.outing;p.activity=routine.activity;p.destination=routine.destination;p.target=pickNextNode(node,-1,p.seed+Math.floor(time*3),p.destination);p.progress=0;p.offset=0;p.offsetCurrent=0;p.life='leaving';p.leaveStart=[home?.entryX??walkNodes[node][0],home?.entryZ??walkNodes[node][1]];p.leaveUntil=time+.9;p.dot.visible=true;p.opacity=0;p.dot.material.opacity=0;p.dot.position.set(p.leaveStart[0],.48,p.leaveStart[1])}return}if(p.life==='leaving'){const homeNode=walkNodes[p.node],duration=.9,t=Math.max(0,Math.min(1,1-(p.leaveUntil-time)/duration));p.dot.position.set(p.leaveStart[0]+(homeNode[0]-p.leaveStart[0])*t,.48,p.leaveStart[1]+(homeNode[1]-p.leaveStart[1])*t);p.opacity=t;p.dot.material.opacity=t;if(time>=p.leaveUntil){p.life='walking';p.opacity=1;p.dot.material.opacity=1;p.dot.position.set(homeNode[0],.48,homeNode[1])}return}if(p.life==='entering'){p.bubble.visible=false;const enterDuration=1.25,enterT=Math.max(0,Math.min(1,1-(p.homeUntil-time)/enterDuration));if(p.enterStart&&p.enterDoor){p.dot.position.set(p.enterStart[0]+(p.enterDoor[0]-p.enterStart[0])*enterT,.48,p.enterStart[1]+(p.enterDoor[1]-p.enterStart[1])*enterT)}p.opacity=Math.max(0,1-Math.max(0,enterT-.78)/.22);p.dot.material.opacity=p.opacity;if(time>=p.homeUntil){p.life='inside';p.homeUntil=time+2.5+seededValue(p.seed+time*7)*7;p.dot.visible=false;return}return}if(p.life==='idle'){p.bubble.visible=false;if(time>=p.homeUntil){p.life='walking';p.destination=p.homeNode;p.target=pickNextNode(p.node,-1,p.seed+Math.floor(time*5),p.destination);p.progress=0;p.previous=-1;p.offset=0;p.offsetCurrent=0}return}if(p.life==='talking'&&time<p.talkUntil){p.progress=0;p.bubble.visible=true;return}else if(p.life==='talking'){p.life='walking';p.bubble.visible=false}p.progress+=p.speed*dt*1.6;p.offsetCurrent+=(p.offset-p.offsetCurrent)*Math.min(1,dt*2.4);if(p.opacity<1){p.opacity=Math.min(1,p.opacity+dt*2.5);p.dot.material.opacity=p.opacity}if(p.progress>=1){p.progress%=1;p.previous=p.node;p.node=p.target;if(p.node===p.destination){p.progress=0;if(p.outing&&p.destination!==p.homeNode){p.life='idle';const stopDuration=p.activity==='park'?8+seededValue(p.seed+time*9)*12:p.activity==='shop'?5+seededValue(p.seed+time*9)*9:p.activity==='civic'?4+seededValue(p.seed+time*9)*8:6+seededValue(p.seed+time*9)*10;p.homeUntil=time+stopDuration;p.bubble.visible=false}else{p.life='entering';const home=homeBuildings[p.homeBuilding];p.enterStart=[p.dot.position.x,p.dot.position.z];p.enterDoor=[home?.entryX??walkNodes[p.node][0],home?.entryZ??walkNodes[p.node][1]];p.bubble.visible=false;p.homeUntil=time+1.25}}else{p.target=pickNextNode(p.node,p.previous,p.seed+Math.floor(time*3),p.destination);p.offset=seededValue(p.seed+time*2)*3.4-1.7}}if(p.life==='entering'&&time>=p.homeUntil){p.life='inside';p.homeUntil=time+2.5+seededValue(p.seed+time*7)*7;p.dot.material.opacity=0;p.dot.visible=false;return}const a=walkNodes[p.node],b=walkNodes[p.target],t=p.progress,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;const wave=Math.sin(time*2.2+p.phase)*.42+Math.sin(time*4.1+p.phase*.7)*.13;const lateral=Math.max(-1.72,Math.min(1.72,p.offsetCurrent+wave));const x=a[0]+dx*t-dz/len*lateral,z=a[1]+dz*t+dx/len*lateral;p.dot.position.set(x,.48,z);p.bubble.visible=false});for(let i=0;i<pedestrianAdmin.count;i++){const a=pedestrianRecords[i];if(a.life!=='walking'||a.dot.visible===false)continue;for(let j=i+1;j<pedestrianAdmin.count;j++){const b=pedestrianRecords[j];if(b.life!=='walking'||!b.dot.visible)continue;if(Math.hypot(a.dot.position.x-b.dot.position.x,a.dot.position.z-b.dot.position.z)<pedestrianAdmin.talkDistance&&time>=a.nextTalkAt&&time>=b.nextTalkAt&&seededValue(a.seed*31+b.seed*17+Math.floor(time*.5))<pedestrianAdmin.talkChance){a.life=b.life='talking';a.talkUntil=b.talkUntil=time+0.8+seededValue(a.seed+b.seed+time)*1.2;a.nextTalkAt=b.nextTalkAt=time+pedestrianAdmin.talkCooldown;a.bubble.visible=b.bubble.visible=true;break}}}}
const buildRaycaster=new THREE.Raycaster(),buildPointer=new THREE.Vector2();
let constructionMode=false,constructionType='residential';
const buildCatalog={
 residential:{label:'Жилой дом',cost:3.2,color:'#647b89',floors:3,w:3.8,h:3.4,kind:'residential'},
 business:{label:'Магазин / офис',cost:2.4,color:'#8a795d',floors:2,w:3.6,h:3.2,kind:'business'},
 industrial:{label:'Предприятие',cost:5.5,color:'#68756d',floors:2,w:4.2,h:3.8,kind:'industrial'},
 civic:{label:'Общественное здание',cost:4.2,color:'#7b7189',floors:2,w:3.8,h:3.6,kind:'civic'}
};
const builtObjects=[];
function saveBuiltObjects(){try{localStorage.setItem('republic-built-buildings-v1',JSON.stringify(builtObjects))}catch{}}
function createPlayerBuilding(record){
 const spec=buildCatalog[record.type];if(!spec)return null;
 const district=districts.find(d=>pointInPolygon([record.x,record.z],d.pts));if(!district)return null;
 const material=new THREE.MeshStandardMaterial({color:spec.color,roughness:.86});
 const geometry=new THREE.BoxGeometry(spec.w,spec.floors*1.25,spec.h);
 const mesh=new THREE.Mesh(geometry,material);mesh.position.set(record.x,spec.floors*.625+.12,record.z);mesh.castShadow=true;mesh.receiveShadow=true;city.add(mesh);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(spec.w+.2,.18,spec.h+.2),new THREE.MeshStandardMaterial({color:'#465563',roughness:.9}));roof.position.set(record.x,spec.floors*1.25+.2,record.z);roof.castShadow=true;city.add(roof);
 const door=new THREE.Mesh(new THREE.BoxGeometry(.58,.95,.09),new THREE.MeshStandardMaterial({color:'#263342',roughness:.9}));door.position.set(record.x+spec.w/2+.05,.52,record.z);door.rotation.y=Math.PI/2;city.add(door);
 const b={...record,mesh,district,floors:spec.floors,kind:spec.kind,w:spec.w,h:spec.h,entryX:record.x+spec.w/2,entryZ:record.z,playerBuilt:true};
 bldgs.push(b);return b;
}
try{const saved=JSON.parse(localStorage.getItem('republic-built-buildings-v1')||'[]');if(Array.isArray(saved))saved.forEach(record=>{if(buildCatalog[record.type]&&Number.isFinite(record.x)&&Number.isFinite(record.z)&&createPlayerBuilding(record))builtObjects.push(record)})}catch{}
function canBuildAt(x,z,spec){
 const candidate={x,z,w:spec.w,h:spec.h};
 if(!districts.some(d=>pointInPolygon([x,z],d.pts)))return'За пределами городских районов';
 if(Math.abs(x)>42||Math.abs(z)>36)return'За пределами доступной территории';
 if(nearRoad(x,z,Math.max(spec.w,spec.h)/2+.2))return'Слишком близко к проезжей части';
 if(!avenuePaths.some(path=>path.slice(0,-1).some((p,i)=>distanceToSegment(x,z,p,path[i+1])<8.5)))return'Нет доступа к улице';
 if(bldgs.some(b=>Math.abs(x-b.x)<(spec.w+b.w)/2+.5&&Math.abs(z-b.z)<(spec.h+b.h)/2+.5))return'Участок уже занят зданием';
 if(partyHeadquarters.some(h=>Math.abs(x-h.x)<spec.w/2+3.1&&Math.abs(z-h.z)<spec.h/2+2.7))return'Рядом находится штаб партии';
 if(Math.abs(x)<spec.w/2+5&&Math.abs(z)<spec.h/2+4.6)return'Нельзя строить рядом со зданием правительства';
 if(parkShapes.some(points=>{const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);return !(x+spec.w/2+.5<Math.min(...xs)||x-spec.w/2-.5>Math.max(...xs)||z+spec.h/2+.5<Math.min(...zs)||z-spec.h/2-.5>Math.max(...zs))}))return'Участок занят парком';
 return'';
}
function setConstructionMode(enabled,type){
 constructionMode=!!enabled;if(type&&buildCatalog[type])constructionType=type;
 controls.enabled=!constructionMode;
 canvas.style.cursor=constructionMode?'crosshair':'grab';
 toast(constructionMode?'Режим строительства: выберите свободный участок':'Режим строительства выключен');
}
window.RepublicCityConstruction={
 setMode:setConstructionMode,
 getCatalog:()=>Object.fromEntries(Object.entries(buildCatalog).map(([key,v])=>[key,{label:v.label,cost:v.cost}])),
 getBuildings:()=>bldgs.length,
};
canvas.addEventListener('pointerdown',e=>{
 if(!constructionMode||e.button!==0)return;
 e.stopImmediatePropagation();
 const rect=canvas.getBoundingClientRect();buildPointer.x=(e.clientX-rect.left)/rect.width*2-1;buildPointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
 buildRaycaster.setFromCamera(buildPointer,camera);
 const hits=buildRaycaster.intersectObject(floor,false);if(!hits.length)return;
 const x=Math.round(hits[0].point.x*2)/2,z=Math.round(hits[0].point.z*2)/2,spec=buildCatalog[constructionType];
 const problem=canBuildAt(x,z,spec);if(problem){toast(problem);return}
 const cost=spec.cost,state=window.republicState;
 if(!state||state.budget<cost){toast('Недостаточно средств. Нужно ₽'+cost.toFixed(1)+' млрд');return}
 state.budget-=cost;
 const record={type:constructionType,x,z,cost};
 if(createPlayerBuilding(record)){builtObjects.push(record);saveBuiltObjects();window.dispatchEvent(new CustomEvent('republic:buildingbuilt',{detail:{...record,label:spec.label}}));window.dispatchEvent(new Event('republic:adminchange'));toast(spec.label+' построен за ₽'+cost.toFixed(1)+' млрд')}
 else{state.budget+=cost;toast('Не удалось разместить здание')}
});
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width*2-1;mouse.y=-((e.clientY-r.top)/r.height*2-1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(districtMeshes,false);if(hits.length){selectedDistrict=hits[0].object.userData.district;document.querySelector('#districtName').textContent=selectedDistrict.name;const localBuildings=bldgs.filter(b=>b.district===selectedDistrict),capacity=b=>b.floors*(b.kind==='residential'?3:b.kind==='business'?1.5:b.kind==='industrial'?2:1),allCapacity=bldgs.reduce((sum,b)=>sum+capacity(b),0)||1,districtCapacity=localBuildings.reduce((sum,b)=>sum+capacity(b),0),population=Math.round(((window.republicState?.people??8.7)*1000)*districtCapacity/allCapacity),residential=localBuildings.filter(b=>b.kind==='residential').length,commercial=localBuildings.filter(b=>b.kind==='business').length,roadAccess=walkNodes.filter(([x,z])=>pointInPolygon([x,z],selectedDistrict.pts)).length,greenSpace=parkShapes.filter(points=>pointInPolygon(points.reduce((a,p)=>[a[0]+p[0]/points.length,a[1]+p[1]/points.length],[0,0]),selectedDistrict.pts)).length,economy=Math.min(95,Math.round(40+commercial*1.2+localBuildings.length*.3)),infrastructure=Math.min(95,Math.round(35+roadAccess*9+localBuildings.length*.45)),ecology=Math.max(20,Math.min(95,Math.round(64+greenSpace*12-residential*0.18)));document.querySelector('#inspect').innerHTML=`<strong>${selectedDistrict.name}</strong><br>Тип: ${selectedDistrict.type==='business'?'деловой':selectedDistrict.type==='industrial'?'промышленный':selectedDistrict.type==='civic'?'административный':'жилой'}<br>Население (оценка): ${population.toLocaleString('ru-RU')} тыс.<br><span style="color:#91a7bd;font-size:11px">Пешеходы на карте — выборочные агенты, не все жители</span><br>Здания: ${localBuildings.length} (жилые ${residential})<br>Коммерческие: ${commercial}<br>Экономика: ${economy}%<br>Инфраструктура: ${infrastructure}%<br>Экология: ${ecology}%<br>Политический лидер: ${politicalWinnerForDistrict(districtMeshes.indexOf(hits[0].object)).name} (${politicalWinnerForDistrict(districtMeshes.indexOf(hits[0].object)).share.toFixed(1)}%)`;districtMeshes.forEach(m=>m.material.opacity=(m.userData.district===selectedDistrict)?0.85:0.56)}});
function setLayer(id,fn){document.getElementById(id).addEventListener('change',fn)}
setLayer('showPeople',()=>people.visible=document.getElementById('showPeople').checked);
const layerIds=['political','economic','infrastructure','ecology'];
const layerColors={political:politicalColors,economic:['#344d64','#426e61','#7d633d','#3d6d69','#66513e'],infrastructure:['#324d70','#416d83','#588b75','#716c58'],ecology:['#406c52','#5b8762','#83a66a','#a3bd7d']};
function politicalWinnerForDistrict(i){const state=window.republicState,support=state?.support||[32,28,20,12,8],colors=state?.partyColors||politicalColors,scores=support.map((v,p)=>Math.max(0,v+Math.sin((i+1)*8.17+(p+1)*3.91)*6)),winner=scores.reduce((best,v,p)=>v>scores[best]?p:best,0),total=scores.reduce((a,b)=>a+b,0)||1;return{winner,color:colors[winner]||politicalColors[winner%politicalColors.length],name:state?.partyNames?.[winner]||'Партия',share:scores[winner]/total*100}}function applyLayer(){const active=layerIds.find(id=>document.getElementById(id).checked)||null;districtMeshes.forEach((m,i)=>{const color=active==='political'?politicalWinnerForDistrict(i).color:active?layerColors[active][i%layerColors[active].length]:districts[i].color;m.material.color.set(color)})}
layerIds.forEach(id=>document.getElementById(id).addEventListener('change',()=>{if(document.getElementById(id).checked)layerIds.filter(other=>other!==id).forEach(other=>document.getElementById(other).checked=false);applyLayer()}));
document.querySelector('#toggleDistrict').onclick=()=>{showDistricts=!showDistricts;districtMeshes.forEach(m=>m.visible=showDistricts);toast(showDistricts?'Районы отображены':'Заливка районов скрыта')};
document.querySelector('#resetCamera').onclick=()=>{camera.position.set(54,66,68);controls.target.set(0,0,0);controls.update()};
function fitCanvas(){
 const host=canvas.parentElement;
 const r=host.getBoundingClientRect();
 const w=Math.max(1,Math.round(r.width||host.clientWidth||window.innerWidth));
 const h=Math.max(window.innerWidth<=650?320:240,Math.round(r.height||host.clientHeight||window.innerHeight-60));
 if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())||camera.aspect!==w/h){
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
}
window.addEventListener('resize',fitCanvas);
window.addEventListener('orientationchange',()=>requestAnimationFrame(fitCanvas));
window.addEventListener('pageshow',()=>requestAnimationFrame(fitCanvas));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestAnimationFrame(fitCanvas)});
if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>requestAnimationFrame(fitCanvas));
if(typeof ResizeObserver!=='undefined'){const mapResizeObserver=new ResizeObserver(()=>requestAnimationFrame(fitCanvas));mapResizeObserver.observe(canvas.parentElement)}
fitCanvas();requestAnimationFrame(()=>requestAnimationFrame(fitCanvas));
const adminPanel=document.querySelector('#adminPanel');
const adminOpen=document.querySelector('#adminOpen'),adminClose=document.querySelector('#adminClose');
const residentSlider=document.querySelector('#adminResidents'),talkChanceSlider=document.querySelector('#adminTalkChance'),talkDistanceSlider=document.querySelector('#adminTalkDistance'),talkCooldownSlider=document.querySelector('#adminTalkCooldown');
function updateAdminLabels(){document.querySelector('#adminResidentsValue').textContent=pedestrianAdmin.count;document.querySelector('#adminTalkChanceValue').textContent=Math.round(pedestrianAdmin.talkChance*100)+'%';document.querySelector('#adminTalkDistanceValue').textContent=pedestrianAdmin.talkDistance.toFixed(1);document.querySelector('#adminTalkCooldownValue').textContent=pedestrianAdmin.talkCooldown+' сек'}
function updateResidentVisibility(){pedestrianRecords.forEach((p,i)=>{p.dot.visible=i<pedestrianAdmin.count&&p.life!=='inside'&&p.life!=='entering';if(i>=pedestrianAdmin.count)p.bubble.visible=false})}
function auditHQ(){let conflicts=0;const names=[];partyHeadquarters.forEach(hq=>{const roadConflict=nearRoad(hq.x,hq.z,3.3);const buildingConflict=bldgs.some(b=>Math.abs(hq.x-b.x)<b.w/2+3.4&&Math.abs(hq.z-b.z)<b.h/2+3.1);if(roadConflict||buildingConflict)conflicts++;names.push(hq.name+' ('+hq.x+', '+hq.z+')')});const el=document.querySelector('#adminAudit');if(conflicts)el.textContent='⚠ Проверка: '+conflicts+' штаб(а) конфликтуют с дорогой/зданием.';else el.textContent='✓ Проверка: все '+partyHeadquarters.length+' штабов вне дорожных коридоров и зданий. '+names.join(' · ')}
adminOpen?.addEventListener('click',()=>{adminPanel?.classList.add('open');auditHQ()});
adminClose?.addEventListener('click',()=>adminPanel?.classList.remove('open'));
adminPanel?.addEventListener('click',e=>{if(e.target===adminPanel)adminPanel.classList.remove('open')});
residentSlider?.addEventListener('input',()=>{pedestrianAdmin.count=Number(residentSlider.value);updateResidentVisibility();updateAdminLabels()});
talkChanceSlider?.addEventListener('input',()=>{pedestrianAdmin.talkChance=Number(talkChanceSlider.value)/100;updateAdminLabels()});
talkDistanceSlider?.addEventListener('input',()=>{pedestrianAdmin.talkDistance=Number(talkDistanceSlider.value);updateAdminLabels()});
talkCooldownSlider?.addEventListener('input',()=>{pedestrianAdmin.talkCooldown=Number(talkCooldownSlider.value);updateAdminLabels()});
const metricIds=['adminBudget','adminStability','adminPolitical','adminUnrest','adminMonth','adminYear','adminPopulation'];
const metricLabels={adminBudget:'adminBudgetValue',adminStability:'adminStabilityValue',adminPolitical:'adminPoliticalValue',adminUnrest:'adminUnrestValue',adminMonth:'adminMonthValue',adminYear:'adminYearValue',adminPopulation:'adminPopulationValue'};
const metricDefs={adminBudget:{key:'budget',format:v=>'₽'+Number(v).toFixed(0)+' млрд'},adminStability:{key:'stability',format:v=>v+'%'},adminPolitical:{key:'politicalCapital',format:v=>v},adminUnrest:{key:'unrest',format:v=>v+'%'},adminMonth:{key:'month',format:v=>['','Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][v]},adminYear:{key:'year',format:v=>v},adminPopulation:{key:'people',format:v=>Number(v).toFixed(1)+' млн'}};
function syncMetricSliders(){const st=window.republicState;if(!st)return;metricIds.forEach(id=>{const el=document.getElementById(id),def=metricDefs[id];if(el)el.value=st[def.key]??el.value;const out=document.getElementById(metricLabels[id]);if(out)out.textContent=def.format(el?.value??st[def.key])})}
adminOpen?.addEventListener('click',syncMetricSliders);
 metricIds.forEach(id=>{
  const el=document.getElementById(id);
  if(!el)return;
  el.addEventListener('input',()=>{
   const def=metricDefs[id],st=window.republicState;
   if(!st)return;
   const value=Number(el.value);
   st[def.key]=value;
   const out=document.getElementById(metricLabels[id]);
   if(out)out.textContent=def.format(value);
   window.dispatchEvent(new CustomEvent('republic:adminchange',{detail:{key:def.key,value}}));
  });
 });
window.cityAdmin={getSettings:()=>({...pedestrianAdmin}),setResidents:n=>{pedestrianAdmin.count=Math.max(90,Math.min(150,Number(n)||110));if(residentSlider)residentSlider.value=pedestrianAdmin.count;updateResidentVisibility();updateAdminLabels()}};
updateAdminLabels();auditHQ();auditCityLayout();
const clock=new THREE.Clock();let lastLayerRefresh=0;function animate(){requestAnimationFrame(animate);const elapsed=clock.getElapsedTime();movePedestrians(elapsed);if(elapsed-lastLayerRefresh>1){applyLayer();lastLayerRefresh=elapsed}controls.update();renderer.render(scene,camera)}animate();
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.style.display='block';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.display='none',2100)}
// Menu creation/opening is handled in index.html independently of WebGL.
// Campaign, law proposals and calendar advancement are implemented in src/game.js.
