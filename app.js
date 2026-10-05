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
function findProf(id){for(const g of IM_GROUPS)for(const p of g.list)if(p.id===id)return{g,p};return null;}
function prof(){return findProf(S.data.settings.prof)||findProf('allo');}
function profLex(){const{g,p}=prof();return Object.assign({},g.lex,p.lex||{});}
function LX(k){const L=Object.assign(profLex(),S.data.settings.lex||{});return L[k]||'';}
function profRoles(){const{g,p}=prof();const L=(p.roles||g.roles||[]).map(x=>x.slice());(S.data.settings.customRoles||[]).forEach(r=>{if(!L.some(x=>x[0]===r[0]))L.splice(Math.max(0,L.length-1),0,r.slice());});return L;}
function profDur(){const{g,p}=prof();return +S.data.settings.dur||p.dur||g.dur||60;}
const IM_DEF={kind:()=>{const{g,p}=prof();return p.kind||g.kind||'once';},dur:()=>profDur(),
  start:date=>{const c=agCfg();const t=todayISO();if((date||t)===t){const m=Math.ceil((nowMin()+15)/30)*30;if(m>=tmin(c.from)&&m<tmin(c.to))return tstr(m);}return c.from;}};
function profNotes(){return(prof().p.t||'').split('|').filter(Boolean);}

/* ---------- χρώμα: της κατηγορίας επαγγέλματος ή δικό σου ---------- */
const THEME_COLORS=[['Βαθιά',['#B4235F','#0F7B72','#4F46C8','#24476E','#C2501A','#2F7D3A','#17324D','#8A3FB0','#B8860B','#C0392B']],
  ['Απαλά',['#E57399','#F48FB1','#4DB6AC','#80CBC4','#7986CB','#9FA8DA','#64B5F6','#90CAF9','#81C784','#AED581','#FFB74D','#FFD54F','#BA68C8','#CE93D8','#A1887F','#90A4AE']]];
function hexMix(h,w,t){const n=x=>parseInt(x,16);const a=[n(h.slice(1,3)),n(h.slice(3,5)),n(h.slice(5,7))];const b=w==='w'?[255,255,255]:[0,0,0];return'#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function themeColor(){return S.data.settings.color||prof().g.color||'#17324D';}
function lum(h){const f=x=>{x=parseInt(x,16)/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);};return .2126*f(h.slice(1,3))+.7152*f(h.slice(3,5))+.0722*f(h.slice(5,7));}
function applyTheme(){const c=themeColor(),R=document.documentElement.style;R.setProperty('--brand',c);const light=lum(c)>.36;R.setProperty('--on-brand',light?'#15202E':'#fff');R.setProperty('--brand-txt',light?hexMix(c,'k',.45):c);R.setProperty('--brand-d',hexMix(c,'k',.25));R.setProperty('--brand-soft',hexMix(c,'w',.88));R.setProperty('--brand-soft2',hexMix(c,'w',.94));
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
  const V={today:viewToday,agenda:viewAgendaApp,people:viewPeople,person:viewPerson,map:viewMap,settings:viewSettingsPage}[r.name]||viewToday;
  if(!window.AGPOS)window.scrollTo(0,0);
  try{V(r);}catch(e){console.error(e);M().innerHTML=`<div class="card"><h2>Κάτι πήγε στραβά</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#/agenda">Ραντεβού</a></div>`;}
}
function shellHTML(sec){
  const nav=[['today','home','Σήμερα'],['agenda','l-calendar-clock','Ημερολόγιο'],['people','users',LX('whoPl')||'Πρόσωπα'],['map','l-map','Χάρτης'],['settings','settings','Ρυθμίσεις']];
  const title={today:'Σήμερα',agenda:'Ημερολόγιο',people:LX('whoPl'),map:'Χάρτης',settings:'Ρυθμίσεις'}[sec]||'Ημερολόγιο';
  const a=([k,i,l])=>`<a href="#/${k}" class="${sec===k?'on':''}">${ic(i,19)}<span>${esc(l)}</span></a>`;
  const fab=['today','agenda','people'].includes(sec);
  document.body.innerHTML=`<div class="app"><aside class="side noprint"><a class="brand" href="#/today">${LOGO}<div><b>Ημερολόγιο</b><span>${esc(S.meta.org||prof().p.n)}</span></div></a><nav class="nav">${nav.map(a).join('')}</nav><div class="side-ver tiny muted">Έκδοση ${APP_VERSION}</div></aside>
  <div class="shell"><header class="topbar noprint"><a class="tbrand" href="#/today">${LOGO}</a><b class="tbtitle">${esc(title)}</b><span class="tbprof">${esc(S.meta.org||prof().p.n)}</span></header>${S.data.settings.demo?`<div class="demostrip noprint"><span>🧪 <b>Δοκιμαστική λειτουργία</b> — τα ραντεβού και οι ${esc(LX('whoPlL'))} είναι παραδείγματα</span><button type="button" id="demoEnd">Τέλος δοκιμής</button></div>`:''}<main class="main" id="main"></main></div>
  <nav class="bottomnav noprint">${nav.map(([k,i,l])=>`<a href="#/${k}" class="${sec===k?'on':''}"><span class="bi">${ic(i,22)}</span><span>${esc(l)}</span></a>`).join('')}</nav>
  ${fab?`<button class="fab noprint" id="fab" aria-label="${sec==='people'?'Νέος':'Νέο ραντεβού'}">${ic('plus',26)}</button>`:''}</div>`;
  const de=$('#demoEnd');if(de)de.onclick=demoClear;
  const f=$('#fab');if(f)f.onclick=()=>sec==='people'?go('person/new'):apptDialog({date:(parseRoute().q.d)||todayISO()});
}
addEventListener('hashchange',render);

