(()=>{
const $=s=>document.querySelector(s),A=window.audioReminder,KEY='legui.v1';
const COLORS=['#FF7900','#FF3D2E','#E8438A','#8B5CF6','#3B82F6','#14B8A6','#32B889','#FFC21A'];
const CATS=['Études','Travail','Personnel','Santé','Maison','Autre'],PR=['Basse','Normale','Haute','Urgente'];
const REMS=[[0,'À l’heure prévue'],[5,'5 minutes avant'],[10,'10 minutes avant'],[15,'15 minutes avant'],[30,'30 minutes avant'],[60,'1 heure avant'],[-1,'Aucun rappel']];
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10),T=()=>iso(new Date());
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let db;try{db=JSON.parse(localStorage.getItem(KEY))}catch{}
db=Object.assign({tasks:[],sessions:[],set:{dark:false,vol:1,snooze:5}},db||{});db.set=Object.assign({dark:false,vol:1,snooze:5},db.set);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch{toast('Stockage local plein ou indisponible')}};
let view='today',cal={d:T(),mode:'month'},showDone=false,draft=null,step=0,detail=null,fo={len:1500,left:1500,run:false,t:null,start:0,recap:null};
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,3000)}
const byId=id=>db.tasks.find(t=>t.id===id);
const prio=t=>PR.indexOf(t.priority||'Normale');
const sortT=(a,b)=>prio(b)-prio(a)||(a.time||'99').localeCompare(b.time||'99');
const fmt=d=>new Date(d+'T00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const remindAt=t=>t.snoozeUntil||(t.time&&t.remind>=0?new Date(t.date+'T'+t.time).getTime()-t.remind*6e4:null);
/* ---------- rendu ---------- */
const card=t=>`<div class="task glass ${t.done?'d':''}" style="--c:${t.color}"><button class="chk" data-a="tog" data-id="${t.id}" aria-label="Terminer">✓</button><div data-a="open" data-id="${t.id}"><b>${esc(t.title)}</b><br><small>${t.time||'Sans heure'} · ${esc(t.cat)}${t.remind>=0&&t.time?' · 🔔':''}</small></div></div>`;
function today(){const l=db.tasks.filter(t=>t.date===T()),d=l.filter(t=>t.done),o=l.filter(t=>!t.done).sort(sortT),p=l.length?Math.round(d.length/l.length*100):0,h=new Date().getHours();
return `<h2>${h<18?'Bonjour !':'Bonsoir !'}</h2><p>${fmt(T())}</p>
<section class="glass"><b>${d.length}</b> terminée(s) sur ${l.length} aujourd’hui<div class="bar"><i style="width:${p}%"></i></div><small>${o.length} restante(s) · ${p}%</small></section>
${o.length?'<h3>Mes priorités</h3>'+o.slice(0,3).map(card).join(''):'<p>Rien de prévu. Appuyez sur + pour ajouter une tâche.</p>'}
${o.length>3?'<h3>Aujourd’hui</h3>'+o.slice(3).map(card).join(''):''}
${d.length?`<h3 data-a="done" style="cursor:pointer">${showDone?'▾':'▸'} Terminées (${d.length})</h3>${showDone?d.map(card).join(''):''}`:''}`}
function calV(){const sel=new Date(cal.d+'T00:00'),m=cal.mode,has=x=>db.tasks.some(t=>t.date===x&&!t.done);let g='',title;
if(m==='month'){const f=new Date(sel.getFullYear(),sel.getMonth(),1),s=(f.getDay()+6)%7;title=sel.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
for(let i=0;i<42;i++){const d=new Date(f.getFullYear(),f.getMonth(),1-s+i),x=iso(d);g+=`<button data-a="day" data-d="${x}" class="${x===cal.d?'sel':''} ${x===T()?'tdy':''} ${has(x)?'dot':''} ${d.getMonth()!==f.getMonth()?'mut':''}">${d.getDate()}</button>`}}
else if(m==='week'){const s=(sel.getDay()+6)%7;title='Semaine du '+new Date(sel.getFullYear(),sel.getMonth(),sel.getDate()-s).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
for(let i=0;i<7;i++){const d=new Date(sel.getFullYear(),sel.getMonth(),sel.getDate()-s+i),x=iso(d);g+=`<button data-a="day" data-d="${x}" class="${x===cal.d?'sel':''} ${x===T()?'tdy':''} ${has(x)?'dot':''}">${'LMMJVSD'[i]}<br>${d.getDate()}</button>`}}
else title=fmt(cal.d);
const l=db.tasks.filter(t=>t.date===cal.d).sort(sortT);
return `<h2>Calendrier</h2><div class="row seg">${['day:Jour','week:Semaine','month:Mois'].map(x=>{const[k,n]=x.split(':');return`<button data-a="mode" data-m="${k}" class="${m===k?'on':''}">${n}</button>`}).join('')}</div>
<section class="glass"><div class="row"><button data-a="nav" data-n="-1" aria-label="Précédent">‹</button><b style="text-align:center;flex:3;text-transform:capitalize">${title}</b><button data-a="nav" data-n="1" aria-label="Suivant">›</button></div>
${g?`<div class="grid" style="${m==='week'?'grid-template-columns:repeat(7,1fr)':''}">${m==='month'?'LMMJVSD'.split('').map(x=>`<small>${x}</small>`).join(''):''}${g}</div>`:''}</section>
<h3>${fmt(cal.d)}</h3>${l.map(card).join('')||'<p>Aucune tâche ce jour-là.</p>'}`}
function stats(){const dn=db.tasks.filter(t=>t.done),tot=db.tasks.length,rate=tot?Math.round(dn.length/tot*100):0,days=new Set(dn.map(t=>t.doneOn));
const wk=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const x=iso(d);return[d.toLocaleDateString('fr-FR',{weekday:'narrow'}),dn.filter(t=>t.doneOn===x).length]});
let st=0;const c=new Date();if(!days.has(iso(c)))c.setDate(c.getDate()-1);while(days.has(iso(c))){st++;c.setDate(c.getDate()-1)}
const mx=Math.max(1,...wk.map(w=>w[1])),mins=Math.round(db.sessions.reduce((a,s)=>a+s.min,0));
return `<h2>Statistiques</h2><section class="glass"><div class="big">${rate}%</div><p style="text-align:center">${dn.length} tâche(s) terminée(s) sur ${tot}</p></section>
<section class="glass"><b>7 derniers jours</b><div class="bars" style="margin-top:12px">${wk.map(w=>`<div><i style="height:${w[1]/mx*80}px"></i>${w[0]}</div>`).join('')}</div></section>
<div class="row"><section class="glass"><small>Série actuelle</small><br><b>${st} jour(s)</b></section><section class="glass"><small>Sessions Focus</small><br><b>${db.sessions.length} · ${mins} min</b></section></div>`}
const mmss=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function focusV(){return `<h2>Focus</h2><section class="glass"><div class="big" id="fclock">${mmss(fo.left)}</div>
<div class="row seg">${[15,25,45].map(m=>`<button data-a="flen" data-m="${m}" class="${fo.len===m*60?'on':''}">${m} min</button>`).join('')}</div>
<div class="row">${fo.run?'<button class="btn" data-a="fpause">Pause</button>':`<button class="btn" data-a="fplay">${fo.left<fo.len?'Reprendre':'Démarrer'}</button>`}<button class="btn g" data-a="freset">Réinitialiser</button></div></section>
${fo.recap?`<section class="glass"><b>Session terminée</b><p>${fo.recap} min de concentration enregistrées.</p></section>`:''}`}
function settings(){const s=db.set,n='Notification' in window?Notification.permission:'indisponible';
return `<h2>Paramètres</h2><section class="glass"><b>Apparence</b><div class="row seg"><button data-a="theme" data-v="0" class="${!s.dark?'on':''}">Clair</button><button data-a="theme" data-v="1" class="${s.dark?'on':''}">Sombre</button></div></section>
<section class="glass"><b>Sons</b><label>Volume <input type="range" min="0" max="1" step=".05" value="${s.vol}" data-a="vol"></label><button class="btn g" data-a="test">Tester la sonnerie</button></section>
<section class="glass"><b>Rappels</b><label>Report par défaut<select data-a="snz">${[5,10,15,30].map(m=>`<option ${s.snooze===m?'selected':''} value="${m}">${m} minutes</option>`).join('')}</select></label>
<p>Notifications : ${n}</p><button class="btn g" data-a="perm">Activer les notifications</button><p><small>Application fermée, le navigateur n’autorise qu’une notification. La sonnerie en boucle exige l’application ouverte.</small></p></section>
<section class="glass"><b>Sauvegarde</b><div class="row"><button class="btn g" data-a="exp">Exporter</button><button class="btn g" data-a="imp">Restaurer</button></div><input type="file" id="file" accept=".json" hidden></section>
<section class="glass"><b>À propos</b><p>LEGUI 1.0 · ${navigator.onLine?'En ligne':'Hors ligne'} · données stockées sur cet appareil</p></section>`}
function render(){const v={today,cal:calV,stats,focus:focusV,settings}[view]();$('#app').innerHTML=v;$('#fab').hidden=!!draft||!!detail;
$('#tabs').innerHTML=[['today','☀️','Aujourd’hui'],['cal','📅','Calendrier'],['stats','📊','Stats'],['focus','⏱️','Focus'],['settings','⚙️','Réglages']].map(([k,i,n])=>`<button data-a="tab" data-v="${k}" class="${view===k?'on':''}"><span>${i}</span>${n}</button>`).join('');
document.documentElement.classList.toggle('dark',!!db.set.dark);sheet()}
/* ---------- feuille : création / détail ---------- */
const newDraft=d=>({id:null,title:'',desc:'',date:d||T(),time:'',priority:'Normale',cat:'Études',color:COLORS[0],subs:[],repeat:'Aucune',remind:0,...{}});
function sheet(){const s=$('#sheet');if(!draft&&!detail){s.hidden=true;return}s.hidden=false;let h;
if(draft){const d=draft;h=`<div role="dialog"><div class="row"><b style="flex:3">${d.id?'Modifier':'Nouvelle'} tâche · ${step+1}/3</b><button data-a="close">✕</button></div>`+[
`<div class="row seg"><button data-a="dt" data-v="${T()}" class="${d.date===T()?'on':''}">Aujourd’hui</button><button class="${d.date!==T()?'on':''}" data-a="dt" data-v="">Date…</button></div><input type="date" data-k="date" value="${d.date}"><input data-k="title" placeholder="Titre" value="${esc(d.title)}"><textarea data-k="desc" rows="3" placeholder="Description (optionnelle)">${esc(d.desc)}</textarea>`,
`<label>Heure <input type="time" data-k="time" value="${d.time}"></label><div class="row seg">${PR.map(p=>`<button data-a="pr" data-v="${p}" class="${d.priority===p?'on':''}">${p}</button>`).join('')}</div>
<select data-k="cat">${CATS.map(c=>`<option ${d.cat===c?'selected':''}>${c}</option>`).join('')}</select><select data-k="repeat">${['Aucune','Chaque jour','Chaque semaine'].map(c=>`<option ${d.repeat===c?'selected':''}>${c}</option>`).join('')}</select>
<div class="sw">${COLORS.map(c=>`<button style="--c:${c}" class="${d.color===c?'on':''}" data-a="col" data-v="${c}" aria-label="Couleur"></button>`).join('')}</div>
<b>Sous-tâches</b>${d.subs.map((x,i)=>`<div class="row"><span style="flex:4">${esc(x.t)}</span><button data-a="rmsub" data-i="${i}">🗑</button></div>`).join('')}<div class="row"><input id="sub" placeholder="Ajouter une sous-tâche" style="flex:4"><button class="btn g" data-a="addsub">+</button></div>`,
`<p>Quand être rappelé ?</p>${d.time?'':'<p><small>Choisissez une heure à l’étape précédente pour activer le rappel.</small></p>'}<select data-k="remind" ${d.time?'':'disabled'}>${REMS.map(r=>`<option value="${r[0]}" ${+d.remind===r[0]?'selected':''}>${r[1]}</option>`).join('')}</select><p><small>La sonnerie ringing.mp3 joue en boucle jusqu’à « Arrêter », puis end_ringing.mp3 une fois.</small></p>`][step]+
`<div class="row">${step?'<button class="btn g" data-a="back">Retour</button>':'<button class="btn g" data-a="close">Annuler</button>'}<button class="btn" data-a="next">${step<2?'Suivant':'Enregistrer'}</button></div></div>`}
else{const t=byId(detail);if(!t){detail=null;return sheet()}
h=`<div><div class="row"><b style="flex:4;font-size:20px">${esc(t.title)}</b><button data-a="close">✕</button></div><p>${esc(t.cat)} · ${fmt(t.date)} · ${t.time||'Sans heure'} · ${t.priority}</p>${t.desc?`<p>${esc(t.desc)}</p>`:''}
<p>🔔 ${t.time&&t.remind>=0?REMS.find(r=>r[0]===+t.remind)[1]:'Pas de rappel'} · 🔁 ${t.repeat}</p>${t.subs.length?`<h3>Sous-tâches (${t.subs.filter(x=>x.d).length}/${t.subs.length})</h3>`+t.subs.map((x,i)=>`<div class="task glass ${x.d?'d':''}"><button class="chk" data-a="subtog" data-i="${i}">✓</button><b>${esc(x.t)}</b></div>`).join(''):''}
<div class="row"><button class="btn g" data-a="edit">Modifier</button><button class="btn g" data-a="push">Reporter</button></div><div class="row"><button class="btn ok" data-a="tog" data-id="${t.id}">${t.done?'Rouvrir':'Terminer'}</button><button class="btn red" data-a="del">Supprimer</button></div></div>`}
const keep=s.firstChild&&s.firstChild.scrollTop;s.innerHTML=h;}
/* ---------- actions ---------- */
function commit(){const d=draft;if(!d.title.trim()){toast('Ajoutez un titre');step=0;return false}
if(!d.date)d.date=T();if(!d.time)d.remind=-1;const o=d.id&&byId(d.id);
if(o)Object.assign(o,{...d,title:d.title.trim(),fired:false,snoozeUntil:null});else db.tasks.push({...d,title:d.title.trim(),id:'t'+Date.now(),done:false,fired:false});
save();draft=null;return true}
function toggle(id){const t=byId(id);if(!t)return;t.done=!t.done;t.doneOn=t.done?T():null;
if(t.done){A.cancel(id);if(t.repeat!=='Aucune'&&!t.next){const n=new Date(t.date+'T00:00');n.setDate(n.getDate()+(t.repeat==='Chaque jour'?1:7));t.next=true;db.tasks.push({...t,id:'t'+Date.now(),date:iso(n),done:false,doneOn:null,fired:false,next:false,snoozeUntil:null,subs:t.subs.map(x=>({...x,d:false}))})}}save()}
const act={
tab(e){view=e.v;draft=detail=null},day(e){cal.d=e.d},mode(e){cal.mode=e.m},done(){showDone=!showDone},
nav(e){const d=new Date(cal.d+'T00:00'),n=+e.n;if(cal.mode==='month')d.setMonth(d.getMonth()+n,1);else d.setDate(d.getDate()+n*(cal.mode==='week'?7:1));cal.d=iso(d)},
tog(e){toggle(e.id)},open(e){detail=e.id},close(){draft=detail=null},
edit(){draft=JSON.parse(JSON.stringify(byId(detail)));detail=null;step=0},
del(){if(confirm('Supprimer cette tâche ?')){A.cancel(detail);db.tasks=db.tasks.filter(t=>t.id!==detail);save();detail=null}},
push(){const t=byId(detail);t.snoozeUntil=Date.now()+db.set.snooze*6e4;if(!t.time)t.time=new Date().toTimeString().slice(0,5);if(t.remind<0)t.remind=0;t.fired=false;save();toast('Reporté de '+db.set.snooze+' min')},
subtog(e){const s=byId(detail).subs[+e.i];s.d=!s.d;save()},
dt(e){draft.date=e.v||T()},pr(e){draft.priority=e.v},col(e){draft.color=e.v},
addsub(){const i=$('#sub');if(i.value.trim()){draft.subs.push({t:i.value.trim(),d:false})}},rmsub(e){draft.subs.splice(+e.i,1)},
back(){step--},next(){if(step<2){if(!draft.title.trim()){toast('Ajoutez un titre');return}step++}else if(!commit())return},
theme(e){db.set.dark=e.v==='1';save()},test(){A.start({id:'test',title:'Test de la sonnerie'})},
perm(){'Notification' in window?Notification.requestPermission().then(render):toast('Notifications indisponibles')},
exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'}));a.download='legui-sauvegarde.json';a.click()},
imp(){$('#file').click()},
flen(e){if(!fo.run){fo.len=fo.left=+e.m*60}},
fplay(){fo.run=true;fo.start=Date.now();fo.base=fo.left;fo.t=setInterval(()=>{fo.left=Math.max(0,fo.base-Math.round((Date.now()-fo.start)/1000));const c=$('#fclock');if(c)c.textContent=mmss(fo.left);if(!fo.left)fend()},250)},
fpause(){clearInterval(fo.t);fo.run=false},freset(){clearInterval(fo.t);fo.run=false;fo.left=fo.len;fo.recap=null}};
function fend(){clearInterval(fo.t);fo.run=false;fo.recap=Math.round(fo.len/60);db.sessions.push({day:T(),min:fo.recap});save();fo.left=fo.len;A.start({id:'focus',title:'Session Focus terminée'});render()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.tagName==='INPUT'||b.tagName==='SELECT')return;const f=act[b.dataset.a];if(f){f(b.dataset);render()}});
document.addEventListener('input',e=>{const k=e.target.dataset.k;if(k&&draft)draft[k]=e.target.value;if(e.target.dataset.a==='vol'){db.set.vol=+e.target.value;A.setVolume(db.set.vol);save()}});
document.addEventListener('change',e=>{const k=e.target.dataset.k;if(k==='time'||k==='date'&&0){render()}if(e.target.dataset.a==='snz'){db.set.snooze=+e.target.value;save()}
if(e.target.id==='file'&&e.target.files[0])e.target.files[0].text().then(x=>{try{const j=JSON.parse(x);if(!Array.isArray(j.tasks))throw 0;db=Object.assign(db,j);save();toast('Sauvegarde restaurée');render()}catch{toast('Fichier invalide')}})});
$('#fab').onclick=()=>{draft=newDraft(view==='cal'?cal.d:T());step=0;render()};
/* ---------- rappel : panneau + planificateur ---------- */
A.setVolume(db.set.vol);
A.subscribe(a=>{const r=$('#ring');r.hidden=a.state==='idle';if(a.state==='idle')return render();
r.innerHTML=`<div><div class="pulse">🔔</div><h2>${esc(a.task?a.task.title:'')}</h2><p>${a.state==='ringing'?(a.error||'Rappel en cours'):'Fin du rappel…'}</p>${a.state==='ringing'?`<div class="row"><button class="btn" style="min-height:56px" data-r="stop">Arrêter</button>${a.task&&byId(a.task.id)?`<button class="btn g" data-r="snz">Reporter ${db.set.snooze} min</button>`:''}</div>`:''}</div>`});
$('#ring').addEventListener('click',e=>{const k=e.target.closest('[data-r]');if(!k){A.retry();return}
if(k.dataset.r==='stop'){const t=A.task&&byId(A.task.id);A.stop();if(t&&!t.snoozeUntil)save()}
else{const t=A.snooze();const x=t&&byId(t.id);if(x){x.snoozeUntil=Date.now()+db.set.snooze*6e4;x.fired=false;save();toast('Reporté de '+db.set.snooze+' min')}}});
function tick(){if(A.state!=='idle')return;const n=Date.now();
for(const t of db.tasks){if(t.done||t.fired)continue;const r=remindAt(t);if(r==null||n<r||n-r>6*36e5)continue;
t.fired=true;t.snoozeUntil=null;save();
if(document.hidden&&'Notification' in window&&Notification.permission==='granted')navigator.serviceWorker.ready.then(g=>g.showNotification('LEGUI · '+t.title,{body:t.desc||'C’est l’heure !',data:{id:t.id},tag:t.id,icon:'assets/icon-192.png'}));
A.start({id:t.id,title:t.title});break}}
['pointerdown','touchend','keydown'].forEach(ev=>document.addEventListener(ev,()=>A.unlock(),{once:true,passive:true}));
setInterval(tick,1000);document.addEventListener('visibilitychange',tick);
/* ---------- démarrage ---------- */
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(()=>{});navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.open){detail=e.data.open;render()}})}
const q=new URLSearchParams(location.search).get('task');if(q&&byId(q))detail=q;
render();setTimeout(()=>$('#splash').classList.add('off'),1400);
window.addEventListener('pagehide',()=>A.destroy());
})();
