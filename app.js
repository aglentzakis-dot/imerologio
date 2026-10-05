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
function IM_NEWPERSON(name){const p={id:uid(),name:name.trim(),avatar:initial(name),contacts:[],created:new Date().toISOString()};S.data.students.push(p);save();return p.id;}

/* ---------- επάγγελμα και λέξεις ---------- */
function findProf(id){for(const g of IM_GROUPS)for(const p of g.list)if(p.id===id)return{g,p};return null;}
function prof(){return findProf(S.data.settings.prof)||findProf('allo');}
function profLex(){const{g,p}=prof();return Object.assign({},g.lex,p.lex||{});}
function LX(k){const L=Object.assign(profLex(),S.data.settings.lex||{});return L[k]||'';}
function profRoles(){const{g,p}=prof();return(p.roles||g.roles||[]).map(x=>x.slice());}
function profDur(){const{g,p}=prof();return p.dur||g.dur||60;}
const IM_DEF={kind:()=>{const{g,p}=prof();return p.kind||g.kind||'once';},dur:()=>profDur(),
  start:date=>{const c=agCfg();const t=todayISO();if((date||t)===t){const m=Math.ceil((nowMin()+15)/30)*30;if(m>=tmin(c.from)&&m<tmin(c.to))return tstr(m);}return c.from;}};
function profNotes(){return(prof().p.t||'').split('|').filter(Boolean);}