/* ---------- πρώτη χρήση: επάγγελμα και όνομα ---------- */
function profPickerHTML(cur){return IM_GROUPS.map(g=>`<div class="pgrp"><i style="background:${g.color}"></i>${esc(g.g)}</div><div class="ptiles">${g.list.map(p=>`<button type="button" data-pf="${p.id}" class="ptile ${p.id===cur?'on':''}" style="--gc:${g.color}"><span class="pti">${p.i||'✨'}</span><span class="ptn">${esc(p.n)}</span></button>`).join('')}</div>`).join('');}
function firstRun(){
  const md=modal(`<div class="fr-head">${LOGO}<div><h2 style="margin:0">Καλώς ήρθες!</h2><div class="small muted">Ημερολόγιο ραντεβού για κάθε επάγγελμα</div></div></div>
   <div class="field"><label class="f" for="fr-n">Το όνομά σου</label><input class="in" id="fr-n" autocomplete="name" placeholder="π.χ. Μαρία Παπαδοπούλου"></div>
   <div class="field"><label class="f" for="fr-b">Επωνυμία επιχείρησης <span class="tiny muted">· προαιρετικό</span></label><input class="in" id="fr-b" placeholder="π.χ. Κομμωτήριο Μαρία"></div>
   <label class="f">Τι δουλειά κάνεις;</label><p class="tiny muted" style="margin:0 0 6px">Ανάλογα με το επάγγελμα αλλάζουν οι λέξεις (πελάτης, ασθενής, μαθητής…), οι ειδικότητες του προσωπικού και η συνηθισμένη διάρκεια. Αλλάζει όποτε θέλεις από τις Ρυθμίσεις.</p>
   <label class="check frdemo"><input type="checkbox" id="fr-d" checked><span>Βάλε μερικά παραδείγματα για να δω πώς δουλεύει<br><small class="tiny muted">Σβήνονται με ένα κουμπί.</small></span></label>
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
  ${certAlertsHTML()}
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
  bindInstall();}

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
function IM_AFTER_SAVE(list,{edit}){if(edit||S.data.settings.confOff||!list||list.length!==1)return;const a=list[0];const p=stOf(a.sid);const ph=p&&(p.phone||((p.contacts||[])[0]||{}).phone);if(!ph||p.demo)return;
  location.href=smsHref(ph,confText(a));}

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
   ${IM_CONTACTS_OK()?`<button type="button" class="btn conpick field" id="p-con">${ic('users',16)} Από τις επαφές του κινητού</button>`:''}
   <div class="field"><label class="f" for="p-n">Ονοματεπώνυμο</label><input class="in" id="p-n" name="name" required autocomplete="off" value="${esc(p.name||'')}"></div>
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="p-ph">Τηλέφωνο</label><div class="phrow"><input class="in" id="p-ph" name="phone" type="tel" inputmode="tel" value="${esc(p.phone||'')}">${p.phone?`<a class="callbtn" href="tel:${telLink(p.phone)}" aria-label="Κλήση">${ic('l-phone',20)}</a><a class="callbtn sms" href="sms:${telLink(p.phone)}" aria-label="Μήνυμα">${ic('l-message-square',20)}</a>`:''}</div></div>
   <div class="field"><label class="f" for="p-em">Email</label><input class="in" id="p-em" name="email" type="email" inputmode="email" autocapitalize="none" value="${esc(p.email||'')}"></div></div>
   <div class="field"><label class="f" for="p-ad">Διεύθυνση <span class="tiny muted">· για τον χάρτη, προαιρετικό</span></label><input class="in" id="p-ad" name="addr" value="${esc(p.loc&&p.loc.addr||'')}"></div>
   <div class="field"><label class="f" for="p-no">Σημειώσεις</label><textarea class="in" id="p-no" name="notes" style="min-height:70px">${esc(p.notes||'')}</textarea></div>
   <div class="field"><label class="f">Χρώμα στο ημερολόγιο</label><div class="scols">${pr.map(c=>`<button type="button" data-pc="${c}" style="background:${c}" class="${p.color===c?'on':''}" aria-label="Χρώμα"></button>`).join('')}<button type="button" data-pc="" class="none ${p.color?'':'on'}" aria-label="Χωρίς χρώμα">${ic('x',12)}</button></div></div>
   <div class="row"><button class="btn pri">${ic('check',16)} Αποθήκευση</button>${isNew?'':`<button type="button" class="btn danger" id="p-del">${ic('trash',16)} Διαγραφή</button>`}</div></form>
  ${isNew?'':`<div class="card"><div class="card-h"><h3>Ραντεβού</h3><button class="btn sm pri" id="p-new">${ic('plus',15)} Νέο ραντεβού</button></div>
   ${p.phone?`<div class="row" style="gap:6px;margin-bottom:12px"><a class="btn sm" href="tel:${telLink(p.phone)}">Κλήση</a>${chBtnsHTML({contacts:[{name:p.name,phone:p.phone,email:p.email}]},'Καλησπέρα!','Μήνυμα','')}</div>`:''}
   ${fut.length?`<div class="aglist">${fut.slice(0,6).map(o=>`<div class="small muted" style="margin:8px 0 2px">${WDAYS[wdOf(o.date)]} ${fmtDate(o.date)}</div>${apptCard(o)}`).join('')}</div>${fut.length>6?`<p class="small muted" style="margin:8px 0 0">και ${fut.length-6} ακόμα μέσα στους επόμενους 6 μήνες.</p>`:''}`:'<p class="small muted">Κανένα επόμενο ραντεβού.</p>'}
   ${past.length?`<details style="margin-top:12px"><summary class="small"><b>Προηγούμενα</b> (${past.length})</summary><div class="aglist" style="margin-top:6px">${past.map(o=>`<div class="small muted" style="margin:8px 0 2px">${fmtDate(o.date)}</div>${apptCard(o)}`).join('')}</div></details>`:''}</div>`}</div>`;
  const F=$('#pf');let col=p.color||'';
  const pc=$('#p-con');if(pc)pc.onclick=async()=>{const L=await IM_PICKCONTACTS(false);const c=L[0];if(!c)return;F.name.value=c.name;if(c.phone)F.phone.value=c.phone;if(c.email)F.email.value=c.email;toast('Μπήκαν τα στοιχεία από τις επαφές.','ok');};
  F.onclick=e=>{const b=e.target.closest('[data-pc]');if(!b)return;col=b.dataset.pc;$$('[data-pc]',F).forEach(x=>x.classList.toggle('on',x===b));};
  F.onsubmit=e=>{e.preventDefault();const o=fd(F);if(!o.name.trim())return toast('Γράψε όνομα.','bad');
    Object.assign(p0,{name:o.name.trim(),avatar:initial(o.name),phone:o.phone.trim(),email:o.email.trim().toLowerCase(),notes:o.notes.trim(),color:col||undefined,updated:new Date().toISOString()});
    p0.contacts=(p0.phone||p0.email)?[{name:p0.name,role:'',phone:p0.phone,email:p0.email}]:[];
    const newAddr=o.addr.trim()&&!(p0.loc&&p0.loc.addr===o.addr.trim()&&p0.loc.lat!=null);if(o.addr.trim())p0.loc=Object.assign({},p0.loc&&p0.loc.addr===o.addr.trim()?p0.loc:{},{addr:o.addr.trim(),home:true});else delete p0.loc;
    if(isNew)S.data.students.push(p0);save();toast('Αποθηκεύτηκε.','ok');if(newAddr)geocodePerson(p0,true);
    if(isNew&&sessionStorage.getItem('im-after-person')){sessionStorage.removeItem('im-after-person');go('today');setTimeout(()=>apptDialog({date:todayISO(),sids:[p0.id]}),200);return;}
    go('person/'+p0.id);};
  const dl=$('#p-del');if(dl)dl.onclick=async()=>{const n=appts().filter(a=>a.sid===p0.id).length;if(!await confirmDlg(`Διαγραφή «${esc(stuName(p0))}»${n?` και ${n===1?'του ραντεβού του':'των '+n+' ραντεβού του'}`:''}; Δεν αναιρείται.`,{ok:'Διαγραφή',danger:true}))return;
    S.data.students=S.data.students.filter(x=>x.id!==p0.id);S.data.appts=appts().filter(a=>a.sid!==p0.id);S.data.waitlist=(S.data.waitlist||[]).filter(w=>w.sid!==p0.id);save();toast('Διαγράφηκε.');go('people');};
  const nb=$('#p-new');if(nb)nb.onclick=()=>apptDialog({date:todayISO(),sids:[p0.id]});}
const PERS_COLORS=['#7462B4','#3A8A61','#2F7FA8','#C77A3A','#B4527A','#8A7A2E','#C46A7A','#5A6ACF','#2E8C8C','#9C5BB5'];

/* ---------- ρυθμίσεις: λίστα κατηγοριών, κάθε κατηγορία σε δική της σελίδα ---------- */
function isPrivate(){return biz().kind==='private';}
const SET_SECS=()=>[
  ['prof','',prof().p.i||'✨','Επάγγελμα',prof().p.n],
  ['info','',isPrivate()?'👤':'🏢',isPrivate()?'Προσωπικά στοιχεία':'Στοιχεία επιχείρησης',isPrivate()?(S.data.settings.myName||'Όνομα, τηλέφωνο'):(biz().name||'Επωνυμία, τηλέφωνο, ΑΦΜ')],
  ['staff','',`👥`,'Προσωπικό',(providers().length===1?'1 άτομο κάνει ραντεβού':providers().length+' άτομα κάνουν ραντεβού')],
  ['hours','','🕘','Ωράριο και αργίες',agCfg().from+'–'+agCfg().to],
  ['look','','🎨','Χρώμα και λέξεις','Το χρώμα της εφαρμογής, πώς λέγονται οι '+LX('whoPlL')],
  ['msgs','','💬','Μηνύματα στους πελάτες',S.data.settings.confOff?'Χωρίς αυτόματη επιβεβαίωση':'Επιβεβαίωση με SMS μόλις κλείνεις ραντεβού'],
  ['backup','','🛟','Αντίγραφα ασφαλείας',bkStatusShort()],
  ['about','','ℹ️','Εγκατάσταση και έκδοση','Έκδοση '+APP_VERSION]];
function viewSettingsPage(r){const id=r.id==='business'?'info':r.id;const L=SET_SECS();const sec=L.find(x=>x[0]===id);
  if(!sec){M().innerHTML=`${pageHead('Ρυθμίσεις','')}<div class="setlist">${L.map(([k,,i,t,d])=>`<a class="setrow" href="#/settings/${k}"><span class="seti">${i}</span><span class="grow"><b>${esc(t)}</b><small>${esc(d)}</small></span>${ic('right',18)}</a>`).join('')}</div><p class="tiny muted" style="text-align:center;margin-top:18px">© 2026 Ανδρέας Μ. Γλεντζάκης · Ημερολόγιο ${APP_VERSION}</p>`;return;}
  M().innerHTML=`<a class="setback" href="#/settings">${ic('left',18)} Ρυθμίσεις</a>${pageHead(esc(sec[3]),'')}<div id="sb"></div>`;SETP[id]($('#sb'));}
const SETP={
 prof(el){el.innerHTML=`<p class="small muted" style="margin-top:0">Αλλάζουν οι λέξεις, οι ειδικότητες του προσωπικού, η διάρκεια ραντεβού και το χρώμα. Τα ραντεβού και τα πρόσωπα μένουν όπως είναι.</p>${profPickerHTML(S.data.settings.prof)}`;
  el.onclick=e=>{const b=e.target.closest('[data-pf]');if(!b)return;S.data.settings.prof=b.dataset.pf;S.data.settings.lex={};save();toast('Επάγγελμα: '+prof().p.n,'ok');render();};},
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
   <div class="row" style="margin-top:12px;align-items:center"><label class="small" for="th-own">Δικό μου χρώμα</label><input type="color" id="th-own" value="${cur}"><button class="btn sm ghost" id="th-def">Το χρώμα του επαγγέλματος</button></div></div>
  <div class="card"><h3>Οι λέξεις της εφαρμογής</h3><p class="small muted" style="margin-top:0">Άλλαξέ τες αν θέλεις κάτι πιο δικό σου. Κενό = η λέξη του επαγγέλματος.</p><div class="grid g2" style="gap:8px">${lx('who','Το πρόσωπο')}${lx('whoAcc','«Διάλεξε …»')}${lx('whoGen','«Καρτέλα …»')}${lx('whoPl','Πληθυντικός')}${lx('whoPlL','Πληθυντικός με μικρά')}${lx('one','Τίτλος στο κινητό')}</div><button class="btn pri" id="st-lx">${ic('check',15)} Αποθήκευση λέξεων</button></div>`;
  $$('[data-th]',el).forEach(b=>b.onclick=()=>{S.data.settings.color=b.dataset.th;save();render();});$('#th-own',el).onchange=e=>{S.data.settings.color=e.target.value;save();render();};$('#th-def',el).onclick=()=>{delete S.data.settings.color;save();render();};
  $('#st-lx',el).onclick=()=>{const o={};$$('[data-lx]',el).forEach(i=>{const v=i.value.trim();if(v&&v!==base[i.dataset.lx])o[i.dataset.lx]=v;});S.data.settings.lex=o;save();toast('Αποθηκεύτηκε.','ok');render();};},
 msgs(el){el.innerHTML=`<div class="card section"><label class="switch"><span><b>Επιβεβαίωση με μήνυμα μόλις κλείνεις ραντεβού</b><small>Με την «Αποθήκευση» ανοίγει έτοιμο μήνυμα προς τον πελάτη (αν έχει τηλέφωνο). Εσύ πατάς μόνο «Αποστολή».</small></span><input type="checkbox" id="cf-on" ${S.data.settings.confOff?'':'checked'}></label>
   <div class="field" style="margin-top:12px"><label class="f" for="cf-t">Κείμενο επιβεβαίωσης</label><textarea class="in" id="cf-t" style="min-height:80px">${esc(S.data.settings.confTpl||CONF_TPL_DEF)}</textarea><div class="tiny muted" style="margin-top:4px">Λέξεις που αλλάζουν μόνες τους: {όνομα} {ημέρα} {ώρα} {επιχείρηση}</div></div>
   <div class="row"><button class="btn pri" id="cf-s">${ic('check',16)} Αποθήκευση</button><button class="btn ghost" id="cf-d">Αρχικό κείμενο</button></div></div>
   <div class="card"><h3>Υπενθυμίσεις την προηγούμενη μέρα</h3><p class="small muted" style="margin-top:0">Από το «Σήμερα» → «Αύριο» → «Στείλε υπενθυμίσεις», ή από το Ημερολόγιο → ⋯ → «Υπενθυμίσεις».</p></div>`;
  $('#cf-on',el).onchange=e=>{S.data.settings.confOff=!e.target.checked;save();};$('#cf-s',el).onclick=()=>{S.data.settings.confTpl=$('#cf-t',el).value.trim()||CONF_TPL_DEF;save();toast('Αποθηκεύτηκε.','ok');};$('#cf-d',el).onclick=()=>{delete S.data.settings.confTpl;save();render();};},
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
// αυτόματος έλεγχος μία φορά τη μέρα
setTimeout(async()=>{try{const k='imer-upchk';if(localStorage.getItem(k)===todayISO())return;localStorage.setItem(k,todayISO());const r=await fetch('version.json?v='+Date.now(),{cache:'no-store'});const v=(await r.json()).version;if(v&&v!==APP_VERSION&&swReg){await swReg.update();}}catch(e){}},4000);

/* ---------- έναρξη ---------- */
S.data=loadData();applyIdentity();
if(!location.hash)history.replaceState(null,'','#/today');
render();
setTimeout(autoBackup,5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&/^#\/agenda/.test(location.hash)&&!topModal())render();});
