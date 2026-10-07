/* Ημερολόγιο — η εφαρμογή γύρω από το κοινό κομμάτι imerologio.js.
   © 2026 Ανδρέας Μ. Γλεντζάκης (Andreas M. Glentzakis). Με την επιφύλαξη παντός δικαιώματος. All rights reserved.
   Απαγορεύεται η αντιγραφή, τροποποίηση και διάθεση, εν όλω ή εν μέρει, χωρίς προηγούμενη γραπτή άδεια του κατόχου. */
'use strict';
const APP_VERSION=document.querySelector('meta[name="app-version"]').content;
const STORE='imerologio-data';
const BACKUP_SUB='Imerologio';

/* ---------- κατάσταση ---------- */
const S={user:{id:'me',name:'Εγώ'},meta:{org:''},data:null,curHash:null};
function loadData(){let d=null;try{d=JSON.parse(localStorage.getItem(STORE));}catch(e){}
  if(!d||typeof d!=='object')d={};
  d.students=Array.isArray(d.students)?d.students:[];
  d.settings=Object.assign({prof:null,lex:{},myName:''},d.settings||{});
  d.meta=Object.assign({created:new Date().toISOString(),changes:0,lastBackup:0},d.meta||{});
  return d;}
function applyIdentity(){const B=biz();S.user.name=S.data.settings.myName||'Εγώ';S.meta.org=B.name||'';ROLES=profRoles();
  if(!ROLES.some(r=>r[0]===B.meRole))B.meRole=(ROLES.find(r=>r[2])||ROLES[0])[0];}
function save(){S.data.meta.changes=(S.data.meta.changes||0)+1;try{localStorage.setItem(STORE,JSON.stringify(S.data));}catch(e){toast('Δεν αποθηκεύτηκε — η μνήμη της συσκευής είναι γεμάτη.','bad');}applyIdentity();}