/* ---------- χρώμα: της κατηγορίας επαγγέλματος ή δικό σου ---------- */
const THEME_COLORS=['#B4235F','#0F7B72','#4F46C8','#24476E','#C2501A','#2F7D3A','#17324D','#8A3FB0','#B8860B','#C0392B'];
function hexMix(h,w,t){const n=x=>parseInt(x,16);const a=[n(h.slice(1,3)),n(h.slice(3,5)),n(h.slice(5,7))];const b=w==='w'?[255,255,255]:[0,0,0];return'#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function themeColor(){return S.data.settings.color||prof().g.color||'#17324D';}
function applyTheme(){const c=themeColor(),R=document.documentElement.style;R.setProperty('--brand',c);R.setProperty('--brand-d',hexMix(c,'k',.25));R.setProperty('--brand-soft',hexMix(c,'w',.88));R.setProperty('--brand-soft2',hexMix(c,'w',.94));
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=c;}

/* ---------- λογότυπο ---------- */
const LOGO=`<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="26" fill="#17324D"/><rect x="20" y="27" width="60" height="55" rx="9" fill="#fff"/><path d="M20 36a9 9 0 0 1 9-9h42a9 9 0 0 1 9 9v6H20z" fill="#F2B632"/><rect x="33" y="18" width="6" height="16" rx="3" fill="#fff" stroke="#17324D" stroke-width="2"/><rect x="61" y="18" width="6" height="16" rx="3" fill="#fff" stroke="#17324D" stroke-width="2"/><g fill="#D6DEE3"><rect x="28" y="50" width="10" height="8" rx="2"/><rect x="45" y="50" width="10" height="8" rx="2"/><rect x="28" y="64" width="10" height="8" rx="2"/><rect x="45" y="64" width="10" height="8" rx="2"/><rect x="62" y="64" width="10" height="8" rx="2"/></g><rect x="62" y="50" width="10" height="8" rx="2" fill="#2E7D5B"/></svg>`;
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
function render(){
  applyTheme();if(!S.data.settings.prof){shellHTML('today');M().innerHTML='';return firstRun();}
  window.AGPOS=null;if(/^#\/agenda/.test(S.curHash||'')&&/^#\/agenda/.test(location.hash)&&typeof agPosSave==='function')agPosSave();
  S.curHash=location.hash;
  const r=parseRoute();const sec=r.name==='person'?'people':r.name;
  shellHTML(sec);
  const V={today:viewToday,agenda:viewAgendaApp,people:viewPeople,person:viewPerson,settings:viewSettingsPage}[r.name]||viewToday;
  if(!window.AGPOS)window.scrollTo(0,0);
  try{V(r);}catch(e){console.error(e);M().innerHTML=`<div class="card"><h2>Κάτι πήγε στραβά</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#/agenda">Ραντεβού</a></div>`;}
}
function shellHTML(sec){
  const nav=[['today','home','Σήμερα'],['agenda','l-calendar-clock','Ημερολόγιο'],['people','users',LX('whoPl')||'Πρόσωπα'],['settings','settings','Ρυθμίσεις']];
  const title={today:'Σήμερα',agenda:'Ημερολόγιο',people:LX('whoPl'),settings:'Ρυθμίσεις'}[sec]||'Ημερολόγιο';
  const a=([k,i,l])=>`<a href="#/${k}" class="${sec===k?'on':''}">${ic(i,19)}<span>${esc(l)}</span></a>`;
  const fab=['today','agenda','people'].includes(sec);
  document.body.innerHTML=`<div class="app"><aside class="side noprint"><a class="brand" href="#/today">${LOGO}<div><b>Ημερολόγιο</b><span>${esc(S.meta.org||prof().p.n)}</span></div></a><nav class="nav">${nav.map(a).join('')}</nav><div class="side-ver tiny muted">Έκδοση ${APP_VERSION}</div></aside>
  <div class="shell"><header class="topbar noprint"><a class="tbrand" href="#/today">${LOGO}</a><b class="tbtitle">${esc(title)}</b><span class="tbprof">${esc(S.meta.org||prof().p.n)}</span></header><main class="main" id="main"></main></div>
  <nav class="bottomnav noprint">${nav.map(([k,i,l])=>`<a href="#/${k}" class="${sec===k?'on':''}"><span class="bi">${ic(i,22)}</span><span>${esc(l)}</span></a>`).join('')}</nav>
  ${fab?`<button class="fab noprint" id="fab" aria-label="${sec==='people'?'Νέος':'Νέο ραντεβού'}">${ic('plus',26)}</button>`:''}</div>`;
  const f=$('#fab');if(f)f.onclick=()=>sec==='people'?go('person/new'):apptDialog({date:(parseRoute().q.d)||todayISO()});
}
addEventListener('hashchange',render);

/* ---------- πρώτη χρήση: επάγγελμα και όνομα ---------- */
function profPickerHTML(cur){return IM_GROUPS.map(g=>`<div class="pgrp">${esc(g.g)}</div><div class="plist">${g.list.map(p=>`<button type="button" data-pf="${p.id}" class="${p.id===cur?'on':''}">${esc(p.n)}</button>`).join('')}</div>`).join('');}
function firstRun(){
  const md=modal(`<div class="fr-head">${LOGO}<div><h2 style="margin:0">Καλώς ήρθες!</h2><div class="small muted">Ημερολόγιο ραντεβού για κάθε επάγγελμα</div></div></div>
   <div class="field"><label class="f" for="fr-n">Το όνομά σου</label><input class="in" id="fr-n" autocomplete="name" placeholder="π.χ. Μαρία Παπαδοπούλου"></div>
   <div class="field"><label class="f" for="fr-b">Επωνυμία επιχείρησης <span class="tiny muted">· προαιρετικό</span></label><input class="in" id="fr-b" placeholder="π.χ. Κομμωτήριο Μαρία"></div>
   <label class="f">Τι δουλειά κάνεις;</label><p class="tiny muted" style="margin:0 0 6px">Ανάλογα με το επάγγελμα αλλάζουν οι λέξεις (πελάτης, ασθενής, μαθητής…), οι ειδικότητες του προσωπικού και η συνηθισμένη διάρκεια. Αλλάζει όποτε θέλεις από τις Ρυθμίσεις.</p>
   <label class="check frdemo"><input type="checkbox" id="fr-d" checked> Βάλε μερικά παραδείγματα για να δω πώς δουλεύει <span class="tiny muted">(σβήνονται με ένα κουμπί)</span></label>
   <div id="fr-p">${profPickerHTML(null)}</div>`,{noHist:true,guard:false});
  md.el.parentElement.onclick=null;
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-pf]');if(!b)return;
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
  ${S.data.settings.demo?`<div class="demobar"><span>Βλέπεις παραδείγματα. Όταν είσαι έτοιμος, σβήσ' τα και βάλε τα δικά σου.</span><button class="btn sm" id="demoX">Σβήσε τα παραδείγματα</button></div>`:''}
  <section class="hero"><div class="hero-in"><div class="hero-hi">${greet()}${first?', '+esc(first):''}</div>
   <div class="hero-date">${WDAYS[wdOf(t)]} ${+t.slice(8)} ${MONTHS_G[+t.slice(5,7)-1]}</div>
   <div class="hero-sum">${closed?esc(closed):act.length?`<b>${act.length}</b> ${act.length===1?'ραντεβού':'ραντεβού'} σήμερα${left?` · <b>${left}</b> ακόμα`:''}`:'Κανένα ραντεβού σήμερα'}</div></div></section>
  ${next?`<button class="nextcard ${live?'live':''}" data-ap="${next.key}"><span class="nc-time"><b>${next.s}</b><small>${next.e}</small></span><span class="nc-main"><small>${live?'Τώρα':'Επόμενο'}</small><b>${esc(stuName(nst))}</b>${next.a.note?`<span>${esc(next.a.note)}</span>`:''}${pvBadge(next,1)}</span>${ic('right',20)}</button>
    ${ph?`<div class="ncact"><a class="btn" href="tel:${telLink(ph)}">${ic('l-message-square',16)} Κλήση</a><a class="btn" href="${smsHref(ph,remText(next))}">${ic('send',16)} Υπενθύμιση</a></div>`:''}`:''}
  <section class="tsec"><div class="tsec-h"><h2>Το πρόγραμμα της ημέρας</h2><a href="#/agenda?view=day&d=${t}">Ημέρα ${ic('right',14)}</a></div>
   ${act.length||L.length?`<div class="tlist">${L.map(o=>`<div class="trow ${o.st==='done'?'done':''} ${tmin(o.e)<=now&&o.st===''?'past':''}"><span class="tr-t">${o.s}</span>${apptCard(o,{compact:true})}</div>`).join('')}</div>`
    :`<div class="tempty">${ic('l-calendar-clock',34)}<b>Η μέρα είναι ελεύθερη</b><span>Κλείσε ραντεβού με το κουμπί + ή διάλεξε μια ελεύθερη ώρα.</span><button class="btn pri" id="tNew">${ic('plus',16)} Νέο ραντεβού</button></div>`}</section>
  ${F.length?`<section class="tsec"><div class="tsec-h"><h2>Ελεύθερες ώρες σήμερα</h2></div><div class="chips">${F.map(x=>`<button class="chipt free" data-new="${t}|${x}">${x}</button>`).join('')}</div></section>`:''}
  <section class="tsec"><div class="tsec-h"><h2>Αύριο</h2><a href="#/agenda?view=day&d=${tm}">Άνοιγμα ${ic('right',14)}</a></div>
   <div class="tmrw"><span><b>${T.length}</b> ${T.length===1?'ραντεβού':'ραντεβού'}${T.length?' — πρώτο στις '+T[0].s:''}</span>${T.length?`<button class="btn sm" id="tRem">${ic('bell',15)} Στείλε υπενθυμίσεις</button>`:''}</div></section>
  ${installCardHTML()}`;
  const n=$('#tNew');if(n)n.onclick=()=>apptDialog({date:t});const r=$('#tRem');if(r)r.onclick=()=>remindDialog(tm);
  const dx=$('#demoX');if(dx)dx.onclick=demoClear;bindInstall();}

/* ---------- ημερολόγιο: τα σπάνια κουμπιά πάνε στο «Περισσότερα» ---------- */
function viewAgendaApp(r){viewAgenda(r);
  const h=$('.page-head .actions');if(!h)return;
  const more=document.createElement('button');more.className='iconbtn agmore';more.setAttribute('aria-label','Περισσότερα');more.innerHTML=ic('more',20);h.appendChild(more);
  const items=[['agBlk','l-flag','Δέσμευση (ώρες που δεν είσαι διαθέσιμος)'],['agRem','bell','Υπενθυμίσεις'],['agWait','users','Λίστα αναμονής'],['agCopyW','copy','Αντιγραφή εβδομάδας'],['agLock','clock','Ποιες ώρες φαίνονται'],['agCfg','settings','Ωράριο λειτουργίας'],['agPdf','printer','Εκτύπωση / PDF']].filter(([id])=>$('#'+id));
  more.onclick=()=>{const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">Περισσότερα</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><div class="list">${items.map(([id,i,l])=>`<button class="rw" data-go="${id}"><span class="ricon">${ic(i,17)}</span><span class="grow"><b>${l}</b></span></button>`).join('')}</div>
    <details class="legendbox"><summary class="small"><b>Τι σημαίνουν τα χρώματα</b></summary>${($('.aglegend')||{}).outerHTML||''}</details>`,{guard:false});
    md.el.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;md.close();setTimeout(()=>{const x=$('#'+b.dataset.go);if(x)x.click();},150);});};}

