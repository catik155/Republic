(function(){
 const menu=document.getElementById('start');
 const toastEl=document.getElementById('toast');
 function toast(message){if(!toastEl)return;toastEl.textContent=message;toastEl.style.display='block';toastEl._timer&&clearTimeout(toastEl._timer);toastEl._timer=setTimeout(()=>toastEl.style.display='none',2500)}
 document.getElementById('startGame').addEventListener('click',()=>{
  const min=Number(document.getElementById('minPlayers').value),max=Number(document.getElementById('maxPlayers').value);
  const parties=Number(document.getElementById('parties').value),ai=Number(document.getElementById('ai').value),year=Number(document.getElementById('year').value);
  if(!Number.isInteger(min)||!Number.isInteger(max)||min<2||max>20||min>max){toast('Проверь количество игроков (2–20).');return}
  if(!Number.isInteger(parties)||parties<2||parties>20||!Number.isInteger(ai)||ai<0||ai>18||ai>parties-1){toast('Проверь партии и количество ИИ. ИИ не может превышать партии минус одна.');return}
  if(!Number.isInteger(year)||year<1900||year>2100){toast('Стартовый год должен быть от 1900 до 2100.');return}
  if(document.getElementById('mode').selectedIndex===1){toast('Создай игру, затем используй блок «Сетевая игра» справа для комнаты.')}
  const name=document.getElementById('country').value.trim()||'Республика';
  document.getElementById('countryName').textContent=name;
  document.getElementById('chronicle').textContent=name+' · '+year+' год · '+parties+' партий · '+ai+' ИИ · '+document.getElementById('difficulty').value+' сложность';
  window.dispatchEvent(new CustomEvent('republic:start',{detail:{name,year,parties,ai,difficulty:document.getElementById('difficulty').value}}));
  menu.classList.add('hidden');toast('Государство создано. Добро пожаловать!');
 });
 document.getElementById('openMenu').addEventListener('click',()=>menu.classList.remove('hidden'));
 // Draw a menu preview without depending on the Three.js renderer.
 const canvas=document.getElementById('preview');
 if(canvas){const box=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,box.width*dpr);canvas.height=Math.max(1,box.height*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.fillStyle='#0a1119';ctx.fillRect(0,0,box.width,box.height);ctx.fillStyle='#20372e';ctx.beginPath();ctx.moveTo(box.width*.12,box.height*.18);ctx.lineTo(box.width*.30,box.height*.10);ctx.lineTo(box.width*.78,box.height*.13);ctx.lineTo(box.width*.90,box.height*.31);ctx.lineTo(box.width*.86,box.height*.78);ctx.lineTo(box.width*.70,box.height*.91);ctx.lineTo(box.width*.28,box.height*.89);ctx.lineTo(box.width*.11,box.height*.74);ctx.closePath();ctx.fill();for(let r=0;r<5;r++){ctx.strokeStyle='#344250';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(box.width*.13,box.height*(.22+r*.13));ctx.lineTo(box.width*.87,box.height*(.22+r*.13));ctx.stroke()}for(let b=0;b<24;b++){const x=box.width*(.18+(b%6)*.12),y=box.height*(.23+Math.floor(b/6)*.15);ctx.fillStyle=['#4a5968','#68798a','#384856'][b%3];ctx.fillRect(x,y,box.width*.035,box.height*.07)}}
})();