/* ---------- πρόσωπα (στο κοινό κομμάτι λέγονται «students» για συμβατότητα) ---------- */
function getStudent(id){return S.data.students.find(x=>x.id===id)||null;}
function myStudents(){return S.data.students.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','el'));}
const stuName=s=>s?(s.name||'—'):'—';
const initial=n=>((n||'?').trim()[0]||'?').toUpperCase();
function IM_NEWPERSON(name,c){c=c||{};const p={id:uid(),name:name.trim(),avatar:initial(name),phone:c.phone||'',email:c.email||'',contacts:(c.phone||c.email)?[{name:name.trim(),phone:c.phone||'',email:c.email||''}]:[],created:new Date().toISOString()};S.data.students.push(p);save();return p.id;}

/* ---------- επαφές του κινητού (Chrome σε Android) ---------- */
const IM_CONTACTS_OK=()=>!!(navigator.contacts&&window.ContactsManager);
async function IM_PICKCONTACTS(multi){try{const L=await navigator.contacts.select(['name','tel','email'],{multiple:!!multi});
  return(L||[]).map(x=>({name:((x.name||[])[0]||(x.tel||[])[0]||'').trim(),phone:((x.tel||[])[0]||'').replace(/\s+/g,' ').trim(),email:((x.email||[])[0]||'').trim()})).filter(x=>x.name);}
  catch(e){if(e&&e.name!=='AbortError')toast('Δεν ήταν δυνατή η πρόσβαση στις επαφές.','bad');return[];}}

/* ---------- επάγγελμα και λέξεις ---------- */
const customProfs=()=>(S.data&&S.data.settings.customProfs)||[];
const groupList=g=>g.list.concat(customProfs().filter(c=>c.group===g.g));
function findProf(id){for(const g of IM_GROUPS)for(const p of groupList(g))if(p.id===id)return{g,p};return null;}
const PROF_ICONS=['✨','💼','🧰','🔧','🔨','🪚','🎨','🖌️','✂️','💇','💅','🧖','💆','🩺','🦷','🧠','🐾','🐶','📚','🎓','🎹','🎸','🏋️','🧘','⚽','🚗','🚚','🚕','🏠','🔑','⚖️','🧮','📐','💡','🌿','🌸','🧽','🍽️','☕','🍰','📷','🎬','💻','📱','🧵','👗','👶','👵','🙏','🛠️'];
function profAddDialog(groupName,old){return new Promise(res=>{const g=IM_GROUPS.find(x=>x.g===groupName)||IM_GROUPS[IM_GROUPS.length-1];let icon=old?old.i:'✨';let done=false;
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">${old?'Αλλαγή επαγγέλματος':'Νέο επάγγελμα'}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Στην κατηγορία <b>${esc(g.g)}</b>: παίρνει τις λέξεις, τη διάρκεια και το χρώμα της κατηγορίας.</p>
   <form id="pa"><div class="field"><label class="f" for="pa-n">Όνομα επαγγέλματος</label><input class="in" id="pa-n" name="n" required value="${esc(old?old.n:'')}" placeholder="π.χ. Μασέρ, Tattoo artist, Λογοθεραπευτής"></div>
   <label class="f">Εικονίδιο</label><div class="pico">${PROF_ICONS.map(x=>`<button type="button" data-pi="${x}" class="${x===icon?'on':''}">${x}</button>`).join('')}</div>
   <div class="field" style="margin-top:12px"><label class="f" for="pa-t">Συνηθισμένες εργασίες <span class="tiny muted">· προαιρετικό, μία ανά γραμμή</span></label><textarea class="in" id="pa-t" name="t" style="min-height:80px" placeholder="π.χ.&#10;Μασάζ πλάτης&#10;Αθλητικό μασάζ">${esc(old?(old.t||'').split('|').join('\n'):'')}</textarea></div>
   <div class="row" style="justify-content:space-between">${old?`<button type="button" class="btn danger" id="pa-del">${ic('trash',16)}</button>`:'<span></span>'}<span class="row"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} ${old?'Αποθήκευση':'Προσθήκη'}</button></span></div></form>`,{onClose:()=>{if(!done)res(null);}});
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-pi]');if(b){icon=b.dataset.pi;$$('[data-pi]',md.el).forEach(x=>x.classList.toggle('on',x===b));}});
  $('#pa',md.el).onsubmit=e=>{e.preventDefault();const o=fd(e.target);const n=o.n.trim();if(!n)return;const t=o.t.split('\n').map(x=>x.trim()).filter(Boolean).join('|');
    const L=customProfs().slice();if(old){Object.assign(L.find(x=>x.id===old.id),{n,i:icon,t});}else L.push({id:'cp_'+uid().slice(0,8),n,i:icon,t,group:g.g,custom:true});
    S.data.settings.customProfs=L;save();done=true;md.close();res(old?old.id:L[L.length-1].id);};
  const dl=$('#pa-del',md.el);if(dl)dl.onclick=async()=>{if(!await confirmDlg(`Διαγραφή του επαγγέλματος «${esc(old.n)}»;`,{ok:'Διαγραφή',danger:true}))return;S.data.settings.customProfs=customProfs().filter(x=>x.id!==old.id);if(S.data.settings.prof===old.id)S.data.settings.prof='allo';save();done=true;md.close();res('deleted');};});}
function prof(){return findProf(S.data.settings.prof)||findProf('allo');}
function profLex(){const{g,p}=prof();return Object.assign({},g.lex,p.lex||{});}
function LX(k){const L=Object.assign(profLex(),S.data.settings.lex||{});return L[k]||'';}
function profRoles(){const{g,p}=prof();const L=(p.roles||g.roles||[]).map(x=>x.slice());(S.data.settings.customRoles||[]).forEach(r=>{if(!L.some(x=>x[0]===r[0]))L.splice(Math.max(0,L.length-1),0,r.slice());});return L;}
function profDur(){const{g,p}=prof();return +S.data.settings.dur||p.dur||g.dur||60;}
const IM_DEF={kind:()=>{const{g,p}=prof();return p.kind||g.kind||'once';},dur:()=>profDur(),
  start:date=>{const c=agCfg();const t=todayISO();if((date||t)===t){const m=Math.ceil((nowMin()+15)/30)*30;if(m>=tmin(c.from)&&m<tmin(c.to))return tstr(m);}return c.from;}};
function profNotes(){return(prof().p.t||'').split('|').filter(Boolean);}

/* ---------- χρώμα: της κατηγορίας επαγγέλματος ή δικό σου ---------- */
const THEME_COLORS=[['Απαλά',['#E57399','#F48FB1','#4DB6AC','#80CBC4','#7986CB','#9FA8DA','#64B5F6','#90CAF9','#81C784','#AED581','#FFB74D','#FFD54F','#BA68C8','#CE93D8','#A1887F','#90A4AE']],
  ['Βαθιά',['#B4235F','#0F7B72','#4F46C8','#24476E','#C2501A','#2F7D3A','#17324D','#8A3FB0','#B8860B','#C0392B']]];
function hexMix(h,w,t){const n=x=>parseInt(x,16);const a=[n(h.slice(1,3)),n(h.slice(3,5)),n(h.slice(5,7))];const b=w==='w'?[255,255,255]:[0,0,0];return'#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function themeColor(){return S.data.settings.color||prof().g.color||'#B39DDB';}
function hueShift(h,deg){let r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let H=0,S2=0;if(mx!==mn){const d=mx-mn;S2=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60;}
  H=(H+deg+360)%360;const k=n=>(n+H/30)%12,a=S2*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return'#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');}
function lum(h){const f=x=>{x=parseInt(x,16)/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);};return .2126*f(h.slice(1,3))+.7152*f(h.slice(3,5))+.0722*f(h.slice(5,7));}
function softColor(c){const n=S.data.settings.colInt!=null?S.data.settings.colInt:100;if(n>=100)return c;const k=(100-n)/100;const gray=Math.round(parseInt(c.slice(1,3),16)*.3+parseInt(c.slice(3,5),16)*.59+parseInt(c.slice(5,7),16)*.11);const g='#'+[gray,gray,gray].map(v=>v.toString(16).padStart(2,'0')).join('');const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');return hexMix(mix(c,g,k*.7),'w',k*.45);}
function applyTheme(){const c=softColor(themeColor()),R=document.documentElement.style;R.setProperty('--brand',c);const light=lum(c)>.36;R.setProperty('--on-brand',light?'#15202E':'#fff');R.setProperty('--brand-txt',light?hexMix(c,'k',.45):c);const dark=matchMedia('(prefers-color-scheme: dark)').matches;const hs=hueShift;R.setProperty('--wc1',c);R.setProperty('--wc2',hs(c,40));R.setProperty('--wc3',hs(c,-50));R.setProperty('--wc-op',String((S.data.settings.wcOp!=null?S.data.settings.wcOp:60)/100));R.setProperty('--cream',dark?'':hexMix(c,'w',.95));R.setProperty('--line',dark?'':hexMix(c,'w',.78));R.setProperty('--line2',dark?'':hexMix(c,'w',.86));R.setProperty('--brand-d',hexMix(c,'k',.25));R.setProperty('--brand-soft',hexMix(c,'w',.88));R.setProperty('--brand-soft2',hexMix(c,'w',.94));
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=c;}

/* ---------- λογότυπο ---------- */
const LOGO=`<img src="icon-192.png" alt="" class="logo-img" width="100" height="100" decoding="async">`;
async function markPNG(){return null;}

/* ---------- ιστορικό: το «πίσω» κλείνει πρώτα το ανοιχτό παράθυρο ---------- */
addEventListener('popstate',async e=>{if(HSKIP){HSKIP--;e.stopImmediatePropagation();if(!HSKIP&&NAVQ){const h=NAVQ;NAVQ=null;location.hash=h;}return;}
  const top=topModal();if(!top||!top.pushed)return;e.stopImmediatePropagation();
  if(top.dirty){try{history.pushState({lm:Date.now()},'');}catch(x){}const ok=await confirmDlg(DIRTY_Q,{ok:'Κλείσιμο χωρίς αποθήκευση',danger:true});if(ok)top.close();return;}
  top.close(true);},true);

// Esc κλείνει το πάνω παράθυρο (με τον ίδιο έλεγχο για μη αποθηκευμένες αλλαγές)
addEventListener('keydown',e=>{if(e.key!=='Escape')return;const t=topModal();if(t&&S.data.settings.prof)t.ov.dispatchEvent(new MouseEvent('click',{bubbles:true}));});

/* ---------- πλοήγηση ---------- */
function parseRoute(){const h=location.hash.replace(/^#\/?/,'');const[p,q]=h.split('?');const parts=p.split('/').filter(Boolean);return{name:parts[0]||'today',id:parts[1]||null,q:Object.fromEntries(new URLSearchParams(q||''))};}
function render(){document.body&&document.body.classList.toggle('hidenames',!!(S.data&&S.data.settings.hideNames));
  applyTheme();if(!S.data.settings.prof){shellHTML('today');M().innerHTML='';return firstRun();}
  window.AGPOS=null;if(/^#\/agenda/.test(S.curHash||'')&&/^#\/agenda/.test(location.hash)&&typeof agPosSave==='function')agPosSave();
  S.curHash=location.hash;
  const r=parseRoute();const sec=r.name==='person'?'people':r.name;
  shellHTML(sec);
  const V={today:viewToday,agenda:viewAgendaApp,people:viewPeople,person:viewPerson,map:viewMap,settings:viewSettingsPage}[r.name]||viewToday;
  if(!window.AGPOS)window.scrollTo(0,0);
  try{V(r);}catch(e){console.error(e);M().innerHTML=`<div class="card"><h2>Κάτι πήγε στραβά</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#/agenda">Ραντεβού</a></div>`;}
}
function shellHTML(sec){
  const nav=[['today','home','Σήμερα'],['agenda','l-calendar-clock','Ημερολόγιο'],['people','users',LX('whoPl')||'Πρόσωπα'],['map','l-map','Χάρτης'],['settings','settings','Ρυθμίσεις']];
  const title={today:'Σήμερα',agenda:'Ημερολόγιο',people:LX('whoPl'),map:'Χάρτης',settings:'Ρυθμίσεις'}[sec]||'Ημερολόγιο';
  const a=([k,i,l])=>`<a href="#/${k}" class="${sec===k?'on':''}">${ic(i,19)}<span>${esc(l)}</span></a>`;
  const fab=['today','agenda','people'].includes(sec);
  document.body.innerHTML=`<div class="wcbg" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="app"><aside class="side noprint"><a class="brand" href="#/today">${LOGO}<div><b>Ημερολόγιο</b><span>${esc(S.meta.org||prof().p.n)}</span></div></a><nav class="nav">${nav.map(a).join('')}</nav><div class="side-ver tiny muted">Έκδοση ${APP_VERSION}</div></aside>
  <div class="shell"><header class="topbar noprint"><a class="tbrand" href="#/today">${LOGO}</a><b class="tbtitle">${esc(title)}</b><span class="tbprof">${esc(S.meta.org||prof().p.n)}</span></header>${S.data.settings.demo?`<div class="demostrip noprint"><span>🧪 <b>Δοκιμαστική λειτουργία</b> — τα ραντεβού και οι ${esc(LX('whoPlL'))} είναι παραδείγματα</span><button type="button" id="demoEnd">Τέλος δοκιμής</button></div>`:''}<main class="main" id="main"></main></div>
  <nav class="bottomnav noprint">${nav.map(([k,i,l])=>`<a href="#/${k}" class="${sec===k?'on':''}"><span class="bi">${ic(i,22)}</span><span>${esc(l)}</span></a>`).join('')}</nav>
  ${fab?`<button class="fab noprint" id="fab" aria-label="${sec==='people'?'Νέος':'Νέο ραντεβού'}">${ic('plus',26)}</button>`:''}</div>`;
  document.body.classList.toggle('hidenames',!!S.data.settings.hideNames);
  const de=$('#demoEnd');if(de)de.onclick=demoClear;
  const f=$('#fab');if(f)f.onclick=()=>sec==='people'?go('person/new'):apptDialog({date:(parseRoute().q.d)||todayISO()});
}
addEventListener('hashchange',render);

/* ---------- πρώτη χρήση: επάγγελμα και όνομα ---------- */
function profPickerHTML(cur,edit){return IM_GROUPS.map(g=>`<div class="pgrp"><i style="background:${g.color}"></i>${esc(g.g)}</div><div class="ptiles">${groupList(g).map(p=>`<button type="button" data-pf="${p.id}" class="ptile ${p.id===cur?'on':''} ${p.custom?'mine':''}" style="--gc:${g.color}"><span class="pti">${p.i||'✨'}</span><span class="ptn">${esc(p.n)}</span>${p.custom&&edit?`<span class="pted" data-pedit="${p.id}" role="button" aria-label="Αλλαγή">${ic('edit',13)}</span>`:''}</button>`).join('')}<button type="button" data-padd="${esc(g.g)}" class="ptile padd" style="--gc:${g.color}"><span class="pti">${ic('plus',22)}</span><span class="ptn">Δικό μου επάγγελμα</span></button></div>`).join('');}
function firstRun(){
  const md=modal(`<div class="fr-head">${LOGO}<div><h2 style="margin:0">Καλώς ήρθες!</h2><div class="small muted">Ημερολόγιο ραντεβού για κάθε επάγγελμα</div></div></div>
   <div class="field"><label class="f" for="fr-n">Το όνομά σου</label><input class="in" id="fr-n" autocomplete="name" placeholder="π.χ. Μαρία Παπαδοπούλου"></div>
   <div class="field"><label class="f" for="fr-b">Επωνυμία επιχείρησης <span class="tiny muted">· προαιρετικό</span></label><input class="in" id="fr-b" placeholder="π.χ. Κομμωτήριο Μαρία"></div>
   <label class="f">Τι δουλειά κάνεις;</label><p class="tiny muted" style="margin:0 0 6px">Ανάλογα με το επάγγελμα αλλάζουν οι λέξεις (πελάτης, ασθενής, μαθητής…), οι ειδικότητες του προσωπικού και η συνηθισμένη διάρκεια. Αλλάζει όποτε θέλεις από τις Ρυθμίσεις.</p>
   <label class="check frdemo"><input type="checkbox" id="fr-d" checked><span>Βάλε μερικά παραδείγματα για να δω πώς δουλεύει<br><small class="tiny muted">Σβήνονται με ένα κουμπί.</small></span></label>
   <div id="fr-p">${profPickerHTML(null)}</div>`,{noHist:true,guard:false});
  md.el.parentElement.onclick=null;
  md.el.addEventListener('click',async e=>{const ad=e.target.closest('[data-padd]');if(ad){const id=await profAddDialog(ad.dataset.padd);if(id){$('#fr-p',md.el).innerHTML=profPickerHTML(id);const t=$(`[data-pf="${id}"]`,md.el);if(t)t.click();}return;}const b=e.target.closest('[data-pf]');if(!b)return;
    S.data.settings.prof=b.dataset.pf;S.data.settings.myName=$('#fr-n',md.el).value.trim();biz().name=$('#fr-b',md.el).value.trim();
    const c=agCfg();c.step=Math.min(60,profDur()>=60?60:profDur()>=30?30:15);applyIdentity();
    if($('#fr-d',md.el).checked)demoFill();
    save();md.close();go('today');render();toast('Έτοιμο! Το + κλείνει νέο ραντεβού.','ok');});
}

/* ---------- «Σήμερα»: η αρχική οθόνη ---------- */
function greet(){const h=new Date().getHours();return h<12?'Καλημέρα':h<18?'Καλό απόγευμα':'Καλησπέρα';}
function viewToday(){const t=todayISO(),tm=addDays(t,1),now=nowMin();
  const L=occ(t,t,{withCancel:true,by:''});const act=L.filter(o=>o.st!=='cancel');
  const next=act.find(o=>o.st===''&&tmin(o.e)>now);const live=next&&tmin(next.s)<=now;
  const T=occ(tm,tm,{by:''});const F=freeSlots(t).filter(x=>tmin(x)>now).slice(0,8);
  const left=act.filter(o=>o.st===''&&tmin(o.s)>now).length;const first=(S.data.settings.myName||'').split(' ')[0];
  const nst=next&&stOf(next.a.sid);const ph=nst&&(nst.phone||((nst.contacts||[])[0]||{}).phone);
  const closed=isClosed(t)?(holidayOf(t)||'Κλειστά σήμερα'):'';
  M().innerHTML=`
  ${certAlertsHTML()}
  <section class="hero"><div class="hero-in"><div class="hero-hi">${greet()}${first?', '+esc(first):''}</div>
   <div class="hero-date">${WDAYS[wdOf(t)]} ${+t.slice(8)} ${MONTHS_G[+t.slice(5,7)-1]}</div>
   <div class="hero-sum">${closed?esc(closed):act.length?`<b>${act.length}</b> ${act.length===1?'ραντεβού':'ραντεβού'} σήμερα${left?` · <b>${left}</b> ακόμα`:''}`:'Κανένα ραντεβού σήμερα'}</div></div></section>
  ${next?`<button class="nextcard ${live?'live':''}" data-ap="${next.key}"><span class="nc-time"><b>${next.s}</b><small>${next.e}</small></span><span class="nc-main"><small>${live?'Τώρα':'Επόμενο'}</small><b>${esc(stuName(nst))}</b>${next.a.note?`<span>${esc(next.a.note)}</span>`:''}${pvBadge(next,1)}</span>${ic('right',20)}</button>
    ${ph?`<div class="ncact"><a class="btn" href="tel:${telLink(ph)}">${ic('l-message-square',16)} Κλήση</a><a class="btn" href="${smsHref(ph,remText(next))}">${ic('send',16)} Υπενθύμιση</a></div>`:''}`:''}
  <section class="tsec"><div class="tsec-h"><h2>Το πρόγραμμα της ημέρας</h2><span class="row" style="gap:8px;align-items:center"><button class="eyebtn ${S.data.settings.hideNames?'off':''}" id="tEye" aria-label="${S.data.settings.hideNames?'Εμφάνιση ονομάτων':'Απόκρυψη ονομάτων'}">${ic('eye',18)}</button><a href="#/agenda?view=day&d=${t}">Ημέρα ${ic('right',14)}</a></span></div>
   ${act.length||L.length?`<div class="tlist">${L.map(o=>`<div class="trow ${o.st==='done'?'done':''} ${tmin(o.e)<=now&&o.st===''?'past':''}"><span class="tr-t">${o.s}</span>${apptCard(o,{compact:true})}</div>`).join('')}</div>`
    :`<div class="tempty">${ic('l-calendar-clock',34)}<b>Η μέρα είναι ελεύθερη</b><span>Κλείσε ραντεβού με το κουμπί + ή διάλεξε μια ελεύθερη ώρα.</span><button class="btn pri" id="tNew">${ic('plus',16)} Νέο ραντεβού</button></div>`}</section>
  ${F.length?`<section class="tsec"><div class="tsec-h"><h2>Ελεύθερες ώρες σήμερα</h2></div><div class="chips">${F.map(x=>`<button class="chipt free" data-new="${t}|${x}">${x}</button>`).join('')}</div></section>`:''}
  <section class="tsec"><div class="tsec-h"><h2>Αύριο</h2><a href="#/agenda?view=day&d=${tm}">Άνοιγμα ${ic('right',14)}</a></div>
   <div class="tmrw"><span><b>${T.length}</b> ${T.length===1?'ραντεβού':'ραντεβού'}${T.length?' — πρώτο στις '+T[0].s:''}</span>${T.length?`<button class="btn sm" id="tRem">${ic('bell',15)} Στείλε υπενθυμίσεις</button>`:''}</div></section>
  ${installCardHTML()}`;
  const n=$('#tNew');if(n)n.onclick=()=>apptDialog({date:t});
  $('#tEye').onclick=()=>{S.data.settings.hideNames=!S.data.settings.hideNames;save();render();};const r=$('#tRem');if(r)r.onclick=()=>remindDialog(tm);
  bindInstall();}

/* ---------- ημερολόγιο: τα σπάνια κουμπιά πάνε στο «Περισσότερα» ---------- */
function viewAgendaApp(r){viewAgenda(r);
  $$('#main .tl-ev:not(.tl-blk) b').forEach(b=>{if(!b.querySelector('.nm')){const t=b.textContent.trim();const sp=t.indexOf(' ');b.innerHTML=(sp>0&&sp<3?esc(t.slice(0,sp))+' ':'')+'<span class="nm">'+esc(sp>0&&sp<3?t.slice(sp+1):t)+'</span>';}});
  {const h=$('.page-head .actions');if(h){const e=document.createElement('button');e.className='eyebtn '+(S.data.settings.hideNames?'off':'');e.setAttribute('aria-label',S.data.settings.hideNames?'Εμφάνιση ονομάτων':'Απόκρυψη ονομάτων');e.title=e.getAttribute('aria-label');e.innerHTML=ic('eye',20);
    e.onclick=()=>{S.data.settings.hideNames=!S.data.settings.hideNames;save();document.body.classList.toggle('hidenames',!!S.data.settings.hideNames);e.classList.toggle('off',!!S.data.settings.hideNames);toast(S.data.settings.hideNames?'Τα ονόματα κρύφτηκαν. Πάτα ξανά το μάτι για να φανούν.':'Τα ονόματα φαίνονται.');};h.insertBefore(e,h.firstChild);}}
  if(innerWidth<=960){const nl=$('.tl-now'),sc=$('#tlScroll');if(sc&&!window.AGPOS){const tgt=nl||$('.tl-ev')||null;if(tgt)setTimeout(()=>{const y=tgt.getBoundingClientRect().top+scrollY-innerHeight*.35;scrollTo({top:Math.max(0,y)});},60);}}
  const h=$('.page-head .actions');if(!h)return;
  const more=document.createElement('button');more.className='iconbtn agmore';more.setAttribute('aria-label','Περισσότερα');more.innerHTML=ic('more',20);h.appendChild(more);
  const items=[['agBlk','l-flag','Δέσμευση (ώρες που δεν είσαι διαθέσιμος)'],['agRem','bell','Υπενθυμίσεις'],['agWait','users','Λίστα αναμονής'],['agCopyW','copy','Αντιγραφή εβδομάδας'],['agLock','clock','Ποιες ώρες φαίνονται'],['agCfg','settings','Ωράριο λειτουργίας'],['agPdf','printer','Εκτύπωση / PDF']].filter(([id])=>$('#'+id));
  more.onclick=()=>{const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">Περισσότερα</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><div class="list">${items.map(([id,i,l])=>`<button class="rw" data-go="${id}"><span class="ricon">${ic(i,17)}</span><span class="grow"><b>${l}</b></span></button>`).join('')}</div>
    <details class="legendbox"><summary class="small"><b>Τι σημαίνουν τα χρώματα</b></summary>${($('.aglegend')||{}).outerHTML||''}</details>`,{guard:false});
    md.el.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;md.close();setTimeout(()=>{const x=$('#'+b.dataset.go);if(x)x.click();},150);});};}

/* ---------- παραδείγματα για να φανεί αμέσως πώς δουλεύει ---------- */
const DEMO_PEOPLE=[
  ['Ελένη Παπαδάκη','Αλεξάνδρας 120, Αμπελόκηποι','Αμπελόκηποι',37.9905,23.7605,'Προτιμά πρωινά ραντεβού.'],
  ['Γιώργος Νικολάου','Πανόρμου 45, Αμπελόκηποι','Πανόρμου',37.9935,23.7650,'Έρχεται με το παιδί του.'],
  ['Κατερίνα Βλάχου','Λεωφόρος Κηφισίας 10, Αμπελόκηποι','Αμπελόκηποι',37.9890,23.7640,'Θέλει υπενθύμιση την προηγούμενη μέρα.'],
  ['Νίκος Αντωνίου','Κουντουριώτου 30, Γκύζη','Γκύζη',37.9985,23.7520,''],
  ['Σοφία Μιχαηλίδη','Μεσογείων 25, Ερυθρός Σταυρός','Ερυθρός Σταυρός',37.9870,23.7700,'Πληρώνει με κάρτα.'],
  ['Δημήτρης Καραλής','Παπάγου 60, Ζωγράφου','Ζωγράφου',37.9790,23.7690,''],
  ['Μαρία Ζαφειρίου','Ζαΐμη 12, Πολύγωνο','Πολύγωνο',38.0005,23.7590,'Νέα πελάτισσα — ήρθε από σύσταση.']];
const DEMO_NAMES=DEMO_PEOPLE.map(x=>x[0]);
function demoFill(){const t=todayISO(),c=agCfg(),du=profDur(),notes=profNotes();const LAT=['eleni','giorgos','katerina','nikos','sofia','dimitris','maria'];const ids=DEMO_PEOPLE.map(([n,addr,area,lat,lng,note],i)=>{const p={id:uid(),name:n,avatar:initial(n),phone:'69000000'+String(10+i),email:LAT[i]+'@example.com',notes:note,loc:{addr,area,lat,lng,home:true},color:PERS_COLORS[i%PERS_COLORS.length],contacts:[],demo:true,created:new Date().toISOString()};p.contacts=[{name:n,phone:p.phone,email:p.email}];const at=addDays(todayISO(),-40-i*9)+'T10:00:00.000Z';p.cons={appt:{on:true,at,how:'προφορικά'},promo:{on:i%3!==1,at,how:'προφορικά'}};S.data.students.push(p);return p.id;});
  const st=Math.max(tmin(c.from),9*60);const add=(d,m,k,sid,i)=>appts().push({id:uid(),sid,kind:k,date:d,d:wdOf(d),s:tstr(m),e:tstr(m+du),note:notes[i%notes.length]||'',ex:{},demo:true,created:new Date().toISOString()});
  [0,1,2,3,4,5].forEach(off=>{const d=addDays(t,off);if(!c.days.includes(wdOf(d))||isClosed(d))return;const n=off===0?4:2+off%3;for(let i=0;i<n;i++){const m=st+i*Math.max(du,60)+(off%2)*30;if(m+du<=tmin(c.to))add(d,m,'once',ids[(off*2+i)%ids.length],i+off);}});
  add(t,st+5*60,IM_DEF.kind()==='weekly'?'weekly':'once',ids[6],2);
  S.data.appts=appts().filter(x=>!(x.date>=t&&(x.sid===ids[3]||x.sid===ids[5])));const past=[[0,[7,35,63,91]],[1,[14,42,70]],[2,[21,49,77,105,133]],[3,[140,200,260]],[4,[10,24,38,52]],[5,[120]],[6,[30,60]]];past.forEach(([k,ds])=>ds.forEach((n,j)=>{const d=addDays(t,-n);add(d,st+((k+j)%4)*60,'once',ids[k],j);const a=appts()[appts().length-1];a.ex={[d]:{st:'done'}};}));
  S.data.settings.demo=true;}
async function demoClear(){if(!await confirmDlg('Τέλος δοκιμής: σβήνονται όλα τα παραδείγματα και η εφαρμογή μένει άδεια για τα δικά σου. Ό,τι έβαλες εσύ μένει.',{ok:'Τέλος δοκιμής',danger:true}))return;
  const D=new Set(S.data.students.filter(p=>p.demo).map(p=>p.id));S.data.students=S.data.students.filter(p=>!p.demo);S.data.appts=appts().filter(a=>!a.demo&&!D.has(a.sid));S.data.settings.demo=false;save();toast('Τέλος δοκιμής. Τώρα βάζεις τα δικά σου.','ok');go('today');render();}

/* ---------- εγκατάσταση στην αρχική οθόνη του κινητού ---------- */
let INST=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();INST=e;setTimeout(installAsk,1500);if(/^#\/(today)?$/.test(location.hash.replace(/^#\/?$/,'#/today'))&&!topModal())render();});
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function installCardHTML(){if(isStandalone()||S.data.settings.instHide)return'';const ios=/iP(hone|ad|od)/.test(navigator.userAgent);if(!INST&&!ios)return'';
  return`<section class="instcard">${LOGO}<div class="grow"><b>Βάλε το Ημερολόγιο στην αρχική οθόνη</b><span>${INST?'Ανοίγει σαν κανονική εφαρμογή, χωρίς τον φυλλομετρητή.':'Στο Safari πάτα «Κοινή χρήση» και μετά «Προσθήκη στην οθόνη Αφετηρίας».'}</span></div>${INST?`<button class="btn pri" id="instGo">Εγκατάσταση</button>`:''}<button class="iconbtn" id="instX" aria-label="Κλείσιμο">${ic('x',16)}</button></section>`;}
function bindInstall(){const g=$('#instGo');if(g)g.onclick=async()=>{INST.prompt();try{await INST.userChoice;}catch(e){}INST=null;render();};const x=$('#instX');if(x)x.onclick=()=>{S.data.settings.instHide=true;save();render();};}

/* ---------- επιβεβαίωση με μήνυμα μόλις κλειστεί ραντεβού ---------- */
const CONF_TPL_DEF='Καλησπέρα{όνομα}! Κλείσαμε ραντεβού {ημέρα} στις {ώρα}. Για αλλαγή στείλτε μου μήνυμα. {επιχείρηση}';
function confText(a){const p=stOf(a.sid)||{},B=biz();const first=(p.name||'').split(' ')[0];
  return(S.data.settings.confTpl||CONF_TPL_DEF).replace(/\{όνομα\}/g,first?' '+first:'').replace(/\{ημέρα\}/g,WDAYS[wdOf(a.date)]+' '+fmtShort(a.date)).replace(/\{ώρα\}/g,a.s).replace(/\{επιχείρηση\}/g,(isPrivate()?S.data.settings.myName:B.name||S.data.settings.myName)||'').trim();}
function IM_AFTER_SAVE(list,{edit}){if(edit||S.data.settings.confOff||!list||list.length!==1)return;const a=list[0];const p=stOf(a.sid);const ph=p&&(p.phone||((p.contacts||[])[0]||{}).phone);if(!ph||p.demo)return;if(consOf(p,'appt')===false){toast('Δεν στάλθηκε επιβεβαίωση: ο πελάτης δεν θέλει μηνύματα για ραντεβού.');return;}
  logMsg(p,'Επιβεβαίωση ραντεβού '+fmtShort(a.date)+' '+a.s,'SMS');location.href=smsHref(ph,confText(a));}

/* ---------- πιστοποιητικά προσωπικού που λήγουν ---------- */
const CERT_SUGG={'Ομορφιά & περιποίηση':['Πιστοποιητικό υγείας','Βεβαίωση άσκησης επαγγέλματος','Δίπλωμα / πτυχίο ειδικότητας'],
  'Υγεία & φροντίδα':['Άδεια άσκησης επαγγέλματος','Ασφάλιση αστικής ευθύνης','Εγγραφή στον σύλλογο','Πιστοποιητικό πρώτων βοηθειών'],
  'Εκπαίδευση & άθληση':['Άδεια διδασκαλίας','Πιστοποιητικό πρώτων βοηθειών','Δίπλωμα οδήγησης / άδεια εκπαιδευτή'],
  'Γραφεία & νομικά':['Άδεια άσκησης επαγγέλματος','Ασφάλιση αστικής ευθύνης'],
  'Τεχνίτες & μάστορες':['Άδεια άσκησης επαγγέλματος','Πιστοποίηση ψυκτικού (φθοριούχα αέρια)','Δίπλωμα οδήγησης'],
  'Υπηρεσίες':['Πιστοποιητικό υγείας','Δίπλωμα οδήγησης','Πιστοποιητικό επαγγελματικής ικανότητας (ΠΕΙ)'],
  'Άλλο':['Πιστοποιητικό υγείας','Άδεια άσκησης επαγγέλματος']};
function allCerts(){const B=biz();const L=[];const me={name:S.data.settings.myName||'Εγώ',certs:B.meCerts||[]};[me].concat(B.staff).forEach(x=>(x.certs||[]).forEach(c=>{if(c.until)L.push({who:x.name||'Εγώ',c});}));return L;}
function certAlertsHTML(){const t=todayISO(),lim=addDays(t,30);const L=allCerts().filter(({c})=>c.until<=lim).sort((a,b)=>a.c.until.localeCompare(b.c.until));if(!L.length)return'';
  return`<a class="certalert" href="#/settings/staff">${L.map(({who,c})=>{const d=Math.round((new Date(c.until+'T12:00')-new Date(t+'T12:00'))/864e5);return`<div><b>${d<0?'Έληξε':d===0?'Λήγει σήμερα':'Λήγει σε '+d+(d===1?' μέρα':' μέρες')}:</b> ${esc(c.name)} — ${esc(who)} <span class="muted">(${fmtShort(c.until)})</span></div>`;}).join('')}</a>`;}

/* ---------- χάρτης πελατών (ίδιο στυλ με το «Κοντά μου») ---------- */
let MAP=null,MAPCL=null,PLACE=null;
function loadCSS(h){if(document.querySelector(`link[href="${h}"]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l);}
async function loadLeaflet(){loadCSS('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');loadCSS('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js');await loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js');}
let GEOQ=Promise.resolve();
function geocodePerson(p,say){if(!p.loc||!p.loc.addr)return Promise.resolve(false);GEOQ=GEOQ.then(async()=>{try{
  const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&accept-language=el&countrycodes=gr&q='+encodeURIComponent(p.loc.addr));const j=await r.json();
  if(j&&j[0]){const a=j[0].address||{};Object.assign(p.loc,{lat:+j[0].lat,lng:+j[0].lon,area:a.suburb||a.city_district||a.neighbourhood||a.town||a.village||a.city||a.municipality||''});save();if(say)toast('Βρέθηκε στον χάρτη: '+(p.loc.area||p.loc.addr),'ok');await new Promise(z=>setTimeout(z,1100));return true;}
  if(say)toast('Η διεύθυνση δεν βρέθηκε στον χάρτη. Βάλε την πινέζα με το χέρι από τον Χάρτη.','bad');}catch(e){if(say)toast('Χωρίς σύνδεση — ο χάρτης θα ενημερωθεί αργότερα.','bad');}await new Promise(z=>setTimeout(z,1100));return false;});return GEOQ;}
async function viewMap(){const all=myStudents();const on=all.filter(p=>p.loc&&p.loc.lat!=null),noPin=all.filter(p=>!(p.loc&&p.loc.lat!=null));
  const areas={};on.forEach(p=>{const k=p.loc.area||'Χωρίς περιοχή';areas[k]=(areas[k]||0)+1;});const AR=Object.entries(areas).sort((a,b)=>b[1]-a[1]);
  M().innerHTML=`<div class="mapwrap"><div id="imap"></div>${PLACE?`<div class="placebar">📍 Πάτα στον χάρτη πού βρίσκεται: <b>${esc(stuName(getStudent(PLACE)))}</b> <button class="btn sm" id="plx">Άκυρο</button></div>`:''}</div>
  <section class="mapsheet"><div class="tsec-h"><h2>Από πού έρχονται</h2><span class="small muted">${on.length} από ${all.length} στον χάρτη</span></div>
   ${AR.length?`<div class="arealist">${AR.map(([a,n])=>`<div class="arow"><span class="grow">${esc(a)}</span><span class="abar"><i style="width:${Math.round(n/AR[0][1]*100)}%"></i></span><b>${n}</b></div>`).join('')}</div>`:`<p class="small muted">Γράψε διεύθυνση στην καρτέλα ${esc(LX('whoGen'))} και θα εμφανιστεί εδώ ως κουκίδα.</p>`}
   ${noPin.length?`<details class="nopin"><summary class="small"><b>Χωρίς σημείο στον χάρτη</b> (${noPin.length})</summary>${noPin.some(p=>p.loc&&p.loc.addr)?`<button class="btn sm" id="geoAll" style="margin:8px 0">${ic('route',14)} Εντοπισμός από τις διευθύνσεις</button>`:''}<div class="list">${noPin.map(p=>`<div class="rw static"><span class="grow"><b>${esc(stuName(p))}</b><small>${p.loc&&p.loc.addr?esc(p.loc.addr):'χωρίς διεύθυνση'}</small></span><button class="btn sm" data-place="${p.id}">📍 Βάλε</button></div>`).join('')}</div></details>`:''}
   <p class="tiny muted" style="margin-top:12px">Ο χάρτης φαίνεται μόνο σε αυτή τη συσκευή. Για τον εντοπισμό, η διεύθυνση στέλνεται στην υπηρεσία χαρτών OpenStreetMap.</p></section>`;
  try{await loadLeaflet();}catch(e){$('#imap').innerHTML='<p class="small muted" style="padding:20px">Ο χάρτης χρειάζεται σύνδεση στο διαδίκτυο.</p>';return;}
  if(!$('#imap'))return;const Lf=window.L;MAP=Lf.map('imap',{zoomControl:true});Lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(MAP);
  MAPCL=Lf.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:46,iconCreateFunction:c=>Lf.divIcon({className:'',html:`<div class="clus" style="background:var(--brand)"><b>${c.getChildCount()}</b></div>`,iconSize:[44,44]})});
  on.forEach(p=>{const m=Lf.marker([p.loc.lat,p.loc.lng],{icon:Lf.divIcon({className:'',html:`<div class="pinwrap"><div class="pin" style="background:${p.color||'var(--brand)'}"><span>${esc(initial(p.name))}</span></div></div>`,iconSize:[30,30],iconAnchor:[4,30]})});
    m.bindPopup(`<b>${esc(stuName(p))}</b><br><span class="small">${esc(p.loc.area||p.loc.addr||'')}</span><br><a href="#/person/${p.id}">Καρτέλα</a>`);MAPCL.addLayer(m);});
  MAP.addLayer(MAPCL);if(on.length)MAP.fitBounds(on.map(p=>[p.loc.lat,p.loc.lng]),{padding:[40,40],maxZoom:14});else MAP.setView([38.2,23.8],6);
  setTimeout(()=>MAP.invalidateSize(),200);
  MAP.on('click',e=>{if(!PLACE)return;const p=getStudent(PLACE);PLACE=null;if(!p)return render();p.loc=Object.assign(p.loc||{},{lat:e.latlng.lat,lng:e.latlng.lng});if(!p.loc.addr)p.loc.addr='';
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=el&lat=${e.latlng.lat}&lon=${e.latlng.lng}`).then(r=>r.json()).then(j=>{const a=(j&&j.address)||{};p.loc.area=a.suburb||a.city_district||a.town||a.village||a.city||'';save();render();}).catch(()=>{save();render();});
    toast('Η πινέζα μπήκε.','ok');});
  M().onclick=async e=>{const b=e.target.closest('[data-place]');if(b){PLACE=b.dataset.place;render();window.scrollTo(0,0);return;}if(e.target.closest('#plx')){PLACE=null;render();return;}
    if(e.target.closest('#geoAll')){const L=noPin.filter(p=>p.loc&&p.loc.addr);toast('Εντοπισμός '+L.length+' διευθύνσεων…');let n=0;for(const p of L)if(await geocodePerson(p,false))n++;toast(`Βρέθηκαν ${n} από ${L.length}.`,n?'ok':'bad');render();}};}

/* ---------- εισαγωγή πολλών μαζί: επαφές κινητού, Excel/CSV, αρχείο επαφών (.vcf) ---------- */
const normPh=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('0030'))d=d.slice(4);else if(d.startsWith('30')&&d.length===12)d=d.slice(2);return d;};
const normNm=n=>normT(n).replace(/\s+/g,' ').trim();
function importMenu(){const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Εισαγωγή πολλών μαζί</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
  <p class="small muted" style="margin-top:0">Βολεύει όταν έρχεσαι από άλλη εφαρμογή ή έχεις ήδη λίστα με τους ${esc(LX('whoPlL'))} σου. Πριν μπουν, βλέπεις τη λίστα και ξετσεκάρεις όσους δεν θέλεις. Όσοι υπάρχουν ήδη παραλείπονται.</p>
  <div class="list">
   ${IM_CONTACTS_OK()?`<button class="rw" data-im="con"><span class="ricon">📇</span><span class="grow"><b>Από τις επαφές του κινητού</b><small>Διάλεξε όσους θέλεις, όλους μαζί</small></span>${ic('right',16)}</button>`:''}
   <button class="rw" data-im="xls"><span class="ricon">📊</span><span class="grow"><b>Από αρχείο Excel ή CSV</b><small>Στήλες όπως Όνομα, Τηλέφωνο, Email, Διεύθυνση</small></span>${ic('right',16)}</button>
   <button class="rw" data-im="vcf"><span class="ricon">👥</span><span class="grow"><b>Από αρχείο επαφών (.vcf)</b><small>Η «Εξαγωγή επαφών» του κινητού ή του Google</small></span>${ic('right',16)}</button>
  </div>
  <button class="btn sm ghost" id="im-tpl" style="margin-top:12px">${ic('file',15)} Κατέβασε έτοιμο πρότυπο Excel</button>
  <input type="file" id="im-f" hidden>`,{guard:false});
  const fi=$('#im-f',md.el);
  md.el.addEventListener('click',async e=>{const b=e.target.closest('[data-im]');if(!b)return;const k=b.dataset.im;
    if(k==='con'){try{localStorage.setItem('imer-conpick','bulk');}catch(x){}const L=await IM_PICKCONTACTS(true);try{localStorage.removeItem('imer-conpick');}catch(x){}if(!L.length)return;md.close();importPreview(L.map(c=>({name:c.name,phone:c.phone,email:c.email})),'τις επαφές');return;}
    fi.accept=k==='vcf'?'.vcf,text/vcard,text/x-vcard':'.xlsx,.xls,.csv,.txt,.ods';fi.dataset.k=k;fi.click();});
  fi.onchange=async()=>{const f=fi.files[0];fi.value='';if(!f)return;try{const rows=await readImportFile(f);if(!rows)return;md.close();
    if(rows.kind==='people')importPreview(rows.list,f.name);else importMap(rows.table,f.name);}catch(err){toast('Δεν διαβάστηκε το αρχείο: '+(err.message||''),'bad');}};
  $('#im-tpl',md.el).onclick=()=>{const csv='﻿Ονοματεπώνυμο;Τηλέφωνο;Email;Διεύθυνση;Σημειώσεις\r\nΜαρία Παπαδοπούλου;6900000001;maria@example.com;Αλεξάνδρας 10, Αθήνα;\r\n';downloadText('protypo-pelates.csv',csv,'text/csv');toast('Άνοιξέ το με Excel, γέμισέ το και φέρ\' το εδώ.','ok');};}
async function readImportFile(f){const n=f.name.toLowerCase();
  if(n.endsWith('.vcf')){return{kind:'people',list:parseVcf(await f.text())};}
  if(n.endsWith('.csv')||n.endsWith('.txt')){return{kind:'table',table:parseCsv(await f.text())};}
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');const wb=window.XLSX.read(await f.arrayBuffer(),{type:'array'});const sh=wb.Sheets[wb.SheetNames[0]];
  return{kind:'table',table:window.XLSX.utils.sheet_to_json(sh,{header:1,raw:false,defval:''})};}
function parseCsv(t){t=t.replace(/^﻿/,'');const first=t.split(/\r?\n/)[0]||'';const sep=[';',',','\t'].map(c=>[c,first.split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],cur='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=ch;}
    else if(ch==='"')q=true;else if(ch===sep){row.push(cur);cur='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(cur);rows.push(row);row=[];cur='';}else cur+=ch;}
  if(cur||row.length){row.push(cur);rows.push(row);}return rows.filter(r=>r.some(x=>String(x).trim()));}
function parseVcf(t){const L=[];t.replace(/\r\n[ \t]/g,'').split(/BEGIN:VCARD/i).slice(1).forEach(b=>{const get=re=>{const m=b.match(re);return m?m[1].trim():'';};
  const dec=v=>v.replace(/\\,/g,',').replace(/\;/g,';').replace(/\\n/gi,' ');let fn=dec(get(/\nFN[^:\n]*:(.*)/i));if(!fn){const nn=get(/\nN[^:\n]*:(.*)/i).split(';');fn=[nn[1],nn[0]].filter(Boolean).join(' ');}
  const adr=get(/\nADR[^:\n]*:(.*)/i).split(';').map(dec).filter(x=>x.trim()).join(', ');
  if(fn||get(/\nTEL[^:\n]*:(.*)/i))L.push({name:fn||get(/\nTEL[^:\n]*:(.*)/i),phone:get(/\nTEL[^:\n]*:(.*)/i),email:get(/\nEMAIL[^:\n]*:(.*)/i),addr:adr,notes:dec(get(/\nNOTE[^:\n]*:(.*)/i))});});return L;}
const IMP_FIELDS=[['name','Ονοματεπώνυμο',/(ον[οό]μ|name|πελ[άα]τ|full)/],['last','Επώνυμο (αν είναι χωριστά)',/(επ[ωώ]ν|surname|last)/],['phone','Τηλέφωνο',/(τηλ|κιν|phone|mobile|tel|cell)/],['email','Email',/(mail|ηλεκτρ)/],['addr','Διεύθυνση',/(διευθ|address|οδ[οό]ς|addr)/],['notes','Σημειώσεις',/(σημει|σχ[οό]λ|note|παρατ)/]];
function importMap(table,src){if(!table.length)return toast('Το αρχείο είναι άδειο.','bad');
  const head=table[0].map(x=>normT(x));const hasHead=head.some(h=>IMP_FIELDS.some(f=>f[2].test(h)));const cols=table[0].map((x,i)=>hasHead?(String(x).trim()||'Στήλη '+(i+1)):'Στήλη '+(i+1)+' (π.χ. «'+String(x).slice(0,18)+'»)');
  const map={};IMP_FIELDS.forEach(([k,,re])=>{const i=hasHead?head.findIndex(h=>re.test(h)&&!(k==='name'&&/(επ[ωώ]ν|surname|last)/.test(h))):-1;map[k]=i;});
  if(map.name<0)map.name=0;if(map.phone<0&&!hasHead)map.phone=table[0].findIndex((x,i)=>i!==map.name&&/\d{6,}/.test(String(x).replace(/\D/g,'')));
  const body=hasHead?table.slice(1):table;
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Ποια στήλη είναι τι;</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Από «${esc(src)}»: ${body.length} γραμμές. Τα βρήκα μόνος μου — διόρθωσε αν κάτι δεν ταιριάζει.</p>
   <div class="grid g2" style="gap:8px">${IMP_FIELDS.map(([k,l])=>`<div class="field"><label class="f">${l}</label><select class="in" data-mk="${k}"><option value="-1">— κανένα —</option>${cols.map((c,i)=>opt(i,c,map[k])).join('')}</select></div>`).join('')}</div>
   <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri" id="mp-go">Συνέχεια ${ic('right',15)}</button></div>`,{guard:false});
  $('#mp-go',md.el).onclick=()=>{$$('[data-mk]',md.el).forEach(x=>map[x.dataset.mk]=+x.value);const g=(r,k)=>map[k]>=0?String(r[map[k]]==null?'':r[map[k]]).trim():'';
    const L=body.map(r=>({name:[g(r,'name'),g(r,'last')].filter(Boolean).join(' '),phone:g(r,'phone'),email:g(r,'email'),addr:g(r,'addr'),notes:g(r,'notes')})).filter(x=>x.name||x.phone);
    if(!L.length)return toast('Δεν βρέθηκαν ονόματα με αυτές τις στήλες.','bad');md.close();importPreview(L,src);};}
function importPreview(list,src){const exPh=new Set(S.data.students.map(p=>normPh(p.phone)).filter(x=>x.length>=6)),exNm=new Set(S.data.students.map(p=>normNm(p.name)));const seen=new Set();
  const L=list.map(x=>{const k=normPh(x.phone)||normNm(x.name);const dup=(normPh(x.phone).length>=6&&exPh.has(normPh(x.phone)))||exNm.has(normNm(x.name));const twice=seen.has(k);seen.add(k);return Object.assign({},x,{name:(x.name||x.phone||'').trim(),dup:dup||twice,on:!(dup||twice)});});
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Έλεγχος πριν την εισαγωγή</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Από ${esc(src)}: ${L.length} άτομα${L.some(x=>x.dup)?` · ${L.filter(x=>x.dup).length} υπάρχουν ήδη και δεν θα ξαναμπούν`:''}.</p>
   <label class="check small" style="margin-bottom:8px"><input type="checkbox" id="ip-all" checked> Όλοι</label>
   <div class="implist">${L.map((x,i)=>`<label class="improw ${x.dup?'dup':''}"><input type="checkbox" data-ii="${i}" ${x.on?'checked':''}><span class="grow"><b>${esc(x.name)}</b><small>${[x.phone,x.email,x.addr].filter(Boolean).map(esc).join(' · ')||'&nbsp;'}${x.dup?' <em>υπάρχει ήδη</em>':''}</small></span></label>`).join('')}</div>
   <div class="savebar"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri" id="ip-go"></button></div>`,{guard:false});
  const cnt=()=>{const n=L.filter(x=>x.on).length;$('#ip-go',md.el).innerHTML=`${ic('check',16)} Πρόσθεσε ${n}`;$('#ip-go',md.el).disabled=!n;};cnt();
  md.el.addEventListener('change',e=>{const c=e.target.closest('[data-ii]');if(c){L[+c.dataset.ii].on=c.checked;cnt();}if(e.target.id==='ip-all'){L.forEach(x=>{if(!x.dup)x.on=e.target.checked;});$$('[data-ii]',md.el).forEach(c=>c.checked=L[+c.dataset.ii].on);cnt();}});
  $('#ip-go',md.el).onclick=()=>{const add=L.filter(x=>x.on);add.forEach((x,i)=>{const p={id:uid(),name:x.name,avatar:initial(x.name),phone:x.phone||'',email:(x.email||'').toLowerCase(),notes:x.notes||'',color:PERS_COLORS[(S.data.students.length+i)%PERS_COLORS.length],contacts:(x.phone||x.email)?[{name:x.name,phone:x.phone||'',email:x.email||''}]:[],created:new Date().toISOString()};if(x.addr)p.loc={addr:x.addr,home:true};S.data.students.push(p);});
    save();md.close();const na=add.filter(x=>x.addr).length;toast(`Μπήκαν ${add.length} ${LX('whoPlL')}.${na?` ${na} έχουν διεύθυνση — από τον Χάρτη πάτα «Εντοπισμός από τις διευθύνσεις».`:''}`,'ok');go('people');render();};}

/* ---------- πάτημα στον μήνα/ημερομηνία του ημερολογίου: επιλογή μήνα ---------- */
function monthPicker(){const r=parseRoute();let view=r.q.view;try{view=view||localStorage.getItem('imer-agview');}catch(e){}view=['month','week','day','list'].includes(view)?view:'day';
  const cur=(r.q.d||r.q.w||(r.q.m?r.q.m+'-01':'')||todayISO()).slice(0,7);let y=+cur.slice(0,4);const t=todayISO();
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Πήγαινε σε μήνα</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><div id="mp-b"></div>
   <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-mgo="${t.slice(0,7)}">${ic('calendar',15)} Σήμερα</button></div>`,{guard:false});
  const draw=()=>{const C={};appts();occ(y+'-01-01',y+'-12-31',{by:''}).forEach(o=>{const k=o.date.slice(0,7);C[k]=(C[k]||0)+1;});
    $('#mp-b',md.el).innerHTML=`<div class="perhd" style="margin-bottom:10px"><button type="button" class="dayarr" data-yr="-1" aria-label="Προηγούμενη χρονιά">${ic('left',22)}</button><div class="dayt"><b style="font-size:1.3rem">${y}</b></div><button type="button" class="dayarr" data-yr="1" aria-label="Επόμενη χρονιά">${ic('right',22)}</button></div>
     <div class="mpgrid">${MONTHS.map((m,i)=>{const k=y+'-'+pad(i+1);return`<button type="button" class="mpm ${k===cur?'on':''} ${k===t.slice(0,7)?'now':''}" data-mgo="${k}"><b>${m}</b><small>${C[k]?C[k]+' ραντεβού':'—'}</small></button>`;}).join('')}</div>`;};draw();
  md.el.addEventListener('click',e=>{const yr=e.target.closest('[data-yr]');if(yr){y+=+yr.dataset.yr;draw();return;}const g=e.target.closest('[data-mgo]');if(!g)return;const k=g.dataset.mgo;const d=k===t.slice(0,7)?t:k+'-01';md.close();
    setTimeout(()=>go(view==='month'?`agenda?view=month&m=${k}`:view==='week'?`agenda?view=week&w=${mondayOf(d)}`:view==='list'?`agenda?view=list&d=${d}`:`agenda?view=day&d=${d}`),130);});}
/* εβδομάδα: λίστα εβδομάδων του μήνα · ημέρα: μικρό ημερολόγιο μήνα για να διαλέξεις μέρα */
function curView(){const r=parseRoute();let v=r.q.view;try{v=v||localStorage.getItem('imer-agview');}catch(e){}return['month','week','day','list'].includes(v)?v:'day';}
function weekPicker(){const r=parseRoute();const t=todayISO();const selW=mondayOf(r.q.w||r.q.d||t);let ym=selW.slice(0,7);
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Διάλεξε εβδομάδα</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><div id="wp-b"></div>
   <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-wgo="${mondayOf(t)}">${ic('calendar',15)} Αυτή η εβδομάδα</button></div>`,{guard:false});
  const draw=()=>{const[Y,Mo]=ym.split('-').map(Number);const first=ym+'-01',last=isoDate(new Date(Y,Mo,0));const W=[];for(let w=mondayOf(first);w<=last;w=addDays(w,7))W.push(w);
    $('#wp-b',md.el).innerHTML=`<div class="perhd" style="margin-bottom:10px"><button type="button" class="dayarr" data-wm="-1" aria-label="Προηγούμενος μήνας">${ic('left',22)}</button><div class="dayt"><b style="font-size:1.15rem">${MONTHS[Mo-1]} ${Y}</b></div><button type="button" class="dayarr" data-wm="1" aria-label="Επόμενος μήνας">${ic('right',22)}</button></div>
     <div class="wplist">${W.map(w=>{const e=addDays(w,6);const n=occ(w,e,{by:''}).length;const fr=[...Array(7)].map((_,i)=>addDays(w,i)).filter(d=>d>=t&&workDay(d)&&!isClosed(d)).reduce((a,d)=>a+freeSlots(d).length,0);
       return`<button type="button" class="wpw ${w===selW?'on':''} ${w===mondayOf(t)?'now':''}" data-wgo="${w}"><span class="grow"><b>${fmtShort(w)} – ${fmtShort(e)}</b><small>${w===mondayOf(t)?'Αυτή η εβδομάδα · ':''}${n} ραντεβού${e>=t?` · ${fr} ελεύθερα κενά`:''}</small></span>${ic('right',16)}</button>`;}).join('')}</div>`;};draw();
  md.el.addEventListener('click',e=>{const m=e.target.closest('[data-wm]');if(m){const[Y,Mo]=ym.split('-').map(Number);ym=isoDate(new Date(Y,Mo-1+ +m.dataset.wm,1)).slice(0,7);draw();return;}
    const g=e.target.closest('[data-wgo]');if(!g)return;md.close();setTimeout(()=>go(`agenda?view=week&w=${g.dataset.wgo}`),130);});}
function dayPicker(){const r=parseRoute();const t=todayISO();const sel=r.q.d||t;let ym=sel.slice(0,7);
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Διάλεξε μέρα</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><div id="dp-b"></div>
   <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-dgo="${t}">${ic('calendar',15)} Σήμερα</button></div>`,{guard:false});
  const draw=()=>{const[Y,Mo]=ym.split('-').map(Number);const first=ym+'-01',last=isoDate(new Date(Y,Mo,0));const C={};occ(first,last,{by:''}).forEach(o=>C[o.date]=(C[o.date]||0)+1);
    let cells='';for(let i=0;i<(new Date(Y,Mo-1,1).getDay()+6)%7;i++)cells+='<span></span>';for(let d=first;d<=last;d=addDays(d,1)){const off=!workDay(d)||isClosed(d);cells+=`<button type="button" class="dpd ${d===sel?'on':''} ${d===t?'now':''} ${off?'off':''}" data-dgo="${d}"><b>${+d.slice(8)}</b>${C[d]?`<i>${C[d]}</i>`:''}</button>`;}
    $('#dp-b',md.el).innerHTML=`<div class="perhd" style="margin-bottom:10px"><button type="button" class="dayarr" data-dm="-1" aria-label="Προηγούμενος μήνας">${ic('left',22)}</button><div class="dayt"><b style="font-size:1.15rem">${MONTHS[Mo-1]} ${Y}</b></div><button type="button" class="dayarr" data-dm="1" aria-label="Επόμενος μήνας">${ic('right',22)}</button></div>
     <div class="dpgrid">${['Δ','Τ','Τ','Π','Π','Σ','Κ'].map(x=>`<span class="dpw">${x}</span>`).join('')}${cells}</div><p class="tiny muted" style="margin:8px 0 0;text-align:center">Το νούμερο πάνω δεξιά = πόσα ραντεβού έχει η μέρα.</p>`;};draw();
  md.el.addEventListener('click',e=>{const m=e.target.closest('[data-dm]');if(m){const[Y,Mo]=ym.split('-').map(Number);ym=isoDate(new Date(Y,Mo-1+ +m.dataset.dm,1)).slice(0,7);draw();return;}
    const g=e.target.closest('[data-dgo]');if(!g)return;md.close();setTimeout(()=>go(`agenda?view=day&d=${g.dataset.dgo}`),130);});}
document.addEventListener('click',e=>{const m=e.target.closest&&e.target.closest('#main .dsm, #main .perhd .dayt b, #main .dayhd .dayt b');if(!m)return;e.preventDefault();e.stopPropagation();
  const v=curView();if(m.classList.contains('dsm'))return dayPicker();if(v==='week')return weekPicker();if(v==='day')return dayPicker();monthPicker();},true);

/* ---------- συγκαταθέσεις: μηνύματα για ραντεβού και, χωριστά, για προσφορές ---------- */
const CONS_TXT_DEF='{επιχείρηση}: Για να σας στέλνουμε υπενθυμίσεις και αλλαγές για τα ραντεβού σας, κρατάμε το όνομα, το τηλέφωνο και το email σας μόνο σε αυτή τη συσκευή. Χωριστά, αν το θέλετε, μπορούμε να σας στέλνουμε προσφορές και νέα. Μπορείτε να αλλάξετε γνώμη όποτε θέλετε, απαντώντας ΣΤΟΠ ή λέγοντάς το μας.';
function consText(){const B=biz();return(S.data.settings.consTpl||CONS_TXT_DEF).replace(/\{επιχείρηση\}/g,(isPrivate()?S.data.settings.myName:B.name||S.data.settings.myName)||'Το γραφείο μας');}
// undefined = δεν έχει ρωτηθεί ακόμα · true / false = ρητή απάντηση
function consOf(p,k){const c=p&&p.cons&&p.cons[k];return c?c.on:undefined;}
function setCons(p,k,on,how){p.cons=p.cons||{};p.cons[k]={on:!!on,at:new Date().toISOString(),how:how||'στην καρτέλα'};
  if(k==='appt'){if(on)delete p.consent;else p.consent={ch:{sms:false,wa:false,viber:false,email:false}};}}
const consLbl=(p,k)=>{const c=p.cons&&p.cons[k];return c?`${c.on?'Ναι':'Όχι'} · ${fmtShort(c.at.slice(0,10))}/${c.at.slice(2,4)}`:'Δεν έχει ρωτηθεί';};

/* ---------- ιστορικό μηνυμάτων ανά πελάτη (καταγράφεται όταν πατάς «αποστολή») ---------- */
function logMsg(p,what,via){if(!p)return;p.msgs=(p.msgs||[]).concat([{at:new Date().toISOString(),what,via}]).slice(-60);save();}
function msgHistory(p){const L=(p.msgs||[]).map(m=>({at:m.at,what:m.what,via:m.via}));const R=S.data.remSent||{};
  Object.entries(R).forEach(([k,at])=>{const a=appts().find(x=>x.id===k.split('|')[0]);if(a&&a.sid===p.id&&typeof at==='string')L.push({at,what:'Υπενθύμιση για το ραντεβού '+fmtShort(k.split('|')[1]),via:'μήνυμα'});});
  return L.sort((a,b)=>b.at.localeCompare(a.at));}
const atTxt=iso=>{const d=new Date(iso);return fmtShort(isoDate(d))+'/'+String(d.getFullYear()).slice(2)+' '+pad(d.getHours())+':'+pad(d.getMinutes());};
function consCard(p){const el=$('#p-cons');if(!el)return;const ph=p.phone||((p.contacts||[])[0]||{}).phone,em=p.email;const H=msgHistory(p);const t=consText();
  el.innerHTML=`<h3>🛡️ Συγκαταθέσεις για μηνύματα</h3>
   <label class="switch"><span><b>Μηνύματα για τα ραντεβού</b><small>Επιβεβαιώσεις, υπενθυμίσεις, αλλαγές · ${consLbl(p,'appt')}</small></span><input type="checkbox" data-cons="appt" ${consOf(p,'appt')!==false?'checked':''}></label>
   <label class="switch"><span><b>Προσφορές και νέα</b><small>Μόνο αν το θέλει ρητά · ${consLbl(p,'promo')}</small></span><input type="checkbox" data-cons="promo" ${consOf(p,'promo')===true?'checked':''}></label>
   ${consOf(p,'promo')===true?`<button type="button" class="btn sm danger" id="cs-stop" style="margin-top:8px">✋ Είπε ΣΤΟΠ — όχι άλλες προσφορές</button>`:''}
   <details class="constxt"><summary class="small"><b>Το κείμενο που του λες ή του στέλνεις</b></summary><div class="note small" style="white-space:pre-wrap;margin-top:8px">${esc(t)}</div>
    <div class="row" style="margin-top:8px">${ph?`<a class="btn sm" id="cs-sms" href="${smsHref(ph,t)}">${ic('l-message-square',15)} Στείλ' το με SMS</a>`:''}${em?`<a class="btn sm" id="cs-mail" href="mailto:${esc(em)}?subject=${encodeURIComponent('Ενημέρωση για τα μηνύματα')}&body=${encodeURIComponent(t)}">${ic('send',15)} Με email</a>`:''}</div></details>
   <h4 class="hist-h">Ιστορικό μηνυμάτων</h4>${H.length?`<div class="histlist">${H.slice(0,20).map(h=>`<div class="msgrow"><span class="hd">${atTxt(h.at)}</span><span class="grow">${esc(h.what)}</span><span class="chip sm">${esc(h.via)}</span></div>`).join('')}</div>`:'<p class="small muted" style="margin:0">Δεν έχει σταλεί ακόμα κανένα μήνυμα από την εφαρμογή.</p>'}
   <p class="tiny muted" style="margin:8px 0 0">Καταγράφεται τη στιγμή που πατάς «Στείλε». Αν δεν πάτησες τελικά «Αποστολή» στο κινητό, η καταγραφή μένει.</p>`;
  $$('[data-cons]',el).forEach(c=>c.onchange=()=>{setCons(p,c.dataset.cons,c.checked);save();toast(c.dataset.cons==='promo'?(c.checked?'Δέχεται προσφορές.':'Όχι προσφορές.'):(c.checked?'Δέχεται μηνύματα για τα ραντεβού.':'Όχι μηνύματα για τα ραντεβού.'),'ok');consCard(p);});
  const st=$('#cs-stop',el);if(st)st.onclick=()=>{setCons(p,'promo',false,'απάντησε ΣΤΟΠ');logMsg(p,'Απάντησε ΣΤΟΠ στις προσφορές','σημείωση');toast('Καταγράφηκε: όχι άλλες προσφορές.','ok');consCard(p);};
  const a=$('#cs-sms',el);if(a)a.addEventListener('click',()=>{logMsg(p,'Κείμενο ενημέρωσης / συγκατάθεσης','SMS');setTimeout(()=>consCard(p),300);});
  const b=$('#cs-mail',el);if(b)b.addEventListener('click',()=>{logMsg(p,'Κείμενο ενημέρωσης / συγκατάθεσης','email');setTimeout(()=>consCard(p),300);});}

/* ---------- συχνότητα επισκέψεων ---------- */
function visitStats(p){const t=todayISO();const from=addDays(t,-730);
  const V=[...new Set(occ(from,addDays(t,-1),{sid:p.id,withCancel:true,by:''}).filter(o=>o.st!=='cancel'&&o.st!=='absent').map(o=>o.date))].sort();
  const nextO=occ(t,addDays(t,365),{sid:p.id,by:''}).find(o=>o.st==='');
  const last=V[V.length-1]||null;const gaps=[];for(let i=1;i<V.length;i++)gaps.push((new Date(V[i]+'T12:00')-new Date(V[i-1]+'T12:00'))/864e5);
  const avg=gaps.length?Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length):null;const since=last?Math.round((new Date(t+'T12:00')-new Date(last+'T12:00'))/864e5):null;
  const y1=V.filter(d=>d>=addDays(t,-365)).length;
  const lim=avg?Math.max(Math.round(avg*1.5),avg+14):60;const late=!nextO&&since!=null&&since>lim;
  return{count:V.length,y1,last,avg,since,next:nextO?nextO.date:null,late,lim};}
const daysTxt=n=>n==null?'—':n<1?'σήμερα':n===1?'1 μέρα':n<60?n+' μέρες':n<730?Math.round(n/30)+' μήνες':Math.round(n/365)+' χρόνια';
function freqTxt(v){if(!v.count)return'Δεν έχει έρθει ακόμα';return`${v.y1} ${v.y1===1?'επίσκεψη':'επισκέψεις'} τον τελευταίο χρόνο${v.avg?` · έρχεται περίπου κάθε ${daysTxt(v.avg)}`:''}`;}

/* ---------- μήνυμα προσφοράς μόνο σε όσους έχουν πει «ναι» ---------- */
function offerDialog(preIds){const all=myStudents().filter(p=>!p.demo||S.data.settings.demo);const yes=all.filter(p=>consOf(p,'promo')===true);const sel=new Set((preIds||yes.map(p=>p.id)).filter(id=>yes.some(p=>p.id===id)));
  const tpl=S.data.settings.offerTpl||'Καλησπέρα{όνομα}! ';
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Μήνυμα προσφοράς</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Στέλνεται <b>μόνο</b> σε όσους έχουν πει «ναι» στις προσφορές (${yes.length} από ${all.length}). Στο τέλος μπαίνει μόνο του το «Για να μη λαμβάνετε προσφορές απαντήστε ΣΤΟΠ».</p>
   <div class="field"><label class="f" for="of-t">Το μήνυμα</label><textarea class="in" id="of-t" style="min-height:90px" placeholder="π.χ. Αυτόν τον μήνα -20% στη βαφή!">${esc(tpl)}</textarea><div class="tiny muted">{όνομα} = το μικρό όνομα του πελάτη</div></div>
   ${yes.length?`<div class="implist" style="max-height:34vh">${yes.map(p=>`<div class="improw"><input type="checkbox" data-of="${p.id}" ${sel.has(p.id)?'checked':''} aria-label="Επιλογή"><span class="grow"><b>${esc(stuName(p))}</b><small>${esc(p.phone||'')}${p.email?' · '+esc(p.email):''}</small></span>${p.phone?`<a class="btn sm" data-ofsms="${p.id}">SMS</a>`:''}</div>`).join('')}</div>
   <div class="savebar"><button type="button" class="btn" id="of-mail">${ic('send',15)} Email σε όλους τους επιλεγμένους</button></div>`:`<div class="note small">Κανείς δεν έχει δώσει ακόμα συγκατάθεση για προσφορές. Σημείωσέ τη στην καρτέλα κάθε ${esc(LX('whoGen'))}.</div>`}`,{guard:false});
  const txt=p=>{const first=(p.name||'').split(' ')[0];return($('#of-t',md.el).value||'').replace(/\{όνομα\}/g,first?' '+first:'').trim()+'\n'+(isPrivate()?S.data.settings.myName||'':biz().name||S.data.settings.myName||'')+'\nΓια να μη λαμβάνετε προσφορές απαντήστε ΣΤΟΠ.';};
  $('#of-t',md.el).onchange=e=>{S.data.settings.offerTpl=e.target.value;save();};
  md.el.addEventListener('change',e=>{const c=e.target.closest('[data-of]');if(c){c.checked?sel.add(c.dataset.of):sel.delete(c.dataset.of);}});
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-ofsms]');if(b){const p=getStudent(b.dataset.ofsms);logMsg(p,'Προσφορά','SMS');location.href=smsHref(p.phone,txt(p));b.textContent='✓ SMS';return;}
    if(e.target.closest('#of-mail')){const L=yes.filter(p=>sel.has(p.id)&&p.email);if(!L.length)return toast('Κανένας επιλεγμένος δεν έχει email.','bad');const t=txt({name:''});L.forEach(p=>logMsg(p,'Προσφορά','email'));location.href=`mailto:?bcc=${L.map(p=>encodeURIComponent(p.email)).join(',')}&subject=${encodeURIComponent('Προσφορά — '+(biz().name||''))}&body=${encodeURIComponent(t)}`;}});}