/* ---------- παραδείγματα για να φανεί αμέσως πώς δουλεύει ---------- */
const DEMO_NAMES=['Ελένη Παπαδάκη','Γιώργος Νικολάου','Κατερίνα Βλάχου','Νίκος Αντωνίου','Σοφία Μιχαηλίδη','Δημήτρης Καραλής','Μαρία Ζαφειρίου'];
function demoFill(){const t=todayISO(),c=agCfg(),du=profDur(),notes=profNotes();const ids=DEMO_NAMES.map((n,i)=>{const p={id:uid(),name:n,avatar:initial(n),phone:'69'+String(40000000+i*1234567).slice(0,8),color:PERS_COLORS[i%PERS_COLORS.length],contacts:[],demo:true,created:new Date().toISOString()};p.contacts=[{name:n,phone:p.phone}];S.data.students.push(p);return p.id;});
  const st=Math.max(tmin(c.from),9*60);const add=(d,m,k,sid,i)=>appts().push({id:uid(),sid,kind:k,date:d,d:wdOf(d),s:tstr(m),e:tstr(m+du),note:notes[i%notes.length]||'',ex:{},demo:true,created:new Date().toISOString()});
  [0,1,2,3,4,5].forEach(off=>{const d=addDays(t,off);if(!c.days.includes(wdOf(d))||isClosed(d))return;const n=off===0?4:2+off%3;for(let i=0;i<n;i++){const m=st+i*Math.max(du,60)+(off%2)*30;if(m+du<=tmin(c.to))add(d,m,'once',ids[(off*2+i)%ids.length],i+off);}});
  add(t,st+5*60,IM_DEF.kind()==='weekly'?'weekly':'once',ids[6],2);
  S.data.settings.demo=true;}
async function demoClear(){if(!await confirmDlg('Να σβηστούν τα παραδείγματα; Ό,τι έβαλες εσύ μένει.',{ok:'Σβήσε τα',danger:true}))return;
  const D=new Set(S.data.students.filter(p=>p.demo).map(p=>p.id));S.data.students=S.data.students.filter(p=>!p.demo);S.data.appts=appts().filter(a=>!a.demo&&!D.has(a.sid));S.data.settings.demo=false;save();toast('Τα παραδείγματα σβήστηκαν.','ok');render();}

