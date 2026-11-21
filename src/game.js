// Republic Alpha 0.20.0 — local political simulation + PeerJS multiplayer MVP.
import Peer from 'peerjs';
(() => {
 const $=id=>document.getElementById(id);
 const state={name:'Республика',year:2026,month:1,parties:8,ai:6,difficulty:'Средняя',campaigns:0,stability:72,budget:284.7,people:8.7,lawCount:0,support:[32,28,20,12,8],partyNames:['Развитие','Социал-демократы','Национальный союз','Зелёные','Гражданская партия'],chronicle:'',hostName:'',players:[]};
 const months=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
 let peer=null,hostConnection=null,connections=[],isHost=false,roomCode='',netReady=false;
 const log=m=>{state.chronicle=m;const el=$('chronicle');if(el)el.textContent=m};
 const toast=m=>{const el=$('toast');if(!el)return;el.textContent=m;el.style.display='block';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.display='none',2400)};
 const netStatus=m=>{const el=$('networkStatus');if(el)el.textContent=m};
 const render=()=>{if($('yearTop'))$('yearTop').textContent=state.year;if($('stabilityTop'))$('stabilityTop').textContent=Math.round(state.stability)+'%';if($('budgetTop'))$('budgetTop').textContent='₽'+state.budget.toFixed(1)+' млрд';if($('populationTop'))$('populationTop').textContent=state.people.toFixed(2)+' млн';if($('yearTop'))$('yearTop').textContent=state.year;};
 const save=()=>{try{localStorage.setItem('republic-save-v020',JSON.stringify(state))}catch{}};
 const serialize=()=>({name:state.name,year:state.year,month:state.month,parties:state.parties,ai:state.ai,difficulty:state.difficulty,campaigns:state.campaigns,stability:state.stability,budget:state.budget,people:state.people,lawCount:state.lawCount,support:state.support,partyNames:state.partyNames,chronicle:state.chronicle});
 const restore=s=>{if(!s)return;Object.assign(state,s);render();if(state.chronicle)log(state.chronicle)};
 const send=(conn,obj)=>{try{if(conn&&conn.open)conn.send(obj)}catch{}};
 const sendHostAction=action=>{if(isHost){applyAction(action,true);broadcastState()}else if(hostConnection?.open)send(hostConnection,{type:'action',action});else toast('Сначала подключись к комнате или создай её.')};
 const broadcastState=()=>connections.forEach(c=>send(c,{type:'state',state:serialize()}));
 const renderPeers=()=>{const el=$('roomPeers');if(el)el.textContent=roomCode?(isHost?'Хост комнаты':'Подключено к хосту')+(connections.length?': '+connections.length+' игрок(ов)':''):''};
 function applyAction(a,fromNetwork=false){
  if(!a||!a.type)return;
  if(a.type==='advance'){state.month++;if(state.month>12){state.month=1;state.year++}state.stability=Math.max(15,Math.min(95,state.stability+(Math.random()-.48)*1.8));state.budget=Math.max(0,state.budget+(.15+(Math.random()-.45)*1.1));log('📅 '+months[state.month-1]+' '+state.year+' · месяц завершён.');}
  else if(a.type==='campaign'){state.campaigns++;const idx=(state.campaigns-1)%Math.min(state.parties,state.support.length);state.support[idx]=Math.min(60,state.support[idx]+1.2);state.stability=Math.max(15,state.stability-.15);log('Кампания партии «'+state.partyNames[idx]+'»: поддержка +1,2 п.п.');}
  else if(a.type==='law'){state.lawCount++;const yes=Math.floor(240+Math.random()*120);const outcome=yes>=226?'принят':'отклонён';log('Законопроект «'+a.name+'» '+outcome+'. Голосов за: '+yes+'/450.');}
  render();save();if(!fromNetwork)toast(a.type==='advance'?'Месяц продвинут':'Действие выполнено');
 }
 function bindConn(conn,isIncoming){
  conn.on('open',()=>{if(isIncoming){connections.push(conn);state.players.push({name:'Подключается…'});send(conn,{type:'welcome',state:serialize(),room:roomCode,hostName:$('playerName')?.value||'Хост'});netStatus('Игрок подключился');renderPeers();}else{hostConnection=conn;send(conn,{type:'join',name:$('playerName')?.value||'Игрок'});netStatus('Связь с хостом установлена');}});
  conn.on('data',msg=>{if(!msg||typeof msg!=='object')return;if(isHost&&msg.type==='join'){const p=state.players.find(p=>p.name==='Подключается…');if(p)p.name=String(msg.name||'Игрок').slice(0,32);renderPeers();connections.forEach(c=>send(c,{type:'roster',players:state.players}));}else if(isHost&&msg.type==='action'){applyAction(msg.action,true);broadcastState()}else if(!isHost&&(msg.type==='welcome'||msg.type==='state')){restore(msg.state);if(msg.room)roomCode=msg.room;netStatus('В комнате '+roomCode+' · синхронизация активна');renderPeers();}else if(!isHost&&msg.type==='roster'){state.players=msg.players||[];renderPeers();}});
  conn.on('close',()=>{if(isIncoming){connections=connections.filter(c=>c!==conn);renderPeers();netStatus('Игрок покинул комнату')}else{hostConnection=null;netStatus('Соединение с хостом потеряно')}});
  conn.on('error',err=>netStatus('Ошибка соединения: '+(err?.type||'unknown')));
 }
 function resetPeer(){try{peer?.destroy()}catch{}peer=null;connections=[];hostConnection=null;roomCode='';isHost=false;netReady=false;}
 $('hostRoom')?.addEventListener('click',()=>{if(peer){toast('Сначала отключись от текущей комнаты');return}isHost=true;roomCode=String(Math.floor(100000+Math.random()*900000));const id='republic-'+roomCode;netStatus('Создаём комнату…');try{peer=new Peer(id);peer.on('open',id=>{netReady=true;netStatus('Комната создана. Код: '+roomCode+' · Ожидание игроков');renderPeers();toast('Код комнаты: '+roomCode);});peer.on('connection',conn=>bindConn(conn,true));peer.on('error',err=>{netStatus('Не удалось создать комнату: '+(err?.type||'ошибка'));resetPeer()});}catch(e){netStatus('Ошибка запуска сетевого модуля');resetPeer()}});
 $('joinRoom')?.addEventListener('click',()=>{if(peer){toast('Сначала отключись от текущей комнаты');return}const code=($('joinCode')?.value||'').trim().replace(/\D/g,'');if(code.length!==6){toast('Введите 6-значный код комнаты');return}roomCode=code;isHost=false;netStatus('Подключаемся к комнате '+code+'…');try{peer=new Peer();peer.on('open',()=>{hostConnection=peer.connect('republic-'+code,{reliable:true});bindConn(hostConnection,false)});peer.on('error',err=>{netStatus('Сетевой сбой: '+(err?.type||'ошибка'));resetPeer()});}catch(e){netStatus('Не удалось запустить сетевое соединение');resetPeer()}});
 window.addEventListener('republic:start',e=>{Object.assign(state,e.detail);state.month=1;state.stability=72;state.budget=284.7;state.people=8.7;state.campaigns=0;state.lawCount=0;render();log(state.name+' создана. '+months[0]+' '+state.year+'. Начинается первый месяц правительства.');save()});
 $('advance')?.addEventListener('click',()=>sendHostAction({type:'advance'}));
 $('campaign')?.addEventListener('click',()=>sendHostAction({type:'campaign'}));
 $('law')?.addEventListener('click',()=>{const name=window.prompt('Название законопроекта:');if(name?.trim())sendHostAction({type:'law',name:name.trim()})});
 try{const saved=JSON.parse(localStorage.getItem('republic-save-v020')||'null');if(saved)restore(saved)}catch{}
 window.addEventListener('beforeunload',()=>{try{peer?.destroy()}catch{}});
 render();
})();