/* ---------- πρόσωπα: λίστα ---------- */
function viewPeople(r){const all=myStudents();const q=(r.q.q||'').toLowerCase();
  M().innerHTML=`${pageHead(esc(LX('whoPl')),`${all.length}`,`<button class="btn" id="p-imp">${ic('download',16)} Εισαγωγή</button><a class="btn pri" href="#/person/new">${ic('plus',17)} Νέος</a>`)}
  ${all.length?`<div class="search field">${ic('search',17)}<input class="in" id="pq" type="search" placeholder="Όνομα ή τηλέφωνο" value="${esc(q)}" aria-label="Αναζήτηση"></div><div class="list" id="pl"></div>`
   :emptyHTML('users',`Δεν υπάρχουν ακόμη ${esc(LX('whoPlL'))}`,`Πρόσθεσε τον πρώτο — ή γράψε απευθείας το όνομα όταν κλείνεις ραντεβού.`,`<a class="btn pri" href="#/person/new">${ic('plus',16)} Νέος</a> <button class="btn" id="p-imp2">${ic('download',16)} Εισαγωγή πολλών μαζί</button>`)}`;
  [$('#p-imp'),$('#p-imp2')].forEach(b=>{if(b)b.onclick=importMenu;});
  if(!all.length)return;
  const t=todayISO();const VS={};all.forEach(p=>VS[p.id]=visitStats(p));let flt=r.q.f||'all';
  const nLate=all.filter(p=>VS[p.id].late).length,nPromo=all.filter(p=>consOf(p,'promo')===true).length;
  $('#pq').closest('.search').insertAdjacentHTML('afterend',`<div class="pftabs"><button data-pf2="all">Όλοι <i>${all.length}</i></button><button data-pf2="late">Έχουν καιρό να έρθουν <i>${nLate}</i></button><button data-pf2="promo">Δέχονται προσφορές <i>${nPromo}</i></button></div><div id="pfx"></div>`);
  const tabs=()=>{$$('[data-pf2]').forEach(b=>b.classList.toggle('on',b.dataset.pf2===flt));$('#pfx').innerHTML=flt==='promo'&&nPromo?`<button class="btn pri wide" id="pf-offer" style="margin-bottom:10px">${ic('send',16)} Στείλε μήνυμα προσφοράς σε ${nPromo}</button>`:flt==='late'?`<p class="small muted" style="margin:0 0 10px">Όσοι δεν έχουν κλεισμένο ραντεβού και πέρασε πολύ περισσότερος καιρός από τη συνηθισμένη τους συχνότητα (ή πάνω από 2 μήνες, αν έχουν έρθει μία φορά).</p>`:'';const o=$('#pf-offer');if(o)o.onclick=()=>offerDialog();};
  $$('[data-pf2]').forEach(b=>b.onclick=()=>{flt=b.dataset.pf2;tabs();draw();});
  const draw=()=>{const v=$('#pq').value.toLowerCase().trim();let L=all.filter(p=>!v||(p.name||'').toLowerCase().includes(v)||(p.phone||'').replace(/\s/g,'').includes(v.replace(/\s/g,'')));
    if(flt==='late')L=L.filter(p=>VS[p.id].late).sort((a,b)=>VS[b.id].since-VS[a.id].since);if(flt==='promo')L=L.filter(p=>consOf(p,'promo')===true);
    $('#pl').innerHTML=L.length?L.map(p=>{const nx=occ(t,addDays(t,120),{sid:p.id,by:''}).find(o=>o.st===''&&(o.date>t||tmin(o.e)>nowMin()));
      const vs=VS[p.id];return`<a class="rw" href="#/person/${p.id}"><span class="ricon" style="${p.color?`background:${p.color};color:#fff`:''}">${esc((p.name||'?').trim()[0]||'?')}</span><span class="grow"><b>${esc(stuName(p))}</b><small>${flt==='late'?`τελευταία φορά πριν ${daysTxt(vs.since)}${vs.avg?' · συνήθως κάθε '+daysTxt(vs.avg):''}`:[p.phone?esc(p.phone):'',nx?'επόμενο '+WDAYS_S[wdOf(nx.date)]+' '+fmtShort(nx.date)+' '+nx.s:vs.last?'τελευταία '+fmtShort(vs.last):''].filter(Boolean).join(' · ')||'&nbsp;'}</small></span>${vs.late&&flt!=='late'?'<span class="chip y sm">έχει καιρό</span>':''}${ic('right',16)}</a>`;}).join(''):`<p class="muted small">Κανένα αποτέλεσμα.</p>`;};
  tabs();draw();$('#pq').oninput=draw;}

/* ---------- πρόσωπο: καρτέλα ---------- */
function viewPerson(r){const fb=$('#fab');if(fb)fb.remove();const isNew=r.id==='new';const p0=isNew?{id:uid(),created:new Date().toISOString(),contacts:[]}:getStudent(r.id);if(!p0)return go('people');
  const p=JSON.parse(JSON.stringify(p0));const t=todayISO();
  const up=isNew?[]:occ(addDays(t,-60),addDays(t,180),{sid:p.id,withCancel:true,by:''});const fut=up.filter(o=>o.date>=t);const past=up.filter(o=>o.date<t).reverse().slice(0,10);
  const pr=PERS_COLORS;
  M().innerHTML=`${pageHead(isNew?'Νέος '+esc(LX('who')).toLowerCase():esc(stuName(p)),isNew?'':esc(LX('who')),`<a class="btn" href="#/people">Πίσω</a>`)}
  <div class="grid g2" style="align-items:start"><form class="card" id="pf"><h3>Στοιχεία</h3>
   ${IM_CONTACTS_OK()?`<button type="button" class="btn conpick field" id="p-con">${ic('users',16)} Από τις επαφές του κινητού</button>`:''}
   <div class="field"><label class="f" for="p-n">Ονοματεπώνυμο</label><input class="in" id="p-n" name="name" required autocomplete="off" value="${esc(p.name||'')}"></div>
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="p-ph">Τηλέφωνο</label><div class="phrow"><input class="in" id="p-ph" name="phone" type="tel" inputmode="tel" value="${esc(p.phone||'')}">${p.phone?`<a class="callbtn" href="tel:${telLink(p.phone)}" aria-label="Κλήση">${ic('l-phone',20)}</a><a class="callbtn sms" href="sms:${telLink(p.phone)}" aria-label="Μήνυμα">${ic('l-message-square',20)}</a>`:''}</div></div>
   <div class="field"><label class="f" for="p-em">Email</label><input class="in" id="p-em" name="email" type="email" inputmode="email" autocapitalize="none" value="${esc(p.email||'')}"></div></div>
   <div class="field"><label class="f" for="p-ad">Διεύθυνση <span class="tiny muted">· για τον χάρτη, προαιρετικό</span></label><input class="in" id="p-ad" name="addr" value="${esc(p.loc&&p.loc.addr||'')}"></div>
   <div class="field"><label class="f" for="p-no">Σημειώσεις</label><textarea class="in" id="p-no" name="notes" style="min-height:70px">${esc(p.notes||'')}</textarea></div>
   ${isNew?'':(()=>{const v=visitStats(p);return`<div class="freqbox ${v.late?'late':''}"><div><b>${v.count?'Τελευταία φορά: '+fmtShort(v.last)+' (πριν '+daysTxt(v.since)+')':'Δεν έχει έρθει ακόμα'}</b><small>${freqTxt(v)}${v.next?' · επόμενο '+fmtShort(v.next):''}</small></div>${v.late?'<span class="chip y">έχει καιρό να έρθει</span>':''}</div>`;})()}
   <div class="field"><label class="f">Χρώμα στο ημερολόγιο</label><div class="scols">${pr.map(c=>`<button type="button" data-pc="${c}" style="background:${c}" class="${p.color===c?'on':''}" aria-label="Χρώμα"></button>`).join('')}<button type="button" data-pc="" class="none ${p.color?'':'on'}" aria-label="Χωρίς χρώμα">${ic('x',12)}</button></div></div>
   <div class="savebar"><button class="btn pri">${ic('check',16)} Αποθήκευση</button>${isNew?'':`<button type="button" class="btn danger" id="p-del">${ic('trash',16)} Διαγραφή</button>`}</div></form>
  ${isNew?'':`<div class="card"><div class="card-h"><h3>Ραντεβού</h3><button class="btn sm pri" id="p-new">${ic('plus',15)} Νέο ραντεβού</button></div>
   ${p.phone?`<div class="row" style="gap:6px;margin-bottom:12px"><a class="btn sm" href="tel:${telLink(p.phone)}">Κλήση</a>${chBtnsHTML({contacts:[{name:p.name,phone:p.phone,email:p.email}]},'Καλησπέρα!','Μήνυμα','')}</div>`:''}
   ${fut.length?`<div class="aglist">${fut.slice(0,6).map(o=>`<div class="small muted" style="margin:8px 0 2px">${WDAYS[wdOf(o.date)]} ${fmtDate(o.date)}</div>${apptCard(o)}`).join('')}</div>${fut.length>6?`<p class="small muted" style="margin:8px 0 0">και ${fut.length-6} ακόμα μέσα στους επόμενους 6 μήνες.</p>`:''}`:'<p class="small muted">Κανένα επόμενο ραντεβού.</p>'}
   ${past.length?`<details style="margin-top:12px"><summary class="small"><b>Προηγούμενα</b> (${past.length})</summary><div class="aglist" style="margin-top:6px">${past.map(o=>`<div class="small muted" style="margin:8px 0 2px">${fmtDate(o.date)}</div>${apptCard(o)}`).join('')}</div></details>`:''}</div>`}</div>
  ${isNew?`<div class="card conscard"><h3>🛡️ Συγκαταθέσεις για μηνύματα</h3><p class="small muted" style="margin:0">Μπαίνουν μόλις αποθηκεύσεις ${esc(LX('whoAcc'))}.</p></div>`:`<div class="card conscard" id="p-cons"></div>`}`;
  const F=$('#pf');let col=p.color||'';
  // πρόχειρο: ό,τι γράφεις κρατιέται, ακόμα κι αν το κινητό κλείσει την εφαρμογή στο παρασκήνιο
  const DK='imer-pdraft';const saveDraft=()=>{try{const o=fd(F);localStorage.setItem(DK,JSON.stringify({rid:r.id,t:Date.now(),o,col}));}catch(e){}};
  const clearDraft=()=>{try{localStorage.removeItem(DK);localStorage.removeItem('imer-conpick');}catch(e){}};
  try{const d=JSON.parse(localStorage.getItem(DK)||'null');if(d&&d.rid===r.id&&Date.now()-d.t<6*36e5){['name','phone','email','addr','notes'].forEach(k=>{if(d.o[k]!=null&&F[k])F[k].value=d.o[k];});if(d.col!=null){col=d.col;$$('[data-pc]',F).forEach(x=>x.classList.toggle('on',x.dataset.pc===col));}
    const cp=localStorage.getItem('imer-conpick');if(cp){localStorage.removeItem('imer-conpick');toast('Το κινητό έκλεισε τη λίστα επαφών όσο ήσουν σε άλλη εφαρμογή. Ό,τι είχες γράψει κρατήθηκε — πάτα ξανά «Από τις επαφές».','bad');}else if(d.o.name||d.o.phone)toast('Συνεχίζεις από εκεί που είχες μείνει.','ok');}}catch(e){}
  F.addEventListener('input',saveDraft);
  const pc=$('#p-con');if(pc)pc.onclick=async()=>{saveDraft();try{localStorage.setItem('imer-conpick','1');}catch(e){}const L=await IM_PICKCONTACTS(false);try{localStorage.removeItem('imer-conpick');}catch(e){}const c=L[0];if(!c)return;F.name.value=c.name;if(c.phone)F.phone.value=c.phone;if(c.email)F.email.value=c.email;toast('Μπήκαν τα στοιχεία από τις επαφές.','ok');saveDraft();};
  F.onclick=e=>{const b=e.target.closest('[data-pc]');if(!b)return;col=b.dataset.pc;$$('[data-pc]',F).forEach(x=>x.classList.toggle('on',x===b));saveDraft();};
  F.onsubmit=e=>{e.preventDefault();const o=fd(F);if(!o.name.trim())return toast('Γράψε όνομα.','bad');
    Object.assign(p0,{name:o.name.trim(),avatar:initial(o.name),phone:o.phone.trim(),email:o.email.trim().toLowerCase(),notes:o.notes.trim(),color:col||undefined,updated:new Date().toISOString()});
    p0.contacts=(p0.phone||p0.email)?[{name:p0.name,role:'',phone:p0.phone,email:p0.email}]:[];
    const newAddr=o.addr.trim()&&!(p0.loc&&p0.loc.addr===o.addr.trim()&&p0.loc.lat!=null);if(o.addr.trim())p0.loc=Object.assign({},p0.loc&&p0.loc.addr===o.addr.trim()?p0.loc:{},{addr:o.addr.trim(),home:true});else delete p0.loc;
    if(isNew)S.data.students.push(p0);save();clearDraft();toast('Αποθηκεύτηκε.','ok');if(newAddr)geocodePerson(p0,true);
    if(isNew&&sessionStorage.getItem('im-after-person')){sessionStorage.removeItem('im-after-person');go('today');setTimeout(()=>apptDialog({date:todayISO(),sids:[p0.id]}),200);return;}
    go('person/'+p0.id);};
  const dl=$('#p-del');if(dl)dl.onclick=async()=>{const n=appts().filter(a=>a.sid===p0.id).length;if(!await confirmDlg(`Διαγραφή «${esc(stuName(p0))}»${n?` και ${n===1?'του ραντεβού του':'των '+n+' ραντεβού του'}`:''}; Δεν αναιρείται.`,{ok:'Διαγραφή',danger:true}))return;
    clearDraft();S.data.students=S.data.students.filter(x=>x.id!==p0.id);S.data.appts=appts().filter(a=>a.sid!==p0.id);S.data.waitlist=(S.data.waitlist||[]).filter(w=>w.sid!==p0.id);save();toast('Διαγράφηκε.');go('people');};
  const nb=$('#p-new');if(nb)nb.onclick=()=>apptDialog({date:todayISO(),sids:[p0.id]});
  if(!isNew)consCard(p0);}
const PERS_COLORS=['#7462B4','#3A8A61','#2F7FA8','#C77A3A','#B4527A','#8A7A2E','#C46A7A','#5A6ACF','#2E8C8C','#9C5BB5'];

/* ---------- ρυθμίσεις: λίστα κατηγοριών, κάθε κατηγορία σε δική της σελίδα ---------- */
function isPrivate(){return biz().kind==='private';}
const SET_SECS=()=>[
  ['prof','',prof().p.i||'✨','Επάγγελμα',prof().p.n],
  ['info','',isPrivate()?'👤':'🏢',isPrivate()?'Προσωπικά στοιχεία':'Στοιχεία επιχείρησης',isPrivate()?(S.data.settings.myName||'Όνομα, τηλέφωνο'):(biz().name||'Επωνυμία, τηλέφωνο, ΑΦΜ')],
  ['staff','',`👥`,'Προσωπικό',(providers().length===1?'1 άτομο κάνει ραντεβού':providers().length+' άτομα κάνουν ραντεβού')],
  ['hours','','🕘','Ωράριο και αργίες',agCfg().from+'–'+agCfg().to],
  ['look','','🎨','Χρώμα και φόντο','Το χρώμα της εφαρμογής και το υδατογράφημα'],
  ['words','','🏷️','Πελάτες ή ασθενείς ή μαθητές;','Τώρα λέγονται «'+LX('whoPl')+'» και κλείνεις «'+LX('one')+'»'],
  ['msgs','','💬','Μηνύματα και συγκαταθέσεις','Επιβεβαιώσεις, κείμενο συγκατάθεσης, προσφορές'],
  ['backup','','🛟','Αντίγραφα ασφαλείας',bkStatusShort()],
  ['demo','','🧪','Δοκιμαστική λειτουργία',S.data.settings.demo?'Ενεργή — βλέπεις παραδείγματα':'Δες την εφαρμογή με παραδείγματα'],
  ['about','','ℹ️','Εγκατάσταση και έκδοση','Έκδοση '+APP_VERSION]];
function viewSettingsPage(r){const id=r.id==='business'?'info':r.id;const L=SET_SECS();const sec=L.find(x=>x[0]===id);
  if(!sec){M().innerHTML=`${pageHead('Ρυθμίσεις','')}<div class="setlist">${L.map(([k,,i,t,d])=>`<a class="setrow" href="#/settings/${k}"><span class="seti">${i}</span><span class="grow"><b>${esc(t)}</b><small>${esc(d)}</small></span>${ic('right',18)}</a>`).join('')}</div><p class="tiny muted" style="text-align:center;margin-top:18px">© 2026 Ανδρέας Μ. Γλεντζάκης · Ημερολόγιο ${APP_VERSION}</p>`;return;}
  M().innerHTML=`<a class="setback" href="#/settings">${ic('left',18)} Ρυθμίσεις</a>${pageHead(esc(sec[3]),'')}<div id="sb"></div>`;SETP[id]($('#sb'));}
const SETP={
 prof(el){el.innerHTML=`<p class="small muted" style="margin-top:0">Αλλάζουν οι λέξεις, οι ειδικότητες του προσωπικού, η διάρκεια ραντεβού και το χρώμα. Τα ραντεβού και τα πρόσωπα μένουν όπως είναι.</p>${profPickerHTML(S.data.settings.prof,true)}`;
  el.onclick=async e=>{const pe=e.target.closest('[data-pedit]');if(pe){e.stopPropagation();const r=await profAddDialog((findProf(pe.dataset.pedit)||{g:{}}).g.g,customProfs().find(x=>x.id===pe.dataset.pedit));if(r)render();return;}const ad=e.target.closest('[data-padd]');if(ad){const id=await profAddDialog(ad.dataset.padd);if(id){S.data.settings.prof=id;S.data.settings.lex={};save();toast('Επάγγελμα: '+prof().p.n,'ok');render();}return;}const b=e.target.closest('[data-pf]');if(!b)return;S.data.settings.prof=b.dataset.pf;S.data.settings.lex={};save();toast('Επάγγελμα: '+prof().p.n,'ok');render();};},
 info(el){const B=biz();const pv=isPrivate();
  el.innerHTML=`<div class="seg kindseg field"><button type="button" data-kind="biz" class="${pv?'':'on'}">🏢 Επιχείρηση</button><button type="button" data-kind="private" class="${pv?'on':''}">👤 Ιδιώτης</button></div>
  <p class="small muted" style="margin-top:0">${pv?'Για προσωπική χρήση: μόνο τα δικά σου στοιχεία.':'Μπαίνουν στις υπενθυμίσεις προς τους πελάτες και στα PDF.'}</p>
  <form class="card" id="inf">
   <div class="field"><label class="f" for="i-me">Το όνομά σου</label><input class="in" id="i-me" name="me" value="${esc(S.data.settings.myName||'')}" autocomplete="name"></div>
   ${pv?'':`<div class="field"><label class="f" for="i-bn">Επωνυμία</label><input class="in" id="i-bn" name="name" value="${esc(B.name||'')}" placeholder="π.χ. ${esc(prof().p.n)} Μαρία"></div>`}
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="i-ph">Τηλέφωνο</label><input class="in" id="i-ph" name="phone" type="tel" value="${esc(B.phone||'')}"></div><div class="field"><label class="f" for="i-em">Email</label><input class="in" id="i-em" name="email" type="email" value="${esc(B.email||'')}"></div></div>
   <div class="field"><label class="f" for="i-ad">Διεύθυνση</label><input class="in" id="i-ad" name="addr" value="${esc(B.addr||'')}"></div>
   ${pv?'':`<div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="i-afm">ΑΦΜ <span class="tiny muted">· προαιρετικό</span></label><input class="in" id="i-afm" name="afm" inputmode="numeric" value="${esc(B.afm||'')}"></div><div class="field"><label class="f" for="i-web">Ιστοσελίδα <span class="tiny muted">· προαιρετικό</span></label><input class="in" id="i-web" name="web" value="${esc(B.web||'')}"></div></div>`}
   <button class="btn pri">${ic('check',16)} Αποθήκευση</button></form>`;
  $$('[data-kind]',el).forEach(b=>b.onclick=()=>{B.kind=b.dataset.kind;save();render();});
  $('#inf',el).onsubmit=e=>{e.preventDefault();const o=fd(e.target);S.data.settings.myName=o.me.trim();if(!isPrivate()){B.name=(o.name||'').trim();B.afm=(o.afm||'').trim();B.web=(o.web||'').trim();}B.phone=o.phone.trim();B.email=o.email.trim();B.addr=o.addr.trim();save();toast('Αποθηκεύτηκε.','ok');render();};},
 staff(el){const B=biz();const row=(x,me)=>{const pv=me?provById('me'):x;return`<div class="staffrow"><i class="pvb" style="background:${pv.color}">${provIni(me?{id:'me'}:x)}</i><div class="grow"><b>${esc(me?(S.user.name||'Εγώ')+' (εγώ)':x.name)}</b><div class="small muted">${esc(roleName(me?B.meRole:x.role,me?B.meCustom:x.custom))}${!me&&x.phone?' · '+esc(x.phone):''}</div><div class="row" style="margin-top:4px;gap:4px">${(me?B.meTeaches:x.appts)?`<span class="chip ok">${ic('calendar',13)} Κάνει ραντεβού</span>`:`<span class="chip">Χωρίς ραντεβού</span>`}${((me?B.meCerts:x.certs)||[]).filter(c=>c.until).map(c=>{const d=Math.round((new Date(c.until+'T12:00')-new Date(todayISO()+'T12:00'))/864e5);return d<=30?`<span class="chip ${d<0?'bad':'y'}">${esc(c.name)}: ${d<0?'έληξε':'λήγει '+fmtShort(c.until)}</span>`:'';}).join('')}</div></div><button class="iconbtn" data-stf="${me?'me':x.id}" aria-label="Αλλαγή">${ic('edit',16)}</button></div>`;};
  el.innerHTML=`<div class="card"><p class="small muted" style="margin-top:0">Όσοι «κάνουν ραντεβού» έχουν δικό τους χρώμα στο ημερολόγιο και μετράνε στα ελεύθερα κενά.</p>${row(null,1)}${B.staff.map(x=>row(x)).join('')}<button class="btn pri" id="st-add" style="margin-top:12px">${ic('plus',16)} Προσθήκη προσωπικού</button></div>`;
  $('#st-add',el).onclick=()=>staffDialog();$$('[data-stf]',el).forEach(b=>b.onclick=()=>staffDialog(b.dataset.stf));},
 hours(el){const B=biz(),c=agCfg(),y=+todayISO().slice(0,4),HL=holList(y),t=todayISO();
  el.innerHTML=`<div class="card section"><dl class="kv"><dt>Ώρες</dt><dd>${c.from}–${c.to}</dd><dt>Μέρες</dt><dd>${DAY_ORDER.filter(d=>c.days.includes(d)).map(d=>WDAYS_S[d]).join(', ')||'—'}</dd><dt>Διάστημα</dt><dd>${c.step} λεπτά</dd></dl><button class="btn pri" id="st-hr">${ic('clock',16)} Αλλαγή ωραρίου</button></div>
  <div class="card"><label class="switch"><span><b>Κλειστά στις επίσημες αργίες</b><small>Βγαίνουν αυτόματα κλειστές κάθε χρόνο — και οι κινητές (Καθαρά Δευτέρα, Πάσχα, Αγίου Πνεύματος).</small></span><input type="checkbox" id="hl-on" ${B.holOff?'':'checked'}></label>
   <div style="margin-top:10px;${B.holOff?'opacity:.5;pointer-events:none':''}">${HL.map(h=>`<label class="holrow ${h.date<t?'past':''}"><span class="hd">${WDAYS_S[wdOf(h.date)]} ${fmtShort(h.date)}</span><span class="grow">${esc(h.name)}</span><input type="checkbox" data-hol="${h.id}" ${holOn(h)?'checked':''}></label>`).join('')}</div></div>`;
  $('#st-hr',el).onclick=agendaCfgDialog;$('#hl-on',el).onchange=e=>{B.holOff=!e.target.checked;save();render();};$$('[data-hol]',el).forEach(x=>x.onchange=()=>{B.hol=B.hol||{};B.hol[x.dataset.hol]=x.checked;save();});},
 look(el){const base=profLex(),L=S.data.settings.lex||{},cur=themeColor();
  const lx=(k,l)=>`<div class="field"><label class="f" for="lx-${k}">${l}</label><input class="in" id="lx-${k}" data-lx="${k}" value="${esc(L[k]||'')}" placeholder="${esc(base[k]||'')}"></div>`;
  el.innerHTML=`<div class="card section"><h3>Χρώμα εφαρμογής</h3>${THEME_COLORS.map(([n,cs])=>`<div class="small muted" style="margin:10px 0 6px">${n}</div><div class="thgrid">${cs.map(c=>`<button type="button" data-th="${c}" style="background:${c}" class="${cur===c?'on':''}" aria-label="Χρώμα ${c}">${cur===c?ic('check',18):''}</button>`).join('')}</div>`).join('')}
   <div class="field" style="margin-top:16px"><label class="f" for="ci-op">Ένταση χρώματος <span class="tiny muted" id="ci-v">${S.data.settings.colInt!=null?S.data.settings.colInt:100}%</span></label><div class="cirow"><span class="tiny muted">Απαλό</span><input type="range" id="ci-op" min="20" max="100" step="5" value="${S.data.settings.colInt!=null?S.data.settings.colInt:100}"><span class="tiny muted">Ζωντανό</span></div><div class="cisample"><i style="background:${softColor(cur)}"></i><span class="tiny muted">Χαμηλώνεις για να είναι πιο ήπιο, πιο «γκριζαρισμένο».</span></div></div>
   <div class="field" style="margin-top:16px"><label class="f" for="wc-op">Υδατογράφημα στο φόντο <span class="tiny muted" id="wc-v">${S.data.settings.wcOp!=null?S.data.settings.wcOp:60}%</span></label><input type="range" id="wc-op" min="0" max="100" step="5" value="${S.data.settings.wcOp!=null?S.data.settings.wcOp:60}" style="width:100%"><div class="tiny muted">0 = καθαρό φόντο. Τα χρώματα ακολουθούν το χρώμα της εφαρμογής.</div></div>
   <div class="row" style="margin-top:12px;align-items:center"><label class="small" for="th-own">Δικό μου χρώμα</label><input type="color" id="th-own" value="${cur}"><button class="btn sm ghost" id="th-def">Το χρώμα του επαγγέλματος</button></div></div>`;
  $$('[data-th]',el).forEach(b=>b.onclick=()=>{S.data.settings.color=b.dataset.th;save();render();});const ci=$('#ci-op',el);ci.oninput=()=>{S.data.settings.colInt=+ci.value;$('#ci-v',el).textContent=ci.value+'%';applyTheme();const sw=$('.cisample i',el);if(sw)sw.style.background=softColor(themeColor());};ci.onchange=()=>save();const wo=$('#wc-op',el);wo.oninput=()=>{S.data.settings.wcOp=+wo.value;$('#wc-v',el).textContent=wo.value+'%';applyTheme();};wo.onchange=()=>save();$('#th-own',el).onchange=e=>{S.data.settings.color=e.target.value;save();render();};$('#th-def',el).onclick=()=>{delete S.data.settings.color;save();render();};
  },
 msgs(el){el.innerHTML=`<div class="card section"><label class="switch"><span><b>Επιβεβαίωση με μήνυμα μόλις κλείνεις ραντεβού</b><small>Με την «Αποθήκευση» ανοίγει έτοιμο μήνυμα προς τον πελάτη (αν έχει τηλέφωνο). Εσύ πατάς μόνο «Αποστολή».</small></span><input type="checkbox" id="cf-on" ${S.data.settings.confOff?'':'checked'}></label>
   <div class="field" style="margin-top:12px"><label class="f" for="cf-t">Κείμενο επιβεβαίωσης</label><textarea class="in" id="cf-t" style="min-height:80px">${esc(S.data.settings.confTpl||CONF_TPL_DEF)}</textarea><div class="tiny muted" style="margin-top:4px">Λέξεις που αλλάζουν μόνες τους: {όνομα} {ημέρα} {ώρα} {επιχείρηση}</div></div>
   <div class="row"><button class="btn pri" id="cf-s">${ic('check',16)} Αποθήκευση</button><button class="btn ghost" id="cf-d">Αρχικό κείμενο</button></div></div>
   <div class="card section"><h3>Κείμενο ενημέρωσης και συγκατάθεσης</h3><p class="small muted" style="margin-top:0">Αυτό λες ή στέλνεις στον πελάτη πριν τσεκάρεις τις συγκαταθέσεις στην καρτέλα του. Ξεχωριστά για ραντεβού και για προσφορές.</p>
    <textarea class="in" id="cs-t" style="min-height:120px">${esc(S.data.settings.consTpl||CONS_TXT_DEF)}</textarea><div class="tiny muted" style="margin:4px 0 8px">{επιχείρηση} = η επωνυμία σου</div>
    <div class="row"><button class="btn pri" id="cs-s">${ic('check',16)} Αποθήκευση</button><button class="btn ghost" id="cs-d">Αρχικό κείμενο</button></div></div>
   <div class="card section"><h3>Μήνυμα προσφοράς</h3><p class="small muted" style="margin-top:0">Πηγαίνει μόνο σε όσους έχουν πει «ναι» στις προσφορές.</p><button class="btn pri" id="of-go">${ic('send',16)} Γράψε μήνυμα προσφοράς</button></div>
   <div class="card"><h3>Υπενθυμίσεις την προηγούμενη μέρα</h3><p class="small muted" style="margin-top:0">Από το «Σήμερα» → «Αύριο» → «Στείλε υπενθυμίσεις», ή από το Ημερολόγιο → ⋯ → «Υπενθυμίσεις».</p></div>`;
  $('#cs-s',el).onclick=()=>{S.data.settings.consTpl=$('#cs-t',el).value.trim()||CONS_TXT_DEF;save();toast('Αποθηκεύτηκε.','ok');};$('#cs-d',el).onclick=()=>{delete S.data.settings.consTpl;save();render();};$('#of-go',el).onclick=()=>offerDialog();
  $('#cf-on',el).onchange=e=>{S.data.settings.confOff=!e.target.checked;save();};$('#cf-s',el).onclick=()=>{S.data.settings.confTpl=$('#cf-t',el).value.trim()||CONF_TPL_DEF;save();toast('Αποθηκεύτηκε.','ok');};$('#cf-d',el).onclick=()=>{delete S.data.settings.confTpl;save();render();};},
 demo(el){const on=!!S.data.settings.demo;
  el.innerHTML=`<div class="card"><p class="small" style="margin-top:0">Γεμίζει την εφαρμογή με ${DEMO_NAMES.length} ${esc(LX('whoPlL'))}-παραδείγματα και ραντεβού για τις επόμενες μέρες, για να δεις πώς δουλεύει ή να τη δείξεις σε κάποιον. Όσο είναι ενεργή, φαίνεται η κίτρινη ταινία «Δοκιμαστική λειτουργία» πάνω πάνω.</p>
   <p class="small muted">Τα δικά σου ραντεβού και ${esc(LX('whoPlL'))} δεν πειράζονται. Με το «Τέλος δοκιμής» σβήνονται μόνο τα παραδείγματα.</p>
   ${on?`<button class="btn danger wide" id="dm-off">Τέλος δοκιμής — σβήσε τα παραδείγματα</button>`:`<button class="btn pri wide" id="dm-on">🧪 Ξεκίνα δοκιμαστική λειτουργία</button>`}</div>`;
  const a=$('#dm-on',el);if(a)a.onclick=()=>{demoFill();save();toast('Μπήκαν τα παραδείγματα.','ok');go('today');};const b=$('#dm-off',el);if(b)b.onclick=demoClear;},
 words(el){const base=profLex(),L=S.data.settings.lex||{};
  el.innerHTML=`<div class="card"><h3>Πώς λες τους ανθρώπους που έρχονται;</h3><p class="small muted" style="margin-top:0">Η λέξη που βλέπεις παντού: στο μενού («${esc(LX('whoPl'))}»), στο νέο ραντεβού («Διάλεξε ${esc(LX('whoAcc'))}»), στην καρτέλα.</p>
   <div class="chips">${Object.entries(IM_WHO).map(([k,w])=>`<button type="button" class="chipt ${LX('who')===w.who?'on':''}" data-who="${k}">${esc(w.who)}</button>`).join('')}</div>
   <h3 style="margin-top:18px">Τι κλείνεις;</h3><p class="small muted" style="margin-top:0">Το όνομα κάθε εγγραφής, π.χ. στο ημερολόγιο του κινητού.</p>
   <div class="chips">${['Ραντεβού','Μάθημα','Συνεδρία','Προπόνηση','Δουλειά','Κράτηση','Επίσκεψη'].map(o=>`<button type="button" class="chipt ${LX('one')===o?'on':''}" data-one="${o}">${o}</button>`).join('')}</div>
   ${Object.keys(S.data.settings.lex||{}).length?`<button class="btn sm ghost" id="lx-def" style="margin-top:14px">Όπως ήταν στο επάγγελμα</button>`:''}
   <details style="margin-top:14px"><summary class="small muted">Για προχωρημένους: γράψε μόνος σου κάθε λέξη</summary>
   <p class="small muted" style="margin:8px 0 10px">Η ίδια λέξη αλλάζει κατάληξη ανάλογα με τη φράση. Γράψε στο κουτάκι τη λέξη όπως ταιριάζει στη φράση από πάνω του. Από κάτω βλέπεις πώς θα φαίνεται.</p>
   ${[['who','Τίτλος στην καρτέλα: «Νέος ___»','Νέος {}'],['whoAcc','Στο νέο ραντεβού: «Διάλεξε ___»','Διάλεξε {}…'],['whoGen','Κουμπί: «Καρτέλα ___»','Καρτέλα {}'],['whoPl','Στο κάτω μενού: «___»','{}'],['whoPlL','Στη φράση: «Πάγιοι ___»','Πάγιοι {}'],['one','Στο ημερολόγιο του κινητού: «___: Μαρία»','{}: Μαρία']].map(([k,l,ex])=>`<div class="lxrow"><label class="f" for="lx-${k}">${l}</label><input class="in" id="lx-${k}" data-lx="${k}" data-ex="${esc(ex)}" value="${esc(L[k]||'')}" placeholder="${esc(base[k]||'')}"><div class="lxprev" id="lxp-${k}">${esc(ex.replace('{}',L[k]||LX(k)))}</div></div>`).join('')}
   <button class="btn pri" id="st-lx">${ic('check',15)} Αποθήκευση</button></details></div>`;
  $$('[data-who]',el).forEach(b=>b.onclick=()=>{const w=IM_WHO[b.dataset.who];const L=Object.assign({},S.data.settings.lex||{});['who','whoAcc','whoGen','whoPl','whoPlL'].forEach(k=>{if(w[k]===base[k])delete L[k];else L[k]=w[k];});S.data.settings.lex=L;save();toast('Τώρα λέγονται «'+w.whoPl+'».','ok');render();});
  $$('[data-one]',el).forEach(b=>b.onclick=()=>{const L=Object.assign({},S.data.settings.lex||{});if(b.dataset.one===base.one)delete L.one;else L.one=b.dataset.one;S.data.settings.lex=L;save();render();});
  $$('[data-lx]',el).forEach(x=>x.oninput=()=>{const p=$('#lxp-'+x.dataset.lx,el);if(p)p.textContent=x.dataset.ex.replace('{}',x.value.trim()||x.placeholder);});
  const ld=$('#lx-def',el);if(ld)ld.onclick=()=>{S.data.settings.lex={};save();render();};
  $('#st-lx',el).onclick=()=>{const o={};$$('[data-lx]',el).forEach(i=>{const v=i.value.trim();if(v&&v!==base[i.dataset.lx])o[i.dataset.lx]=v;});S.data.settings.lex=o;save();toast('Αποθηκεύτηκε.','ok');render();};},
 backup(el){backupPage(el);},
 about(el){el.innerHTML=`<div class="card section"><h3>Εγκατάσταση</h3>${isStandalone()?'<p class="small muted" style="margin:0">Η εφαρμογή είναι εγκατεστημένη σε αυτή τη συσκευή.</p>':INST?`<p class="small muted" style="margin-top:0">Βάλ' την στην αρχική οθόνη για να ανοίγει σαν κανονική εφαρμογή.</p><button class="btn pri" id="ab-in">${ic('download',16)} Εγκατάσταση</button>`:`<p class="small muted" style="margin:0">Από τις τρεις τελείες του Chrome: «Προσθήκη στην αρχική οθόνη» → «Εγκατάσταση». Αν γράφει «έχει ήδη εγκατασταθεί», ψάξε «Ημερολόγιο» στη λίστα εφαρμογών του κινητού.</p>`}</div>
  <div class="card"><h3>Έκδοση ${esc(APP_VERSION)}</h3><button class="btn" id="up-chk">${ic('refresh',16)} Έλεγχος αναβάθμισης</button><p class="tiny muted" style="margin:12px 0 0">© 2026 Ανδρέας Μ. Γλεντζάκης. Με την επιφύλαξη παντός δικαιώματος.</p></div>`;
  const ai=$('#ab-in',el);if(ai)ai.onclick=installNow;$('#up-chk',el).onclick=checkUpdate;}
};
function staffDialog(id){const B=biz();const me=id==='me';const x=me?{name:S.data.settings.myName||'',role:B.meRole,custom:B.meCustom,color:B.meColor,appts:B.meTeaches,certs:B.meCerts||[],phone:B.mePhone||'',email:B.meEmail||'',hired:B.meHired||'',afm:B.meAfm||'',amka:B.meAmka||'',notes:B.meNotes||''}
   :id?B.staff.find(y=>y.id===id):{id:uid(),name:'',role:(ROLES.find(r=>r[2])||ROLES[0])[0],color:STAFF_COLORS[(B.staff.length+1)%STAFF_COLORS.length],appts:true,phone:'',certs:[],created:new Date().toISOString()};if(!x)return;let col=x.color;let certs=(x.certs||[]).map(c=>Object.assign({},c));
  const sugg=(CERT_SUGG[prof().g.g]||CERT_SUGG['Άλλο']);
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">${me?'Τα δικά μου στοιχεία':id?esc(x.name):'Νέο μέλος προσωπικού'}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><form id="sf">
   ${me?'':`<div class="field"><label class="f" for="sf-n">Ονοματεπώνυμο</label><input class="in" id="sf-n" name="name" required value="${esc(x.name||'')}"></div>`}
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="sf-r">Ειδικότητα</label><select class="in" id="sf-r" name="role">${ROLES.map(r=>opt(r[0],r[1],x.role)).join('')}<option value="__new">+ Νέα ειδικότητα…</option></select></div>
    <div class="field"><label class="f" for="sf-hd">Ημερομηνία πρόσληψης</label><input class="in" id="sf-hd" name="hired" type="date" value="${esc(x.hired||'')}"></div></div>
   <div class="field" id="sf-cw" ${x.role==='other'?'':'hidden'}><label class="f" for="sf-c">Ποια ειδικότητα</label><input class="in" id="sf-c" name="custom" value="${esc(x.custom||'')}"></div>
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="sf-ph">Τηλέφωνο</label><input class="in" id="sf-ph" name="phone" type="tel" value="${esc(x.phone||'')}"></div><div class="field"><label class="f" for="sf-em">Email</label><input class="in" id="sf-em" name="email" type="email" value="${esc(x.email||'')}"></div>
    <div class="field"><label class="f" for="sf-afm">ΑΦΜ</label><input class="in" id="sf-afm" name="afm" inputmode="numeric" maxlength="9" value="${esc(x.afm||'')}"></div><div class="field"><label class="f" for="sf-amka">ΑΜΚΑ</label><input class="in" id="sf-amka" name="amka" inputmode="numeric" maxlength="11" value="${esc(x.amka||'')}"></div></div>
   <label class="f">Πιστοποιητικά και άδειες <span class="tiny muted">· σε ειδοποιεί 30 μέρες πριν λήξουν</span></label><div id="sf-certs"></div>
   <div class="chips" style="margin:4px 0 12px">${sugg.map(n=>`<button type="button" class="chipt" data-cadd="${esc(n)}">${ic('plus',12)} ${esc(n)}</button>`).join('')}<button type="button" class="chipt" data-cadd="">${ic('plus',12)} Άλλο</button></div>
   <div class="field"><label class="f" for="sf-no">Σημειώσεις</label><textarea class="in" id="sf-no" name="notes" style="min-height:56px">${esc(x.notes||'')}</textarea></div>
   <label class="switch field"><span><b>Κάνει ραντεβού</b><small>Εμφανίζεται στο ημερολόγιο με δικό του χρώμα.</small></span><input type="checkbox" name="appts" ${x.appts!==false?'checked':''}></label>
   <div class="field"><label class="f">Χρώμα</label><div class="scols">${STAFF_COLORS.map(c=>`<button type="button" data-sc="${c}" style="background:${c}" class="${col===c?'on':''}" aria-label="Χρώμα"></button>`).join('')}</div></div>
   <p class="tiny muted">Τα στοιχεία (ΑΦΜ, ΑΜΚΑ κ.λπ.) μένουν μόνο σε αυτή τη συσκευή. Ενημέρωσε τον εργαζόμενο ότι τα κρατάς.</p>
   <div class="row" style="justify-content:space-between">${!me&&id?`<button type="button" class="btn danger" id="sf-del">${ic('trash',16)}</button>`:'<span></span>'}<span class="row"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Αποθήκευση</button></span></div></form>`);
  const f=$('#sf',md.el);const t=todayISO();
  const drawC=()=>{$('#sf-certs',md.el).innerHTML=certs.length?certs.map((c,i)=>{const d=c.until?Math.round((new Date(c.until+'T12:00')-new Date(t+'T12:00'))/864e5):null;return`<div class="certrow ${d!=null&&d<0?'exp':d!=null&&d<=30?'soon':''}"><input class="in" data-ci="${i}" data-ck="name" value="${esc(c.name||'')}" placeholder="Όνομα πιστοποιητικού"><label class="tiny muted">Λήγει<input class="in" type="date" data-ci="${i}" data-ck="until" value="${esc(c.until||'')}"></label><button type="button" class="iconbtn" data-cdel="${i}" aria-label="Αφαίρεση">${ic('x',15)}</button>${d!=null?`<small class="cst">${d<0?'έληξε':d<=30?'λήγει σε '+d+' μέρες':'σε ισχύ'}</small>`:''}</div>`;}).join(''):'<p class="tiny muted" style="margin:0 0 4px">Κανένα ακόμα — πάτα μια πρόταση από κάτω.</p>';};drawC();
  md.el.addEventListener('input',e=>{const c=e.target.closest('[data-ci]');if(c)certs[+c.dataset.ci][c.dataset.ck]=c.value;});
  md.el.addEventListener('change',e=>{if(e.target.matches('[data-ck=until]'))drawC();});
  f.onclick=async e=>{const b=e.target.closest('[data-sc]');if(b){col=b.dataset.sc;$$('[data-sc]',f).forEach(z=>z.classList.toggle('on',z===b));return;}
    const a=e.target.closest('[data-cadd]');if(a){certs.push({id:uid(),name:a.dataset.cadd,until:''});drawC();const ins=$$('[data-ck=until]',md.el);if(a.dataset.cadd)ins[ins.length-1].focus();else $$('[data-ck=name]',md.el).pop().focus();return;}
    const d=e.target.closest('[data-cdel]');if(d){certs.splice(+d.dataset.cdel,1);drawC();}};
  $('#sf-r',md.el).onchange=async e=>{if(e.target.value==='__new'){const n=((await promptDlg('Νέα ειδικότητα'))||'').trim();if(!n){e.target.value=x.role;return;}const idr='c_'+uid().slice(0,6);S.data.settings.customRoles=(S.data.settings.customRoles||[]).concat([[idr,n,1]]);ROLES=profRoles();save();e.target.insertAdjacentHTML('afterbegin',opt(idr,n,idr));e.target.value=idr;}$('#sf-cw',md.el).hidden=e.target.value!=='other';};
  f.onsubmit=e=>{e.preventDefault();const o=fd(f);const ap=!!f.appts.checked;const C=certs.filter(c=>(c.name||'').trim()).map(c=>Object.assign(c,{name:c.name.trim()}));
    if(o.afm&&!/^\d{9}$/.test(o.afm))return toast('Ο ΑΦΜ έχει 9 ψηφία.','bad');if(o.amka&&!/^\d{11}$/.test(o.amka))return toast('Ο ΑΜΚΑ έχει 11 ψηφία.','bad');
    if(me){Object.assign(B,{meRole:o.role,meCustom:o.custom||'',meColor:col,meTeaches:ap,meCerts:C,mePhone:o.phone,meEmail:o.email,meHired:o.hired,meAfm:o.afm,meAmka:o.amka,meNotes:o.notes});}
    else{if(!o.name.trim())return toast('Γράψε όνομα.','bad');Object.assign(x,{name:o.name.trim(),phone:(o.phone||'').trim(),email:o.email||'',role:o.role,custom:o.custom||'',color:col,appts:ap,certs:C,hired:o.hired,afm:o.afm,amka:o.amka,notes:o.notes});if(!B.staff.includes(x))B.staff.push(x);}
    save();md.close();toast('Αποθηκεύτηκε.','ok');render();};
  const dl=$('#sf-del',md.el);if(dl)dl.onclick=async()=>{const n=appts().filter(a=>a.by===x.id).length;if(!await confirmDlg(`Αφαίρεση «${esc(x.name)}»;${n?` Τα ${n} ραντεβού του περνούν σε σένα.`:''}`,{ok:'Αφαίρεση',danger:true}))return;appts().forEach(a=>{if(a.by===x.id)delete a.by;});B.staff=B.staff.filter(y=>y.id!==x.id);save();md.close();render();};}

/* ---------- αντίγραφα ασφαλείας (ίδιο στήσιμο με το Δρομολόγιο) ----------
   1. μέσα στην εφαρμογή: γίνεται μόνο του, κρατά τα 10 νεότερα
   2. φάκελος στο κινητό: δικός του φάκελος (όχι ο φάκελος άλλης εφαρμογής), μόνο του μία φορά τη μέρα
   3. σύννεφο: Drive / OneDrive / Dropbox μέσα από την κοινοποίηση
   4. αρχείο με το χέρι
*/
const FS_DB='shared-backups',FS_STORE='handles',FS_KEY='imerologio-root',BK_KEEP=10;
const fsOK=()=>typeof window.showDirectoryPicker==='function'&&window.isSecureContext;
function fsIdb(){return new Promise((ok,no)=>{const r=indexedDB.open(FS_DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(FS_STORE))d.createObjectStore(FS_STORE);};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}
async function fsDo(mode,fn){try{const db=await fsIdb();return await new Promise((ok,no)=>{const q=fn(db.transaction(FS_STORE,mode).objectStore(FS_STORE));q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error);});}catch(e){return null;}}
const fsGet=()=>fsDo('readonly',st=>st.get(FS_KEY)),fsPut=h=>fsDo('readwrite',st=>st.put(h,FS_KEY)),fsDel=()=>fsDo('readwrite',st=>st.delete(FS_KEY));
async function fsPerm(h,ask){try{let p=await h.queryPermission({mode:'readwrite'});if(p==='granted')return true;if(!ask)return false;p=await h.requestPermission({mode:'readwrite'});return p==='granted';}catch(e){return false;}}
const normT=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const fsOtherApp=n=>/(fish|ψαρ|δρομολογ|dromolog|υγει|ygei|ταμει|tameia|lumio|identify|brewtopia|οχημ|φωτομετρ|fotometr)/.test(normT(n));
async function fsRoot(ask){if(!fsOK())return null;let h=await fsGet();if(h&&await fsPerm(h,ask))return h;return null;}
async function fsChoose(){if(!fsOK())return toast('Αυτή η συσκευή δεν επιτρέπει επιλογή φακέλου. Χρησιμοποίησε το σύννεφο ή το αρχείο.','bad');
  let h;try{h=await window.showDirectoryPicker({id:'imerologio',mode:'readwrite',startIn:'documents'});}catch(e){return;}
  if(!await fsPerm(h,true))return toast('Δεν δόθηκε άδεια εγγραφής στον φάκελο.','bad');
  if(fsOtherApp(h.name)&&!await confirmDlg(`Ο φάκελος «${esc(h.name)}» μοιάζει να ανήκει σε άλλη εφαρμογή. Να μπαίνουν σίγουρα εκεί τα αντίγραφα του Ημερολογίου;`,{ok:'Ναι, εκεί',cancel:'Διάλεξε άλλον'}))return fsChoose();
  await fsPut(h);const ok=await fsSave(h);toast(ok?'Ο φάκελος ορίστηκε και μπήκε το πρώτο αντίγραφο.':'Ο φάκελος ορίστηκε.','ok');render();}
async function fsDir(root){try{return await root.getDirectoryHandle(BACKUP_SUB,{create:true});}catch(e){return null;}}
async function fsSave(root){root=root||await fsRoot(false);if(!root)return false;const d=await fsDir(root);if(!d)return false;
  try{const fh=await d.getFileHandle('imerologio-'+todayISO()+'.json',{create:true});const w=await fh.createWritable();await w.write(backupText());await w.close();
    const names=[];for await(const[n,h]of d.entries())if(h.kind==='file'&&/^imerologio-\d{4}-\d{2}-\d{2}\.json$/.test(n))names.push(n);names.sort().reverse().slice(30).forEach(n=>d.removeEntry(n).catch(()=>{}));
    S.data.meta.folderLast=Date.now();return true;}catch(e){return false;}}
async function fsList(){const root=await fsRoot(false);if(!root)return[];const d=await fsDir(root);if(!d)return[];const L=[];try{for await(const[n,h]of d.entries())if(h.kind==='file'&&n.endsWith('.json'))L.push([n,h]);}catch(e){}return L.sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10);}
// μέσα στην εφαρμογή (ιδιωτικός χώρος του φυλλομετρητή)
async function opfsDir(){try{const r=await navigator.storage.getDirectory();return await r.getDirectoryHandle('imerologio-antigrafa',{create:true});}catch(e){return null;}}
async function opfsSave(){const d=await opfsDir();if(!d)return false;try{const fh=await d.getFileHandle('imerologio-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.json',{create:true});const w=await fh.createWritable();await w.write(backupText());await w.close();
  const L=[];for await(const[n,h]of d.entries())if(h.kind==='file')L.push(n);L.sort().reverse().slice(BK_KEEP).forEach(n=>d.removeEntry(n).catch(()=>{}));S.data.meta.opfsLast=Date.now();return true;}catch(e){return false;}}
async function opfsList(){const d=await opfsDir();if(!d)return[];const L=[];try{for await(const[n,h]of d.entries())if(h.kind==='file')L.push([n,h]);}catch(e){}return L.sort((a,b)=>b[0].localeCompare(a[0]));}
function backupText(){return JSON.stringify({app:'imerologio',version:APP_VERSION,savedAt:new Date().toISOString(),data:S.data});}
const bkName=()=>'imerologio-'+todayISO()+'.json';
function bkWays(){return Object.assign({folder:false,cloud:false},S.data.settings.bkWays||{});}
function markBacked(){S.data.meta.lastBackup=Date.now();S.data.meta.changes=0;try{localStorage.setItem(STORE,JSON.stringify(S.data));}catch(e){}}
function bkStatusShort(){const m=S.data.meta;return m.lastBackup?'Τελευταίο: '+fmtShort(new Date(m.lastBackup).toISOString().slice(0,10))+(m.changes?' · '+m.changes+' αλλαγές από τότε':''):'Δεν έχει κρατηθεί ακόμα';}
async function cloudShare(){const f=new File([backupText()],bkName(),{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'Αντίγραφο Ημερολογίου'});S.data.meta.cloudLast=Date.now();markBacked();toast('Έτοιμο. Αν διάλεξες το σύννεφο, το αρχείο ανέβηκε εκεί.','ok');return true;}catch(e){if(e&&e.name==='AbortError'){toast('Ακυρώθηκε· δεν ανέβηκε τίποτα.');return false;}}}
  downloadText(bkName(),backupText(),'application/json');markBacked();toast('Το αρχείο κατέβηκε στις λήψεις. Ανέβασέ το στο σύννεφό σου.','ok');return true;}