/* ---------- εγκατάσταση στην αρχική οθόνη του κινητού ---------- */
let INST=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();INST=e;if(/^#\/(today)?$/.test(location.hash.replace(/^#\/?$/,'#/today'))&&!topModal())render();});
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function installCardHTML(){if(isStandalone()||S.data.settings.instHide)return'';const ios=/iP(hone|ad|od)/.test(navigator.userAgent);if(!INST&&!ios)return'';
  return`<section class="instcard">${LOGO}<div class="grow"><b>Βάλε το Ημερολόγιο στην αρχική οθόνη</b><span>${INST?'Ανοίγει σαν κανονική εφαρμογή, χωρίς τον φυλλομετρητή.':'Στο Safari πάτα «Κοινή χρήση» και μετά «Προσθήκη στην οθόνη Αφετηρίας».'}</span></div>${INST?`<button class="btn pri" id="instGo">Εγκατάσταση</button>`:''}<button class="iconbtn" id="instX" aria-label="Κλείσιμο">${ic('x',16)}</button></section>`;}
function bindInstall(){const g=$('#instGo');if(g)g.onclick=async()=>{INST.prompt();try{await INST.userChoice;}catch(e){}INST=null;render();};const x=$('#instX');if(x)x.onclick=()=>{S.data.settings.instHide=true;save();render();};}

/* ---------- πρόσωπα: λίστα ---------- */
function viewPeople(r){const all=myStudents();const q=(r.q.q||'').toLowerCase();
  M().innerHTML=`${pageHead(esc(LX('whoPl')),`${all.length}`,`<a class="btn pri" href="#/person/new">${ic('plus',17)} Νέος</a>`)}
  ${all.length?`<div class="search field">${ic('search',17)}<input class="in" id="pq" type="search" placeholder="Όνομα ή τηλέφωνο" value="${esc(q)}" aria-label="Αναζήτηση"></div><div class="list" id="pl"></div>`
   :emptyHTML('users',`Δεν υπάρχουν ακόμη ${esc(LX('whoPlL'))}`,`Πρόσθεσε τον πρώτο — ή γράψε απευθείας το όνομα όταν κλείνεις ραντεβού.`,`<a class="btn pri" href="#/person/new">${ic('plus',16)} Νέος</a>`)}`;
  if(!all.length)return;
  const t=todayISO();
  const draw=()=>{const v=$('#pq').value.toLowerCase().trim();const L=all.filter(p=>!v||(p.name||'').toLowerCase().includes(v)||(p.phone||'').replace(/\s/g,'').includes(v.replace(/\s/g,'')));
    $('#pl').innerHTML=L.length?L.map(p=>{const nx=occ(t,addDays(t,120),{sid:p.id,by:''}).find(o=>o.st===''&&(o.date>t||tmin(o.e)>nowMin()));
      return`<a class="rw" href="#/person/${p.id}"><span class="ricon" style="${p.color?`background:${p.color};color:#fff`:''}">${esc((p.name||'?').trim()[0]||'?')}</span><span class="grow"><b>${esc(stuName(p))}</b><small>${[p.phone?esc(p.phone):'',nx?'επόμενο '+WDAYS_S[wdOf(nx.date)]+' '+fmtShort(nx.date)+' '+nx.s:''].filter(Boolean).join(' · ')||'&nbsp;'}</small></span>${ic('right',16)}</a>`;}).join(''):`<p class="muted small">Κανένα αποτέλεσμα.</p>`;};
  draw();$('#pq').oninput=draw;}

/* ---------- πρόσωπο: καρτέλα ---------- */
function viewPerson(r){const isNew=r.id==='new';const p0=isNew?{id:uid(),created:new Date().toISOString(),contacts:[]}:getStudent(r.id);if(!p0)return go('people');
  const p=JSON.parse(JSON.stringify(p0));const t=todayISO();
  const up=isNew?[]:occ(addDays(t,-60),addDays(t,180),{sid:p.id,withCancel:true,by:''});const fut=up.filter(o=>o.date>=t);const past=up.filter(o=>o.date<t).reverse().slice(0,10);
  const pr=PERS_COLORS;
  M().innerHTML=`${pageHead(isNew?'Νέος '+esc(LX('who')).toLowerCase():esc(stuName(p)),isNew?'':esc(LX('who')),`<a class="btn" href="#/people">Πίσω</a>`)}
  <div class="grid g2" style="align-items:start"><form class="card" id="pf"><h3>Στοιχεία</h3>
   <div class="field"><label class="f" for="p-n">Ονοματεπώνυμο</label><input class="in" id="p-n" name="name" required autocomplete="off" value="${esc(p.name||'')}"></div>
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="p-ph">Τηλέφωνο</label><input class="in" id="p-ph" name="phone" type="tel" inputmode="tel" value="${esc(p.phone||'')}"></div>
   <div class="field"><label class="f" for="p-em">Email</label><input class="in" id="p-em" name="email" type="email" inputmode="email" autocapitalize="none" value="${esc(p.email||'')}"></div></div>
   <div class="field"><label class="f" for="p-ad">Διεύθυνση <span class="tiny muted">· αν πηγαίνεις εσύ</span></label><input class="in" id="p-ad" name="addr" value="${esc(p.loc&&p.loc.addr||'')}"></div>
   <div class="field"><label class="f" for="p-no">Σημειώσεις</label><textarea class="in" id="p-no" name="notes" style="min-height:70px">${esc(p.notes||'')}</textarea></div>
   <div class="field"><label class="f">Χρώμα στο ημερολόγιο</label><div class="scols">${pr.map(c=>`<button type="button" data-pc="${c}" style="background:${c}" class="${p.color===c?'on':''}" aria-label="Χρώμα"></button>`).join('')}<button type="button" data-pc="" class="none ${p.color?'':'on'}" aria-label="Χωρίς χρώμα">${ic('x',12)}</button></div></div>
   <div class="row"><button class="btn pri">${ic('check',16)} Αποθήκευση</button>${isNew?'':`<button type="button" class="btn danger" id="p-del">${ic('trash',16)} Διαγραφή</button>`}</div></form>
  ${isNew?'':`<div class="card"><div class="card-h"><h3>Ραντεβού</h3><button class="btn sm pri" id="p-new">${ic('plus',15)} Νέο ραντεβού</button></div>
   ${p.phone?`<div class="row" style="gap:6px;margin-bottom:12px"><a class="btn sm" href="tel:${telLink(p.phone)}">Κλήση</a>${chBtnsHTML({contacts:[{name:p.name,phone:p.phone,email:p.email}]},'Καλησπέρα!','Μήνυμα','')}</div>`:''}
   ${fut.length?`<div class="aglist">${fut.slice(0,6).map(o=>`<div class="small muted" style="margin:8px 0 2px">${WDAYS[wdOf(o.date)]} ${fmtDate(o.date)}</div>${apptCard(o)}`).join('')}</div>${fut.length>6?`<p class="small muted" style="margin:8px 0 0">και ${fut.length-6} ακόμα μέσα στους επόμενους 6 μήνες.</p>`:''}`:'<p class="small muted">Κανένα επόμενο ραντεβού.</p>'}
   ${past.length?`<details style="margin-top:12px"><summary class="small"><b>Προηγούμενα</b> (${past.length})</summary><div class="aglist" style="margin-top:6px">${past.map(o=>`<div class="small muted" style="margin:8px 0 2px">${fmtDate(o.date)}</div>${apptCard(o)}`).join('')}</div></details>`:''}</div>`}</div>`;
  const F=$('#pf');let col=p.color||'';
  F.onclick=e=>{const b=e.target.closest('[data-pc]');if(!b)return;col=b.dataset.pc;$$('[data-pc]',F).forEach(x=>x.classList.toggle('on',x===b));};
  F.onsubmit=e=>{e.preventDefault();const o=fd(F);if(!o.name.trim())return toast('Γράψε όνομα.','bad');
    Object.assign(p0,{name:o.name.trim(),avatar:initial(o.name),phone:o.phone.trim(),email:o.email.trim().toLowerCase(),notes:o.notes.trim(),color:col||undefined,updated:new Date().toISOString()});
    p0.contacts=(p0.phone||p0.email)?[{name:p0.name,role:'',phone:p0.phone,email:p0.email}]:[];
    if(o.addr.trim())p0.loc=Object.assign({},p0.loc&&p0.loc.addr===o.addr.trim()?p0.loc:{},{addr:o.addr.trim(),home:true});else delete p0.loc;
    if(isNew)S.data.students.push(p0);save();toast('Αποθηκεύτηκε.','ok');
    if(isNew&&sessionStorage.getItem('im-after-person')){sessionStorage.removeItem('im-after-person');go('today');setTimeout(()=>apptDialog({date:todayISO(),sids:[p0.id]}),200);return;}
    go('person/'+p0.id);};
  const dl=$('#p-del');if(dl)dl.onclick=async()=>{const n=appts().filter(a=>a.sid===p0.id).length;if(!await confirmDlg(`Διαγραφή «${esc(stuName(p0))}»${n?` και ${n===1?'του ραντεβού του':'των '+n+' ραντεβού του'}`:''}; Δεν αναιρείται.`,{ok:'Διαγραφή',danger:true}))return;
    S.data.students=S.data.students.filter(x=>x.id!==p0.id);S.data.appts=appts().filter(a=>a.sid!==p0.id);S.data.waitlist=(S.data.waitlist||[]).filter(w=>w.sid!==p0.id);save();toast('Διαγράφηκε.');go('people');};
  const nb=$('#p-new');if(nb)nb.onclick=()=>apptDialog({date:todayISO(),sids:[p0.id]});}
const PERS_COLORS=['#7462B4','#3A8A61','#2F7FA8','#C77A3A','#B4527A','#8A7A2E','#C46A7A','#5A6ACF','#2E8C8C','#9C5BB5'];

/* ---------- ρυθμίσεις ---------- */
function viewSettingsPage(r){const B=biz();const c=agCfg();const PV=providers();const{g,p}=prof();const base=profLex();const L=S.data.settings.lex||{};
  const lx=(k,l)=>`<div class="field"><label class="f" for="lx-${k}">${l}</label><input class="in" id="lx-${k}" data-lx="${k}" value="${esc(L[k]||'')}" placeholder="${esc(base[k]||'')}"></div>`;
  const staffRow=(x,me)=>{const pv=me?provById('me'):x;return`<div class="staffrow"><i class="pvb" style="background:${pv.color}">${provIni(me?{id:'me'}:x)}</i><div class="grow"><b>${esc(me?(S.user.name||'Εγώ')+' (εγώ)':x.name)}</b><div class="small muted">${esc(roleName(me?B.meRole:x.role,me?B.meCustom:x.custom))}${!me&&x.phone?' · '+esc(x.phone):''}</div><div class="row" style="margin-top:4px;gap:4px">${(me?B.meTeaches:x.appts)?`<span class="chip ok">${ic('calendar',13)} Κάνει ραντεβού</span>`:`<span class="chip">Χωρίς ραντεβού</span>`}</div></div><button class="iconbtn" data-stf="${me?'me':x.id}" aria-label="Αλλαγή">${ic('edit',16)}</button></div>`;};
  const y=+todayISO().slice(0,4),HL=holList(y),t=todayISO();
  M().innerHTML=`${pageHead('Ρυθμίσεις','')}
  <div class="grid g2" style="align-items:start"><div>
  <div class="card section"><div class="card-h"><h3>Επάγγελμα</h3></div><button class="rw" id="st-prof" style="width:100%"><span class="grow"><b>${esc(p.n)}</b><small>${esc(g.g)}</small></span>${ic('right',16)}</button>
   <details style="margin-top:12px"><summary class="small"><b>Οι λέξεις της εφαρμογής</b> — άλλαξέ τες αν θέλεις κάτι πιο δικό σου</summary><div class="grid g2" style="gap:8px;margin-top:8px">${lx('who','Το πρόσωπο')}${lx('whoAcc','…διάλεξε (αιτιατική)')}${lx('whoGen','…καρτέλα (γενική)')}${lx('whoPl','Πληθυντικός')}${lx('whoPlL','Πληθυντικός με μικρά')}${lx('one','Τίτλος στο κινητό')}</div><button class="btn sm" id="st-lx">${ic('check',15)} Αποθήκευση λέξεων</button><p class="tiny muted" style="margin:6px 0 0">Κενό = η λέξη του επαγγέλματος.</p></details></div>
  <div class="card section"><div class="card-h"><h3>Χρώμα εφαρμογής</h3></div><div class="scols big">${THEME_COLORS.map(c=>`<button type="button" data-th="${c}" style="background:${c}" class="${themeColor()===c?'on':''}" aria-label="Χρώμα"></button>`).join('')}</div><button class="btn sm ghost" id="th-def" style="margin-top:8px">Το χρώμα του επαγγέλματος</button></div>
  <div class="card section"><div class="card-h"><h3>Στοιχεία</h3></div>
   <div class="field"><label class="f" for="st-me">Το όνομά σου</label><input class="in" id="st-me" value="${esc(S.data.settings.myName||'')}"></div>
   <div class="field"><label class="f" for="st-bn">Επωνυμία</label><input class="in" id="st-bn" value="${esc(B.name||'')}"></div>
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="st-ph">Τηλέφωνο</label><input class="in" id="st-ph" type="tel" value="${esc(B.phone||'')}"></div><div class="field"><label class="f" for="st-em">Email</label><input class="in" id="st-em" type="email" value="${esc(B.email||'')}"></div></div>
   <button class="btn pri" id="st-sv">${ic('check',16)} Αποθήκευση</button><div class="tiny muted" style="margin-top:8px">Μπαίνουν στις υπενθυμίσεις και στα PDF.</div></div>
  <div class="card section"><div class="card-h"><h3>Προσωπικό</h3></div><p class="small muted" style="margin-top:0">Όσοι «κάνουν ραντεβού» έχουν δικό τους χρώμα και μετράνε στα ελεύθερα κενά.</p>${staffRow(null,1)}${B.staff.map(x=>staffRow(x)).join('')}<button class="btn" id="st-add" style="margin-top:10px">${ic('plus',16)} Προσθήκη προσωπικού</button></div>
  </div><div>
  <div class="card section"><div class="card-h"><h3>Ωράριο λειτουργίας</h3></div><dl class="kv"><dt>Ώρες</dt><dd>${c.from}–${c.to}</dd><dt>Μέρες</dt><dd>${DAY_ORDER.filter(d=>c.days.includes(d)).map(d=>WDAYS_S[d]).join(', ')||'—'}</dd><dt>Διάστημα</dt><dd>${c.step} λεπτά</dd><dt>Χωρητικότητα</dt><dd>${PV.length} ${PV.length===1?'άτομο':'άτομα'}</dd></dl><button class="btn" id="st-hr">${ic('clock',16)} Αλλαγή ωραρίου</button></div>
  <div class="card section"><div class="card-h"><h3>Αργίες</h3></div><label class="switch"><span><b>Κλειστά στις επίσημες αργίες</b><small>Βγαίνουν αυτόματα κλειστές κάθε χρόνο — και οι κινητές (Καθαρά Δευτέρα, Πάσχα, Αγίου Πνεύματος).</small></span><input type="checkbox" id="hl-on" ${B.holOff?'':'checked'}></label>
   <details style="margin-top:10px"><summary class="small"><b>Αργίες ${y}</b></summary><div style="${B.holOff?'opacity:.5;pointer-events:none':''}">${HL.map(h=>`<label class="holrow ${h.date<t?'past':''}"><span class="hd">${WDAYS_S[wdOf(h.date)]} ${fmtShort(h.date)}</span><span class="grow">${esc(h.name)}</span><input type="checkbox" data-hol="${h.id}" ${holOn(h)?'checked':''}></label>`).join('')}</div></details></div>
  <div class="card section"><div class="card-h"><h3>Αντίγραφα ασφαλείας</h3></div><p class="small muted" style="margin-top:0">Τα δεδομένα μένουν μόνο σε αυτή τη συσκευή. ${S.data.meta.lastBackup?'Τελευταίο αντίγραφο: '+fmtDate(new Date(S.data.meta.lastBackup).toISOString())+'.':'<b>Δεν έχεις κρατήσει ακόμα αντίγραφο.</b>'}</p>
   <div class="row"><button class="btn pri" id="bk-now">${ic('cloud',16)} Αντίγραφο τώρα</button><button class="btn" id="bk-rs">${ic('history',16)} Επαναφορά</button></div><p class="tiny muted" id="bk-f" style="margin:8px 0 0"></p><input type="file" id="bk-file" accept="application/json,.json" hidden></div>
  <div class="card section"><div class="card-h"><h3>Έκδοση ${esc(APP_VERSION)}</h3></div><button class="btn" id="up-chk">${ic('refresh',16)} Έλεγχος αναβάθμισης</button><p class="tiny muted" style="margin:10px 0 0">© 2026 Ανδρέας Μ. Γλεντζάκης. Με την επιφύλαξη παντός δικαιώματος.</p></div>
  </div></div>`;
  $('#st-prof').onclick=profDialog;$$('[data-th]').forEach(b=>b.onclick=()=>{S.data.settings.color=b.dataset.th;save();render();});$('#th-def').onclick=()=>{delete S.data.settings.color;save();render();};
  $('#st-lx').onclick=()=>{const o={};$$('[data-lx]').forEach(i=>{const v=i.value.trim();if(v&&v!==base[i.dataset.lx])o[i.dataset.lx]=v;});S.data.settings.lex=o;save();toast('Αποθηκεύτηκε.','ok');render();};
  $('#st-sv').onclick=()=>{S.data.settings.myName=$('#st-me').value.trim();B.name=$('#st-bn').value.trim();B.phone=$('#st-ph').value.trim();B.email=$('#st-em').value.trim();save();toast('Αποθηκεύτηκε.','ok');render();};
  $('#st-add').onclick=()=>staffDialog();$$('[data-stf]').forEach(b=>b.onclick=()=>staffDialog(b.dataset.stf));
  $('#st-hr').onclick=agendaCfgDialog;
  $('#hl-on').onchange=e=>{B.holOff=!e.target.checked;save();render();};$$('[data-hol]').forEach(x=>x.onchange=()=>{B.hol=B.hol||{};B.hol[x.dataset.hol]=x.checked;save();});
  $('#bk-now').onclick=backupNow;$('#bk-rs').onclick=restoreMenu;$('#bk-file').onchange=e=>{const f=e.target.files[0];if(f)f.text().then(restoreFrom).catch(()=>toast('Δεν διαβάστηκε το αρχείο.','bad'));e.target.value='';};
  folderNote();$('#up-chk').onclick=checkUpdate;}
function profDialog(){const md=modal(`<div class="spread"><h3 style="margin:0">Επάγγελμα</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><p class="small muted">Αλλάζουν οι λέξεις και οι ειδικότητες. Τα ραντεβού και τα πρόσωπα μένουν όπως είναι.</p>${profPickerHTML(S.data.settings.prof)}`,{guard:false});
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-pf]');if(!b)return;S.data.settings.prof=b.dataset.pf;S.data.settings.lex={};save();md.close();render();toast('Το επάγγελμα άλλαξε.','ok');});}
function staffDialog(id){const B=biz();const me=id==='me';const x=me?{name:S.user.name,role:B.meRole,custom:B.meCustom,color:B.meColor,appts:B.meTeaches}:id?B.staff.find(y=>y.id===id):{id:uid(),name:'',role:(ROLES.find(r=>r[2])||ROLES[0])[0],color:STAFF_COLORS[(B.staff.length+1)%STAFF_COLORS.length],appts:true,phone:'',created:new Date().toISOString()};if(!x)return;let col=x.color;
  const md=modal(`<h3 style="margin-top:0">${me?'Εγώ':id?'Αλλαγή προσωπικού':'Νέο μέλος προσωπικού'}</h3><form id="sf">
   ${me?'':`<div class="field"><label class="f" for="sf-n">Όνομα</label><input class="in" id="sf-n" name="name" required value="${esc(x.name||'')}"></div><div class="field"><label class="f" for="sf-ph">Τηλέφωνο</label><input class="in" id="sf-ph" name="phone" type="tel" value="${esc(x.phone||'')}"></div>`}
   <div class="field"><label class="f" for="sf-r">Ειδικότητα</label><select class="in" id="sf-r" name="role">${ROLES.map(r=>opt(r[0],r[1],x.role)).join('')}</select></div>
   <div class="field" id="sf-cw" ${x.role==='other'?'':'hidden'}><label class="f" for="sf-c">Ποια ειδικότητα</label><input class="in" id="sf-c" name="custom" value="${esc(x.custom||'')}"></div>
   <label class="switch field"><span><b>Κάνει ραντεβού</b><small>Εμφανίζεται στο ημερολόγιο με δικό του χρώμα.</small></span><input type="checkbox" name="appts" ${x.appts!==false?'checked':''}></label>
   <div class="field"><label class="f">Χρώμα</label><div class="scols">${STAFF_COLORS.map(c=>`<button type="button" data-sc="${c}" style="background:${c}" class="${col===c?'on':''}" aria-label="Χρώμα"></button>`).join('')}</div></div>
   <div class="row" style="justify-content:space-between">${!me&&id?`<button type="button" class="btn danger" id="sf-del">${ic('trash',16)}</button>`:'<span></span>'}<span class="row"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Αποθήκευση</button></span></div></form>`);
  const f=$('#sf',md.el);f.onclick=e=>{const b=e.target.closest('[data-sc]');if(b){col=b.dataset.sc;$$('[data-sc]',f).forEach(z=>z.classList.toggle('on',z===b));}};
  $('#sf-r',md.el).onchange=e=>{$('#sf-cw',md.el).hidden=e.target.value!=='other';};
  f.onsubmit=e=>{e.preventDefault();const o=fd(f);const ap=!!f.appts.checked;
    if(me){Object.assign(B,{meRole:o.role,meCustom:o.custom||'',meColor:col,meTeaches:ap});}
    else{if(!o.name.trim())return toast('Γράψε όνομα.','bad');Object.assign(x,{name:o.name.trim(),phone:(o.phone||'').trim(),role:o.role,custom:o.custom||'',color:col,appts:ap});if(!B.staff.includes(x))B.staff.push(x);}
    save();md.close();render();};
  const dl=$('#sf-del',md.el);if(dl)dl.onclick=async()=>{const n=appts().filter(a=>a.by===x.id).length;if(!await confirmDlg(`Αφαίρεση «${esc(x.name)}»;${n?` Τα ${n} ραντεβού του περνούν σε σένα.`:''}`,{ok:'Αφαίρεση',danger:true}))return;appts().forEach(a=>{if(a.by===x.id)delete a.by;});B.staff=B.staff.filter(y=>y.id!==x.id);save();md.close();render();};}

/* ---------- αντίγραφα: κοινός φάκελος όλων των εφαρμογών GlenApps ---------- */
function idb(){return new Promise((ok,no)=>{const r=indexedDB.open('shared-backups',1);r.onupgradeneeded=()=>r.result.createObjectStore('handles');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}
async function idbGet(k){const db=await idb();return new Promise(ok=>{const r=db.transaction('handles').objectStore('handles').get(k);r.onsuccess=()=>ok(r.result||null);r.onerror=()=>ok(null);});}
async function idbSet(k,v){const db=await idb();return new Promise(ok=>{const t=db.transaction('handles','readwrite');v===null?t.objectStore('handles').delete(k):t.objectStore('handles').put(v,k);t.oncomplete=()=>ok();t.onerror=()=>ok();});}
const folderOK=()=>'showDirectoryPicker' in window;
async function rootDir(pick){if(!folderOK())return null;let h=null;try{h=await idbGet('root');}catch(e){}
  if(h){try{let p=await h.queryPermission({mode:'readwrite'});if(p!=='granted'&&pick)p=await h.requestPermission({mode:'readwrite'});if(p==='granted')return h;}catch(e){}}
  if(!pick)return null;try{h=await window.showDirectoryPicker({id:'backups',mode:'readwrite',startIn:'downloads'});await idbSet('root',h);return h;}catch(e){return null;}}
async function folderNote(){const el=$('#bk-f');if(!el)return;if(!folderOK()){el.textContent='Σε αυτή τη συσκευή τα αντίγραφα κατεβαίνουν ως αρχείο.';return;}
  let h=null;try{h=await idbGet('root');}catch(e){}
  el.innerHTML=h?`Κοινός φάκελος: <b>${esc(h.name)}</b> / ${BACKUP_SUB} <button class="btn sm ghost" id="bk-x" aria-label="Αποσύνδεση φακέλου">${ic('x',13)}</button>`:'Την πρώτη φορά θα σε ρωτήσει σε ποιον φάκελο να κρατά τα αντίγραφα — ο ίδιος κοινός φάκελος με τις άλλες εφαρμογές σου.';
  const x=$('#bk-x');if(x)x.onclick=async()=>{await idbSet('root',null);folderNote();toast('Ο φάκελος αποσυνδέθηκε. Τα αρχεία δεν σβήστηκαν.');};}
function backupText(){return JSON.stringify({app:'imerologio',version:APP_VERSION,savedAt:new Date().toISOString(),data:S.data});}
function markBacked(){S.data.meta.lastBackup=Date.now();S.data.meta.changes=0;try{localStorage.setItem(STORE,JSON.stringify(S.data));}catch(e){}}
async function backupNow(){const name='imerologio-'+todayISO()+'.json',txt=backupText();const root=await rootDir(true);
  if(root){try{const d=await root.getDirectoryHandle(BACKUP_SUB,{create:true});const fh=await d.getFileHandle(name,{create:true});const w=await fh.createWritable();await w.write(txt);await w.close();markBacked();toast('Το αντίγραφο μπήκε στον φάκελο «'+BACKUP_SUB+'».','ok');return render();}catch(e){}}
  downloadText(name,txt,'application/json');markBacked();toast('Το αντίγραφο κατέβηκε ως αρχείο.','ok');render();}
async function restoreMenu(){const root=await rootDir(false);let files=[];
  if(root){try{const d=await root.getDirectoryHandle(BACKUP_SUB,{create:false});for await(const[n,h]of d.entries())if(h.kind==='file'&&n.endsWith('.json'))files.push([n,h]);files.sort((a,b)=>b[0].localeCompare(a[0]));files=files.slice(0,10);}catch(e){}}
  if(!files.length)return $('#bk-file').click();
  const md=modal(`<h3 style="margin-top:0">Επαναφορά από αντίγραφο</h3><p class="small muted">Θα αντικαταστήσει ό,τι υπάρχει τώρα.</p><div class="list">${files.map(([n],i)=>`<button class="rw" data-bf="${i}"><span class="grow"><b>${esc(n.replace('imerologio-','').replace('.json',''))}</b>${i===0?'<small>νεότερο</small>':''}</span></button>`).join('')}<button class="rw" data-bf="file"><span class="grow"><b>Από άλλο αρχείο…</b></span></button></div>`,{guard:false});
  md.el.addEventListener('click',async e=>{const b=e.target.closest('[data-bf]');if(!b)return;md.close();if(b.dataset.bf==='file')return $('#bk-file').click();const h=files[+b.dataset.bf][1];restoreFrom(await(await h.getFile()).text());});}
async function restoreFrom(txt){let o;try{o=JSON.parse(txt);}catch(e){}const d=o&&o.app==='imerologio'&&o.data;
  if(!d||!Array.isArray(d.students))return toast('Το αρχείο δεν είναι αντίγραφο του Ημερολογίου.','bad');
  if(!await confirmDlg(`Επαναφορά αντιγράφου με ${d.students.length} πρόσωπα και ${(d.appts||[]).length} ραντεβού; Ό,τι υπάρχει τώρα θα αντικατασταθεί.`,{ok:'Επαναφορά',danger:true}))return;
  localStorage.setItem(STORE,JSON.stringify(d));S.data=loadData();applyIdentity();toast('Έγινε επαναφορά.','ok');go('agenda');render();}

/* ---------- αναβάθμιση ---------- */
let swReg=null;
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('sw.js').then(r=>{swReg=r;r.update();}).catch(()=>{});
  let reloaded=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloaded)return;reloaded=true;location.reload();});}
async function checkUpdate(){try{const r=await fetch('version.json?v='+Date.now(),{cache:'no-store'});const v=(await r.json()).version;
  if(v&&v!==APP_VERSION){toast('Βρέθηκε νέα έκδοση '+v+'. Αναβάθμιση…','ok');if(swReg)await swReg.update();setTimeout(()=>location.reload(),900);}else toast('Έχεις την τελευταία έκδοση ('+APP_VERSION+').');}
  catch(e){toast('Χρειάζεται σύνδεση στο διαδίκτυο για τον έλεγχο.','bad');}}
// αυτόματος έλεγχος μία φορά τη μέρα
setTimeout(async()=>{try{const k='imer-upchk';if(localStorage.getItem(k)===todayISO())return;localStorage.setItem(k,todayISO());const r=await fetch('version.json?v='+Date.now(),{cache:'no-store'});const v=(await r.json()).version;if(v&&v!==APP_VERSION&&swReg){await swReg.update();}}catch(e){}},4000);

/* ---------- έναρξη ---------- */
S.data=loadData();applyIdentity();
if(!location.hash)history.replaceState(null,'','#/today');
render();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&/^#\/agenda/.test(location.hash)&&!topModal())render();});
