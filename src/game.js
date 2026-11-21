// Republic Alpha 0.19 — lightweight monthly political simulation.
(() => {
 const $=id=>document.getElementById(id);
 const state={name:'Республика',year:2026,month:1,parties:8,ai:6,difficulty:'Средняя',campaigns:0,stability:72,budget:284.7,people:8.7,lawCount:0,support:[32,28,20,12,8],partyNames:['Развитие','Социал-демократы','Национальный союз','Зелёные','Гражданская партия']};
 const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
 const chronicle=msg=>{const el=$('chronicle');if(el)el.textContent=msg};
 const toast=msg=>{const el=$('toast');if(!el)return;el.textContent=msg;el.style.display='block';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.display='none',2400)};
 const render=()=>{const year=$('yearTop');if(year)year.textContent=state.year;const stability=$('stabilityTop');if(stability)stability.textContent=Math.round(state.stability)+'%';const budget=$('budgetTop');if(budget)budget.textContent='₽'+state.budget.toFixed(1)+' млрд';const p=$('populationTop');if(p)p.textContent=state.people.toFixed(2)+' млн';};
 window.addEventListener('republic:start',e=>{Object.assign(state,e.detail);state.month=1;state.stability=72;state.budget=284.7;state.people=8.7;state.campaigns=0;state.lawCount=0;render();chronicle(state.name+' создана. '+monthNames[state.month-1]+' '+state.year+'. Первый месяц правительства начинается.')});
 $('advance')?.addEventListener('click',()=>{state.month++;if(state.month>12){state.month=1;state.year++}const drift=(Math.random()-.48)*1.8;state.stability=Math.max(15,Math.min(95,state.stability+drift));state.budget=Math.max(0,state.budget+(.15+(Math.random()-.45)*1.1));render();chronicle('📅 '+monthNames[state.month-1]+' '+state.year+' · экономика и общественное настроение изменились.');toast('Наступил '+monthNames[state.month-1]+' '+state.year)});
 $('campaign')?.addEventListener('click',()=>{state.campaigns++;const idx=(state.campaigns-1)%Math.min(state.parties,state.support.length);state.support[idx]=Math.min(60,state.support[idx]+1.2);state.stability=Math.max(15,state.stability-.15);render();chronicle('Кампания партии «'+state.partyNames[idx]+'»: поддержка +1,2 п.п.');toast('Кампания проведена: '+state.partyNames[idx]+' +1,2%')});
 $('law')?.addEventListener('click',()=>{const text=window.prompt('Название законопроекта:');if(!text||!text.trim())return;state.lawCount++;const yes=Math.floor(240+Math.random()*120);const result=yes>=226?'принят':'отклонён';chronicle('Законопроект «'+text.trim()+'» '+result+'. Голосов за: '+yes+'/450.');toast('Закон '+result+' ('+yes+'/450)')});
 render();
})();