async function backupAllNow(){const W=bkWays(),ok=[],no=[];await opfsSave();ok.push('μέσα στην εφαρμογή');
  if(W.folder){(await fsSave(await fsRoot(true)))?ok.push('φάκελος'):no.push('φάκελος');}
  if(W.cloud){(await cloudShare())?ok.push('σύννεφο'):no.push('σύννεφο');}
  markBacked();toast('✓ Αντίγραφο σε: '+ok.join(', ')+'.'+(no.length?' Δεν έγινε σε: '+no.join(', ')+'.':'')+(!W.folder&&!W.cloud?' Διάλεξε και έναν τρόπο έξω από την εφαρμογή.':''),no.length?'bad':'ok');render();}
// αυτόματο: μία φορά τη μέρα μέσα στην εφαρμογή και στον φάκελο (αν έχει ήδη άδεια)
async function autoBackup(){const m=S.data.meta;if(!S.data.students.length&&!(S.data.appts||[]).length)return;const day=24*36e5;
  if(Date.now()-(m.opfsLast||0)>day)await opfsSave();if(bkWays().folder&&Date.now()-(m.folderLast||0)>day)await fsSave();try{localStorage.setItem(STORE,JSON.stringify(S.data));}catch(e){}}
async function backupPage(el){const W=bkWays(),m=S.data.meta;const root=fsOK()?await fsGet():null;const ago=t=>t?fmtShort(new Date(t).toISOString().slice(0,10)):'ποτέ';
  el.innerHTML=`<div class="card section bkhead"><p class="small" style="margin:0 0 10px">${m.lastBackup?'Τελευταίο αντίγραφο: <b>'+fmtDate(new Date(m.lastBackup).toISOString())+'</b>.':'<b>Δεν έχει κρατηθεί ακόμα αντίγραφο.</b>'} Αλλαγές από τότε: ${m.changes||0}.</p>
   <button class="btn pri wide" id="bk-all">🛟 Κράτα αντίγραφο τώρα</button>
   <p class="tiny muted" style="margin:8px 0 0">Μέσα στην εφαρμογή κρατιέται πάντα αντίγραφο μόνο του. Για ασφάλεια διάλεξε και έναν τρόπο έξω από αυτήν.</p></div>
  <details class="bkcard" open><summary><span class="bkic">📁</span><span class="grow"><b>Φάκελος στο κινητό</b><small>${!fsOK()?'δεν υποστηρίζεται σε αυτή τη συσκευή':root?'«'+esc(root.name)+'» / '+BACKUP_SUB+' · '+ago(m.folderLast):'δεν έχει οριστεί'}</small></span></summary>
   ${fsOK()?`<label class="check"><input type="checkbox" data-way="folder" ${W.folder?'checked':''}> Να γίνεται με το «Κράτα αντίγραφο τώρα» και μόνο του κάθε μέρα</label>
   <div class="row" style="margin-top:10px"><button class="btn" id="fs-pick">${ic('folder',16)} ${root?'Άλλαξε φάκελο':'Διάλεξε φάκελο'}</button>${root?`<button class="btn ghost" id="fs-x">${ic('x',15)} Αποσύνδεση</button>`:''}</div>
   <p class="tiny muted" style="margin:8px 0 0">Διάλεξε ή φτιάξε έναν φάκελο μόνο για αντίγραφα (π.χ. «Αντίγραφα»), όχι τον φάκελο άλλης εφαρμογής. Μέσα του μπαίνει ο υποφάκελος «${BACKUP_SUB}».</p>
   <div id="fs-list"></div>`:`<p class="small muted">Χρησιμοποίησε το σύννεφο ή το αρχείο πιο κάτω.</p>`}</details>
  <details class="bkcard"><summary><span class="bkic">☁️</span><span class="grow"><b>Σύννεφο</b><small>${m.cloudLast?'τελευταίο '+ago(m.cloudLast):'Drive, OneDrive, Dropbox, iCloud'}</small></span></summary>
   <label class="check"><input type="checkbox" data-way="cloud" ${W.cloud?'checked':''}> Να γίνεται με το «Κράτα αντίγραφο τώρα»</label>
   <button class="btn pri wide" id="bk-cloud" style="margin-top:10px">☁️ Ανέβασμα στο σύννεφο τώρα</button>
   <details class="det"><summary class="small"><b>Οδηγίες βήμα βήμα</b></summary><ol class="howto small">
    <li>Βεβαιώσου ότι στο κινητό υπάρχει η εφαρμογή του σύννεφού σου (Google Drive, OneDrive, Dropbox) και ότι έχεις μπει με τον λογαριασμό σου.</li>
    <li>Πάτα «☁️ Ανέβασμα στο σύννεφο τώρα».</li>
    <li>Στη λίστα «Κοινοποίηση» διάλεξε «Drive» (ή «OneDrive», «Dropbox»). Στο iPhone «Αποθήκευση στα Αρχεία» → «iCloud Drive».</li>
    <li>Την πρώτη φορά φτιάξε φάκελο «Ημερολόγιο αντίγραφα» και πάτα «Αποθήκευση». Τις επόμενες φορές το σύννεφο τον θυμάται.</li></ol></details></details>
  <details class="bkcard"><summary><span class="bkic">📱</span><span class="grow"><b>Μέσα στην εφαρμογή</b><small>γίνεται μόνο του · ${ago(m.opfsLast)}</small></span></summary><div id="op-list"><p class="small muted">Φόρτωση…</p></div></details>
  <details class="bkcard"><summary><span class="bkic">📤</span><span class="grow"><b>Αρχείο με το χέρι</b><small>κοινοποίηση ή αποθήκευση στις λήψεις</small></span></summary>
   <div class="row"><button class="btn" id="bk-share">${ic('send',16)} Κοινοποίηση</button><button class="btn" id="bk-dl">${ic('download',16)} Αποθήκευση αρχείου</button></div></details>
  <details class="bkcard bkdanger"><summary><span class="bkic">⚠️</span><span class="grow"><b>Επαναφορά</b><small>από αρχείο</small></span></summary>
   <p class="small muted" style="margin-top:0">Η επαναφορά αντικαθιστά ό,τι υπάρχει τώρα. Για επαναφορά από τον φάκελο ή από την εφαρμογή, πάτα ένα αρχείο στις κάρτες πιο πάνω.</p>
   <label class="btn danger">${ic('history',16)} Επαναφορά από αρχείο<input type="file" id="bk-file" accept="application/json,.json,.txt" hidden></label></details>`;
  const fileRows=(L,attr)=>L.length?`<div class="list" style="margin-top:10px">${L.map(([n],i)=>`<button class="rw" ${attr}="${i}"><span class="ricon">${ic('history',16)}</span><span class="grow"><b>${esc(n.replace('imerologio-','').replace('.json',''))}</b><small>${i===0?'νεότερο · ':''}πάτα για επαναφορά</small></span></button>`).join('')}</div>`:'<p class="small muted">Δεν υπάρχουν ακόμα αντίγραφα.</p>';
  $('#bk-all',el).onclick=backupAllNow;$('#bk-cloud',el).onclick=async()=>{await cloudShare();render();};
  $('#bk-share',el).onclick=cloudShare;$('#bk-dl',el).onclick=()=>{downloadText(bkName(),backupText(),'application/json');markBacked();toast('Το αρχείο αποθηκεύτηκε στις λήψεις.','ok');};
  $('#bk-file',el).onchange=e=>{const f=e.target.files[0];if(f)f.text().then(restoreFrom).catch(()=>toast('Δεν διαβάστηκε το αρχείο.','bad'));e.target.value='';};
  $$('[data-way]',el).forEach(x=>x.onchange=async()=>{const w=bkWays();w[x.dataset.way]=x.checked;S.data.settings.bkWays=w;save();if(x.dataset.way==='folder'&&x.checked&&!await fsGet())fsChoose();});
  const fp=$('#fs-pick',el);if(fp)fp.onclick=async()=>{const w=bkWays();w.folder=true;S.data.settings.bkWays=w;save();fsChoose();};
  const fx=$('#fs-x',el);if(fx)fx.onclick=async()=>{await fsDel();const w=bkWays();w.folder=false;S.data.settings.bkWays=w;save();toast('Ο φάκελος αποσυνδέθηκε. Τα αρχεία του δεν σβήστηκαν.');render();};
  if(fsOK()&&root){const FL=await fsList();const box=$('#fs-list',el);if(box){box.innerHTML=fileRows(FL,'data-fsr');box.onclick=async e=>{const b=e.target.closest('[data-fsr]');if(b)restoreFrom(await(await FL[+b.dataset.fsr][1].getFile()).text());};}}
  const OL=await opfsList();const ob=$('#op-list',el);if(ob){ob.innerHTML=fileRows(OL,'data-opr');ob.onclick=async e=>{const b=e.target.closest('[data-opr]');if(b)restoreFrom(await(await OL[+b.dataset.opr][1].getFile()).text());};}}
