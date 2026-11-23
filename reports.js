(()=>{
  const $=s=>document.querySelector(s);
  let period='week',offset=0;
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const dateFromIso=s=>new Date(s+'T12:00:00');
  const monday=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-(x.getDay()+6)%7);return x};
  const inRange=(date,start,end)=>date>=start&&date<=end;
  const formatDate=(date,options)=>new Intl.DateTimeFormat('ru-RU',options).format(date);
  const metric=(label,value,note)=>{const box=document.createElement('div');box.className='report-metric';const title=document.createElement('span');title.textContent=label;const strong=document.createElement('strong');strong.textContent=value;const small=document.createElement('small');small.textContent=note;box.append(title,strong,small);return box};
  function range(){const now=new Date();let start,end;if(period==='week'){start=monday(now);start.setDate(start.getDate()+offset*7);end=new Date(start);end.setDate(start.getDate()+6)}else{start=new Date(now.getFullYear(),now.getMonth()+offset,1);end=new Date(start.getFullYear(),start.getMonth()+1,0)}return {start,end,startIso:iso(start),endIso:iso(end)}}
  function currency(profile){const code=['RUB','USD','EUR','KZT','GBP','PLN'].includes(profile?.currency)?profile.currency:'RUB';return n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:code,maximumFractionDigits:0}).format(n)}
  function render(snapshot){
    if(!snapshot||!Array.isArray(snapshot.profiles))return;
    const profile=snapshot.profiles.find(p=>p.id===snapshot.activeProfileId)||snapshot.profiles[0],data=profile?.state||{},tasks=(data.tasks||[]).filter(t=>t.date),workouts=(data.workouts||[]).filter(w=>w.date),transactions=(data.transactions||[]).filter(t=>t.date),r=range();
    const selectedTasks=tasks.filter(t=>inRange(t.date,r.startIso,r.endIso)),done=selectedTasks.filter(t=>t.completed),selectedWorkouts=workouts.filter(w=>inRange(w.date,r.startIso,r.endIso)),selectedTransactions=transactions.filter(t=>inRange(t.date,r.startIso,r.endIso));
    const plannedMinutes=selectedTasks.reduce((a,t)=>a+(Number(t.duration)||0),0),doneMinutes=done.reduce((a,t)=>a+(Number(t.duration)||0),0),workoutMinutes=selectedWorkouts.reduce((a,w)=>a+(Number(w.duration)||0),0),income=selectedTransactions.filter(t=>t.type==='income').reduce((a,t)=>a+(Number(t.amount)||0),0),expense=selectedTransactions.filter(t=>t.type==='expense').reduce((a,t)=>a+(Number(t.amount)||0),0),rate=selectedTasks.length?Math.round(done.length/selectedTasks.length*100):0,money=currency(profile);
    const label=period==='week'?formatDate(r.start,{day:'numeric',month:'short'})+' — '+formatDate(r.end,{day:'numeric',month:'short'}):formatDate(r.start,{month:'long',year:'numeric'});
    $('#reportPeriodLabel').textContent=label;
    const metrics=$('#reportMetrics');metrics.replaceChildren(metric('Задачи',done.length+' / '+selectedTasks.length,selectedTasks.length?rate+'% выполнено':'задач пока нет'),metric('Выполненные часы',formatDuration(doneMinutes),'из '+formatDuration(plannedMinutes)+' запланировано'),metric('Тренировки',String(selectedWorkouts.length),workoutMinutes+' мин за период'),metric('Финансовый итог',money(income-expense),'доходы '+money(income)+' · расходы '+money(expense)));
    renderChart(r,selectedTasks);
    $('#reportFoot').textContent=selectedTasks.length?'Доля выполнения считается по задачам, отмеченным как выполненные. Время учитывает длительность этих задач.':'Отмечай выполненные задачи в их карточках — они попадут в следующий отчёт.';
  }
  function formatDuration(minutes){const m=Math.max(0,Math.round(minutes||0));if(m<60)return m+' мин';const h=Math.floor(m/60),rest=m%60;return h+' ч'+(rest?' '+rest+' мин':'')}
  function renderChart(r,tasks){
    const chart=$('#reportChart');chart.replaceChildren();const groups=[];
    if(period==='week'){
      const weekdays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
      for(let i=0;i<7;i++){const date=new Date(r.start);date.setDate(date.getDate()+i);const key=iso(date);groups.push({label:weekdays[i]+' '+date.getDate(),tasks:tasks.filter(t=>t.date===key)})}
    }else{
      let cursor=new Date(r.start),index=1;
      while(cursor<=r.end){const end=new Date(cursor);end.setDate(end.getDate()+6);if(end>r.end)end.setTime(r.end.getTime());const a=iso(cursor),b=iso(end);groups.push({label:'Неделя '+index+' · '+cursor.getDate()+'–'+end.getDate(),tasks:tasks.filter(t=>t.date>=a&&t.date<=b)});cursor=new Date(end);cursor.setDate(cursor.getDate()+1);index++}
    }
    if(!tasks.length){const empty=document.createElement('div');empty.className='report-empty';empty.textContent='В выбранном периоде задач нет.';chart.append(empty);return}
    for(const group of groups){const row=document.createElement('div');row.className='report-row';const name=document.createElement('span');name.className='report-row-label';name.textContent=group.label;const track=document.createElement('div');track.className='report-track';const bar=document.createElement('i');bar.style.width=(group.tasks.length?Math.round(group.tasks.filter(t=>t.completed).length/group.tasks.length*100):0)+'%';track.append(bar);const count=document.createElement('em');count.textContent=group.tasks.filter(t=>t.completed).length+'/'+group.tasks.length;row.append(name,track,count);chart.append(row)}
  }
  function update(){render(window.NEXUS_API?.getSnapshot())}
  $('#reportPeriod').addEventListener('change',e=>{period=e.target.value;offset=0;update()});
  $('#reportPrev').addEventListener('click',()=>{offset--;update()});
  $('#reportNext').addEventListener('click',()=>{offset++;update()});
  $('#reportCurrent').addEventListener('click',()=>{offset=0;update()});
  window.NEXUS_REPORTS={render};
})();