async function restoreFrom(txt){let o=null;try{const t=String(txt||'');o=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));}catch(e){}const d=o&&o.app==='imerologio'&&o.data;
  if(!d||!Array.isArray(d.students))return toast('Το αρχείο δεν είναι αντίγραφο του Ημερολογίου.','bad');
  if(!await confirmDlg(`Επαναφορά αντιγράφου με ${d.students.length} πρόσωπα και ${(d.appts||[]).length} ραντεβού; Ό,τι υπάρχει τώρα θα αντικατασταθεί.`,{ok:'Επαναφορά',danger:true}))return;
  await opfsSave();localStorage.setItem(STORE,JSON.stringify(d));S.data=loadData();applyIdentity();toast('Έγινε επαναφορά.','ok');go('today');render();}

/* ---------- εγκατάσταση: παράθυρο που βγαίνει μόνο του ---------- */
async function installNow(){if(!INST)return;INST.prompt();let r=null;try{r=await INST.userChoice;}catch(e){}INST=null;if(r&&r.outcome==='accepted')toast('Η εφαρμογή μπαίνει στην αρχική οθόνη.','ok');render();}
function installAsk(){if(!INST||isStandalone()||topModal()||!S.data.settings.prof)return;const k='imer-instask';try{if(Date.now()-(+localStorage.getItem(k)||0)<3*864e5)return;localStorage.setItem(k,Date.now());}catch(e){}
  const md=modal(`<div class="instpop">${LOGO}<h3>Βάλε το Ημερολόγιο στο κινητό</h3><p class="small muted">Ανοίγει από την αρχική οθόνη σαν κανονική εφαρμογή, γρήγορα και χωρίς τον φυλλομετρητή.</p>
   <div class="row" style="justify-content:center"><button class="btn" data-close>Όχι τώρα</button><button class="btn pri" id="ip-go">${ic('download',16)} Εγκατάσταση</button></div></div>`,{guard:false});
  $('#ip-go',md.el).onclick=()=>{md.close();installNow();};}

/* ---------- αναβάθμιση ---------- */
let swReg=null;
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('sw.js').then(r=>{swReg=r;r.update();}).catch(()=>{});
  let reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloaded)return;reloaded=true;location.reload();});}
async function checkUpdate(){try{const r=await fetch('version.json?v='+Date.now(),{cache:'no-store'});const v=(await r.json()).version;
  if(v&&v!==APP_VERSION){toast('Βρέθηκε νέα έκδοση '+v+'. Αναβάθμιση…','ok');if(swReg)await swReg.update();try{const ks=await caches.keys();await Promise.all(ks.filter(k=>k.startsWith('imerologio-')).map(k=>caches.delete(k)));}catch(e){}setTimeout(()=>location.reload(),900);}else toast('Έχεις την τελευταία έκδοση ('+APP_VERSION+').');}
  catch(e){toast('Χρειάζεται σύνδεση στο διαδίκτυο για τον έλεγχο.','bad');}}
// αυτόματος έλεγχος κάθε φορά που ανοίγει η εφαρμογή: αν υπάρχει νέα έκδοση, βγαίνει κουμπί «Ενημέρωση τώρα»
let UPV=null;
async function autoUpdCheck(){try{const r=await fetch('version.json?v='+Date.now(),{cache:'no-store'});const v=(await r.json()).version;if(!v||v===APP_VERSION||UPV===v)return;UPV=v;if(swReg)swReg.update().catch(()=>{});
  const b=document.createElement('div');b.className='updbar';b.innerHTML=`<span>Νέα έκδοση <b>${esc(v)}</b></span><button type="button">Ενημέρωση τώρα</button>`;document.body.appendChild(b);
  b.querySelector('button').onclick=async()=>{b.querySelector('button').textContent='Ενημέρωση…';try{if(swReg)await swReg.update();const ks=await caches.keys();await Promise.all(ks.filter(k=>k.startsWith('imerologio-')).map(k=>caches.delete(k)));}catch(e){}location.reload();};}catch(e){}}
setTimeout(autoUpdCheck,2500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoUpdCheck();});

/* ---------- έναρξη ---------- */
S.data=loadData();applyIdentity();
if(!location.hash)history.replaceState(null,'','#/today');
render();
setTimeout(autoBackup,5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&/^#\/agenda/.test(location.hash)&&!topModal())render();});
