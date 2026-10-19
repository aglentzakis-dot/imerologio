/* Ημερολόγιο — η εφαρμογή γύρω από το κοινό κομμάτι imerologio.js.
   © 2026 Ανδρέας Μ. Γλεντζάκης (Andreas M. Glentzakis). Με την επιφύλαξη παντός δικαιώματος. All rights reserved.
   Απαγορεύεται η αντιγραφή, τροποποίηση και διάθεση, εν όλω ή εν μέρει, χωρίς προηγούμενη γραπτή άδεια του κατόχου. */
'use strict';
/* κοινές μεταβλητές που χρειάζεται ήδη η πρώτη εμφάνιση (έτος, μνήμη θέσης) */
var YEAR_PICK=null,NAVSTK=[location.hash||'#/today'],SCROLLMEM={},_scT=0,_scLock=0,_shT=0;
var START_OPTS=[['last','Τελευταία που είχες ανοίξει','↩️'],['today','Σήμερα','🏠'],['day','Ημέρα','📅'],['week','Εβδομάδα','🗓️'],['month','Μήνας','▦'],['year','Έτος','📆'],['list','Λίστα','☰']];
var OFF_REASONS=[['Άδεια','🏖️'],['Κλειστό','🔒'],['Σεμινάριο','🎓'],['Ταξίδι','✈️'],['Προσωπικό','🏠']];
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
function save(){S.data.meta.changes=(S.data.meta.changes||0)+1;try{localStorage.setItem(STORE,JSON.stringify(S.data));}catch(e){toast('Δεν αποθηκεύτηκε — η μνήμη της συσκευής είναι γεμάτη.','bad');}applyIdentity();if(window.glenShare)glenShare();}

/* ---------- πρόσωπα (στο κοινό κομμάτι λέγονται «students» για συμβατότητα) ---------- */
function getStudent(id){return S.data.students.find(x=>x.id===id)||null;}
const COLL=new Intl.Collator('el');function myStudents(){return S.data.students.slice().sort((a,b)=>COLL.compare(a.name||'',b.name||''));}
const stuName=s=>s?(s.name||'—'):'—';
const initial=n=>((n||'?').trim()[0]||'?').toUpperCase();
function IM_NEWPERSON(name,c){c=c||{};if(c.id&&getStudent(c.id))return c.id;if(c.phone){const ex=byPhone(c.phone);if(ex)return ex.id;}const p={id:uid(),name:name.trim(),avatar:initial(name),phone:c.phone||'',email:c.email||'',contacts:(c.phone||c.email)?[{name:name.trim(),phone:c.phone||'',email:c.email||''}]:[],created:new Date().toISOString()};
  if(c.phone2||(c.phones&&c.phones[1]))p.phone2=c.phone2||c.phones[1];if(c.addr)p.loc={addr:c.addr,home:true};if(c.notes)p.notes=c.notes;if(c.cons)setCons(p,'appt',c.cons==='yes',c.consHow||'στο νέο ραντεβού');
  S.data.students.push(p);save();if(p.loc&&window.geocodePerson)geocodePerson(p,false);return p.id;}
/* γρήγορη καρτέλα νέου πελάτη μέσα από το «Νέο ραντεβού»: όνομα, τηλέφωνο και, αν θέλεις, τα υπόλοιπα — αποθηκεύεται κανονικά στους πελάτες */
const phKey=x=>String(x||'').replace(/\D/g,'').slice(-10);
/* όλα τα τηλέφωνα ενός πελάτη (κύριο, 2ο, 3ο, επαφές) */
const phonesOf=p=>[p.phone,p.phone2,p.phone3,...(p.contacts||[]).map(c=>c.phone)].map(x=>String(x||'').trim()).filter(Boolean);
const byPhone=(ph,skip)=>{const k=phKey(ph);return k.length>=8?S.data.students.find(p=>p.id!==skip&&phonesOf(p).some(x=>phKey(x)===k)):null;};
function IM_NEWPERSON_DIALOG(nm){return new Promise(res=>{let done=false;
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">${ic('plus',18)} Νέος ${esc(LX('who')).toLowerCase()}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Μπαίνει κατευθείαν στους ${esc(LX('whoPlL'))} και επιλέγεται για το ραντεβού.</p>
   <div class="npsrc"><button type="button" class="btn sm" id="np-con">📇 Από τις επαφές</button><button type="button" class="btn sm" id="np-xls">📊 Από Excel ή αρχείο</button></div>
   <form id="np"><div class="field"><label class="f" for="np-n">Ονοματεπώνυμο</label><input class="in" id="np-n" name="name" required autocomplete="off" value="${esc(nm||'')}"></div>
    <div class="field"><label class="f" for="np-p">Τηλέφωνο</label><input class="in" id="np-p" name="phone" type="tel" inputmode="tel" autocomplete="off" placeholder="π.χ. 69…"><div class="tiny muted" style="margin-top:4px">Για να του στέλνεις επιβεβαίωση και υπενθύμιση.</div><div id="np-dup"></div></div>
    <details class="field npmore"><summary class="small"><b>Περισσότερα στοιχεία</b> <span class="muted">— προαιρετικά</span></summary>
     <div class="field" style="margin-top:10px"><label class="f" for="np-e">Email</label><input class="in" id="np-e" name="email" type="email" inputmode="email" autocomplete="off"></div>
     <div class="field"><label class="f" for="np-a">Διεύθυνση <span class="tiny muted">· για τον χάρτη</span></label><input class="in" id="np-a" name="addr" autocomplete="off"></div>
     <div class="field"><label class="f" for="np-o">Σημειώσεις</label><textarea class="in" id="np-o" name="notes" style="min-height:56px"></textarea></div>
     <label class="switch"><span><b>Δέχεται μηνύματα για τα ραντεβού</b><small>Επιβεβαίωση, υπενθύμιση, αλλαγή</small></span><input type="checkbox" name="cons" checked></label></details>
    <div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Αποθήκευση και επιλογή</button></div></form>`,{onClose:()=>{if(!done)res(null);}});
  const f=$('#np',md.el);const n=$('#np-n',md.el);setTimeout(()=>(nm?$('#np-p',md.el):n).focus(),80);
  const dupOf=()=>byPhone(f.phone.value);
  const fillFrom=L=>{if(!L||!L.length)return;if(L.length>1){done=true;md.close();return res({list:L});}const c=L[0];f.name.value=c.name||f.name.value;if(c.phone){f.phone.value=c.phone;f.phone.oninput();}if(c.email)f.email.value=c.email;if(c.addr)f.addr.value=c.addr;if(c.notes)f.notes.value=c.notes;if(c.email||c.addr||c.notes)$('.npmore',md.el).open=true;toast('Συμπληρώθηκαν τα στοιχεία — έλεγξε και πάτα «Αποθήκευση».','ok');};
  $('#np-con',md.el).onclick=async()=>fillFrom(await IM_PICKCONTACTS(true));
  $('#np-xls',md.el).onclick=async()=>fillFrom(await IM_FILEPICK(true,false));
  f.phone.oninput=()=>{const d=dupOf();$('#np-dup',md.el).innerHTML=d?`<div class="note small" style="margin-top:6px">Αυτό το τηλέφωνο το έχει ήδη ο/η <b>${esc(stuName(d))}</b>. <button type="button" class="btn sm" id="np-use">Διάλεξε αυτόν</button></div>`:'';const u=$('#np-use',md.el);if(u)u.onclick=()=>{done=true;md.close();res({id:d.id,name:stuName(d)});};};
  f.onsubmit=e=>{e.preventDefault();const v=fd(f);const name=(v.name||'').trim();if(!name)return toast('Γράψε όνομα.','bad');
    const same=S.data.students.find(p=>(p.name||'').trim().toLocaleLowerCase('el')===name.toLocaleLowerCase('el')&&(!v.phone||phKey(p.phone)===phKey(v.phone)));
    if(same&&!confirm('Υπάρχει ήδη «'+stuName(same)+'». Να φτιαχτεί δεύτερος με το ίδιο όνομα;')){done=true;md.close();return res({id:same.id,name:stuName(same)});}
    done=true;md.close();toast('Αποθηκεύτηκε στους '+LX('whoPlL')+'.','ok');res({name,phone:(v.phone||'').trim(),email:(v.email||'').trim(),addr:(v.addr||'').trim(),notes:(v.notes||'').trim(),cons:v.cons?'yes':'no'});};});}

/* ---------- επαφές του κινητού (Chrome σε Android) ---------- */
const IM_CONTACTS_OK=()=>!!(navigator.contacts&&window.ContactsManager);
const IM_IOS=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
/* όταν το κινητό δεν δίνει τις επαφές (iPhone, Samsung Internet, Firefox…): αρχείο επαφών (.vcf) ή Excel — γυρίζει τη λίστα που διάλεξε */
function IM_FILEPICK(multi,why,saveMode){return new Promise(res=>{let done=false,picking=false;const fin=v=>{if(done)return;done=true;res(v||[]);};
  const ios=IM_IOS();
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">${why?'📇 Επαφές':'📊 Από αρχείο'}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   ${why?`<p class="small" style="margin-top:0">${ios?'Το iPhone δεν αφήνει τις εφαρμογές του διαδικτύου να ανοίγουν απευθείας τις επαφές.':'Αυτός ο περιηγητής δεν ανοίγει απευθείας τις επαφές (ανοίγουν από το <b>Chrome σε Android</b>).'} Φέρ' τες με έναν από αυτούς τους τρόπους:</p>`:''}
   <div class="list">
    <button class="rw" data-fp="vcf"><span class="ricon">👤</span><span class="grow"><b>Αρχείο επαφής (.vcf)</b><small>${ios?'Επαφές → άνοιξε την επαφή → «Κοινοποίηση επαφής» → «Αποθήκευση στα Αρχεία». Μετά διάλεξέ το εδώ.':'Επαφές → ⋮ → «Κοινή χρήση» ή «Εξαγωγή» → αποθήκευση. Μετά διάλεξέ το εδώ.'}</small></span>${ic('right',16)}</button>
    <button class="rw" data-fp="xls"><span class="ricon">📊</span><span class="grow"><b>Λίστα Excel ή CSV</b><small>Το έτοιμο πρότυπο ή δική σου λίστα με Όνομα, Τηλέφωνο…</small></span>${ic('right',16)}</button>
   </div>
   <button class="btn sm ghost" id="fp-tpl" style="margin-top:10px">${ic('download',15)} Κατέβασε το πρότυπο Excel</button>`,{guard:false,onClose:()=>{if(!picking)fin([]);}});
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-fp]');if(!b)return;IM_FILEIN(b.dataset.fp,async f=>{picking=true;md.close();if(saveMode){fin([]);importFile(f);return;}fin(await importFile(f,{multi}));});});
  $('#fp-tpl',md.el).onclick=()=>xlsTemplate();});}
/* ανοίγει τον επιλογέα αρχείων (πρέπει να γίνει μέσα στο πάτημα) */
function IM_FILEIN(k,cb){const fi=document.createElement('input');fi.type='file';fi.accept=k==='vcf'?'.vcf,text/vcard,text/x-vcard':'.xlsx,.xls,.csv,.txt,.ods';fi.style.display='none';document.body.appendChild(fi);
  fi.onchange=()=>{const f=fi.files[0];fi.remove();if(f)cb(f);};fi.click();}
async function IM_PICKCONTACTS(multi){if(!IM_CONTACTS_OK())return IM_FILEPICK(multi,true);try{const L=await navigator.contacts.select(['name','tel','email'],{multiple:!!multi});
  return(L||[]).map(x=>({name:((x.name||[])[0]||(x.tel||[])[0]||'').trim(),phone:((x.tel||[])[0]||'').replace(/\s+/g,' ').trim(),phones:(x.tel||[]).map(t=>String(t).replace(/\s+/g,' ').trim()).filter(Boolean),email:((x.email||[])[0]||'').trim()})).filter(x=>x.name);}
  catch(e){if(e&&e.name!=='AbortError')toast('Δεν ήταν δυνατή η πρόσβαση στις επαφές.','bad');return[];}}

/* ---------- επάγγελμα και λέξεις ---------- */
const customProfs=()=>(S.data&&S.data.settings.customProfs)||[];
const groupList=g=>g.list.concat(customProfs().filter(c=>c.group===g.g));
function findProf(id){for(const g of IM_GROUPS)for(const p of groupList(g))if(p.id===id)return{g,p};return null;}
const PROF_ICONS=['✨','💼','🧰','🔧','🔨','🪚','🎨','🖌️','✂️','💇','💅','🧖','💆','🩺','🦷','🧠','🐾','🐶','📚','🎓','🎹','🎸','🏋️','🧘','⚽','🚗','🚚','🚕','🏠','🔑','⚖️','🧮','📐','💡','🌿','🌸','🧽','🍽️','☕','🍰','📷','🎬','💻','📱','🧵','👗','👶','👵','🙏','🛠️'];
const HEALTH_G='Υγεία & φροντίδα';const HEALTH_RE=/(ιατρ|γιατρ|θεραπ|ψυχ|νοσηλ|μαι[αά]|οδοντ|διαιτ|ορθοπ|παιδιατ|καρδιο|δερματο|οφθαλμ|γυναικολ|ωρλ|ακτινο|μικροβιο|ρευματο|νευρο|ενδοκριν|ουρολ|ψυχοθερ|συμβουλ.*ψυχ|ποδολ|ομοιοπαθ|βελονισ|χειροπρακ|οστεοπαθ|logo|therap|doctor|clinic|nurse|psych|dent)/;
function profAddDialog(groupName,old){return new Promise(res=>{const GS=IM_GROUPS.filter(x=>x.g!==OTHER_G);let g=GS.find(x=>x.g===((old&&old.group)||groupName))||null;let icon=old?old.i:'✨';let done=false;
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">${old?'Αλλαγή επαγγέλματος':'Νέο επάγγελμα'}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <form id="pa"><div class="field"><label class="f" for="pa-g">Κατηγορία <span class="tiny muted">· υποχρεωτικό</span></label><select class="in" id="pa-g" name="g" required><option value="">— Διάλεξε κατηγορία —</option>${GS.map(x=>`<option value="${esc(x.g)}" ${g&&g.g===x.g?'selected':''}>${esc(x.g)}</option>`).join('')}</select>
    <div class="tiny muted" style="margin-top:4px">Από την κατηγορία παίρνει τις λέξεις, τη διάρκεια, το χρώμα — και για τα επαγγέλματα υγείας, τον τρόπο που δουλεύουν οι κρατήσεις.</div><div id="pa-hh"></div></div><div class="field"><label class="f" for="pa-n">Όνομα επαγγέλματος</label><input class="in" id="pa-n" name="n" required value="${esc(old?old.n:'')}" placeholder="π.χ. Μασέρ, Tattoo artist, Λογοθεραπευτής"></div>
   <label class="f">Εικονίδιο</label><div class="pico">${PROF_ICONS.map(x=>`<button type="button" data-pi="${x}" class="${x===icon?'on':''}">${x}</button>`).join('')}</div>
   <div class="field" style="margin-top:12px"><label class="f" for="pa-t">Συνηθισμένες εργασίες <span class="tiny muted">· προαιρετικό, μία ανά γραμμή</span></label><textarea class="in" id="pa-t" name="t" style="min-height:80px" placeholder="π.χ.&#10;Μασάζ πλάτης&#10;Αθλητικό μασάζ">${esc(old?(old.t||'').split('|').join('\n'):'')}</textarea></div>
   <div class="row" style="justify-content:space-between">${old?`<button type="button" class="btn danger" id="pa-del">${ic('trash',16)}</button>`:'<span></span>'}<span class="row"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} ${old?'Αποθήκευση':'Προσθήκη'}</button></span></div></form>`,{onClose:()=>{if(!done)res(null);}});
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-pi]');if(b){icon=b.dataset.pi;$$('[data-pi]',md.el).forEach(x=>x.classList.toggle('on',x===b));}});
  const hh=()=>{const n=normT($('#pa-n',md.el).value),sg=$('#pa-g',md.el).value;const box=$('#pa-hh',md.el);box.innerHTML=n&&HEALTH_RE.test(n)&&sg!==HEALTH_G?`<div class="note small" style="margin-top:6px">🩺 Μοιάζει με επάγγελμα υγείας. Αν είναι, βάλ' το στην κατηγορία «${HEALTH_G}» για να προστατεύονται τα στοιχεία των ασθενών. <button type="button" class="btn sm" id="pa-tohealth">Βάλ' το εκεί</button></div>`:'';const b=$('#pa-tohealth',md.el);if(b)b.onclick=()=>{$('#pa-g',md.el).value=HEALTH_G;hh();};};
  $('#pa-n',md.el).addEventListener('input',hh);$('#pa-g',md.el).addEventListener('change',hh);hh();
  $('#pa',md.el).onsubmit=e=>{e.preventDefault();const o=fd(e.target);const n=o.n.trim();if(!n)return;g=GS.find(x=>x.g===o.g);if(!g)return toast('Διάλεξε κατηγορία.','bad');const t=o.t.split('\n').map(x=>x.trim()).filter(Boolean).join('|');
    const L=customProfs().slice();if(old){Object.assign(L.find(x=>x.id===old.id),{n,i:icon,t,group:g.g});}else L.push({id:'cp_'+uid().slice(0,8),n,i:icon,t,group:g.g,custom:true});
    S.data.settings.customProfs=L;save();done=true;md.close();res(old?old.id:L[L.length-1].id);};
  const dl=$('#pa-del',md.el);if(dl)dl.onclick=async()=>{if(!await confirmDlg(`Διαγραφή του επαγγέλματος «${esc(old.n)}»;`,{ok:'Διαγραφή',danger:true}))return;S.data.settings.customProfs=customProfs().filter(x=>x.id!==old.id);if(S.data.settings.prof===old.id)S.data.settings.prof='allo';save();done=true;md.close();res('deleted');};});}
function prof(){return findProf(S.data.settings.prof)||findProf('allo');}
function profLex(){const{g,p}=prof();return Object.assign({},g.lex,p.lex||{});}
/* η λέξη του επαγγέλματος για το ραντεβού (ραντεβού, μάθημα, συνεδρία…) σε πληθυντικό και ενικό για φράσεις */
/* επαγγέλματα υγείας (όχι κτηνίατρος): οι κρατήσεις δεν περνούν ποτέ με ονόματα από διακομιστή — μόνο κατευθείαν στον επαγγελματία */
function isHealthProf(){try{const{g,p}=prof();return(g.g==='Υγεία & φροντίδα'||g.id==='ygeia')&&p.id!=='ktiniatros';}catch(e){return false;}}
const HP_TXT=`<div class="hpnote"><b>🩺 Πώς δουλεύουν οι κρατήσεις στα επαγγέλματα υγείας</b>
 <ul><li>Το όνομα και το τηλέφωνο του ασθενούς έρχονται <b>κατευθείαν σε σένα</b> με Viber ή SMS, από το δικό του κινητό. Δεν περνούν από κανέναν διακομιστή και δεν τα βλέπει κανείς άλλος — ούτε εμείς.</li>
 <li>Στη σελίδα κράτησης ο ασθενής βλέπει σημείωση να μη γράφει συμπτώματα ή στοιχεία υγείας.</li>
 <li>Όταν ενεργοποιηθεί ο διακομιστής, οι ελεύθερες ώρες θα ενημερώνονται ζωντανά <b>χωρίς ονόματα</b> — μόνο «πιασμένη / ελεύθερη ώρα» — ώστε να μη διπλοκλείνεται ώρα. Τα στοιχεία του ασθενούς θα συνεχίσουν να έρχονται μόνο σε σένα.</li>
 <li>Για τα στοιχεία των ασθενών σου υπεύθυνος είσαι εσύ: κράτα το κινητό κλειδωμένο και κάνε αντίγραφα ασφαλείας.</li></ul></div>`;
function onePl(){const o=(LX('one')||'Ραντεβού').trim();const M={'ραντεβού':'ραντεβού','μάθημα':'μαθήματα','προπόνηση':'προπονήσεις','δουλειά':'δουλειές','κράτηση':'κρατήσεις','διαδρομή':'διαδρομές','επίδειξη':'επιδείξεις','φωτογράφιση':'φωτογραφίσεις','συνεδρία':'συνεδρίες','επίσκεψη':'επισκέψεις','θεραπεία':'θεραπείες','εξέταση':'εξετάσεις','ραντεβού ':'ραντεβού'};const k=o.toLocaleLowerCase('el');return M[k]||k;}
function oneSg(){const o=(LX('one')||'Ραντεβού').trim().toLocaleLowerCase('el');return o;}
function LX(k){const L=Object.assign(profLex(),S.data.settings.lex||{});return L[k]||'';}
function profRoles(){const{g,p}=prof();const L=(p.roles||g.roles||[]).map(x=>x.slice());(S.data.settings.customRoles||[]).forEach(r=>{if(!L.some(x=>x[0]===r[0]))L.splice(Math.max(0,L.length-1),0,r.slice());});return L;}
function profDur(){const{g,p}=prof();return +S.data.settings.dur||p.dur||g.dur||60;}
if(window.LANG==='en'){WDAYS.splice(0,7,'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday');WDAYS_S.splice(0,7,'Sun','Mon','Tue','Wed','Thu','Fri','Sat');
  MONTHS.splice(0,12,'January','February','March','April','May','June','July','August','September','October','November','December');MONTHS_G.splice(0,12,...MONTHS);}
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
  {const qm=new URLSearchParams(location.search).get('mine');if(qm){history.replaceState(null,'',location.pathname+'#/today');S.curHash='#/today';if(mineImport(qm)){applyIdentity&&applyIdentity();return render();}}}
  applyTheme();if(!S.data.settings.prof){shellHTML('today');M().innerHTML='';return firstRun();}
  const prevH=S.curHash,newH=location.hash,sameH=prevH===newH,y0=scrollY;let back=null;
  /* «πίσω»: γυρνάμε στη θέση που ήσουν· ίδια σελίδα: μένουμε εκεί που είσαι */
  if(!sameH){const K=NAVSTK;if(K.length>1&&K[K.length-2]===newH){K.pop();back=SCROLLMEM[newH]||null;}else{if(K[K.length-1]!==newH)K.push(newH);if(K.length>60)K.shift();}}
  window.AGPOS=null;if(/^#\/agenda/.test(S.curHash||'')&&/^#\/agenda/.test(location.hash)&&typeof agPosSave==='function')agPosSave();
  S.curHash=location.hash;
  {const qb=new URLSearchParams(location.search).get('book');if(qb){history.replaceState(null,'',location.pathname+'#/today');S.curHash='#/today';setTimeout(async()=>bookImport(await openTxt(qb)),200);}}
  const r=parseRoute();if(r.name==='book'){const c=r.q.r;history.replaceState(null,'','#/today');S.curHash='#/today';setTimeout(async()=>bookImport(await openTxt(c)),150);return render();}
  if(r.name==='mine'){const c=r.q.r;history.replaceState(null,'','#/today');S.curHash='#/today';setTimeout(async()=>{if(mineImport(await openTxt(c))){applyIdentity&&applyIdentity();render();}},150);return render();}const sec=r.name==='person'?'people':r.name==='stats'?'today':r.name;
  shellHTML(sec);
  try{if(r.name==='today')localStorage.setItem('imer-lasthome','today');else if(r.name==='agenda'){const v=r.q.view||localStorage.getItem('imer-agview')||'day';localStorage.setItem('imer-lasthome',v);}}catch(_){}
  const V={today:viewToday,agenda:viewAgendaApp,people:viewPeople,person:viewPerson,map:viewKonta,settings:viewSettingsPage,stats:viewStats}[r.name]||viewToday;
  if(!window.AGPOS&&!sameH&&!back)window.scrollTo(0,0);
  setTimeout(()=>dirtyWatch(M()),60);setTimeout(mineMsgShow,500);
  try{V(r);}catch(e){console.error(e);M().innerHTML=`<div class="card"><h2>Κάτι πήγε στραβά</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#/agenda">Ραντεβού</a></div>`;}
  if(back)scrollBack(back);else if(sameH&&!window.AGPOS){scrollTo(0,y0);requestAnimationFrame(()=>scrollTo(0,y0));}
}
/* μνήμη θέσης ανά σελίδα (και της λωρίδας ωρών του ημερολογίου) */
function scrollRec(){if(Date.now()<_scLock)return;const h=S.curHash||location.hash;if(!h)return;const sc=document.getElementById('tlScroll');SCROLLMEM[h]={y:scrollY,tl:sc?sc.scrollTop:null};}
addEventListener('scroll',()=>{clearTimeout(_scT);_scT=setTimeout(scrollRec,80);},{passive:true});
document.addEventListener('scroll',e=>{if(e.target&&e.target.id==='tlScroll'){clearTimeout(_scT);_scT=setTimeout(scrollRec,80);}},{passive:true,capture:true});
function scrollBack(p){_scLock=Date.now()+700;const go=()=>{scrollTo(0,p.y);const sc=document.getElementById('tlScroll');if(sc&&p.tl!=null)sc.scrollTop=p.tl;};go();requestAnimationFrame(go);setTimeout(go,90);setTimeout(()=>{if(Math.abs(scrollY-p.y)>40)go();},350);setTimeout(()=>{_scLock=0;scrollRec();},720);}
function shellHTML(sec){
  const nav=[['today','home','Σήμερα'],['agenda','l-calendar-clock','Ημερολόγιο'],['people','users',LX('whoPl')||'Πρόσωπα'],['map','l-map','Κοντά μου'],['settings','settings','Ρυθμίσεις']];
  const title={today:'Σήμερα',agenda:'Ημερολόγιο',people:LX('whoPl'),map:'Κοντά μου',settings:'Ρυθμίσεις'}[sec]||'Ημερολόγιο';
  const a=([k,i,l])=>`<a href="#/${k}" class="${sec===k?'on':''}">${ic(i,19)}<span>${esc(l)}</span></a>`;
  const fab=['today','agenda','people'].includes(sec);
  document.body.innerHTML=`<div class="wcbg" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="app"><aside class="side noprint"><a class="brand" href="#/today">${LOGO}<div><b>Ημερολόγιο</b><span>${esc(S.meta.org||prof().p.n)}</span></div></a><nav class="nav">${nav.map(a).join('')}</nav><div class="side-ver tiny muted">Έκδοση ${APP_VERSION}</div></aside>
  <div class="shell"><header class="topbar noprint"><a class="tbrand" href="#/today">${LOGO}</a><b class="tbtitle">${esc(title)}</b><span class="tbprof">${esc(S.meta.org||prof().p.n)}</span><button type="button" class="tblang" id="tbLang" aria-label="Γλώσσα · Language">${langFlag()}</button></header>${S.data.settings.demo?`<div class="demostrip noprint"><span>🧪 <b>Δοκιμαστική λειτουργία</b> — τα ραντεβού και οι ${esc(LX('whoPlL'))} είναι παραδείγματα</span><button type="button" id="demoEnd">Τέλος δοκιμής</button></div>`:''}<main class="main" id="main"></main></div>
  <nav class="bottomnav noprint">${nav.map(([k,i,l])=>`<a href="#/${k}" class="${sec===k?'on':''}"><span class="bi">${ic(i,22)}</span><span>${esc(l)}</span></a>`).join('')}</nav>
  ${fab?`<button class="fab noprint" id="fab" aria-label="${sec==='people'?'Νέος':'Νέο ραντεβού'}">${ic('plus',26)}</button>`:''}</div>`;
  document.body.classList.toggle('hidenames',!!S.data.settings.hideNames);
  const de=$('#demoEnd');if(de)de.onclick=demoClear;const tl=$('#tbLang');if(tl)tl.onclick=langDialog;
  const f=$('#fab');if(f)f.onclick=()=>sec==='people'?go('person/new'):apptDialog({date:(parseRoute().q.d)||todayISO()});
}
addEventListener('hashchange',async()=>{
  if(LEAVE_OK||location.hash===S.curHash||!pageDirty()){LEAVE_OK=false;return render();}
  const to=location.hash;try{history.replaceState(null,'',S.curHash||'#/today');}catch(_){}
  if(await leaveAsk()){LEAVE_OK=true;location.hash=to;}});
addEventListener('beforeunload',e=>{if(pageDirty()){e.preventDefault();e.returnValue='';}});

/* ---------- πρώτη χρήση: επάγγελμα και όνομα ---------- */
const OTHER_G='Άλλο';
function profPickerHTML(cur,edit){return IM_GROUPS.map(g=>`<div class="pgrp"><i style="background:${g.color}"></i>${esc(g.g)}</div><div class="ptiles">${groupList(g).filter(p=>!(g.g===OTHER_G&&p.id==='allo'&&cur!=='allo')).map(p=>`<button type="button" data-pf="${p.id}" class="ptile ${p.id===cur?'on':''} ${p.custom?'mine':''}" style="--gc:${g.color}"><span class="pti">${p.i||'✨'}</span><span class="ptn">${esc(p.n)}</span>${p.custom&&edit?`<span class="pted" data-pedit="${p.id}" role="button" aria-label="Αλλαγή">${ic('edit',13)}</span>`:''}</button>`).join('')}<button type="button" data-padd="${g.g===OTHER_G?'':esc(g.g)}" class="ptile padd" style="--gc:${g.color}"><span class="pti">${ic('plus',22)}</span><span class="ptn">${g.g===OTHER_G?'Δικό μου επάγγελμα (διαλέγεις κατηγορία)':'Δικό μου επάγγελμα'}</span></button></div>`).join('');}
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
  <nav class="vjump" aria-label="Προβολή ημερολογίου"><a href="#/agenda?view=day&d=${t}">${ic('calendar',16)}<span>Ημέρα</span></a><a href="#/agenda?view=week&w=${mondayOf(t)}">${ic('l-calendar-clock',16)}<span>Εβδομάδα</span></a><a href="#/agenda?view=month">${ic('grid',16)}<span>Μήνας</span></a><a href="#/agenda?view=year">${ic('calendar',16)}<span>Έτος</span></a><a href="#/agenda?view=list">${ic('menu',16)}<span>Λίστα</span></a></nav>
  ${isPrivate()?monthDotsHTML():''}
  ${certAlertsHTML()}
  <section class="hero"><div class="hero-in"><div class="hero-hi">${greet()}${first?', '+esc(first):''}</div>
   <div class="hero-date">${WDAYS[wdOf(t)]} ${+t.slice(8)} ${MONTHS_G[+t.slice(5,7)-1]}</div>
   <div class="hero-sum">${closed?esc(closed):act.length?`<b>${act.length}</b> ${act.length===1?'ραντεβού':'ραντεβού'} σήμερα${left?` · <b>${left}</b> ακόμα`:''}`:'Κανένα ραντεβού σήμερα'}</div></div></section>
  ${next?`<button class="nextcard ${live?'live':''}" data-ap="${next.key}"><span class="nc-time"><b>${next.s}</b><small>${next.e}</small></span><span class="nc-main"><small>${live?'Τώρα':'Επόμενο'}</small><b>${esc(stuName(nst))}</b>${next.a.note?`<span>${esc(next.a.note)}</span>`:''}${pvBadge(next,1)}</span>${ic('right',20)}</button>
    ${ph?`<div class="ncact"><a class="btn" data-cg="${nst.id}" href="tel:${telLink(ph)}">${ic('l-phone',16)} Κλήση</a><a class="btn" data-cg="${nst.id}" href="${smsHref(ph,remText(next))}">${ic('send',16)} Υπενθύμιση</a></div>`:''}`:''}
  <section class="tsec"><div class="tsec-h"><h2>Το πρόγραμμα της ημέρας</h2><span class="row" style="gap:8px;align-items:center"><button class="eyebtn ${S.data.settings.hideNames?'off':''}" id="tEye" aria-label="${S.data.settings.hideNames?'Εμφάνιση ονομάτων':'Απόκρυψη ονομάτων'}">${ic('eye',18)}</button><a href="#/agenda?view=day&d=${t}">Ημέρα ${ic('right',14)}</a></span></div>
   ${act.length||L.length?`<div class="tlist">${L.map(o=>`<div class="trow ${o.st==='done'?'done':''} ${tmin(o.e)<=now&&o.st===''?'past':''}"><span class="tr-t">${o.s}</span>${apptCard(o,{compact:true})}</div>`).join('')}</div>`
    :`<div class="tempty">${ic('l-calendar-clock',34)}<b>Η μέρα είναι ελεύθερη</b><span>Κλείσε ραντεβού με το κουμπί + ή διάλεξε μια ελεύθερη ώρα.</span><button class="btn pri" id="tNew">${ic('plus',16)} Νέο ραντεβού</button></div>`}</section>
  ${F.length?`<section class="tsec"><div class="tsec-h"><h2>Ελεύθερες ώρες σήμερα</h2></div><div class="chips">${F.map(x=>`<button class="chipt free" data-new="${t}|${x}">${x}</button>`).join('')}</div></section>`:''}
  <section class="tsec"><div class="tsec-h"><h2>Αύριο</h2><a href="#/agenda?view=day&d=${tm}">Άνοιγμα ${ic('right',14)}</a></div>
   <div class="tmrw"><span><b>${T.length}</b> ${T.length===1?'ραντεβού':'ραντεβού'}${T.length?' — πρώτο στις '+T[0].s:''}</span>${T.length?`<button class="btn sm" id="tRem">${ic('bell',15)} Στείλε υπενθυμίσεις</button>`:''}</div></section>
  ${installCardHTML()}`;
  const n=$('#tNew');if(n)n.onclick=()=>apptDialog({date:t});
  $('#tEye').onclick=()=>{S.data.settings.hideNames=!S.data.settings.hideNames;save();render();};const r=$('#tRem');if(r)r.onclick=()=>remindDialog(tm);if(isPrivate())monthDotsBind();
  bindInstall();}

/* ---------- ημερολόγιο: τα σπάνια κουμπιά πάνε στο «Περισσότερα» ---------- */
function viewAgendaApp(r){M().onclick=null;M().onchange=null;setTimeout(()=>window.glenInbox&&glenInbox(),0);{let v=r.q.view;if(!v&&!r.q.d&&!r.q.w&&!r.q.m){try{v=localStorage.getItem('imer-agview');}catch(e){}}if(v==='year')return viewYear(r);}YEAR_PICK=null;viewAgenda(r);
  /* κλειστή μέρα με ραντεβού μίας φοράς: δείξ' τα για να μετακινηθούν */
  {const v=r.q.view||(()=>{try{return localStorage.getItem('imer-agview');}catch(e){return'';}})();const d=r.q.d||todayISO();const H=(v==='day'||!v)&&isClosed(d)?hiddenOnce(d,d):[];
   if(H.length){const box=document.createElement('div');box.className='note';box.style.margin='10px 0';box.innerHTML=`⚠️ <b>Η μέρα είναι κλειστή (${esc(offWhy(d))}) αλλά έχει ${H.length} ραντεβού.</b> Μετακίνησέ τα ή ακύρωσέ τα:<div class="aglist" style="margin-top:8px">${H.map(o=>apptCard({a:o.a,date:o.date,s:o.a.s,e:o.a.e,st:'',key:o.a.id+'|'+o.date})).join('')}</div>`;const ref=$('#main .dstrip-h')||$('#main .perhd')||$('#main .agbar');if(ref)ref.after(box);}}
  /* «Όλοι ▾» στην ίδια σειρά με την ημερομηνία· οι πληροφορίες του μήνα κάτω από την ημέρα */
  {const pb=$('#main .pvbar'),dh=$('#main .dstrip-h'),ph=$('#main .perhd');
   if(pb){if(dh){dh.classList.add('withpv');dh.insertBefore(pb,dh.children[1]||null);}else if(ph){ph.classList.add('withpv');ph.appendChild(pb);}}
   const tl=$('#main .tl');if(tl&&dh){const st=$('#main .dstat'),rw=st&&st.nextElementSibling&&st.nextElementSibling.classList.contains('row')?st.nextElementSibling:null;
     const box=document.createElement('div');box.className='aginfo';if(rw)box.appendChild(rw);if(st)box.appendChild(st);if(box.children.length)tl.after(box);}}
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
  return(S.data.settings.confTpl||tr(CONF_TPL_DEF)).replace(/\{όνομα\}/g,first?' '+first:'').replace(/\{ημέρα\}/g,WDAYS[wdOf(a.date)]+' '+fmtShort(a.date)).replace(/\{ώρα\}/g,a.s).replace(/\{επιχείρηση\}/g,(isPrivate()?S.data.settings.myName:B.name||S.data.settings.myName)||'').trim();}
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
function geocodePerson(p,say){if(!p.loc||!p.loc.addr||S.data.settings.geoOff)return Promise.resolve(false);GEOQ=GEOQ.then(async()=>{try{
  const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&accept-language=el&countrycodes=gr&q='+encodeURIComponent(p.loc.addr));const j=await r.json();
  if(j&&j[0]){const a=j[0].address||{};Object.assign(p.loc,{lat:+j[0].lat,lng:+j[0].lon,area:a.suburb||a.city_district||a.neighbourhood||a.town||a.village||a.city||a.municipality||''});save();if(say)toast('Βρέθηκε στον χάρτη: '+(p.loc.area||p.loc.addr),'ok');await new Promise(z=>setTimeout(z,1100));return true;}
  if(say)toast('Η διεύθυνση δεν βρέθηκε στον χάρτη. Βάλε την πινέζα με το χέρι από τον Χάρτη.','bad');}catch(e){if(say)toast('Χωρίς σύνδεση — ο χάρτης θα ενημερωθεί αργότερα.','bad');}await new Promise(z=>setTimeout(z,1100));return false;});return GEOQ;}
/* «Κοντά μου» μέσα στο Ημερολόγιο: η ΑΥΘΕΝΤΙΚΗ εφαρμογή (ίδια διεύθυνση), οπότε κάθε αναβάθμισή της φαίνεται και εδώ αμέσως */
function viewKonta(r){const fb=$('#fab');if(fb)fb.remove();const tab=(r&&r.q&&r.q.v)==='clients'?'clients':'km';
  if(tab==='clients'){const ins=()=>{if($('#km-tabs'))return;const ph=$('#main .page-head');if(ph)ph.insertAdjacentHTML('afterend',kmTabs('clients'));else M().insertAdjacentHTML('afterbegin',kmTabs('clients'));};
    const pr=viewMap(r);setTimeout(ins,0);Promise.resolve(pr).then(()=>setTimeout(ins,0),()=>setTimeout(ins,0));setTimeout(ins,1500);return;}
  const url=new URL('../kontamou/',location.href).href;
  M().innerHTML=`${kmTabs('km')}<p class="small muted" style="margin:0 0 8px">Έτσι σε βρίσκουν οι πελάτες της περιοχής σου στο <b>Κοντά μου</b> της GlenApps.</p>
   <div class="kmwrap"><iframe src="${esc(url)}" title="Κοντά μου" loading="lazy" allow="geolocation"></iframe></div>
   <a class="tiny muted" href="${esc(url)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px">Άνοιγμα σε ξεχωριστό παράθυρο ↗</a>`;}
const kmTabs=t=>`<div class="seg field" id="km-tabs" style="margin-top:4px"><a href="#/map" class="${t==='km'?'on':''}">📍 Κοντά μου</a><a href="#/map?v=clients" class="${t==='clients'?'on':''}">🗺️ Οι ${esc(LX('whoPlL'))} μου</a></div>`;
async function viewMap(){setTimeout(()=>{const g=$('#geo-on');if(g)g.onchange=()=>{S.data.settings.geoOff=!g.checked;save();toast(g.checked?'Ο εντοπισμός άνοιξε.':'Ο εντοπισμός έκλεισε — καμία διεύθυνση δεν στέλνεται.','ok');render();};},0);const all=myStudents();const on=all.filter(p=>p.loc&&p.loc.lat!=null),noPin=all.filter(p=>!(p.loc&&p.loc.lat!=null));
  const DC=dromoClients();const dOn=S.data.settings.mapDromo!==false;const DCp=dOn?DC.filter(c=>c.lat!=null&&c.lng!=null):[];
  const areas={};on.forEach(p=>{const k=p.loc.area||'Χωρίς περιοχή';areas[k]=(areas[k]||0)+1;});const AR=Object.entries(areas).sort((a,b)=>b[1]-a[1]);
  M().innerHTML=`<div class="mapwrap"><div id="imap"></div>${PLACE?`<div class="placebar">📍 Πάτα στον χάρτη πού βρίσκεται: <b>${esc(stuName(getStudent(PLACE)))}</b> <button class="btn sm" id="plx">Άκυρο</button></div>`:''}</div>
  <section class="mapsheet"><div class="tsec-h"><h2>Από πού έρχονται</h2><span class="small muted">${on.length} από ${all.length} στον χάρτη</span></div>
   ${DC.length?`<label class="switch"><span><b>🚐 Πελάτες από το Δρομολόγιο (${DC.length})</b><small>Πράσινες πινέζες· όσοι δεν είναι ήδη εδώ. Πάτα μία για να τον προσθέσεις στους ${esc(LX('whoPlL'))}.</small></span><input type="checkbox" id="map-dr" ${dOn?'checked':''}></label>`:`<p class="tiny muted" style="margin:0 0 8px">🚐 Αν έχεις και το Δρομολόγιο σε αυτό το κινητό, εδώ θα φαίνονται και οι πελάτες του.</p>`}
   <label class="switch geosw"><span><b>Αυτόματος εντοπισμός διευθύνσεων</b><small>${S.data.settings.geoOff?'Κλειστός: καμία διεύθυνση δεν φεύγει από το κινητό· την πινέζα τη βάζεις με το χέρι.':'Η διεύθυνση (χωρίς όνομα) στέλνεται στο OpenStreetMap μόνο για να βρεθεί το σημείο στον χάρτη.'}</small></span><input type="checkbox" id="geo-on" ${S.data.settings.geoOff?'':'checked'}></label>
   ${AR.length?`<div class="arealist">${AR.map(([a,n])=>`<div class="arow"><span class="grow">${esc(a)}</span><span class="abar"><i style="width:${Math.round(n/AR[0][1]*100)}%"></i></span><b>${n}</b></div>`).join('')}</div>`:`<p class="small muted">Γράψε διεύθυνση στην καρτέλα ${esc(LX('whoGen'))} και θα εμφανιστεί εδώ ως κουκίδα.</p>`}
   ${noPin.length?`<details class="nopin"><summary class="small"><b>Χωρίς σημείο στον χάρτη</b> (${noPin.length})</summary>${noPin.some(p=>p.loc&&p.loc.addr)?`<button class="btn sm" id="geoAll" style="margin:8px 0">${ic('route',14)} Εντοπισμός από τις διευθύνσεις</button>`:''}<div class="list">${noPin.map(p=>`<div class="rw static"><span class="grow"><b>${esc(stuName(p))}</b><small>${p.loc&&p.loc.addr?esc(p.loc.addr):'χωρίς διεύθυνση'}</small></span><button class="btn sm" data-place="${p.id}">📍 Βάλε</button></div>`).join('')}</div></details>`:''}
   <p class="tiny muted" style="margin-top:12px">Ο χάρτης φαίνεται μόνο σε αυτή τη συσκευή. Για τον εντοπισμό, η διεύθυνση στέλνεται στην υπηρεσία χαρτών OpenStreetMap.</p></section>`;
  setTimeout(()=>{const t=$('#map-dr');if(t)t.onchange=()=>{S.data.settings.mapDromo=t.checked;save();render();};},0);
  M().onclick=async e=>{const da=e.target.closest('[data-dadd]');if(da){const c=DC.find(x=>String(x.id)===da.dataset.dadd);if(!c)return;const id=IM_NEWPERSON(c.n,{phone:c.ph||'',addr:c.a||''});const p=getStudent(id);if(p&&c.lat!=null){p.loc=Object.assign(p.loc||{},{addr:c.a||'',lat:c.lat,lng:c.lng,home:true});save();}toast(`Ο/Η ${c.n} μπήκε στους ${LX('whoPlL')}.`,'ok');render();return;}
    const b=e.target.closest('[data-place]');if(b){PLACE=b.dataset.place;render();window.scrollTo(0,0);return;}if(e.target.closest('#plx')){PLACE=null;render();return;}
    if(e.target.closest('#geoAll')){const L=noPin.filter(p=>p.loc&&p.loc.addr);toast('Εντοπισμός '+L.length+' διευθύνσεων…');let n=0;for(const p of L)if(await geocodePerson(p,false))n++;toast(`Βρέθηκαν ${n} από ${L.length}.`,n?'ok':'bad');render();}};
  try{await loadLeaflet();}catch(e){$('#imap').innerHTML='<p class="small muted" style="padding:20px">Ο χάρτης χρειάζεται σύνδεση στο διαδίκτυο.</p>';return;}
  if(!$('#imap'))return;const Lf=window.L;MAP=Lf.map('imap',{zoomControl:true});Lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(MAP);
  MAPCL=Lf.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:46,iconCreateFunction:c=>Lf.divIcon({className:'',html:`<div class="clus" style="background:var(--brand)"><b>${c.getChildCount()}</b></div>`,iconSize:[44,44]})});
  on.forEach(p=>{const m=Lf.marker([p.loc.lat,p.loc.lng],{icon:Lf.divIcon({className:'',html:`<div class="pinwrap"><div class="pin" style="background:${p.color||'var(--brand)'}"><span>${esc(initial(p.name))}</span></div></div>`,iconSize:[30,30],iconAnchor:[4,30]})});
    m.bindPopup(`<b>${esc(stuName(p))}</b><br><span class="small">${esc(p.loc.area||p.loc.addr||'')}</span><br><a href="#/person/${p.id}">Καρτέλα</a>`);MAPCL.addLayer(m);});
  DCp.forEach(c=>{const m=Lf.marker([c.lat,c.lng],{icon:Lf.divIcon({className:'',html:`<div class="pinwrap"><div class="pin drpin"><span>🚐</span></div></div>`,iconSize:[30,30],iconAnchor:[4,30]})});
    m.bindPopup(`<b>${esc(c.n)}</b> <span class="tiny muted">· Δρομολόγιο</span><br><span class="small">${esc(c.a||'')}</span>${c.ph?`<br><a href="tel:${esc(c.ph)}">${esc(c.ph)}</a>`:''}<br><button class="btn sm" data-dadd="${esc(c.id)}" style="margin-top:6px">➕ Στους ${esc(LX('whoPlL'))}</button>`);MAPCL.addLayer(m);});
  const PTS=on.map(p=>[p.loc.lat,p.loc.lng]).concat(DCp.map(c=>[c.lat,c.lng]));
  MAP.addLayer(MAPCL);if(PTS.length)MAP.fitBounds(PTS,{padding:[40,40],maxZoom:14});else MAP.setView([38.2,23.8],6);
  setTimeout(()=>MAP.invalidateSize(),200);
  MAP.on('click',e=>{if(!PLACE)return;const p=getStudent(PLACE);PLACE=null;if(!p)return render();p.loc=Object.assign(p.loc||{},{lat:e.latlng.lat,lng:e.latlng.lng});if(!p.loc.addr)p.loc.addr='';
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=el&lat=${e.latlng.lat}&lon=${e.latlng.lng}`).then(r=>r.json()).then(j=>{const a=(j&&j.address)||{};p.loc.area=a.suburb||a.city_district||a.town||a.village||a.city||'';save();render();}).catch(()=>{save();render();});
    toast('Η πινέζα μπήκε.','ok');});
}

/* ---------- εισαγωγή πολλών μαζί: επαφές κινητού, Excel/CSV, αρχείο επαφών (.vcf) ---------- */
const normPh=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('0030'))d=d.slice(4);else if(d.startsWith('30')&&d.length===12)d=d.slice(2);return d;};
const normNm=n=>normT(n).replace(/\s+/g,' ').trim();
function importMenu(){const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Εισαγωγή πολλών μαζί</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
  <p class="small muted" style="margin-top:0">Βολεύει όταν έρχεσαι από άλλη εφαρμογή ή έχεις ήδη λίστα με τους ${esc(LX('whoPlL'))} σου. Πριν μπουν, βλέπεις τη λίστα και ξετσεκάρεις όσους δεν θέλεις. Όσοι υπάρχουν ήδη δεν διπλασιάζονται — ενημερώνονται μόνο αν άλλαξε κάτι.</p>
  <div class="list">
   <button class="rw" data-im="con"><span class="ricon">📇</span><span class="grow"><b>Από τις επαφές του κινητού</b><small>${IM_CONTACTS_OK()?'Διάλεξε όσους θέλεις, όλους μαζί':'Σε αυτό το κινητό: μέσω αρχείου επαφών — δες πώς'}</small></span>${ic('right',16)}</button>
   <button class="rw" data-im="vcf"><span class="ricon">👥</span><span class="grow"><b>Από αρχείο επαφών (.vcf)</b><small>Η «Εξαγωγή επαφών» του κινητού ή του Google</small></span>${ic('right',16)}</button>
  </div>
  <div class="xlsteps"><b>📊 Με Excel, σε 3 βήματα</b>
   <div class="xs"><span class="n">1</span><span class="grow">Κατέβασε το αρχείο${S.data.students.length?` — έχει ήδη μέσα τους ${S.data.students.length} ${esc(LX('whoPlL'))} σου`:''}<br><button class="btn sm" id="im-tpl" style="margin-top:6px">${ic('download',15)} Κατέβασε το Excel</button></span></div>
   <div class="xs"><span class="n">2</span><span class="grow">Πρόσθεσε ή διόρθωσε γραμμές στο Excel (ή στο Google Sheets) και αποθήκευσέ το.</span></div>
   <div class="xs"><span class="n">3</span><span class="grow">Ανέβασέ το: πριν αλλάξει οτιδήποτε, βλέπεις ποιοι μπαίνουν και ποιοι ενημερώνονται.<br><button class="btn sm pri" data-im="xls" style="margin-top:6px">${ic('upload',15)} Ανέβασε το Excel</button></span></div></div>`,{guard:false});
  md.el.addEventListener('click',async e=>{const b=e.target.closest('[data-im]');if(!b)return;const k=b.dataset.im;
    if(k==='con'&&!IM_CONTACTS_OK()){md.close();IM_FILEPICK(true,true,true);return;}
    if(k==='con'){try{localStorage.setItem('imer-conpick','bulk');}catch(x){}const L=await IM_PICKCONTACTS(true);try{localStorage.removeItem('imer-conpick');}catch(x){}if(!L.length)return;md.close();importPreview(L.map(c=>({name:c.name,phone:c.phone,email:c.email})),'τις επαφές');return;}
    IM_FILEIN(k,f=>{md.close();importFile(f);});});
  $('#im-tpl',md.el).onclick=()=>xlsTemplate();}
/* διαβάζει αρχείο: χωρίς pick → εισαγωγή/ενημέρωση· με pick → γυρίζει όσους διάλεξες (για το ραντεβού) */
async function importFile(f,pick){try{const rows=await readImportFile(f);if(!rows)return[];
  return await new Promise(res=>{const pk=pick?Object.assign({},pick,{res}):null;if(rows.kind==='people')importPreview(rows.list,f.name,pk);else importMap(rows.table,f.name,pk);if(!pk)res([]);});}
  catch(err){toast('Δεν διαβάστηκε το αρχείο: '+(err.message||''),'bad');return[];}}
const XLS_HEAD=['Ονοματεπώνυμο','Τηλέφωνο','Τηλέφωνο 2','Email','Διεύθυνση','Σημειώσεις','Κωδικός (μην τον αλλάζεις)'];
/* πρότυπο Excel: οι στήλες μας + όλοι οι πελάτες που υπάρχουν ήδη, ώστε να διορθώνεις και να το ξαναφέρνεις */
async function xlsTemplate(){try{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');}catch(e){return toast(e.message,'bad');}
  const X=window.XLSX;const L=S.data.students.filter(p=>!p.demo&&!p.archived).sort((a,b)=>stuName(a).localeCompare(stuName(b),'el'));
  const rows=[XLS_HEAD].concat(L.map(p=>[stuName(p),p.phone||'',p.phone2||'',p.email||'',(p.loc&&p.loc.addr)||'',p.notes||'',p.id]));
  const ws=X.utils.aoa_to_sheet(rows);ws['!cols']=[{wch:28},{wch:15},{wch:15},{wch:26},{wch:32},{wch:30},{wch:14}];ws['!autofilter']={ref:'A1:G'+Math.max(rows.length,2)};
  const help=X.utils.aoa_to_sheet([['Πώς το γεμίζεις'],[''],['• Μία γραμμή για κάθε '+LX('who').toLowerCase()+'. Αρκεί το Ονοματεπώνυμο· τα υπόλοιπα είναι προαιρετικά.'],['• Τηλέφωνο: όπως το γράφεις στο κινητό, π.χ. 6912345678.'],['• Για να διορθώσεις κάποιον που υπάρχει, άλλαξε τα στοιχεία του στη γραμμή του. Μην πειράζεις τη στήλη «Κωδικός».'],['• Για νέους, γράψε σε κενές γραμμές στο τέλος και άφησε τον «Κωδικό» κενό.'],['• Αποθήκευσε ως .xlsx και ανέβασέ το από το Ημερολόγιο: '+LX('whoPl')+' → Νέος → «Πολλοί μαζί».'],[''],['Πριν αλλάξει οτιδήποτε, η εφαρμογή σου δείχνει ποιοι μπαίνουν και ποιοι ενημερώνονται.']]);help['!cols']=[{wch:100}];
  const wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,String(LX('whoPl')).slice(0,30));X.utils.book_append_sheet(wb,help,'Οδηγίες');
  X.writeFile(wb,'pelates-imerologio.xlsx');toast('Κατέβηκε το «pelates-imerologio.xlsx». Γέμισέ το και ανέβασέ το εδώ.','ok');}
async function readImportFile(f){const n=f.name.toLowerCase();
  if(n.endsWith('.vcf')){return{kind:'people',list:parseVcf(await f.text())};}
  if(n.endsWith('.csv')||n.endsWith('.txt')){return{kind:'table',table:parseCsv(await f.text())};}
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');const wb=window.XLSX.read(await f.arrayBuffer(),{type:'array'});const sh=wb.Sheets[wb.SheetNames[0]];
  return{kind:'table',table:window.XLSX.utils.sheet_to_json(sh,{header:1,raw:false,defval:''})};}
function parseCsv(t){t=t.replace(/^﻿/,'');const first=t.split(/\r?\n/)[0]||'';const sep=[';',',','\t'].map(c=>[c,first.split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],cur='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=ch;}
    else if(ch==='"')q=true;else if(ch===sep){row.push(cur);cur='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(cur);rows.push(row);row=[];cur='';}else cur+=ch;}
  if(cur||row.length){row.push(cur);rows.push(row);}return rows.filter(r=>r.some(x=>String(x).trim()));}
/* παλιά κινητά (vCard 2.1) γράφουν τα ελληνικά ονόματα «κωδικοποιημένα» (QUOTED-PRINTABLE): τα αποκωδικοποιούμε */
function vcfQP(t){t=String(t).replace(/\r\n/g,'\n');
  t=t.replace(/^([^:\n]*ENCODING=QUOTED-PRINTABLE[^:\n]*:)((?:.*=\n)*.*)$/gim,(m,h,v)=>{v=v.replace(/=\n/g,'');const cs=(h.match(/CHARSET=([^;:]+)/i)||[])[1]||'utf-8';
    const bytes=[];for(let i=0;i<v.length;i++){if(v[i]==='='&&/^[0-9A-F]{2}$/i.test(v.substr(i+1,2))){bytes.push(parseInt(v.substr(i+1,2),16));i+=2;}else bytes.push(v.charCodeAt(i)&255);}
    let out;try{out=new TextDecoder(cs.toLowerCase()).decode(new Uint8Array(bytes));}catch(e){out=new TextDecoder('utf-8').decode(new Uint8Array(bytes));}
    return h.replace(/;?ENCODING=QUOTED-PRINTABLE/i,'')+out;});
  return t.replace(/\n/g,'\r\n');}
function parseVcf(t){t=vcfQP(t);const L=[];t.replace(/\r\n[ \t]/g,'').split(/BEGIN:VCARD/i).slice(1).forEach(b=>{const get=re=>{const m=b.match(re);return m?m[1].trim():'';};
  const dec=v=>v.replace(/\\,/g,',').replace(/\;/g,';').replace(/\\n/gi,' ');let fn=dec(get(/\nFN[^:\n]*:(.*)/i));if(!fn){const nn=get(/\nN[^:\n]*:(.*)/i).split(';');fn=[nn[1],nn[0]].filter(Boolean).join(' ');}
  const adr=get(/\nADR[^:\n]*:(.*)/i).split(';').map(dec).filter(x=>x.trim()).join(', ');
  if(fn||get(/\nTEL[^:\n]*:(.*)/i))L.push({name:fn||get(/\nTEL[^:\n]*:(.*)/i),phone:get(/\nTEL[^:\n]*:(.*)/i),email:get(/\nEMAIL[^:\n]*:(.*)/i),addr:adr,notes:dec(get(/\nNOTE[^:\n]*:(.*)/i))});});return L;}
const IMP_P2=/(τηλ\S*\s*2|phone\s*2|mobile\s*2|2ο\s*τηλ|δευτερ)/;
const IMP_FIELDS=[['name','Ονοματεπώνυμο',/(ον[οό]μ|name|πελ[άα]τ|full)/],['last','Επώνυμο (αν είναι χωριστά)',/(^επ[ωώ]ν|surname|last)/],['phone','Τηλέφωνο',/(τηλ|κιν|phone|mobile|tel|cell)/],['phone2','Τηλέφωνο 2',IMP_P2],['email','Email',/(mail|ηλεκτρ)/],['addr','Διεύθυνση',/(διευθ|address|οδ[οό]ς|addr)/],['notes','Σημειώσεις',/(σημει|σχ[οό]λ|note|παρατ)/],['id','Κωδικός',/(^κωδικ|^id$)/]];
function importMap(table,src,pk){if(!table.length){toast('Το αρχείο είναι άδειο.','bad');return pk&&pk.res([]);}
  const head=table[0].map(x=>normT(x));const hasHead=head.some(h=>IMP_FIELDS.some(f=>f[2].test(h)));const cols=table[0].map((x,i)=>hasHead?(String(x).trim()||'Στήλη '+(i+1)):'Στήλη '+(i+1)+' (π.χ. «'+String(x).slice(0,18)+'»)');
  const map={};IMP_FIELDS.forEach(([k,,re])=>{const i=hasHead?head.findIndex(h=>re.test(h)&&!(k==='name'&&/(^επ[ωώ]ν|surname|last)/.test(h))&&!(k==='phone'&&IMP_P2.test(h))):-1;map[k]=i;});
  if(map.name<0)map.name=0;if(map.phone<0&&!hasHead)map.phone=table[0].findIndex((x,i)=>i!==map.name&&/\d{6,}/.test(String(x).replace(/\D/g,'')));
  const body=hasHead?table.slice(1):table;
  const g=(r,k)=>map[k]>=0?String(r[map[k]]==null?'':r[map[k]]).trim():'';
  const build=()=>body.map(r=>({name:[g(r,'name'),g(r,'last')].filter(Boolean).join(' '),phone:g(r,'phone'),phone2:g(r,'phone2'),email:g(r,'email'),addr:g(r,'addr'),notes:g(r,'notes'),id:g(r,'id')})).filter(x=>x.name||x.phone);
  /* το δικό μας πρότυπο: οι στήλες είναι γνωστές, πάμε κατευθείαν στον έλεγχο */
  if(normT(table[0][0])===normT(XLS_HEAD[0])&&map.phone>=0){const L=build();if(!L.length){toast('Το αρχείο δεν έχει γραμμές.','bad');return pk&&pk.res([]);}return importPreview(L,src,pk);}
  let went=false;
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Ποια στήλη είναι τι;</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Από «${esc(src)}»: ${body.length} γραμμές. Τα βρήκα μόνος μου — διόρθωσε αν κάτι δεν ταιριάζει.</p>
   <div class="grid g2" style="gap:8px">${IMP_FIELDS.map(([k,l])=>`<div class="field"><label class="f">${l}</label><select class="in" data-mk="${k}"><option value="-1">— κανένα —</option>${cols.map((c,i)=>opt(i,c,map[k])).join('')}</select></div>`).join('')}</div>
   <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri" id="mp-go">Συνέχεια ${ic('right',15)}</button></div>`,{guard:false,onClose:()=>{if(!went&&pk)pk.res([]);}});
  $('#mp-go',md.el).onclick=()=>{$$('[data-mk]',md.el).forEach(x=>map[x.dataset.mk]=+x.value);
    const L=build();
    if(!L.length)return toast('Δεν βρέθηκαν ονόματα με αυτές τις στήλες.','bad');went=true;md.close();importPreview(L,src,pk);};}
const IMP_CMP=[['name','όνομα'],['phone','τηλέφωνο'],['phone2','2ο τηλέφωνο'],['email','email'],['addr','διεύθυνση'],['notes','σημειώσεις']];
const impVal=(p,k)=>k==='addr'?((p.loc&&p.loc.addr)||''):k==='name'?stuName(p):(p[k]||'');
/* ποιος υπάρχει ήδη: πρώτα ο κωδικός, μετά το τηλέφωνο, μετά το ίδιο όνομα */
function impMatch(x){if(x.id){const p=getStudent(x.id);if(p)return p;}const bp=x.phone&&byPhone(x.phone);if(bp)return bp;const n=normNm(x.name);return n?S.data.students.find(p=>normNm(p.name)===n):null;}
function impApply(p,x){IMP_CMP.forEach(([k])=>{const v=String(x[k]||'').trim();if(!v||v===impVal(p,k))return;if(k==='addr'){p.loc={addr:v,home:true};}else if(k==='email')p.email=v.toLowerCase();else p[k]=v;if(k==='name')p.avatar=initial(v);});
  const c0=(p.contacts||[])[0];if(c0){c0.name=p.name;c0.phone=p.phone||c0.phone;c0.email=p.email||c0.email;}else if(p.phone||p.email)p.contacts=[{name:p.name,phone:p.phone||'',email:p.email||''}];}
function importPreview(list,src,pk){const seen=new Set();
  const L=list.map(x=>{x=Object.assign({},x,{name:(x.name||x.phone||'').trim()});const k=x.id||normPh(x.phone)||normNm(x.name);const twice=seen.has(k);seen.add(k);
    const p=impMatch(x);const ch=p?IMP_CMP.filter(([f])=>{const v=String(x[f]||'').trim();return v&&v!==impVal(p,f)&&!(f==='phone'&&phKey(v)===phKey(p.phone));}).map(([,l])=>l):[];
    const st=twice?'twice':!p?'new':ch.length?'upd':'same';return Object.assign(x,{p,ch,st,on:pk?false:(st==='new'||st==='upd')});});
  /* επιλογή για το ραντεβού: ένα μόνο άτομο → κατευθείαν */
  if(pk&&L.length===1){const x=L[0];if(x.p)x.id=x.p.id;return pk.res([x]);}
  let went=false;const nNew=L.filter(x=>x.st==='new').length,nUpd=L.filter(x=>x.st==='upd').length,nSame=L.filter(x=>x.st==='same').length;
  const tag=x=>x.st==='new'?'<em class="tg new">νέος</em>':x.st==='upd'?`<em class="tg upd">αλλάζει: ${esc(x.ch.join(', '))}</em>`:x.st==='same'?'<em class="tg">υπάρχει ήδη</em>':'<em class="tg">2η φορά στο αρχείο</em>';
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">${pk?'Διάλεξε από το αρχείο':'Έλεγχος πριν την εισαγωγή'}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Από ${esc(src)}: ${L.length} άτομα${nNew?` · <b>${nNew} νέοι</b>`:''}${nUpd?` · <b>${nUpd} με αλλαγές</b>`:''}${nSame?` · ${nSame} ίδιοι`:''}.</p>
   ${L.length>6?`<input class="in" type="search" id="ip-q" placeholder="Αναζήτηση…" style="margin-bottom:8px">`:''}
   ${pk&&!pk.multi?'':`<label class="check small" style="margin-bottom:8px"><input type="checkbox" id="ip-all" ${pk?'':'checked'}> Όλοι</label>`}
   <div class="implist">${L.map((x,i)=>`<label class="improw ${x.st==='same'||x.st==='twice'?'dup':''}" data-ir="${i}"><input type="${pk&&!pk.multi?'radio':'checkbox'}" name="ii" data-ii="${i}" ${x.on?'checked':''} ${!pk&&(x.st==='same'||x.st==='twice')?'disabled':''}><span class="grow"><b>${esc(x.name)}</b><small>${[x.phone,x.email,x.addr].filter(Boolean).map(esc).join(' · ')||'&nbsp;'} ${tag(x)}</small></span></label>`).join('')}</div>
   ${pk&&nNew>0?`<label class="check small" style="margin-top:8px"><input type="checkbox" id="ip-rest"> Πέρασε και όλους τους νέους στους ${esc(LX('whoPlL'))} (χωρίς ραντεβού)</label>`:''}
   <div class="savebar"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri" id="ip-go"></button></div>`,{guard:false,onClose:()=>{if(!went&&pk)pk.res([]);}});
  const cnt=()=>{const on=L.filter(x=>x.on);const b=$('#ip-go',md.el);if(pk)b.innerHTML=`${ic('check',16)} Διάλεξε ${on.length||''}`;else{const a=on.filter(x=>x.st==='new').length,u=on.filter(x=>x.st==='upd').length;b.innerHTML=`${ic('check',16)} `+[a?`Πρόσθεσε ${a}`:'',u?`ενημέρωσε ${u}`:''].filter(Boolean).join(' · ')||'Τίποτα';}b.disabled=!on.length;};cnt();
  md.el.addEventListener('change',e=>{const c=e.target.closest('[data-ii]');if(c){if(c.type==='radio')L.forEach(x=>x.on=false);L[+c.dataset.ii].on=c.checked;cnt();}if(e.target.id==='ip-all'){L.forEach(x=>{if(pk||x.st==='new'||x.st==='upd')x.on=e.target.checked;});$$('[data-ii]',md.el).forEach(c=>c.checked=L[+c.dataset.ii].on);cnt();}});
  const q=$('#ip-q',md.el);if(q)q.oninput=()=>{const v=normT(q.value);$$('[data-ir]',md.el).forEach(r=>{const x=L[+r.dataset.ir];r.style.display=!v||normT(x.name+' '+(x.phone||'')+' '+(x.email||'')).includes(v)?'':'none';});};
  const addNew=x=>{const p={id:uid(),name:x.name,avatar:initial(x.name),phone:x.phone||'',email:(x.email||'').toLowerCase(),notes:x.notes||'',color:PERS_COLORS[S.data.students.length%PERS_COLORS.length],contacts:(x.phone||x.email)?[{name:x.name,phone:x.phone||'',email:x.email||''}]:[],created:new Date().toISOString()};if(x.phone2)p.phone2=x.phone2;if(x.addr)p.loc={addr:x.addr,home:true};S.data.students.push(p);x.p=p;return p;};
  $('#ip-go',md.el).onclick=()=>{const on=L.filter(x=>x.on);went=true;
    if(pk){const rest=$('#ip-rest',md.el);if(rest&&rest.checked){L.filter(x=>x.st==='new'&&!x.on).forEach(addNew);save();}md.close();return pk.res(on.map(x=>Object.assign({},x,{id:x.p?x.p.id:'',p:undefined})));}
    let a=0,u=0;on.forEach(x=>{if(x.st==='new'){addNew(x);a++;}else if(x.st==='upd'&&x.p){impApply(x.p,x);u++;}});
    save();md.close();const na=on.filter(x=>x.st==='new'&&x.addr).length;toast([a?`Μπήκαν ${a} ${LX('whoPlL')}.`:'',u?`Ενημερώθηκαν ${u}.`:'',na?`${na} έχουν διεύθυνση — από τον Χάρτη πάτα «Εντοπισμός από τις διευθύνσεις».`:''].filter(Boolean).join(' '),'ok');go('people');render();};}

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
     <div class="dpgrid">${(window.LANG==='en'?['M','T','W','T','F','S','S']:['Δ','Τ','Τ','Π','Π','Σ','Κ']).map(x=>`<span class="dpw">${x}</span>`).join('')}${cells}</div><p class="tiny muted" style="margin:8px 0 0;text-align:center">Το νούμερο πάνω δεξιά = πόσα ραντεβού έχει η μέρα.</p>`;};draw();
  md.el.addEventListener('click',e=>{const m=e.target.closest('[data-dm]');if(m){const[Y,Mo]=ym.split('-').map(Number);ym=isoDate(new Date(Y,Mo-1+ +m.dataset.dm,1)).slice(0,7);draw();return;}
    const g=e.target.closest('[data-dgo]');if(!g)return;md.close();setTimeout(()=>go(`agenda?view=day&d=${g.dataset.dgo}`),130);});}
document.addEventListener('click',e=>{const m=e.target.closest&&e.target.closest('#main .dsm, #main .perhd .dayt b, #main .dayhd .dayt b');if(!m)return;e.preventDefault();e.stopPropagation();
  const v=curView();if(m.classList.contains('dsm'))return dayPicker();if(v==='week')return weekPicker();if(v==='day')return dayPicker();monthPicker();},true);

/* ---------- συγκαταθέσεις: μηνύματα για ραντεβού και, χωριστά, για προσφορές ---------- */
const CONS_TXT_DEF='{επιχείρηση}: Κρατάμε το όνομα, το τηλέφωνο και το email σας μόνο σε αυτή τη συσκευή, για δύο ξεχωριστά πράγματα:\n1) Μηνύματα για τα ραντεβού σας (επιβεβαίωση, υπενθύμιση, αλλαγή).\n2) Προσφορές και νέα — μόνο αν μας απαντήσετε ΝΑΙ.\nΓια να σταματήσουν μόνο οι προσφορές, απαντήστε ΣΤΟΠ. Για να σταματήσουν και τα μηνύματα για τα ραντεβού, απαντήστε ΣΤΟΠ ΟΛΑ. Μπορείτε και να μας το πείτε όποτε θέλετε.';
const CONS_RESP='Το κείμενο το αλλάζεις με δική σου ευθύνη. Καλό είναι να λέει καθαρά τι κρατάς, για ποιο λόγο στέλνεις μηνύματα, και πώς σταματούν χωριστά οι προσφορές και τα μηνύματα για τα ραντεβού.';
function consText(){const B=biz();return(S.data.settings.consTpl||tr(CONS_TXT_DEF)).replace(/\{επιχείρηση\}/g,(isPrivate()?S.data.settings.myName:B.name||S.data.settings.myName)||'Το γραφείο μας');}
// undefined = δεν έχει ρωτηθεί ακόμα · true / false = ρητή απάντηση
function consOf(p,k){const c=p&&p.cons&&p.cons[k];return c?c.on:undefined;}
function setCons(p,k,on,how,at,mid){p.cons=p.cons||{};p.cons[k]={on:!!on,at:at||new Date().toISOString(),how:how||'στην καρτέλα'};if(mid)p.cons[k].mid=mid;
  if(k==='appt'){if(on)delete p.consent;else p.consent={ch:{sms:false,wa:false,viber:false,email:false}};}}
const consLbl=(p,k)=>{const c=p.cons&&p.cons[k];return c?`${c.on?'Ναι':'Όχι'} · ${fmtShort(c.at.slice(0,10))}/${c.at.slice(2,4)}`:'Δεν έχει ρωτηθεί';};

/* ---------- ιστορικό μηνυμάτων ανά πελάτη (καταγράφεται όταν πατάς «αποστολή») ---------- */
function logMsg(p,what,via,x){if(!p)return;const m=Object.assign({at:new Date().toISOString(),what,via},x||{});p.msgs=(p.msgs||[]).concat([m]).slice(-60);save();return m;}
/* ημερομηνία που το είπε ο πελάτης (μπορεί να είναι παλιότερη από σήμερα) */
const VIA_ANS=['SMS','Τηλέφωνο','Από κοντά','Viber / WhatsApp','Email'];
function dayISO(d){return d===todayISO()?new Date().toISOString():new Date(d+'T12:00').toISOString();}
function answerDlg(title,{date,via}={}){return new Promise(res=>{let v=via||'SMS';
  const md=modal(`<h3 style="margin-top:0">${title}</h3>
   <div class="field"><label class="f" for="ad-d">Πότε το είπε</label><input class="in" type="date" id="ad-d" value="${date||todayISO()}" max="${todayISO()}"><div class="tiny muted" style="margin-top:4px">Αν σου το είπε άλλη μέρα και το περνάς τώρα, βάλε την ημερομηνία που το είπε.</div></div>
   <div class="field"><label class="f">Πώς το είπε</label><div class="row" style="gap:6px">${VIA_ANS.map(x=>`<button type="button" class="chip${x===v?' on':''}" data-av="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
   <div class="row" style="justify-content:flex-end"><button class="btn" data-x="0">Άκυρο</button><button class="btn pri" data-x="1">${ic('check',15)} Καταγραφή</button></div>`,{onClose:()=>res(null),noHist:true,guard:false});
  md.el.addEventListener('click',e=>{const c=e.target.closest('[data-av]');if(c){v=c.dataset.av;$$('[data-av]',md.el).forEach(b=>b.classList.toggle('on',b===c));return;}
   const b=e.target.closest('[data-x]');if(!b)return;if(b.dataset.x==='1'){const d=$('#ad-d',md.el).value||todayISO();if(d>todayISO())return toast('Η ημερομηνία δεν μπορεί να είναι μελλοντική.','bad');res({date:d,via:v});}else res(null);md.close();});});}
async function recAnswer(p,{title,what,set,toastTxt}){const A=await answerDlg(title);if(!A)return;const at=dayISO(A.date);
  const m=logMsg(p,what,A.via,{day:A.date!==todayISO(),rec:new Date().toISOString(),id:uid()});set.forEach(([k,on,how])=>setCons(p,k,on,how,at,m.id));m.at=at;save();toast(toastTxt,'ok');consCard(p);}
async function editAnswer(p,id){const m=(p.msgs||[]).find(x=>x.id===id);if(!m)return;const A=await answerDlg('Διόρθωση: '+esc(m.what),{date:isoDate(new Date(m.at)),via:m.via});if(!A)return;
  m.at=dayISO(A.date);m.via=A.via;m.day=A.date!==todayISO();Object.values(p.cons||{}).forEach(c=>{if(c&&c.mid===id)c.at=m.at;});save();toast('Διορθώθηκε.','ok');consCard(p);}
function msgHistory(p){const L=(p.msgs||[]).map(m=>({at:m.at,what:m.what,via:m.via,day:m.day,rec:m.rec,id:m.id}));const R=S.data.remSent||{};
  Object.entries(R).forEach(([k,at])=>{const a=appts().find(x=>x.id===k.split('|')[0]);if(a&&a.sid===p.id&&typeof at==='string')L.push({at,what:'Υπενθύμιση για το ραντεβού '+fmtShort(k.split('|')[1]),via:'μήνυμα'});});
  return L.sort((a,b)=>b.at.localeCompare(a.at));}
const atTxt=iso=>{const d=new Date(iso);return fmtShort(isoDate(d))+'/'+String(d.getFullYear()).slice(2)+' '+pad(d.getHours())+':'+pad(d.getMinutes());};
function consCard(p){const sb=$('#p-stopb');if(sb)sb.innerHTML=consOf(p,'appt')===false?(c=>`<div class="stopall">⛔ <b>Δεν θέλει κανένα μήνυμα</b>${c.at?' · '+esc(c.how||'')+' στις '+atTxt(c.at).split(' ')[0]:''}</div>`)((p.cons||{}).appt||{}):'';const el=$('#p-cons');if(!el)return;const ph=p.phone||((p.contacts||[])[0]||{}).phone,em=p.email;const H=msgHistory(p);const t=consText();
  el.innerHTML=`<h3>🛡️ Συγκαταθέσεις για μηνύματα</h3>
   <label class="switch"><span><b>Μηνύματα για τα ραντεβού</b><small>Επιβεβαιώσεις, υπενθυμίσεις, αλλαγές · ${consLbl(p,'appt')}</small></span><input type="checkbox" data-cons="appt" ${consOf(p,'appt')!==false?'checked':''}></label>
   <label class="switch"><span><b>Προσφορές και νέα</b><small>Μόνο αν το θέλει ρητά · ${consLbl(p,'promo')}</small></span><input type="checkbox" data-cons="promo" ${consOf(p,'promo')===true?'checked':''}></label>
   <div class="row" style="margin-top:8px">${consOf(p,'promo')===true?`<button type="button" class="btn sm danger" id="cs-stop">✋ Είπε ΣΤΟΠ — όχι προσφορές</button>`:''}${consOf(p,'appt')!==false||consOf(p,'promo')===true?`<button type="button" class="btn sm danger" id="cs-stopall">⛔ Είπε ΣΤΟΠ ΟΛΑ — κανένα μήνυμα</button>`:''}${consOf(p,'promo')!==true&&consOf(p,'appt')!==false?`<button type="button" class="btn sm" id="cs-yes">👍 Είπε ΝΑΙ στις προσφορές</button>`:''}</div>
   <details class="constxt"><summary class="small"><b>Το κείμενο που του λες ή του στέλνεις</b></summary><div id="cs-view"><div class="note small" style="white-space:pre-wrap;margin-top:8px">${esc(t)}</div><button type="button" class="btn sm ghost" id="cs-edit" style="margin-top:6px">✏️ Αλλαγή κειμένου</button></div>
    <div id="cs-ed" hidden><textarea class="in" id="cs-et" style="min-height:150px;margin-top:8px">${esc(S.data.settings.consTpl||tr(CONS_TXT_DEF))}</textarea><div class="tiny muted" style="margin:4px 0">{επιχείρηση} = η επωνυμία σου · ισχύει για όλους τους ${esc(LX('whoPlL'))}</div><div class="note small warnnote">⚠️ ${CONS_RESP}</div><div class="row" style="margin-top:6px"><button type="button" class="btn sm pri" id="cs-esave">${ic('check',15)} Αποθήκευση</button><button type="button" class="btn sm ghost" id="cs-edef">Αρχικό κείμενο</button><button type="button" class="btn sm ghost" id="cs-ecan">Άκυρο</button></div></div>
    <div class="row" style="margin-top:8px">${ph?`<a class="btn sm" id="cs-sms" href="${smsHref(ph,t)}">${ic('l-message-square',15)} Στείλ' το με SMS</a>`:''}${em?`<a class="btn sm" id="cs-mail" href="mailto:${esc(em)}?subject=${encodeURIComponent('Ενημέρωση για τα μηνύματα')}&body=${encodeURIComponent(t)}">${ic('send',15)} Με email</a>`:''}</div></details>
   <h4 class="hist-h">Ιστορικό μηνυμάτων</h4>${H.length?`<div class="histlist">${H.slice(0,20).map(h=>`<div class="msgrow"><span class="hd">${h.day?atTxt(h.at).split(' ')[0]:atTxt(h.at)}</span><span class="grow">${esc(h.what)}${h.day&&h.rec?`<small class="tiny muted" style="display:block">περάστηκε ${atTxt(h.rec)}</small>`:''}</span><span class="chip sm">${esc(h.via)}</span>${h.id?`<button type="button" class="iconbtn sm" data-hed="${h.id}" aria-label="Διόρθωση ημερομηνίας">✏️</button>`:''}</div>`).join('')}</div>`:'<p class="small muted" style="margin:0">Δεν υπάρχει ακόμα καμία καταγραφή.</p>'}
   <p class="tiny muted" style="margin:8px 0 0">Καταγράφεται τη στιγμή που πατάς «Στείλε». Αν δεν πάτησες τελικά «Αποστολή» στο κινητό, η καταγραφή μένει.</p>`;
  $$('[data-cons]',el).forEach(c=>c.onchange=()=>{setCons(p,c.dataset.cons,c.checked);save();toast(c.dataset.cons==='promo'?(c.checked?'Δέχεται προσφορές.':'Όχι προσφορές.'):(c.checked?'Δέχεται μηνύματα για τα ραντεβού.':'Όχι μηνύματα για τα ραντεβού.'),'ok');consCard(p);});
  const st=$('#cs-stop',el);if(st)st.onclick=()=>recAnswer(p,{title:'✋ Είπε ΣΤΟΠ — όχι προσφορές',what:'Απάντησε ΣΤΟΠ στις προσφορές',set:[['promo',false,'απάντησε ΣΤΟΠ']],toastTxt:'Καταγράφηκε: όχι άλλες προσφορές.'});
  const sa=$('#cs-stopall',el);if(sa)sa.onclick=()=>recAnswer(p,{title:'⛔ Είπε ΣΤΟΠ ΟΛΑ — κανένα μήνυμα',what:'Απάντησε ΣΤΟΠ ΟΛΑ — κανένα μήνυμα',set:[['promo',false,'απάντησε ΣΤΟΠ ΟΛΑ'],['appt',false,'απάντησε ΣΤΟΠ ΟΛΑ']],toastTxt:'Καταγράφηκε: κανένα μήνυμα.'});
  const ys=$('#cs-yes',el);if(ys)ys.onclick=()=>recAnswer(p,{title:'👍 Είπε ΝΑΙ στις προσφορές',what:'Απάντησε ΝΑΙ στις προσφορές',set:[['promo',true,'απάντησε ΝΑΙ']],toastTxt:'Καταγράφηκε: δέχεται προσφορές.'});
  $$('[data-hed]',el).forEach(b=>b.onclick=()=>editAnswer(p,b.dataset.hed));
  $('#cs-edit',el).onclick=()=>{$('#cs-view',el).hidden=true;$('#cs-ed',el).hidden=false;$('#cs-et',el).focus();};
  $('#cs-ecan',el).onclick=()=>consCard(p);
  $('#cs-esave',el).onclick=()=>{S.data.settings.consTpl=$('#cs-et',el).value.trim()||tr(CONS_TXT_DEF);save();toast('Αποθηκεύτηκε το νέο κείμενο.','ok');consCard(p);$('.constxt',el).open=true;};
  $('#cs-edef',el).onclick=()=>{delete S.data.settings.consTpl;save();toast('Μπήκε το αρχικό κείμενο.','ok');consCard(p);$('.constxt',el).open=true;};
  const a=$('#cs-sms',el);if(a)a.addEventListener('click',()=>{logMsg(p,'Κείμενο ενημέρωσης / συγκατάθεσης','SMS');setTimeout(()=>consCard(p),300);});
  const b=$('#cs-mail',el);if(b)b.addEventListener('click',()=>{logMsg(p,'Κείμενο ενημέρωσης / συγκατάθεσης','email');setTimeout(()=>consCard(p),300);});}

/* ---------- φύλακας: προειδοποίηση πριν από επικοινωνία με όποιον είπε «ΣΤΟΠ ΟΛΑ» ---------- */
document.addEventListener('click',async e=>{const a=e.target.closest('a[data-cg]');if(!a)return;const p=getStudent(a.dataset.cg);if(!p||consOf(p,'appt')!==false)return;
  e.preventDefault();e.stopImmediatePropagation();const h=a.getAttribute('href')||'';const tel=h.startsWith('tel:');
  const via=tel?'κλήση':h.startsWith('sms:')?'SMS':h.includes('wa.me')||h.includes('whatsapp')?'WhatsApp':h.startsWith('viber:')?'Viber':h.startsWith('mailto:')?'email':'μήνυμα';
  const c=(p.cons||{}).appt||{};const when=c.at?' στις '+atTxt(c.at).split(' ')[0]:'';
  const txt=tel?`⛔ <b>${esc(stuName(p))}</b> είπε «ΣΤΟΠ ΟΛΑ»${when} — δεν θέλει μηνύματα.<br><br>Ένα τηλεφώνημα για κάτι που αφορά το ραντεβού του μπορεί να χρειαστεί, αλλά να είσαι σίγουρος ότι το θέλει. Να γίνει η κλήση;`
   :`⛔ <b>${esc(stuName(p))}</b> είπε «ΣΤΟΠ ΟΛΑ»${when} — <b>δεν θέλει κανένα μήνυμα</b>, ούτε για τα ραντεβού.<br><br>Αν του στείλεις ${esc(via)}, το κάνεις με δική σου ευθύνη και θα γραφτεί στο ιστορικό του. Να ανοίξει παρ' όλα αυτά;`;
  if(!await confirmDlg(txt,{ok:tel?'Ναι, κλήση':'Ναι, το ξέρω',cancel:'Όχι',danger:true}))return;
  if(!tel)logMsg(p,'Μήνυμα παρά το «ΣΤΟΠ ΟΛΑ»',via);
  if(a.target==='_blank')window.open(h,'_blank','noopener');else location.href=h;
  if(!tel&&$('#p-cons'))setTimeout(()=>consCard(p),300);},true);

/* ---------- συχνότητα επισκέψεων ---------- */
function visitStats(p,pre){const t=todayISO();const from=addDays(t,-730);
  const V=[...new Set((pre?pre.past:occ(from,addDays(t,-1),{sid:p.id,withCancel:true,by:''})).filter(o=>o.st!=='cancel'&&o.st!=='absent').map(o=>o.date))].sort();
  const nextO=(pre?pre.fut:occ(t,addDays(t,365),{sid:p.id,by:''})).find(o=>o.st==='');
  const last=V[V.length-1]||null;const gaps=[];for(let i=1;i<V.length;i++)gaps.push((new Date(V[i]+'T12:00')-new Date(V[i-1]+'T12:00'))/864e5);
  const avg=gaps.length?Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length):null;const since=last?Math.round((new Date(t+'T12:00')-new Date(last+'T12:00'))/864e5):null;
  const y1=V.filter(d=>d>=addDays(t,-365)).length;
  const lim=avg?Math.max(Math.round(avg*1.5),avg+14):60;const late=!nextO&&since!=null&&since>lim;
  return{count:V.length,y1,last,avg,since,next:nextO?nextO.date:null,late,lim};}
const daysTxt=n=>n==null?'—':n<1?'σήμερα':n===1?'1 μέρα':n<60?n+' μέρες':n<730?Math.round(n/30)+' μήνες':Math.round(n/365)+' χρόνια';
function freqTxt(v){if(!v.count)return'Δεν έχει έρθει ακόμα';return`${v.y1} ${v.y1===1?'επίσκεψη':'επισκέψεις'} τον τελευταίο χρόνο${v.avg?` · έρχεται περίπου κάθε ${daysTxt(v.avg)}`:''}`;}

/* ---------- μήνυμα προσφοράς μόνο σε όσους έχουν πει «ναι» ---------- */
function offerDialog(preIds){const all=myStudents().filter(p=>!p.demo||S.data.settings.demo);const yes=all.filter(p=>consOf(p,'promo')===true);const sel=new Set((preIds||yes.map(p=>p.id)).filter(id=>yes.some(p=>p.id===id)));
  const tpl=S.data.settings.offerTpl||tr('Καλησπέρα{όνομα}! ');
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Μήνυμα προσφοράς</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Στέλνεται <b>μόνο</b> σε όσους έχουν πει «ναι» στις προσφορές (${yes.length} από ${all.length}). Στο τέλος μπαίνει μόνο του το «Για να μη λαμβάνετε προσφορές απαντήστε ΣΤΟΠ».</p>
   <div class="field"><label class="f" for="of-t">Το μήνυμα</label><textarea class="in" id="of-t" style="min-height:90px" placeholder="π.χ. Αυτόν τον μήνα -20% στη βαφή!">${esc(tpl)}</textarea><div class="tiny muted">{όνομα} = το μικρό όνομα του πελάτη</div></div>
   ${yes.length?`<div class="implist" style="max-height:34vh">${yes.map(p=>`<div class="improw"><input type="checkbox" data-of="${p.id}" ${sel.has(p.id)?'checked':''} aria-label="Επιλογή"><span class="grow"><b>${esc(stuName(p))}</b><small>${esc(p.phone||'')}${p.email?' · '+esc(p.email):''}</small></span>${p.phone?`<a class="btn sm" data-ofsms="${p.id}">SMS</a>`:''}</div>`).join('')}</div>
   <div class="savebar"><button type="button" class="btn" id="of-mail">${ic('send',15)} Email σε όλους τους επιλεγμένους</button></div>`:`<div class="note small">Κανείς δεν έχει δώσει ακόμα συγκατάθεση για προσφορές. Σημείωσέ τη στην καρτέλα κάθε ${esc(LX('whoGen'))}.</div>`}`,{guard:false});
  const txt=p=>{const first=(p.name||'').split(' ')[0];return($('#of-t',md.el).value||'').replace(/\{όνομα\}/g,first?' '+first:'').trim()+'\n'+(isPrivate()?S.data.settings.myName||'':biz().name||S.data.settings.myName||'')+'\n'+tr('Για να μη λαμβάνετε προσφορές απαντήστε ΣΤΟΠ.');};
  $('#of-t',md.el).onchange=e=>{S.data.settings.offerTpl=e.target.value;save();};
  md.el.addEventListener('change',e=>{const c=e.target.closest('[data-of]');if(c){c.checked?sel.add(c.dataset.of):sel.delete(c.dataset.of);}});
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-ofsms]');if(b){const p=getStudent(b.dataset.ofsms);logMsg(p,'Προσφορά','SMS');location.href=smsHref(p.phone,txt(p));b.textContent='✓ SMS';return;}
    if(e.target.closest('#of-mail')){const L=yes.filter(p=>sel.has(p.id)&&p.email);if(!L.length)return toast('Κανένας επιλεγμένος δεν έχει email.','bad');const t=txt({name:''});L.forEach(p=>logMsg(p,'Προσφορά','email'));location.href=`mailto:?bcc=${L.map(p=>encodeURIComponent(p.email)).join(',')}&subject=${encodeURIComponent('Προσφορά — '+(biz().name||''))}&body=${encodeURIComponent(t)}`;}});}

/* ---------- πρόσωπα: λίστα ---------- */
function viewPeople(r){const all=myStudents();const q=(r.q.q||'').toLowerCase();
  M().innerHTML=`${pageHead(esc(LX('whoPl')),`${all.length}`,`<a class="btn" href="#/stats" title="Στατιστικά">📊</a><a class="btn pri" href="#/person/new">${ic('plus',17)} Νέος</a>`)}
  ${all.length?`<div class="search field">${ic('search',17)}<input class="in" id="pq" type="search" placeholder="Όνομα ή τηλέφωνο" value="${esc(q)}" aria-label="Αναζήτηση"></div><div class="list" id="pl"></div>`
   :emptyHTML('users',`Δεν υπάρχουν ακόμη ${esc(LX('whoPlL'))}`,`Πρόσθεσε τον πρώτο — ή γράψε απευθείας το όνομα όταν κλείνεις ραντεβού.`,`<a class="btn pri" href="#/person/new">${ic('plus',16)} Νέος</a> <button class="btn" id="p-imp2">${ic('download',16)} Εισαγωγή πολλών μαζί</button>`)}`;
  [$('#p-imp2')].forEach(b=>{if(b)b.onclick=importMenu;});{const bk=$('#p-bk');if(bk)bk.onclick=()=>bookShareDialog();}{const ph=$('#main .page-head');if(ph&&!$('#p-bk')){const b=document.createElement('button');b.type='button';b.className='bookbar';b.id='p-bk';b.innerHTML=`<span class="bb-i">📲</span><span class="grow"><b>Να κλείνουν μόνοι τους ${esc(onePl())}</b><small>Στείλε σύνδεσμο με τις ελεύθερες ώρες σου · Viber, SMS, WhatsApp, QR</small></span>${ic('right',18)}`;b.onclick=()=>bookShareDialog();ph.after(b);}}
  if(!all.length)return;
  const t=todayISO();const VS={};const grp=L=>{const G={};L.forEach(o=>(G[o.a.sid]=G[o.a.sid]||[]).push(o));return G;};const PAST=grp(occ(addDays(t,-730),addDays(t,-1),{withCancel:true,by:''})),FUT=grp(occ(t,addDays(t,365),{by:''}));all.forEach(p=>VS[p.id]=visitStats(p,{past:PAST[p.id]||[],fut:FUT[p.id]||[]}));let flt=r.q.f||'all';
  const nLate=all.filter(p=>VS[p.id].late).length,nPromo=all.filter(p=>consOf(p,'promo')===true).length;
  $('#pq').closest('.search').insertAdjacentHTML('afterend',`<div class="pftabs"><button data-pf2="all">Όλοι <i>${all.length}</i></button><button data-pf2="late">Έχουν καιρό να έρθουν <i>${nLate}</i></button><button data-pf2="promo">Δέχονται προσφορές <i>${nPromo}</i></button></div><div id="pfx"></div>`);
  const tabs=()=>{$$('[data-pf2]').forEach(b=>b.classList.toggle('on',b.dataset.pf2===flt));$('#pfx').innerHTML=flt==='promo'&&nPromo?`<button class="btn pri wide" id="pf-offer" style="margin-bottom:10px">${ic('send',16)} Στείλε μήνυμα προσφοράς σε ${nPromo}</button>`:flt==='late'?`<p class="small muted" style="margin:0 0 10px">Όσοι δεν έχουν κλεισμένο ραντεβού και πέρασε πολύ περισσότερος καιρός από τη συνηθισμένη τους συχνότητα (ή πάνω από 2 μήνες, αν έχουν έρθει μία φορά).</p>`:'';const o=$('#pf-offer');if(o)o.onclick=()=>offerDialog();};
  $$('[data-pf2]').forEach(b=>b.onclick=()=>{flt=b.dataset.pf2;tabs();draw();});
  const draw=()=>{const v=$('#pq').value.toLowerCase().trim();let L=all.filter(p=>!v||(p.name||'').toLowerCase().includes(v)||(p.phone||'').replace(/\s/g,'').includes(v.replace(/\s/g,'')));
    if(flt==='late')L=L.filter(p=>VS[p.id].late).sort((a,b)=>VS[b.id].since-VS[a.id].since);if(flt==='promo')L=L.filter(p=>consOf(p,'promo')===true);
    $('#pl').innerHTML=L.length?L.map(p=>{const nx=(FUT[p.id]||[]).find(o=>o.date<=addDays(t,120)&&o.st===''&&(o.date>t||tmin(o.e)>nowMin()));
      const vs=VS[p.id];return`<a class="rw" href="#/person/${p.id}"><span class="ricon" style="${p.color?`background:${p.color};color:#fff`:''}">${esc((p.name||'?').trim()[0]||'?')}</span><span class="grow"><b>${esc(stuName(p))}</b><small>${flt==='late'?`τελευταία φορά πριν ${daysTxt(vs.since)}${vs.avg?' · συνήθως κάθε '+daysTxt(vs.avg):''}`:[p.phone?esc(p.phone):'',nx?'επόμενο '+WDAYS_S[wdOf(nx.date)]+' '+fmtShort(nx.date)+' '+nx.s:vs.last?'τελευταία '+fmtShort(vs.last):''].filter(Boolean).join(' · ')||'&nbsp;'}</small></span>${vs.late&&flt!=='late'?'<span class="chip y sm">έχει καιρό</span>':''}${ic('right',16)}</a>`;}).join(''):`<p class="muted small">Κανένα αποτέλεσμα.</p>`;};
  tabs();draw();$('#pq').oninput=draw;}

/* ---------- πρόσωπο: καρτέλα ---------- */
/* επιστροφή στις υπενθυμίσεις όταν η καρτέλα άνοιξε από εκεί */
function remBackInfo(){try{return JSON.parse(sessionStorage.getItem('im-rem-back')||'null');}catch(_){return null;}}
function remBackGo(){const b=remBackInfo();try{sessionStorage.removeItem('im-rem-back');}catch(_){}if(!b)return false;location.hash=b.h||'#/today';setTimeout(()=>remindDialog(b.d),250);return true;}
addEventListener('hashchange',()=>{if(!location.hash.startsWith('#/person/'))try{sessionStorage.removeItem('im-rem-back');}catch(_){}});
function viewPerson(r){const fb=$('#fab');if(fb)fb.remove();const isNew=r.id==='new';const p0=isNew?{id:uid(),created:new Date().toISOString(),contacts:[]}:getStudent(r.id);if(!p0)return go('people');
  const p=JSON.parse(JSON.stringify(p0));const t=todayISO();
  const up=isNew?[]:occ(addDays(t,-60),addDays(t,180),{sid:p.id,withCancel:true,by:''});const fut=up.filter(o=>o.date>=t);const past=up.filter(o=>o.date<t).reverse().slice(0,10);
  const pr=PERS_COLORS;
  const rb=!isNew&&remBackInfo();
  M().innerHTML=`${pageHead(isNew?'Νέος '+esc(LX('who')).toLowerCase():esc(stuName(p)),isNew?'':esc(LX('who')),rb?`<button class="btn" id="p-remback">${ic('bell',15)} Πίσω στις υπενθυμίσεις</button>`:`<a class="btn" href="#/people">Πίσω</a>`)}
  <div id="p-stopb"></div>${isNew?'':`<button type="button" class="bookbar" id="p-book"><span class="bb-i">📲</span><span class="grow"><b>Στείλε του να κλείσει μόνος του ${esc(oneSg())}</b><small>Σύνδεσμος με τις ελεύθερες ώρες σου, με Viber / SMS / WhatsApp</small></span>${ic('right',18)}</button>`}<div class="grid g2" style="align-items:start"><form class="card" id="pf"><h3>Στοιχεία</h3>
   <button type="button" class="btn conpick field" id="p-con">${ic('users',16)} Από τις επαφές του κινητού</button>${isNew?`<button type="button" class="linkbtn small" id="p-many">Πολλοί μαζί; Από τις επαφές ή από αρχείο Excel / vCard →</button>`:''}
   <div class="field"><label class="f" for="p-n">Ονοματεπώνυμο</label><input class="in" id="p-n" name="name" required autocomplete="off" value="${esc(p.name||'')}"></div>
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="p-ph">Τηλέφωνο</label><div class="phrow"><input class="in" id="p-ph" name="phone" type="tel" inputmode="tel" value="${esc(p.phone||'')}">${p.phone?`<a class="callbtn" data-cg="${p.id}" href="tel:${telLink(p.phone)}" aria-label="Κλήση">${ic('l-phone',20)}</a><a class="callbtn sms" data-cg="${p.id}" href="sms:${telLink(p.phone)}" aria-label="Μήνυμα">${ic('l-message-square',20)}</a>`:''}</div></div>
   <div class="field"><label class="f" for="p-em">Email</label><input class="in" id="p-em" name="email" type="email" inputmode="email" autocapitalize="none" value="${esc(p.email||'')}"></div></div>
   ${(()=>{const one=(k,lb)=>{const v=p[k]||'';return`<div class="field"><label class="f" for="p-${k}">${lb} <span class="tiny muted">· προαιρετικό</span></label><div class="phrow"><input class="in" id="p-${k}" name="${k}" type="tel" inputmode="tel" placeholder="π.χ. σταθερό, δουλειάς" value="${esc(v)}">${v?`<a class="callbtn" data-cg="${p.id}" href="tel:${telLink(v)}" aria-label="Κλήση">${ic('l-phone',20)}</a>`:''}</div></div>`;};return`<div class="grid g2" style="gap:10px">${one('phone2','2ο τηλέφωνο')}${one('phone3','3ο τηλέφωνο')}</div>`;})()}
   <input type="hidden" name="color" value="${esc(p.color||'')}">
   <div class="field"><label class="f" for="p-ad">Διεύθυνση <span class="tiny muted">· για τον χάρτη, προαιρετικό</span></label><input class="in" id="p-ad" name="addr" value="${esc(p.loc&&p.loc.addr||'')}"></div>
   <div class="field"><label class="f" for="p-no">Σημειώσεις</label><textarea class="in" id="p-no" name="notes" style="min-height:70px">${esc(p.notes||'')}</textarea></div>
   ${isNew?'':(()=>{const v=visitStats(p);return`<div class="freqbox ${v.late?'late':''}"><div><b>${v.count?'Τελευταία φορά: '+fmtShort(v.last)+' (πριν '+daysTxt(v.since)+')':'Δεν έχει έρθει ακόμα'}</b><small>${freqTxt(v)}${v.next?' · επόμενο '+fmtShort(v.next):''}</small></div>${v.late?'<span class="chip y">έχει καιρό να έρθει</span>':''}</div>`;})()}
   <div class="field"><label class="f">Χρώμα στο ημερολόγιο</label><div class="scols">${pr.map(c=>`<button type="button" data-pc="${c}" style="background:${c}" class="${p.color===c?'on':''}" aria-label="Χρώμα"></button>`).join('')}<button type="button" data-pc="" class="none ${p.color?'':'on'}" aria-label="Χωρίς χρώμα">${ic('x',12)}</button></div></div>
   <div class="savebar"><button class="btn pri">${ic('check',16)} Αποθήκευση</button>${isNew?'':`<button type="button" class="btn danger" id="p-del">${ic('trash',16)} Διαγραφή</button>`}</div></form>
  ${isNew?'':`<div class="card"><div class="card-h"><h3>Ραντεβού</h3><button class="btn sm pri" id="p-new">${ic('plus',15)} Νέο ραντεβού</button></div>
   ${p.phone?`<div class="row" style="gap:6px;margin-bottom:12px"><a class="btn sm" data-cg="${p.id}" href="tel:${telLink(p.phone)}">Κλήση</a>${chBtnsHTML({contacts:[{name:p.name,phone:p.phone,email:p.email}]},'Καλησπέρα!','Μήνυμα',`data-cg="${p.id}"`)}</div>`:''}
   ${fut.length?`<div class="aglist">${fut.slice(0,6).map(o=>`<div class="small muted" style="margin:8px 0 2px">${WDAYS[wdOf(o.date)]} ${fmtDate(o.date)}</div>${apptCard(o)}`).join('')}</div>${fut.length>6?`<p class="small muted" style="margin:8px 0 0">και ${fut.length-6} ακόμα μέσα στους επόμενους 6 μήνες.</p>`:''}`:'<p class="small muted">Κανένα επόμενο ραντεβού.</p>'}
   ${past.length?`<details style="margin-top:12px"><summary class="small"><b>Προηγούμενα</b> (${past.length})</summary><div class="aglist" style="margin-top:6px">${past.map(o=>`<div class="small muted" style="margin:8px 0 2px">${fmtDate(o.date)}</div>${apptCard(o)}`).join('')}</div></details>`:''}</div>`}</div>
  ${isNew?`<div class="card conscard"><h3>🛡️ Συγκαταθέσεις για μηνύματα</h3><p class="small muted" style="margin:0">Μπαίνουν μόλις αποθηκεύσεις ${esc(LX('whoAcc'))}.</p></div>`:`<div class="card conscard" id="p-cons"></div>`}`;
  const F=$('#pf');let col=p.color||'';
  // πρόχειρο: ό,τι γράφεις κρατιέται, ακόμα κι αν το κινητό κλείσει την εφαρμογή στο παρασκήνιο
  const DK='imer-pdraft';const saveDraft=()=>{try{const o=fd(F);localStorage.setItem(DK,JSON.stringify({rid:r.id,t:Date.now(),o,col}));}catch(e){}};
  const clearDraft=()=>{try{localStorage.removeItem(DK);localStorage.removeItem('imer-conpick');}catch(e){}};
  F._base0=formSnap(F);const poke=()=>F.dispatchEvent(new Event('input',{bubbles:true}));
  try{const d=JSON.parse(localStorage.getItem(DK)||'null');if(d&&d.rid===r.id&&Date.now()-d.t<6*36e5){['name','phone','phone2','phone3','email','addr','notes'].forEach(k=>{if(d.o[k]!=null&&F[k])F[k].value=d.o[k];});if(d.col!=null){col=d.col;F.color.value=col;$$('[data-pc]',F).forEach(x=>x.classList.toggle('on',x.dataset.pc===col));}
    const cp=localStorage.getItem('imer-conpick');if(cp){localStorage.removeItem('imer-conpick');toast('Το κινητό έκλεισε τη λίστα επαφών όσο ήσουν σε άλλη εφαρμογή. Ό,τι είχες γράψει κρατήθηκε — πάτα ξανά «Από τις επαφές».','bad');}else if(d.o.name||d.o.phone)toast('Συνεχίζεις από εκεί που είχες μείνει.','ok');}}catch(e){}
  F.addEventListener('input',saveDraft);
  const pm=$('#p-many');if(pm)pm.onclick=importMenu;const pc=$('#p-con');if(pc)pc.onclick=async()=>{saveDraft();try{localStorage.setItem('imer-conpick','1');}catch(e){}const L=(await IM_PICKCONTACTS(false))||[];try{localStorage.removeItem('imer-conpick');}catch(e){}const c=L[0];if(!c)return;const said=[];
    if(!F.name.value.trim()){F.name.value=c.name;said.push('το όνομα');}
    const slots=['phone','phone2','phone3'];let full=0;
    (c.phones&&c.phones.length?c.phones:[c.phone]).filter(Boolean).forEach(ph=>{if(slots.some(k=>phKey(F[k].value)===phKey(ph)))return;const k=slots.find(k=>!F[k].value.trim());if(k){F[k].value=ph;said.push(k==='phone'?'το τηλέφωνο':(k==='phone2'?'2ο':'3ο')+' τηλέφωνο ('+ph+')');}else full++;});
    if(c.email&&!F.email.value.trim()){F.email.value=c.email;said.push('το email');}
    poke();saveDraft();
    if(said.length)toast('Μπήκε '+said.join(', ')+'. Ό,τι υπήρχε ήδη δεν άλλαξε — πάτα «Αποθήκευση» για να μείνει.','ok');
    else toast(full?'Δεν υπάρχει άλλη κενή θέση τηλεφώνου. Σβήσε ένα από τα τρία αν θέλεις να μπει άλλο.':'Τα στοιχεία της επαφής υπάρχουν ήδη εδώ.',full?'bad':'');};
  F.onclick=e=>{const b=e.target.closest('[data-pc]');if(!b)return;col=b.dataset.pc;F.color.value=col;$$('[data-pc]',F).forEach(x=>x.classList.toggle('on',x===b));poke();saveDraft();};
  F.onsubmit=e=>{e.preventDefault();const o=fd(F);if(!o.name.trim())return toast('Γράψε όνομα.','bad');
    Object.assign(p0,{name:o.name.trim(),avatar:initial(o.name),phone:o.phone.trim(),phone2:o.phone2.trim()&&phKey(o.phone2)!==phKey(o.phone)?o.phone2.trim():'',phone3:o.phone3.trim()&&![o.phone,o.phone2].some(x=>phKey(x)===phKey(o.phone3))?o.phone3.trim():'',email:o.email.trim().toLowerCase(),notes:o.notes.trim(),color:col||undefined,updated:new Date().toISOString()});
    p0.contacts=(p0.phone||p0.email)?[{name:p0.name,role:'',phone:p0.phone,email:p0.email}]:[];
    const newAddr=o.addr.trim()&&!(p0.loc&&p0.loc.addr===o.addr.trim()&&p0.loc.lat!=null);if(o.addr.trim())p0.loc=Object.assign({},p0.loc&&p0.loc.addr===o.addr.trim()?p0.loc:{},{addr:o.addr.trim(),home:true});else delete p0.loc;
    if(isNew)S.data.students.push(p0);save();clearDraft();toast('Αποθηκεύτηκε.','ok');if(newAddr)geocodePerson(p0,true);
    if(isNew&&sessionStorage.getItem('im-after-person')){sessionStorage.removeItem('im-after-person');go('today');setTimeout(()=>apptDialog({date:todayISO(),sids:[p0.id]}),200);return;}
    if(remBackGo())return;go('person/'+p0.id);};
  const dl=$('#p-del');if(dl)dl.onclick=async()=>{const n=appts().filter(a=>a.sid===p0.id).length;if(!await confirmDlg(`Διαγραφή «${esc(stuName(p0))}»${n?` και ${n===1?'του ραντεβού του':'των '+n+' ραντεβού του'}`:''}; Δεν αναιρείται.`,{ok:'Διαγραφή',danger:true}))return;
    clearDraft();S.data.students=S.data.students.filter(x=>x.id!==p0.id);S.data.appts=appts().filter(a=>a.sid!==p0.id);S.data.waitlist=(S.data.waitlist||[]).filter(w=>w.sid!==p0.id);save();toast('Διαγράφηκε.');LEAVE_OK=true;go('people');};
  const nb=$('#p-new');if(nb)nb.onclick=()=>apptDialog({date:todayISO(),sids:[p0.id]});
  {const pb=$('#p-book');if(pb)pb.onclick=()=>bookShareDialog(p0);}if(rb){scrollTo(0,0);setTimeout(()=>scrollTo(0,0),120);setTimeout(()=>scrollTo(0,0),400);}if(!isNew)consCard(p0);const rbb=$("#p-remback");if(rbb)rbb.onclick=()=>remBackGo();}
const PERS_COLORS=['#7462B4','#3A8A61','#2F7FA8','#C77A3A','#B4527A','#8A7A2E','#C46A7A','#5A6ACF','#2E8C8C','#9C5BB5'];

/* ---------- ρυθμίσεις: λίστα κατηγοριών, κάθε κατηγορία σε δική της σελίδα ---------- */
function isPrivate(){return biz().kind==='private';}
const SET_SECS=()=>[
  ['prof','me',prof().p.i||'✨','Επάγγελμα',prof().p.n],
  ['lang','view','🌐','Γλώσσα · Language',LANGS.map(l=>l.f+' '+l.n).join(' · ')],
  ['info','me',isPrivate()?'👤':'🏢',isPrivate()?'Προσωπικά στοιχεία':'Στοιχεία επιχείρησης',isPrivate()?(S.data.settings.myName||'Όνομα, τηλέφωνο'):(biz().name||'Επωνυμία, τηλέφωνο, ΑΦΜ')],
  ['staff','me',`👥`,'Προσωπικό',(providers().length===1?'1 άτομο κάνει ραντεβού':providers().length+' άτομα κάνουν ραντεβού')],
  ['hours','me','🕘','Ωράριο και αργίες',agCfg().from+'–'+agCfg().to],
  ['start','view','🚪','Άνοιγμα εφαρμογής','Ανοίγει σε: '+START_OPTS.find(x=>x[0]===(S.data.settings.startView||'last'))[1]],
  ['look','view','🎨','Χρώμα και φόντο','Το χρώμα της εφαρμογής και το υδατογράφημα'],
  ['words','cli','🏷️','Πελάτες ή ασθενείς ή μαθητές;','Τώρα λέγονται «'+LX('whoPl')+'» και κλείνεις «'+LX('one')+'»'],
  ['msgs','cli','💬','Μηνύματα και συγκαταθέσεις','Επιβεβαιώσεις, κείμενο συγκατάθεσης, προσφορές'],
  ['backup','data','🛟','Αντίγραφα ασφαλείας',bkStatusShort()],
  ['demo','data','🧪','Δοκιμαστική λειτουργία',S.data.settings.demo?'Ενεργή — βλέπεις παραδείγματα':'Δες την εφαρμογή με παραδείγματα'],
  ['pro','gl','⭐','Ημερολόγιο Pro',(st=>st.pro?'Ενεργό έως '+fmtDate(st.until)+(st.full?' · GlenApps Full':''):PRO_FIRST+' € τον πρώτο χρόνο · κρατήσεις, στατιστικά')(proState())],
  ['stats','gl','📊','Στατιστικά','Έσοδα, επισκέψεις, πληρότητα, καλύτεροι '+LX('whoPlL')],
  ['apps','gl','🧩','Οι εφαρμογές μας','Δρομολόγιο, Ταμεία, Παραγγελίες και άλλες'],
  ['about','gl','ℹ️','Εγκατάσταση και έκδοση','Έκδοση '+APP_VERSION]];
const SET_GRPS=[['me','💼','Η δουλειά σου'],['cli','📇','Πελάτες και μηνύματα'],['view','🎨','Εμφάνιση και γλώσσα'],['data','🛟','Δεδομένα και ασφάλεια'],['gl','⭐','GlenApps']];
function viewSettingsPage(r){const id=r.id==='business'?'info':r.id;const L=SET_SECS();const sec=L.find(x=>x[0]===id);
  if(!sec){M().innerHTML=`${pageHead('Ρυθμίσεις','')}${SET_GRPS.map(([g,gi,gt])=>{const R=L.filter(x=>x[1]===g);return R.length?`<h4 class="setgrp"><span>${gi}</span>${esc(g==='cli'?LX('whoPl')+' και μηνύματα':gt)}</h4><div class="setlist grp">${R.map(([k,,i,t,d])=>`<a class="setrow${k==='pro'&&!isPro()?' prorow':''}" href="#/${k==='stats'?'stats':'settings/'+k}"><span class="seti">${i}</span><span class="grow"><b>${esc(t)}</b><small>${esc(d)}</small></span>${ic('right',18)}</a>`).join('')}</div>`:'';}).join('')}<p class="tiny muted" style="text-align:center;margin-top:18px">© 2026 Ανδρέας Μ. Γλεντζάκης · Ημερολόγιο ${APP_VERSION}</p>`;return;}
  M().innerHTML=`<a class="setback" href="#/settings">${ic('left',18)} Ρυθμίσεις</a>${pageHead(esc(sec[3]),'')}<div id="sb"></div>`;SETP[id]($('#sb'));}

/* Viber «forward» κόβει τα μεγάλα κείμενα (π.χ. συνδέσμους): για μεγάλα κείμενα πάμε από το μενού κοινοποίησης */
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="viber://forward"]');if(!a)return;let txt='';try{txt=decodeURIComponent(a.getAttribute('href').split('text=')[1]||'');}catch(_){}
  if(txt.length<170)return;e.preventDefault();try{navigator.clipboard&&navigator.clipboard.writeText(txt);}catch(_){}
  if(navigator.share){toast('Διάλεξε «Viber» από τη λίστα και μετά τον παραλήπτη.','ok');navigator.share({text:txt}).catch(()=>{});}else{toast('Το κείμενο αντιγράφηκε· στο Viber κάνε «Επικόλληση».','ok');location.href='viber://forward?text='+encodeURIComponent(txt.slice(0,160));}},true);
/* ---------- ο πελάτης κρατά το ραντεβού στο ΔΙΚΟ του Ημερολόγιο (ως ιδιώτης) ---------- */
function mineImport(code){const q=bookDecode(code);if(!q)return false;const biz0=String(q.n||'').trim()||'Ραντεβού';
  if(!S.data.settings.prof){S.data.settings.prof='prosopiko';S.data.settings.lex={};biz().kind='private';S.data.settings.demo=false;}
  const seen=(S.data.mineSeen=S.data.mineSeen||{});const key=q.id+'|'+q.d+'|'+q.s;
  if(!seen[key]){let p=(q.ph&&byPhone(q.ph))||S.data.students.find(x=>(x.name||'')===biz0);
    if(!p){const id=IM_NEWPERSON(biz0,{phone:q.ph||''});p=getStudent(id);}
    const e=tstr(tmin(q.s)+q.u);appts().push({id:uid(),sid:p.id,kind:'once',date:q.d,d:wdOf(q.d),s:q.s,e,note:(q.no?q.no+' · ':'')+'Περιμένει επιβεβαίωση',ex:{},created:new Date().toISOString(),src:'mine'});
    seen[key]=new Date().toISOString();save();}
  try{sessionStorage.setItem('im-mine-msg',JSON.stringify({d:q.d,s:q.s,b:biz0}));}catch(_){}
  return true;}
function mineMsgShow(){let m=null;try{m=JSON.parse(sessionStorage.getItem('im-mine-msg')||'null');sessionStorage.removeItem('im-mine-msg');}catch(_){}if(!m)return;const q={d:m.d,s:m.s},biz0=m.b;
  {const when=WDAYS[wdOf(q.d)]+' '+fmtShort(q.d)+' · '+q.s;
    const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">✅ Μπήκε στο ημερολόγιό σου</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
     <div class="note"><b>📅 ${esc(when)}</b><div class="small">${esc(biz0)} · περιμένει επιβεβαίωση</div></div>
     <p class="small" style="margin:12px 0 6px">Βάλε το Ημερολόγιο στην αρχική οθόνη του κινητού σου: θα βλέπεις όλο τον μήνα με <b>στίγματα</b> στις μέρες που έχεις ραντεβού.</p>
     ${INST?`<button class="btn pri" id="mi-inst" style="width:100%">${ic('download',16)} Εγκατάσταση στο κινητό</button>`:isStandalone()?'':`<div class="note small">Από τις τρεις τελείες του φυλλομετρητή: «Προσθήκη στην αρχική οθόνη» → «Εγκατάσταση».</div>`}
     <button class="btn" data-close style="width:100%;margin-top:8px">Εντάξει</button>`,{guard:false});
    const b=$('#mi-inst',md.el);if(b)b.onclick=async()=>{const e=INST;if(!e)return;e.prompt();const r=await e.userChoice.catch(()=>null);INST=null;md.close();if(r&&r.outcome==='accepted')toast('Η εφαρμογή μπαίνει στην αρχική οθόνη.','ok');};}}
/* ---------- μεγάλος μήνας με στίγματα (αρχική οθόνη για ιδιώτες) ---------- */
let MDOT=null;
function monthDotsHTML(){const t=todayISO();const ym=MDOT||t.slice(0,7);const first=ym+'-01';const start=mondayOf(first);
  const endM=addDays(ym.slice(0,4)+'-'+String(+ym.slice(5,7)%12+1).padStart(2,'0')+'-01',0);const last=+ym.slice(5,7)===12?(+ym.slice(0,4)+1)+'-01-01':endM;
  const L=occ(start,addDays(start,41),{by:''}).filter(o=>o.st!=='cancel');const by={};L.forEach(o=>(by[o.date]=by[o.date]||[]).push(o));
  let cells='';for(let i=0;i<42;i++){const d=addDays(start,i);if(i>=35&&d>=last)break;const out=d.slice(0,7)!==ym;const X=by[d]||[];
    cells+=`<a class="mdc ${out?'out':''} ${d===t?'today':''} ${isClosed(d)?'closed':''}" href="#/agenda?view=day&d=${d}"><b>${+d.slice(8)}</b><span class="mdd">${X.slice(0,4).map(o=>`<i style="background:${(stOf(o.a.sid)||{}).color||'var(--brand)'}"></i>`).join('')}${X.length>4?'<em>+</em>':''}</span></a>`;}
  const nx=L.filter(o=>o.date>t||(o.date===t&&tmin(o.e)>nowMin())).slice(0,3);
  return`<section class="card mdots"><div class="spread" style="margin-bottom:8px"><button class="iconbtn" data-mdm="-1" aria-label="Προηγούμενος μήνας">${ic('left',18)}</button><b class="mdt">${MONTHS[+ym.slice(5,7)-1]} ${ym.slice(0,4)}</b><button class="iconbtn" data-mdm="1" aria-label="Επόμενος μήνας">${ic('right',18)}</button></div>
   <div class="mdg">${(window.LANG==='en'?['M','T','W','T','F','S','S']:['Δ','Τ','Τ','Π','Π','Σ','Κ']).map(x=>`<span class="mdw">${x}</span>`).join('')}${cells}</div>
   ${nx.length?`<div class="mdn">${nx.map(o=>`<button type="button" data-ap="${o.key}" class="mdnr"><i style="background:${(stOf(o.a.sid)||{}).color||'var(--brand)'}"></i><b>${WDAYS_S[wdOf(o.date)]} ${fmtShort(o.date)} · ${o.s}</b><span>${esc(stuName(stOf(o.a.sid)))}</span></button>`).join('')}</div>`:''}</section>`;}
function monthDotsBind(){$$('[data-mdm]').forEach(b=>b.onclick=()=>{const ym=MDOT||todayISO().slice(0,7);let y=+ym.slice(0,4),m=+ym.slice(5,7)+(+b.dataset.mdm);if(m<1){m=12;y--;}if(m>12){m=1;y++;}MDOT=y+'-'+String(m).padStart(2,'0');render();});}
/* ---------- κουμπί «Αποθήκευση»: σβήνει όταν δεν υπάρχει αλλαγή, γράφει «✓ Αποθηκεύτηκε» ---------- */
const formSnap=f=>JSON.stringify([...f.elements].filter(e=>e.name||e.id).map(e=>e.type==='checkbox'||e.type==='radio'?e.checked:e.value));
/* έξοδος από σελίδα με αλλαγές που δεν αποθηκεύτηκαν: ρωτά πρώτα */
const pageDirty=()=>{const m=document.getElementById('main');return!!m&&$$('form',m).some(f=>f._isDirty&&f._isDirty());};
let LEAVE_OK=false;
async function leaveAsk(){const ok=await confirmDlg('Έχεις αλλαγές που <b>δεν αποθηκεύτηκαν</b>. Να φύγεις χωρίς αποθήκευση;',{ok:'Φύγε χωρίς αποθήκευση',cancel:'Μείνε εδώ',danger:true});
  if(ok)try{localStorage.removeItem('imer-pdraft');}catch(_){}return ok;}
function dirtyWatch(root){if(!root)return;$$('form',root).forEach(f=>{const btn=f.querySelector('button.btn.pri:not([type=button])');if(!btn||f._dw)return;f._dw=true;
  const fresh=/\/new\b/.test(location.hash);const label=btn.innerHTML;
  const val=()=>formSnap(f);
  let base=f._base0!=null?f._base0:val();
  const upd=()=>{const dirty=fresh?[...f.elements].some(e=>/^(text|tel|email|textarea|search|url|number|date|time)$/.test(e.type)&&e.value.trim()):val()!==base;
    btn.disabled=!dirty;btn.classList.toggle('saved',!dirty&&!fresh);btn.innerHTML=dirty||fresh?label:`${ic('check',16)} Αποθηκεύτηκε`;};
  f._isDirty=()=>!(f._sub&&Date.now()-f._sub<2000)&&!btn.disabled&&(fresh?[...f.elements].some(e=>/^(text|tel|email|textarea)$/.test(e.type)&&e.value.trim()):val()!==base);
  f.addEventListener('input',upd);f.addEventListener('change',upd);f.addEventListener('submit',()=>{f._sub=Date.now();},true);f.addEventListener('submit',()=>setTimeout(()=>{if(document.body.contains(f)){base=val();upd();}},80));
  upd();});}
/* ---------- κρατήσεις από πελάτες (τρόπος Α: σύνδεσμος, χωρίς διακομιστή) ----------
   Ο σύνδεσμος κουβαλά τις ελεύθερες ώρες (συμπιεσμένες). Ο πελάτης διαλέγει ώρα στη σελίδα kratisi.html
   και στέλνει μήνυμα (Viber / SMS / WhatsApp / email) με σύνδεσμο «#/book?r=…». Το πάτημά του
   ανοίγει το Ημερολόγιο και η κράτηση μπαίνει με ένα «Καταχώρηση». Τίποτα δεν περνά από δικό μας διακομιστή. */
function bkCfg(){return Object.assign({days:14,ch:'vswe',pvPick:true},S.data.settings.book||{});}
function b64uEnc(u){let b='';for(let i=0;i<u.length;i++)b+=String.fromCharCode(u[i]);return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function b64uDec(x){x=x.replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';const b=atob(x);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
/* κρυπτογράφηση συνδέσμων (AES-GCM, τυχαίο κλειδί μέσα στον σύνδεσμο, μετά το «#»): «e» + δεδομένα + «.» + κλειδί */
async function sealTxt(type,obj){const key=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const k=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['encrypt']);
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(type+JSON.stringify(obj))));const buf=new Uint8Array(12+ct.length);buf.set(iv);buf.set(ct,12);return'e'+b64uEnc(buf)+'.'+b64uEnc(key);}
/* ανοίγει «e…» και γυρίζει τον παλιό κωδικό (τύπος + base64) για να τον διαβάσουν οι υπάρχουσες συναρτήσεις· οι παλιοί σύνδεσμοι περνούν όπως είναι */
async function openTxt(s){s=String(s||'');if(s[0]!=='e')return s;try{const[a,b]=s.slice(1).split('.');const buf=b64uDec(a),key=b64uDec(b);const k=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['decrypt']);
  const pt=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:buf.slice(0,12)},k,buf.slice(12)));return pt[0]+b64uEnc(new TextEncoder().encode(pt.slice(1)));}catch(e){return'';}}
async function packZ(obj){const bytes=new TextEncoder().encode(JSON.stringify(obj));
  if(window.CompressionStream){const cs=new CompressionStream('deflate-raw');const z=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer());return 'z'+b64uEnc(z);}
  return 'j'+b64uEnc(bytes);}
function bookSlots(days){const out=[];const t=todayISO();const du=IM_DEF.dur();const PV=providers();
  for(let i=0;i<days;i++){const d=addDays(t,i);const set=new Set();PV.forEach(p=>slotsFor(d,p.id,du,null,true).forEach(x=>set.add(tmin(x))));if(set.size)out.push([d,[...set].sort((a,b)=>a-b)]);}
  return out;}
/* οι ελεύθερες ώρες γράφονται ως «χάρτης» ανά 15λεπτο (δεκαεξαδικό ανά μέρα): μικρός σύνδεσμος, χωρίς συμπίεση,
   ώστε να ανοίγει σε κάθε κινητό και σε κάθε εσωτερικό φυλλομετρητή (Viber, Gmail…) */
function slotPack(S2,days){const t=todayISO();const all=S2.flatMap(x=>x[1]);if(!all.length)return{b:t,t0:0,d:[]};
  const t0=Math.floor(Math.min(...all)/15)*15,n=Math.floor((Math.max(...all)-t0)/15)+1;const M=new Map(S2);const d=[];
  for(let i=0;i<days;i++){const L=M.get(addDays(t,i));if(!L){d.push('');continue;}const bits=new Array(Math.ceil(n/4)*4).fill(0);L.forEach(m=>{bits[(m-t0)/15|0]=1;});let h='';for(let k=0;k<bits.length;k+=4)h+=((bits[k]<<3)|(bits[k+1]<<2)|(bits[k+2]<<1)|bits[k+3]).toString(16);d.push(h.replace(/0+$/,''));}
  while(d.length&&!d[d.length-1])d.pop();return{b:t,t0,d};}
/* ελεύθερες ώρες ανά άτομο (για να διαλέγει ο πελάτης με ποιον θα εξυπηρετηθεί) */
const pvPub=p=>p.id==='me'?(((S.data.settings.myName||'').trim().split(/\s+/)[0])||'Υπεύθυνος/η'):p.short;
const hexOf=(L,t0)=>{if(!L.length)return'';const n=Math.floor((Math.max(...L)-t0)/15)+1;const bits=new Array(Math.ceil(n/4)*4).fill(0);L.forEach(m=>{if(m>=t0)bits[(m-t0)/15|0]=1;});let h='';for(let k=0;k<bits.length;k+=4)h+=((bits[k]<<3)|(bits[k+1]<<2)|(bits[k+2]<<1)|bits[k+3]).toString(16);return h.replace(/0+$/,'');};
function pvPack(P,days){const PV=providers();if(PV.length<2||!bkCfg().pvPick)return{};const du=IM_DEF.dur(),t=todayISO();
  return{pv:PV.map(p=>{const d=[];for(let i=0;i<days;i++)d.push(hexOf(slotsFor(addDays(t,i),p.id,du,null,true).map(tmin),P.t0));while(d.length&&!d[d.length-1])d.pop();return{i:p.id,n:pvPub(p),c:p.color,d};})};}
function weekTemplate(){const c=agCfg(),du=IM_DEF.dur(),t=todayISO();const W=[[],[],[],[],[],[],[]];
  for(let i=0;i<7;i++){const d=addDays(t,i);const wd=wdOf(d);if(!agCfg().days.includes(wd))continue;const PV=providers();const held=m=>PV.every(p=>blocks().some(b=>b.hold&&b.kind==='weekly'&&(b.days||[]).includes(wd)&&(b.by||'me')===p.id&&tmin(b.s)<m+du&&m<tmin(b.e)));
    for(let m=tmin(c.from);m+du<=tmin(c.to);m+=30)if(inWork(m,du)&&!held(m))W[wd].push(m);}return W;}
async function bookLinkPerm(){const B=biz(),c=bkCfg();const W=weekTemplate();const all=W.flat();const t0=all.length?Math.floor(Math.min(...all)/15)*15:0;
  const w=W.map(L=>{if(!L.length)return'';const n=Math.floor((Math.max(...all)-t0)/15)+1;const bits=new Array(Math.ceil(n/4)*4).fill(0);L.forEach(m=>{bits[(m-t0)/15|0]=1;});let h='';for(let k=0;k<bits.length;k+=4)h+=((bits[k]<<3)|(bits[k+1]<<2)|(bits[k+2]<<1)|bits[k+3]).toString(16);return h.replace(/0+$/,'');});
  const D={v:2,pm:1,n:(isPrivate()?S.data.settings.myName:B.name||S.data.settings.myName)||'',ph:B.phone||'',em:B.email||'',o:LX('one'),c:themeColor(),l:window.LANG||'el',u:IM_DEF.dur(),g:Date.now(),ch:c.ch,dd:c.days,t0,w,x:proState().until||''};if(providers().length>1&&bkCfg().pvPick)D.pv=providers().map(p=>({i:p.id,n:pvPub(p),c:p.color}));
  return new URL('kratisi.html',location.href).href.split('#')[0].split('?')[0]+'#k='+await sealTxt('c',D);}
async function qrDialog(){await loadScript('qr.js');const now=(await bookLink()).url,perm=await bookLinkPerm();const B=biz();const name=(isPrivate()?S.data.settings.myName:B.name||S.data.settings.myName)||'';
  let tab='now';const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">🔳 Κωδικός QR για κρατήσεις</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <div class="seg field" id="qr-tab"><button type="button" data-qt="now" class="on">Να σκανάρει τώρα</button><button type="button" data-qt="perm">Μόνιμος (αφίσα)</button></div>
   <div id="qr-body"></div>`,{guard:false});
  const draw=()=>{const url=tab==='now'?now:perm;$('#qr-body',md.el).innerHTML=`<div class="qrbox">${qrSVG(url,{ecl:'M'})}</div>
    <p class="small" style="margin:10px 0 0">${tab==='now'?'Δείξε την οθόνη στον πελάτη: σκανάρει με την κάμερα του κινητού του και βλέπει τις <b>ελεύθερες ώρες σου αυτή τη στιγμή</b>.':'Για να τον τυπώσεις και να τον κολλήσεις στη βιτρίνα ή στο ταμείο. Δεν λήγει ποτέ: δείχνει τις <b>ώρες λειτουργίας</b> σου και ο πελάτης ζητάει ώρα· εσύ την επιβεβαιώνεις (αν είναι πιασμένη, η εφαρμογή σού προτείνει άλλες).'}</p>
    ${tab==='perm'?`<div class="note small warnnote" style="margin-top:8px">Αν αλλάξεις ωράριο ή διάρκεια ραντεβού, τύπωσε νέο κωδικό.</div>`:''}
    <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn pri" id="qr-pr">${ic('printer',16)} Εκτύπωση</button><button type="button" class="btn" id="qr-sv">${ic('download',16)} Αποθήκευση εικόνας</button></div>`;
    $('#qr-pr',md.el).onclick=()=>qrPrint(url,name);$('#qr-sv',md.el).onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([qrSVG(url)],{type:'image/svg+xml'}));a.download='kratisi-qr.svg';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500);};};
  $$('[data-qt]',md.el).forEach(b=>b.onclick=()=>{tab=b.dataset.qt;$$('[data-qt]',md.el).forEach(x=>x.classList.toggle('on',x===b));draw();});draw();}
function qrPrint(url,name){const w=window.open('','_blank');if(!w)return toast('Επίτρεψε τα αναδυόμενα παράθυρα για την εκτύπωση.','bad');
  w.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><title>Κράτηση ραντεβού</title><style>@page{size:A5;margin:12mm}body{font-family:system-ui,sans-serif;text-align:center;color:#222;margin:0}h1{font-size:26pt;margin:6mm 0 2mm}h2{font-size:16pt;font-weight:600;margin:0 0 6mm;color:#555}.q{width:110mm;height:110mm;margin:0 auto}.q svg{width:100%;height:100%}p{font-size:12pt;margin:6mm 10mm 0;line-height:1.4}.s{font-size:9pt;color:#888;margin-top:8mm}</style></head><body>
   <h1>${esc(name||'Κράτηση ραντεβού')}</h1><h2>📅 Κλείσε ραντεβού μόνος σου</h2><div class="q">${qrSVG(url,{ecl:'M',margin:2})}</div>
   <p>Άνοιξε την κάμερα του κινητού σου, στόχευσε τον κωδικό και πάτα τον σύνδεσμο που εμφανίζεται. Διαλέγεις ώρα και μας τη στέλνεις.</p><p class="s">Ημερολόγιο · GlenApps</p>
   <script>setTimeout(function(){window.print()},400)<\/script></body></html>`);w.document.close();}
async function bookLink(p){const B=biz(),c=bkCfg();const S2=bookSlots(c.days);
  const D=Object.assign({v:2,hp:isHealthProf()?1:0,n:(isPrivate()?S.data.settings.myName:B.name||S.data.settings.myName)||'',ph:B.phone||'',em:B.email||'',o:LX('one'),c:themeColor(),l:window.LANG||'el',u:IM_DEF.dur(),g:Date.now(),ch:c.ch},p?{pc:{i:p.id,n:stuName(p),ph:p.phone||((p.contacts||[])[0]||{}).phone||''},my:occ(todayISO(),addDays(todayISO(),c.days),{sid:p.id,by:''}).filter(o=>o.st==='').map(o=>[o.date,o.s]).slice(0,20)}:{},slotPack(S2,c.days));Object.assign(D,pvPack(D,c.days));
  const k=await sealTxt('c',D);
  return{url:new URL('kratisi.html',location.href).href.split('#')[0].split('?')[0]+'#k='+k,slots:S2.reduce((a,x)=>a+x[1].length,0),days:S2.length};}
/* ---------- Ημερολόγιο Pro (15 € τον χρόνο): ο σύνδεσμος κρατήσεων για τους πελάτες ----------
   Κλειδί «IM2…» (υπογραφή «I|») ή το κλειδί GlenApps Full «GA2…» (υπογραφή «GA|»), δεμένο με το email.
   Δωρεάν μένει μία αποστολή, για να δει κανείς πώς δουλεύει. Όλα τα υπόλοιπα του Ημερολογίου είναι δωρεάν. */
const PRO_PRICE=39,PRO_FIRST=29,PRO_FREE=1,PAY_EMAIL='aglentzakis.apps@gmail.com';
const LIC_PUB={kty:"EC",crv:"P-256",x:"vz6Lkoa7PzVQ1xGOcUyYmYPdOYYjbsp5t1xSsgc8cwg",y:"x9KzKNLFp5OKklXt6VcEaFlwr3wzvRjb1OJ9t1cBR1Q"};
const B32K="0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function b32dec(t){let e=0,n=0;const o=[];for(const a of t){const i=B32K.indexOf(a);if(i<0)return null;n=n<<5|i;e+=5;if(e>=8){e-=8;o.push(n>>e&255);}}return new Uint8Array(o);}
function licParse(t){const e=String(t||'').toUpperCase().replace(/[\s\-–—_.]+/g,'').replace(/O/g,'0').replace(/[IL]/g,'1');
  const m=/^(1M2|GA2)(\d{6})([0-9A-Z]{100,110})$/.exec(e.replace(/^IM2/,'1M2'));if(!m)return null;const sig=b32dec(m[3]);if(!sig||sig.length<64)return null;
  return{pre:m[1]==='GA2'?'GA':'I',clean:(m[1]==='GA2'?'GA2':'IM2')+m[2]+m[3],until:'20'+m[2].slice(0,2)+'-'+m[2].slice(2,4)+'-'+m[2].slice(4,6),sig:sig.slice(0,64)};}
const licMail=t=>String(t||'').trim().toLowerCase();
async function licSha(t){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function licVerify(email,key){const k=licParse(key);if(!k||!email||!window.crypto||!crypto.subtle)return null;
  try{const pk=await crypto.subtle.importKey('jwk',LIC_PUB,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pk,k.sig,new TextEncoder().encode(k.pre+'|'+await licSha(licMail(email))+'|'+k.until));
    return ok?{email:licMail(email),key:k.clean,until:k.until,full:k.pre==='GA'}:null;}catch(_){return null;}}
function proState(){const L=S.data.settings.lic||{};if(L.ok&&L.until&&L.until>=todayISO())return{pro:true,until:L.until,full:!!L.full,email:L.email};
  return{pro:false,expired:!!(L.ok&&L.until),until:L.until||'',left:Math.max(0,PRO_FREE-(S.data.settings.bkFree||0))};}
const isPro=()=>proState().pro;
async function licApply(email,key){const v=await licVerify(email,key);if(!v)return{err:licParse(key)?'Το κλειδί δεν ταιριάζει με αυτό το email.':'Το κλειδί δεν έχει σωστή μορφή. Ξεκινά με «IM2» (ή «GA2» για το GlenApps Full).'};
  if(v.until<todayISO())return{err:'Αυτό το κλειδί έληξε στις '+fmtDate(v.until)+'.'};
  S.data.settings.lic=Object.assign(v,{ok:true,at:new Date().toISOString()});save();
  if(v.full)try{if(!localStorage.getItem('glenapps-kleidi'))localStorage.setItem('glenapps-kleidi',JSON.stringify({kleidi:v.key,email:v.email}));}catch(_){}
  return v;}
/* στην εκκίνηση: ξαναελέγχει το αποθηκευμένο κλειδί και παίρνει αυτόματα το κλειδί GlenApps Full αν υπάρχει στο κινητό */
async function licBoot(){if(!S.data||!S.data.settings)return;const L=S.data.settings.lic||{};
  if(L.key){const v=await licVerify(L.email,L.key);if(!v){delete S.data.settings.lic;save();}}
  if(!isPro())try{const g=JSON.parse(localStorage.getItem('glenapps-kleidi')||'null');if(g&&g.kleidi&&g.email){const v=await licVerify(g.email,g.kleidi);if(v&&v.until>=todayISO()){S.data.settings.lic=Object.assign(v,{ok:true,at:new Date().toISOString(),auto:true});save();}}}catch(_){}}
setTimeout(licBoot,800);
function proPriceHTML(){return`<div class="probig"><b>${PRO_FIRST} €</b><span>τον πρώτο χρόνο · μετά ${PRO_PRICE} € τον χρόνο · με ΦΠΑ, μόνο ετήσιο</span></div>`;}
function proFeatHTML(){return`<ul class="proul"><li>📲 Σύνδεσμος κρατήσεων χωρίς όριο αποστολών</li><li>👤 Προσωπικός σύνδεσμος για τον καθένα: δεν γράφει στοιχεία, βλέπει και τα ραντεβού του</li><li>🔳 Κωδικός QR για βιτρίνα ή ταμείο (μόνιμος, για εκτύπωση)</li><li>📥 Οι κρατήσεις έρχονται στο κινητό σου με Viber / SMS / WhatsApp / email και μπαίνουν με ένα πάτημα</li><li>👥 Ο πελάτης διαλέγει και με ποιον θέλει να εξυπηρετηθεί</li><li>📊 Στατιστικά: έσοδα και επισκέψεις ανά πελάτη, ποιοι έχουν καιρό να έρθουν, πληρότητα, γεμάτες μέρες και ώρες, ανά άτομο προσωπικού, εξαγωγή σε Excel</li></ul>`;}
function proKeyHTML(){const L=S.data.settings.lic||{};return`<div class="field"><label class="f" for="pk-em">Email με το οποίο πήρες το κλειδί</label><input class="in" id="pk-em" type="email" inputmode="email" autocapitalize="none" value="${esc(L.email||'')}"></div>
  <div class="field"><label class="f" for="pk-k">Κλειδί</label><textarea class="in" id="pk-k" rows="3" placeholder="IM2… ή GA2…" autocapitalize="characters" spellcheck="false" style="font-family:ui-monospace,monospace;font-size:13px"></textarea></div><div id="pk-err"></div>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn pri" id="pk-ok">${ic('check',16)} Ενεργοποίηση</button><button type="button" class="btn" id="pk-ask">✉️ Ζήτα κλειδί (${PRO_FIRST} €)</button></div>`;}
function proKeyBind(el,done){const ok=$('#pk-ok',el),ask=$('#pk-ask',el);
  const errBox=(html,bad=true)=>{const b=$('#pk-err',el);b.innerHTML=`<div class="pkmsg ${bad?'bad':'ok'}">${html}</div>`;b.scrollIntoView({behavior:'smooth',block:'center'});};
  const kf=$('#pk-k',el);
  // ασφάλεια: αν κάποιος επικολλήσει το ΜΥΣΤΙΚΟ αρχείο υπογραφής (prv.json) αντί για κλειδί, το σβήνουμε αμέσως
  const isPrv=v=>/"d"\s*:|"kty"\s*:|"crv"\s*:/.test(v);
  if(kf)kf.addEventListener('input',()=>{if(isPrv(kf.value)){kf.value='';errBox('🛑 <b>Αυτό δεν είναι κλειδί πελάτη — είναι το ΜΥΣΤΙΚΟ αρχείο υπογραφής (prv.json).</b><br>Το έσβησα αμέσως και δεν αποθηκεύτηκε πουθενά. Το prv.json μπαίνει <b>μόνο</b> στη σελίδα «Κλειδιά GlenApps». Εκεί φτιάχνεις κλειδί «Ημερολόγιο» (ξεκινά με IM2…) και αυτό το κλειδί το βάζεις εδώ.');}});
  if(ok)ok.onclick=async()=>{const em=$('#pk-em',el).value,k=kf.value;
    if(isPrv(k)){kf.value='';return errBox('🛑 Αυτό είναι το μυστικό αρχείο υπογραφής, όχι κλειδί. Το έσβησα.');}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(licMail(em)))return errBox('✋ Γράψε το email με το οποίο πήρες το κλειδί.');
    if(!k.trim())return errBox('✋ Επικόλλησε το κλειδί (ξεκινά με IM2… ή GA2…).');
    const lab=ok.innerHTML;ok.disabled=true;ok.innerHTML='⏳ Έλεγχος…';const r=await licApply(em,k);ok.disabled=false;ok.innerHTML=lab;
    if(r.err)return errBox('✗ <b>Δεν ενεργοποιήθηκε.</b> '+esc(r.err));
    kf.value='';ok.disabled=true;ok.innerHTML='✓ Ενεργοποιήθηκε';errBox(`⭐ <b>Το Pro ενεργοποιήθηκε!</b> Ισχύει έως <b>${fmtDate(r.until)}</b>${r.full?' (GlenApps Full)':''}.`,false);
    const m=modal(`<div style="text-align:center"><div style="font-size:54px;line-height:1">⭐</div><h3 style="margin:8px 0 4px">Το Pro ενεργοποιήθηκε!</h3><p class="small" style="margin:0 0 6px">Ισχύει έως <b>${fmtDate(r.until)}</b>${r.full?' · με το κλειδί GlenApps Full':''}.</p><p class="small muted" style="margin:0 0 14px">Τώρα έχεις σύνδεσμο κρατήσεων χωρίς όριο, κωδικό QR και στατιστικά.</p><button class="btn pri" data-close style="width:100%">Εντάξει</button></div>`,{guard:false,onClose:()=>{done&&done();}});};
  if(ask)ask.onclick=()=>{const em=licMail(($('#pk-em',el)||{}).value);const B=biz();
    location.href=`mailto:${PAY_EMAIL}?subject=${encodeURIComponent('[IM-PRO] Ημερολόγιο Pro')}&body=${encodeURIComponent(['Γεια σας,','','Θα ήθελα κλειδί για το Ημερολόγιο Pro για έναν χρόνο ('+(S.data.settings.lic&&S.data.settings.lic.ok?PRO_PRICE+' € με ΦΠΑ, ανανέωση':PRO_FIRST+' € με ΦΠΑ, πρώτος χρόνος')+').','',(isPrivate()?'Όνομα':'Επιχείρηση')+': '+((isPrivate()?S.data.settings.myName:B.name)||'—'),'Email για το κλειδί: '+(em||'—'),'','Παρακαλώ στείλτε μου πώς να πληρώσω.'].join('\n'))}`;};}
function proSheet(why){const st=proState();const W={bk:'Η δωρεάν αποστολή συνδέσμου κρατήσεων χρησιμοποιήθηκε.',qr:'Ο κωδικός QR για κρατήσεις είναι μέρος του Pro.',st:'Τα στατιστικά είναι μέρος του Pro.'}[why]||'';
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">⭐ Ημερολόγιο Pro</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   ${W?`<div class="note small" style="margin-bottom:10px">${W}${st.expired?' Το κλειδί σου έληξε στις '+fmtDate(st.until)+'.':''}</div>`:''}
   ${proPriceHTML()}${proFeatHTML()}
   <p class="small muted" style="margin:6px 0 12px">Όλα τα υπόλοιπα του Ημερολογίου μένουν <b>δωρεάν</b>. Το κλειδί <b>GlenApps Full</b> (όλες οι εφαρμογές) ξεκλειδώνει και αυτό.</p>
   <div id="pk-box">${proKeyHTML()}</div>`,{guard:false});proKeyBind(md.el,()=>{md.close();render();});}
async function bookShareDialog(p){const B=biz();
  if(!isPro()&&proState().left<=0)return proSheet('bk');
  if(!B.phone&&!B.email){if(await confirmDlg('Για να σου στέλνουν κρατήσεις, χρειάζεται το τηλέφωνο της επιχείρησης (για Viber / SMS) ή email. Να πας να το γράψεις;',{ok:'Πάμε'}))go('settings/info');return;}
  if(isHealthProf()&&!S.data.settings.hpAck){const ok=await new Promise(res=>{const m=modal(`${HP_TXT}<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Όχι τώρα</button><button class="btn pri" id="hp-ok">Κατάλαβα, συνέχεια</button></div>`,{guard:false,onClose:()=>res(false)});$('#hp-ok',m.el).onclick=()=>{res(true);m.close();};});if(!ok)return;S.data.settings.hpAck=new Date().toISOString();save();}
  const L0=await bookLink(p);const nm=p?(p.name||'').split(' ')[0]:'';
  const txt=window.LANG==='en'?(nm?'Hello '+nm+'! ':'Hello! ')+'Pick a time that suits you here:\n'+L0.url:(nm?'Καλησπέρα '+nm+'! ':'Καλησπέρα! ')+'Διάλεξε μόνος σου ώρα για '+LX('one').toLowerCase()+' εδώ:\n'+L0.url;
  const ph=p&&(p.phone||((p.contacts||[])[0]||{}).phone);
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">📲 Σύνδεσμος κρατήσεων</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>${isHealthProf()?`<button type="button" class="hpline" id="hp-why">🩺 Επάγγελμα υγείας: τα στοιχεία των ασθενών έρχονται μόνο σε σένα. <u>Πώς δουλεύει</u></button>`:''}
   <p class="small" style="margin-top:0">Ο ${esc(LX('who')).toLowerCase()} ανοίγει τον σύνδεσμο, διαλέγει μέρα και ώρα από τις <b>ελεύθερες</b> σου και σου στέλνει την κράτηση με Viber, SMS, WhatsApp ή email. Εσύ πατάς τον σύνδεσμο στο μήνυμα και μπαίνει στο ημερολόγιο.</p>
   <div class="note small">📅 Μέσα: <b>${L0.slots}</b> ελεύθερες ώρες σε <b>${L0.days}</b> μέρες (επόμενες ${bkCfg().days}).<br>⏱️ Οι ώρες είναι όπως είναι <b>τώρα</b>· για φρέσκες ώρες στείλε νέο σύνδεσμο.</div>
   ${isPro()?'':`<div class="note small freenote" style="margin-top:8px">🎁 <b>Δωρεάν δοκιμή:</b> ${PRO_FREE===1?'μία αποστολή':PRO_FREE+' αποστολές'}, για να δεις πώς δουλεύει. Μετά χρειάζεται το <b>Ημερολόγιο Pro</b> (${PRO_FIRST} € τον πρώτο χρόνο). <button type="button" class="linkbtn small" id="bk-pro">Τι περιλαμβάνει →</button></div>`}
   ${p?`<p class="small" style="margin:10px 0 4px">Προς: <b>${esc(stuName(p))}</b> · ο σύνδεσμος είναι προσωπικός: δεν θα χρειαστεί να γράψει όνομα και τηλέφωνο.</p>`:''}
   <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">
    ${ph?`<a class="btn" href="${smsHref(ph,txt)}">${ic('l-message-square',15)} SMS</a><a class="btn" target="_blank" rel="noopener" href="${waHref(ph,txt)}">WhatsApp</a>`:''}
    <button type="button" class="btn" id="bk-vb">Viber</button>
    ${navigator.share?`<button type="button" class="btn" id="bk-sh">${ic('send',15)} Κοινοποίηση…</button>`:''}
    <button type="button" class="btn" id="bk-cp">${ic('copy',15)} Αντιγραφή</button>${p?'':`<button type="button" class="btn" id="bk-qr">🔳 Κωδικός QR${isPro()?'':' ⭐'}</button>`}
    <a class="btn ghost" href="${esc(L0.url)}" target="_blank" rel="noopener">👀 Δες τη σελίδα</a></div>
   ${providers().length>1?`<label class="switch" style="margin-top:12px"><span><b>👥 Ο ${esc(LX('who')).toLowerCase()} μπορεί να διαλέξει άτομο</b><small>${bkCfg().pvPick?'Ναι — κρυμμένο πίσω από «Θέλεις συγκεκριμένο άτομο;». Αλλιώς πηγαίνει στον πιο ελεύθερο.':'Όχι — βλέπει μόνο ελεύθερες ώρες· το ραντεβού πηγαίνει στον πιο ελεύθερο.'}</small></span><input type="checkbox" id="bk-pv" ${bkCfg().pvPick?'checked':''}></label>`:''}
   <details style="margin-top:12px"><summary class="small"><b>Ρυθμίσεις κρατήσεων</b></summary>
    <div class="field" style="margin-top:8px"><label class="f">Πόσες μέρες μπροστά</label><div class="seg" id="bk-days">${[7,14,21,30].map(n=>`<button type="button" data-bd="${n}" class="${bkCfg().days===n?'on':''}">${n}</button>`).join('')}</div></div>
    <div class="field"><label class="f">Πώς μπορούν να σου στείλουν</label><div class="chips">${[['v','Viber'],['s','SMS'],['w','WhatsApp'],['e','Email']].map(([k,l])=>`<button type="button" class="chipt ${bkCfg().ch.includes(k)?'on':''}" data-bch="${k}">${l}</button>`).join('')}</div>
     <div class="tiny muted" style="margin-top:4px">Viber / SMS / WhatsApp στο ${esc(B.phone||'— (λείπει τηλέφωνο)')} · Email στο ${esc(B.email||'— (λείπει email)')}</div></div></details>`,{guard:false});
  {const hw=$('#hp-why',md.el);if(hw)hw.onclick=()=>modal(`${HP_TXT}<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn pri" data-close>Εντάξει</button></div>`,{guard:false});}
  $('#bk-vb',md.el).onclick=async()=>{try{await navigator.clipboard.writeText(txt);}catch(_){}if(p)logMsg(p,'Σύνδεσμος κρατήσεων','Viber');
    if(navigator.share){toast('Διάλεξε «Viber» από τη λίστα και μετά τον παραλήπτη.','ok');navigator.share({text:txt}).catch(()=>{});}
    else{toast('Ο σύνδεσμος αντιγράφηκε. Αν στο Viber δεν φαίνεται ολόκληρος, κάνε «Επικόλληση».','ok');location.href=viberHref(txt);}};
  const sh=$('#bk-sh',md.el);if(sh)sh.onclick=()=>navigator.share({title:'Κράτηση ραντεβού',text:txt}).catch(()=>{});
  {const q=$('#bk-qr',md.el);if(q)q.onclick=()=>{md.close();isPro()?qrDialog():proSheet('qr');};}
  {const pb=$('#bk-pro',md.el);if(pb)pb.onclick=()=>{md.close();proSheet();};}
  /* η δωρεάν αποστολή «ξοδεύεται» με την πρώτη αποστολή από αυτό το παράθυρο */
  let spent=false;const spend=()=>{if(spent||isPro())return;spent=true;S.data.settings.bkFree=(S.data.settings.bkFree||0)+1;save();};
  md.el.addEventListener('click',e=>{const t=e.target.closest('#bk-vb,#bk-sh,#bk-cp,a.btn');if(t&&!/👀/.test(t.textContent))spend();},true);
  $('#bk-cp',md.el).onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>toast('Αντιγράφηκε — επικόλλησέ το όπου θέλεις.','ok')).catch(()=>toast('Δεν έγινε αντιγραφή — πάτα «Κοινοποίηση».','bad'));};
  if(p)$$('a.btn',md.el).forEach(a=>{if(/^(sms|viber|https:\/\/wa)/.test(a.getAttribute('href')))a.addEventListener('click',()=>logMsg(p,'Σύνδεσμος κρατήσεων',a.textContent.trim()));});
  $$('[data-bd]',md.el).forEach(b=>b.onclick=()=>{S.data.settings.book=Object.assign(bkCfg(),{days:+b.dataset.bd});save();md.close();bookShareDialog(p);});
  {const pvs=$('#bk-pv',md.el);if(pvs)pvs.onchange=()=>{S.data.settings.book=Object.assign(bkCfg(),{pvPick:pvs.checked});save();toast(pvs.checked?'Ο πελάτης μπορεί να διαλέξει άτομο.':'Ο πελάτης δεν διαλέγει άτομο.','ok');md.close();bookShareDialog(p);};}
  $$('[data-bch]',md.el).forEach(b=>b.onclick=()=>{let ch=bkCfg().ch;ch=ch.includes(b.dataset.bch)?ch.replace(b.dataset.bch,''):ch+b.dataset.bch;if(!ch)return toast('Άφησε τουλάχιστον έναν τρόπο.','bad');S.data.settings.book=Object.assign(bkCfg(),{ch});save();md.close();bookShareDialog(p);});}
/* το πάτημα του συνδέσμου από το μήνυμα του πελάτη */
function bookDecode(r){try{if(!r||r[0]!=='j')return null;const o=JSON.parse(new TextDecoder().decode(b64uDec(r.slice(1))));
  if(!o||o.v!==1||!/^\d{4}-\d{2}-\d{2}$/.test(o.d)||!/^\d{2}:\d{2}$/.test(o.s))return null;
  const c=(x,n)=>String(x||'').replace(/\s+/g,' ').trim().slice(0,n);return{ad:c(o.ad,120),ca:o.ca===undefined?null:!!o.ca,ts:+o.ts||0,sid:c(o.sid,60),d:o.d,s:o.s,u:Math.min(Math.max(+o.u||IM_DEF.dur(),10),480),n:c(o.n,80),ph:c(o.ph,25),no:c(o.no,200),pr:!!o.pr,id:c(o.id,20),pv:c(o.pv,40),pn:c(o.pn,40)};}catch(e){return null;}}
function bookImport(code){const q=bookDecode(code);if(!q)return toast('Ο σύνδεσμος κράτησης δεν είναι σωστός.','bad');
  const seen=(S.data.bookSeen=S.data.bookSeen||{});const key=q.id+'|'+q.d+'|'+q.s;
  const e=tstr(tmin(q.s)+q.u);const PV=providers();const isFreeP=p=>!conflicts(q.d,q.s,e,'',p.id).length&&!holdAt(q.d,q.s,e,p.id)&&inWork(tmin(q.s),q.u);
  const want=q.pv&&PV.find(p=>p.id===q.pv);const load=p=>occ(q.d,q.d,{by:p.id}).reduce((m,o)=>m+tmin(o.e)-tmin(o.s),0);
  const freeP=want&&isFreeP(want)?want:PV.filter(isFreeP).sort((a,b)=>load(a)-load(b))[0];const swap=!!(want&&freeP&&freeP.id!==want.id);
  const existing=(q.sid&&getStudent(q.sid))||(q.ph&&byPhone(q.ph));
  const past=q.d<todayISO();const closed=isClosed(q.d)||!workDay(q.d);
  const alt=()=>{const out=[];let d=q.d<todayISO()?todayISO():q.d;for(let k=0;k<30&&out.length<3;k++,d=addDays(d,1)){const set=new Set();PV.forEach(p=>slotsFor(d,p.id,q.u,null,true).forEach(x=>set.add(x)));[...set].sort().forEach(x=>{if(out.length<3&&!(d===q.d&&x===q.s))out.push([d,x]);});}return out;};
  const when=WDAYS[wdOf(q.d)]+' '+fmtShort(q.d)+' · '+q.s+'–'+e;
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">📲 Νέα κράτηση</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <div class="qsum"><span class="av lg">${esc((q.n||'?')[0].toUpperCase())}</span><div><b>${esc(q.n)}</b><div class="small">${esc(q.ph)}${existing?` · <span style="color:var(--ok)">υπάρχει ήδη στους ${esc(LX('whoPlL'))}</span>`:` · <span class="muted">νέος ${esc(LX('who')).toLowerCase()}</span>`}</div></div></div>
   <div class="note" style="margin:10px 0"><b>📅 ${esc(when)}</b>${want||q.pn?`<div class="small" style="margin-top:4px">👤 Θέλει: <b>${esc(want?want.short:q.pn)}</b></div>`:''}${q.no?`<div class="small" style="margin-top:4px">📝 ${esc(q.no)}</div>`:''}${q.ad?`<div class="small" style="margin-top:4px">📍 ${esc(q.ad)}</div>`:''}<div class="tiny muted" style="margin-top:4px">Δήλωσε ο ίδιος: μηνύματα ραντεβού <b>${q.ca===false?'ΟΧΙ':'ΝΑΙ'}</b> · προσφορές <b>${q.pr?'ΝΑΙ':'ΟΧΙ'}</b></div></div>
   ${seen[key]?`<div class="note small warnnote">Αυτή η κράτηση έχει ήδη καταχωρηθεί (${esc(atTxt(seen[key]))}).</div><div class="row" style="justify-content:flex-end;margin-top:10px"><a class="btn pri" href="#/agenda?view=day&d=${q.d}" data-close>Δες τη μέρα</a></div>`
   :past?`<div class="note small warnnote">Η μέρα αυτή έχει περάσει.</div>`
   :(freeP&&!closed)?`${swap?`<div class="note small warnnote">⚠️ ${esc(want.short)} είναι πιασμένος/η εκείνη την ώρα· ελεύθερος/η είναι ${esc(freeP.short)}. Αν θέλεις, ρώτα πρώτα τον ${esc(LX('who')).toLowerCase()}.</div>`:''}<div class="row" style="justify-content:flex-end;gap:8px;margin-top:6px"><button type="button" class="btn" data-close>Όχι τώρα</button><button type="button" class="btn pri" id="bi-ok">${ic('check',16)} Καταχώρηση${PV.length>1?' με '+esc(freeP.short):''}</button></div>`
   :`<div class="note small warnnote">⚠️ ${closed?'Εκείνη τη μέρα είσαι κλειστά.':'Η ώρα αυτή πιάστηκε στο μεταξύ.'} Στείλε του άλλες ώρες:</div><div id="bi-alt" style="margin-top:8px"></div>`}`,{guard:false});
  const ok=$('#bi-ok',md.el);if(ok)ok.onclick=()=>{let sid=existing&&existing.id;
    if(!sid)sid=IM_NEWPERSON(q.n,{phone:q.ph,cons:'yes',consHow:'από τη σελίδα κρατήσεων'});const p=getStudent(sid);
    const how='δήλωσε ο ίδιος στη σελίδα κρατήσεων',at=q.ts?new Date(q.ts).toISOString():undefined;
    if(q.ca!==null)setCons(p,'appt',q.ca,how,at);else if(!p.cons||!p.cons.appt)setCons(p,'appt',true,how,at);
    if(q.pr)setCons(p,'promo',true,how,at);else if(!p.cons||!p.cons.promo)setCons(p,'promo',false,how,at);
    if(q.ad&&!(p.loc&&p.loc.addr)){p.loc={addr:q.ad,home:true};geocodePerson(p,false);}
    logMsg(p,'Δήλωσε μόνος του: μηνύματα ραντεβού '+(q.ca===false?'ΟΧΙ':'ΝΑΙ')+' · προσφορές '+(q.pr?'ΝΑΙ':'ΟΧΙ')+(q.ad?' · διεύθυνση':''),'σελίδα κρατήσεων',{at:at||new Date().toISOString()});
    const a={id:uid(),sid,kind:'once',date:q.d,d:wdOf(q.d),s:q.s,e,note:q.no||'',ex:{},by:freeP.id==='me'?undefined:freeP.id,created:new Date().toISOString(),src:'link'};
    appts().push(a);seen[key]=new Date().toISOString();logMsg(p,'Κράτηση από τον σύνδεσμο: '+fmtShort(q.d)+' '+q.s,'σύνδεσμος');save();md.close();render();
    toast('Καταχωρήθηκε. Στείλε επιβεβαίωση.','ok');setTimeout(()=>{const txt=confText(a);const ph=q.ph;
      const m2=modal(`<h3 style="margin-top:0">✅ Στείλε επιβεβαίωση</h3><p class="small muted" style="margin-top:0">${esc(txt)}</p><div class="row" style="gap:8px;flex-wrap:wrap">${chBtnsHTML({contacts:[{name:q.n,phone:ph}]},txt,'Επιβεβαίωση ραντεβού','data-bcf="1"')}</div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Κλείσιμο</button></div>`,{guard:false});
      m2.el.addEventListener('click',ev=>{const b=ev.target.closest('[data-bcf]');if(b)logMsg(p,'Επιβεβαίωση κράτησης '+fmtShort(q.d)+' '+q.s,b.textContent.trim());});},250);};
  const al=$('#bi-alt',md.el);if(al){(async()=>{const A=alt();const L0=await bookLink();
    const fm=A.map(([d,x])=>WDAYS_S[wdOf(d)]+' '+fmtShort(d)+' '+x).join(', ');const first=(q.n||'').split(' ')[0];const slot=WDAYS[wdOf(q.d)]+' '+fmtShort(q.d)+' '+q.s;
    const txt=window.LANG==='en'?'Hello '+first+'! Sorry, '+slot+' is no longer free.'+(A.length?' I can do: '+fm+'.':'')+'\nOr pick another time here:\n'+L0.url:'Καλησπέρα '+first+'! Δυστυχώς η ώρα '+slot+' δεν είναι πια ελεύθερη.'+(A.length?' Μπορώ: '+fm+'.':'')+'\nΉ διάλεξε άλλη ώρα εδώ:\n'+L0.url;
    al.innerHTML=`<p class="small" style="margin:0 0 6px">${A.length?'Πρώτες ελεύθερες: <b>'+A.map(([d,x])=>esc(WDAYS_S[wdOf(d)]+' '+fmtShort(d)+' '+x)).join(' · ')+'</b>':'Δεν βρέθηκαν ελεύθερες ώρες τις επόμενες 30 μέρες.'}</p><div class="row" style="gap:8px;flex-wrap:wrap">${chBtnsHTML({contacts:[{name:q.n,phone:q.ph}]},txt,'Κράτηση ραντεβού','')}</div>`;})();}}
/* ---------- λέξεις: βοήθεια για κάθε κουτάκι ---------- */
const LXF=[['who','Τίτλος στην καρτέλα: «Νέος ___»','Νέος {}'],['whoAcc','Στο νέο ραντεβού: «Διάλεξε ___»','Διάλεξε {}…'],['whoGen','Κουμπί: «Καρτέλα ___»','Καρτέλα {}'],['whoPl','Στο κάτω μενού: «___»','{}'],['whoPlL','Στη φράση: «Πάγιοι ___»','Πάγιοι {}'],['one','Στο ημερολόγιο του κινητού: «___: Μαρία»','{}: Μαρία']];
const T2=(el,en)=>window.LANG==='en'?en:el;
const LXH_EN={
 who:{how:'<b>One</b> person, the way you name them.',test:'Who came? — The <u>___</u> came.',caps:'Start with a <b>capital</b> letter.',no:['clients','Clients']},
 whoAcc:{how:'<b>One</b> person, as in “<b>choose a ___</b>”.',test:'Who are you waiting for? — A <u>___</u>.',caps:'All <b>lowercase</b>.',no:['Clients']},
 whoGen:{how:'<b>One</b> person, as in “<b>the ___ profile</b>”. Usually the same as the box above.',test:'Whose profile is it? — The <u>___</u>’s.',caps:'All <b>lowercase</b>.',no:['clients']},
 whoPl:{how:'<b>Many</b> people. It is the label of the bottom menu button, so keep it <b>short</b> (one word).',test:'Who is coming? — The <u>___</u>.',caps:'Start with a <b>capital</b> letter.',no:['Client']},
 whoPlL:{how:'<b>Many</b> people, inside a sentence.',test:'How many? — Ten <u>___</u>.',caps:'All <b>lowercase</b>.',no:['client']},
 one:{how:'What you <b>book</b>. It goes in the title of each entry in your phone calendar.',test:'What do you have at 10:00? — A <u>___</u>.',caps:'Start with a <b>capital</b> letter.',no:['appointments'],ex:['Appointment','Lesson','Session','Visit','Booking']}};
const LXH={
 who:{how:'Τον <b>έναν</b>, όπως τον λες όταν μιλάς <b>για</b> αυτόν.',test:'Ποιος ήρθε; — Ήρθε ο <u>___</u>.',caps:'Με <b>κεφαλαίο</b> το πρώτο γράμμα.',no:['Πελάτη','Πελάτες']},
 whoAcc:{how:'Τον <b>έναν</b>, όπως λες «<b>βλέπω τον ___</b>».',test:'Ποιον περιμένεις; — Περιμένω τον <u>___</u>.',caps:'Με <b>μικρά</b> γράμματα.',no:['πελάτης','Πελάτες']},
 whoGen:{how:'Τον <b>έναν</b>, όπως λες «<b>η καρτέλα του ___</b>». Στα περισσότερα επαγγέλματα είναι ίδιο με το από πάνω κουτάκι.',test:'Τίνος είναι η καρτέλα; — Του <u>___</u>.',caps:'Με <b>μικρά</b> γράμματα.',no:['πελάτης','πελατών']},
 whoPl:{how:'<b>Πολλοί</b> μαζί. Είναι ο τίτλος του κουμπιού στο κάτω μενού, οπότε κράτησέ το <b>σύντομο</b> (μία λέξη).',test:'Ποιοι έρχονται; — Οι <u>___</u>.',caps:'Με <b>κεφαλαίο</b> το πρώτο γράμμα.',no:['Πελάτης','πελατών']},
 whoPlL:{how:'<b>Πολλοί</b> μαζί, μέσα σε πρόταση.',test:'Πόσοι είναι; — Είναι δέκα <u>___</u>.',caps:'Με <b>μικρά</b> γράμματα.',no:['Πελάτες','πελάτη']},
 one:{how:'Πώς λέγεται <b>αυτό που κλείνεις</b>. Μπαίνει στον τίτλο κάθε εγγραφής στο ημερολόγιο του κινητού.',test:'Τι έχεις στις 10:00; — Έχω <u>___</u>.',caps:'Με <b>κεφαλαίο</b> το πρώτο γράμμα.',no:['ραντεβούς','Ραντεβού μου'],ex:['Ραντεβού','Μάθημα','Συνεδρία','Επίσκεψη','Κράτηση']}};
function lxHelp(k,host){const h=(window.LANG==='en'?LXH_EN:LXH)[k],F=LXF.find(x=>x[0]===k);const inp=host&&$('#lx-'+k,host);const cur=(inp&&(inp.value.trim()||inp.placeholder))||LX(k);
  const ex=h.ex||[...new Set(Object.values(IM_WHO).map(w=>w[k]))].slice(0,6);
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Τι γράφω εδώ;</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <div class="lxh-where"><small>Πού φαίνεται</small><b>${esc(F[1].split(':')[0])}</b><div class="lxh-demo">${esc(F[2]).replace('{}','<mark>'+esc(cur)+'</mark>')}</div></div>
   <div class="lxh-step"><span>1</span><div><b>Τι γράφεις</b><p>${h.how}</p></div></div>
   <div class="lxh-step"><span>2</span><div><b>Το κόλπο για να βγει σωστό</b><p>${T2('Πες δυνατά τη φράση και βάλε τη λέξη σου στο κενό:','Say the sentence out loud with your word in the gap:')}<br><i>«${h.test}»</i></p></div></div>
   <div class="lxh-step"><span>3</span><div><b>Γράμματα</b><p>${h.caps}</p></div></div>
   <div class="lxh-ok"><small>✓ Σωστά παραδείγματα</small><div>${ex.map(x=>`<span class="chip">${esc(x)}</span>`).join(' ')}</div></div>
   <div class="lxh-no"><small>✗ Όχι έτσι</small><div>${h.no.map(x=>`<span class="chip">${esc(x)}</span>`).join(' ')}</div></div>
   <button type="button" class="btn pri" data-close style="width:100%;margin-top:12px">Κατάλαβα</button>`,{guard:false});}
/* από μία λέξη (π.χ. «Ιδιοκτήτης») φτιάχνει όλες τις μορφές */
function lxGuess(w){w=w.trim();if(window.LANG==='en'&&!/[\u0370-\u03FF]/.test(w)){const c=w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(),l=c.toLowerCase(),p=/(s|x|ch|sh)$/.test(l)?l+'es':/[^aeiou]y$/.test(l)?l.slice(0,-1)+'ies':l+'s';return{who:c,whoAcc:l,whoGen:l,whoPl:p.charAt(0).toUpperCase()+p.slice(1),whoPlL:p,known:false};}const cap=x=>x.charAt(0).toLocaleUpperCase('el')+x.slice(1),low=x=>x.charAt(0).toLocaleLowerCase('el')+x.slice(1);
  const K=Object.values(IM_WHO).find(x=>[x.who,x.whoAcc,x.whoPl,x.whoPlL].some(v=>v&&v.toLocaleLowerCase('el')===w.toLocaleLowerCase('el')));
  if(K)return{who:K.who,whoAcc:K.whoAcc,whoGen:K.whoGen,whoPl:K.whoPl,whoPlL:K.whoPlL,known:true};
  const s=low(w);let acc=s,pl=s,gen=null;
  if(/ής$/.test(s)){acc=s.slice(0,-1);pl=s.slice(0,-2)+'ές';}
  else if(/ης$/.test(s)){acc=s.slice(0,-1);pl=s.slice(0,-2)+'ες';}
  else if(/ός$/.test(s)){acc=s.slice(0,-1);pl=s.slice(0,-2)+'οί';gen=s.slice(0,-2)+'ού';}
  else if(/ος$/.test(s)){acc=s.slice(0,-1);pl=s.slice(0,-2)+'οι';gen=s.slice(0,-2)+'ου';}
  else if(/άς$/.test(s)){acc=s.slice(0,-1);pl=s.slice(0,-2)+'άδες';}
  else if(/ας$/.test(s)){acc=s.slice(0,-1);pl=s.slice(0,-2)+'ες';}
  else if(/[αη]$/.test(s)){pl=s.slice(0,-1)+'ες';gen=s+'ς';}
  else if(/[άή]$/.test(s)){pl=s.slice(0,-1)+'ές';gen=s+'ς';}
  return{who:cap(s),whoAcc:acc,whoGen:gen||acc,whoPl:cap(pl),whoPlL:pl,known:false};}
function langDialog(){const md=modal(`<div class="spread" style="margin-bottom:10px"><h3 style="margin:0">🌐 Γλώσσα · Language</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>${langPickHTML()}`,{guard:false});langPickBind(md.el);}
function langPickHTML(){return`<div class="langpick">${LANGS.map(l=>`<button type="button" class="langbtn ${l.k===LANG?'on':''}" data-lang="${l.k}" data-notr><span class="lflag">${l.f}</span><b>${l.n}</b>${l.k===LANG?'<small>✓</small>':''}</button>`).join('')}</div>`;}
function langPickBind(el){$$('[data-lang]',el).forEach(b=>b.onclick=()=>{if(b.dataset.lang!==LANG)setLang(b.dataset.lang);});}
const SETP={
 start(el){const cur=S.data.settings.startView||'last';el.innerHTML=`<div class="card"><p class="small muted" style="margin-top:0">Σε ποια οθόνη ανοίγει η εφαρμογή όταν την ξεκινάς.</p><div class="list">${START_OPTS.map(([k,l,i])=>`<label class="rw"><span class="ricon">${i}</span><span class="grow"><b>${esc(l)}</b>${k==='last'?'<small>Εκεί που την άφησες την τελευταία φορά</small>':''}</span><input type="radio" name="sv" value="${k}" ${cur===k?'checked':''}></label>`).join('')}</div></div>`;
  el.onchange=e=>{if(e.target.name!=='sv')return;S.data.settings.startView=e.target.value;save();toast('Η εφαρμογή θα ανοίγει: '+START_OPTS.find(x=>x[0]===e.target.value)[1],'ok');};},
 lang(el){el.innerHTML=`<div class="card">${langPickHTML()}<p class="small muted" style="margin:12px 0 0">Ισχύει για όλες τις εφαρμογές GlenApps σε αυτό το κινητό. Τα μηνύματα προς τους πελάτες βγαίνουν στη γλώσσα που διαλέγεις· όσα κείμενα έχεις αλλάξει εσύ μένουν όπως τα έγραψες.</p></div>`;langPickBind(el);},
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
   <div style="margin-top:10px;${B.holOff?'opacity:.5;pointer-events:none':''}">${HL.map(h=>`<label class="holrow ${h.date<t?'past':''}"><span class="hd">${WDAYS_S[wdOf(h.date)]} ${fmtShort(h.date)}</span><span class="grow">${esc(h.name)}</span><input type="checkbox" data-hol="${h.id}" ${holOn(h)?'checked':''}></label>`).join('')}</div>
   <button type="button" class="btn sm ghost" id="hl-reset" style="margin-top:10px">↩︎ Επαναφορά στις βασικές αργίες</button></div>`;
  $('#st-hr',el).onclick=agendaCfgDialog;$('#hl-reset',el).onclick=holReset;$('#hl-on',el).onchange=e=>{B.holOff=!e.target.checked;save();render();};$$('[data-hol]',el).forEach(x=>x.onchange=()=>{B.hol=B.hol||{};B.hol[x.dataset.hol]=x.checked;save();});},
 look(el){const base=profLex(),L=S.data.settings.lex||{},cur=themeColor();
  const lx=(k,l)=>`<div class="field"><label class="f" for="lx-${k}">${l}</label><input class="in" id="lx-${k}" data-lx="${k}" value="${esc(L[k]||'')}" placeholder="${esc(base[k]||'')}"></div>`;
  el.innerHTML=`<div class="card section"><h3>Χρώμα εφαρμογής</h3>${THEME_COLORS.map(([n,cs])=>`<div class="small muted" style="margin:10px 0 6px">${n}</div><div class="thgrid">${cs.map(c=>`<button type="button" data-th="${c}" style="background:${c}" class="${cur===c?'on':''}" aria-label="Χρώμα ${c}">${cur===c?ic('check',18):''}</button>`).join('')}</div>`).join('')}
   <div class="field" style="margin-top:16px"><label class="f" for="ci-op">Ένταση χρώματος <span class="tiny muted" id="ci-v">${S.data.settings.colInt!=null?S.data.settings.colInt:100}%</span></label><div class="cirow"><span class="tiny muted">Απαλό</span><input type="range" id="ci-op" min="20" max="100" step="5" value="${S.data.settings.colInt!=null?S.data.settings.colInt:100}"><span class="tiny muted">Ζωντανό</span></div><div class="cisample"><i style="background:${softColor(cur)}"></i><span class="tiny muted">Χαμηλώνεις για να είναι πιο ήπιο, πιο «γκριζαρισμένο».</span></div></div>
   <div class="field" style="margin-top:16px"><label class="f" for="wc-op">Υδατογράφημα στο φόντο <span class="tiny muted" id="wc-v">${S.data.settings.wcOp!=null?S.data.settings.wcOp:60}%</span></label><input type="range" id="wc-op" min="0" max="100" step="5" value="${S.data.settings.wcOp!=null?S.data.settings.wcOp:60}" style="width:100%"><div class="tiny muted">0 = καθαρό φόντο. Τα χρώματα ακολουθούν το χρώμα της εφαρμογής.</div></div>
   <div class="row" style="margin-top:12px;align-items:center"><label class="small" for="th-own">Δικό μου χρώμα</label><input type="color" id="th-own" value="${cur}"><button class="btn sm ghost" id="th-def">Το χρώμα του επαγγέλματος</button></div></div>`;
  $$('[data-th]',el).forEach(b=>b.onclick=()=>{S.data.settings.color=b.dataset.th;save();render();});const ci=$('#ci-op',el);ci.oninput=()=>{S.data.settings.colInt=+ci.value;$('#ci-v',el).textContent=ci.value+'%';applyTheme();const sw=$('.cisample i',el);if(sw)sw.style.background=softColor(themeColor());};ci.onchange=()=>save();const wo=$('#wc-op',el);wo.oninput=()=>{S.data.settings.wcOp=+wo.value;$('#wc-v',el).textContent=wo.value+'%';applyTheme();};wo.onchange=()=>save();$('#th-own',el).onchange=e=>{S.data.settings.color=e.target.value;save();render();};$('#th-def',el).onclick=()=>{delete S.data.settings.color;save();render();};
  },
 msgs(el){el.innerHTML=`<div class="card section"><label class="switch"><span><b>Επιβεβαίωση με μήνυμα μόλις κλείνεις ραντεβού</b><small>Με την «Αποθήκευση» ανοίγει έτοιμο μήνυμα προς τον πελάτη (αν έχει τηλέφωνο). Εσύ πατάς μόνο «Αποστολή».</small></span><input type="checkbox" id="cf-on" ${S.data.settings.confOff?'':'checked'}></label>
   <div class="field" style="margin-top:12px"><label class="f" for="cf-t">Κείμενο επιβεβαίωσης</label><textarea class="in" id="cf-t" style="min-height:80px">${esc(S.data.settings.confTpl||tr(CONF_TPL_DEF))}</textarea><div class="tiny muted" style="margin-top:4px">Λέξεις που αλλάζουν μόνες τους: {όνομα} {ημέρα} {ώρα} {επιχείρηση}</div></div>
   <div class="row"><button class="btn pri" id="cf-s">${ic('check',16)} Αποθήκευση</button><button class="btn ghost" id="cf-d">Αρχικό κείμενο</button></div></div>
   <div class="card section"><h3>Κείμενο ενημέρωσης και συγκατάθεσης</h3><p class="small muted" style="margin-top:0">Αυτό λες ή στέλνεις στον πελάτη πριν τσεκάρεις τις συγκαταθέσεις στην καρτέλα του. Το αλλάζεις και από την καρτέλα του πελάτη. «ΣΤΟΠ» = όχι προσφορές · «ΣΤΟΠ ΟΛΑ» = κανένα μήνυμα.</p>
    <textarea class="in" id="cs-t" style="min-height:120px">${esc(S.data.settings.consTpl||tr(CONS_TXT_DEF))}</textarea><div class="tiny muted" style="margin:4px 0 8px">{επιχείρηση} = η επωνυμία σου</div><div class="note small warnnote" style="margin-bottom:8px">⚠️ ${CONS_RESP}</div>
    <div class="row"><button class="btn pri" id="cs-s">${ic('check',16)} Αποθήκευση</button><button class="btn ghost" id="cs-d">Αρχικό κείμενο</button></div></div>
   <div class="card section"><h3>Μήνυμα προσφοράς</h3><p class="small muted" style="margin-top:0">Πηγαίνει μόνο σε όσους έχουν πει «ναι» στις προσφορές.</p><button class="btn pri" id="of-go">${ic('send',16)} Γράψε μήνυμα προσφοράς</button></div>
   <div class="card"><h3>Υπενθυμίσεις την προηγούμενη μέρα</h3><p class="small muted" style="margin-top:0">Από το «Σήμερα» → «Αύριο» → «Στείλε υπενθυμίσεις», ή από το Ημερολόγιο → ⋯ → «Υπενθυμίσεις».</p></div>`;
  $('#cs-s',el).onclick=()=>{S.data.settings.consTpl=$('#cs-t',el).value.trim()||tr(CONS_TXT_DEF);save();toast('Αποθηκεύτηκε.','ok');};$('#cs-d',el).onclick=()=>{delete S.data.settings.consTpl;save();render();};$('#of-go',el).onclick=()=>offerDialog();
  $('#cf-on',el).onchange=e=>{S.data.settings.confOff=!e.target.checked;save();};$('#cf-s',el).onclick=()=>{S.data.settings.confTpl=$('#cf-t',el).value.trim()||tr(CONF_TPL_DEF);save();toast('Αποθηκεύτηκε.','ok');};$('#cf-d',el).onclick=()=>{delete S.data.settings.confTpl;save();render();};},
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
   <div class="lxeasy"><b>Ο εύκολος τρόπος</b><p class="small" style="margin:4px 0 8px">${T2('Γράψε <b>μία</b> λέξη, όπως λες τον <b>έναν</b> (π.χ. <i>Ιδιοκτήτης</i>), και πάτα «Συμπλήρωσε τα υπόλοιπα». Η εφαρμογή γράφει μόνη της όλες τις μορφές· εσύ απλώς τις κοιτάς.','Type <b>one</b> word for <b>one</b> person (e.g. <i>Owner</i>) and tap “Fill in the rest”. The app writes all the forms for you; you just check them.')}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><input class="in" id="lx-one-word" placeholder="π.χ. Ιδιοκτήτης" style="flex:1 1 160px;min-width:0"><button type="button" class="btn pri" id="lx-guess">✨ Συμπλήρωσε τα υπόλοιπα</button></div></div>
   <p class="small muted" style="margin:12px 0 6px">${T2(`Κάθε κουτάκι είναι η <b>ίδια λέξη</b> σε άλλη φράση, γι' αυτό αλλάζει λίγο η κατάληξη. Πάτα το <b class="lxq-ex">?</b> δίπλα σε κάθε κουτάκι για να δεις ακριβώς τι γράφεις.`,`Each box is the <b>same word</b> in a different phrase. Tap the <b class="lxq-ex">?</b> next to each box to see exactly what to type.`)}</p>
   ${LXF.map(([k,l,ex])=>`<div class="lxrow"><div class="lxlab"><label class="f" for="lx-${k}">${l}</label><button type="button" class="lxq" data-lxq="${k}" aria-label="Τι γράφω εδώ;">?</button></div><input class="in" id="lx-${k}" data-lx="${k}" data-ex="${esc(ex)}" value="${esc(L[k]||'')}" placeholder="${esc(base[k]||'')}"><div class="lxprev"><span class="muted">Θα φαίνεται:</span> <b id="lxp-${k}">${esc(ex.replace('{}',L[k]||LX(k)))}</b></div></div>`).join('')}
   <button class="btn pri" id="st-lx">${ic('check',15)} Αποθήκευση</button></details></div>`;
  $$('[data-who]',el).forEach(b=>b.onclick=()=>{const w=IM_WHO[b.dataset.who];const L=Object.assign({},S.data.settings.lex||{});['who','whoAcc','whoGen','whoPl','whoPlL'].forEach(k=>{if(w[k]===base[k])delete L[k];else L[k]=w[k];});S.data.settings.lex=L;save();toast('Τώρα λέγονται «'+w.whoPl+'».','ok');render();});
  $$('[data-one]',el).forEach(b=>b.onclick=()=>{const L=Object.assign({},S.data.settings.lex||{});if(b.dataset.one===base.one)delete L.one;else L.one=b.dataset.one;S.data.settings.lex=L;save();render();});
  $$('[data-lx]',el).forEach(x=>x.oninput=()=>{const p=$('#lxp-'+x.dataset.lx,el);if(p)p.textContent=x.dataset.ex.replace('{}',x.value.trim()||x.placeholder);});
  $$('[data-lxq]',el).forEach(b=>b.onclick=()=>lxHelp(b.dataset.lxq,el));
  $('#lx-guess',el).onclick=()=>{const w=$('#lx-one-word',el).value.trim();if(!w)return toast('Γράψε πρώτα μία λέξη, π.χ. Ιδιοκτήτης.','bad');const G=lxGuess(w);
    ['who','whoAcc','whoGen','whoPl','whoPlL'].forEach(k=>{const i=$('#lx-'+k,el);i.value=G[k];i.oninput();i.classList.add('lxfilled');});
    toast(G.known?'Έτοιμο. Πάτα «Αποθήκευση».':'Έτοιμο. Κοίτα τα κουτάκια — αν κάποιο δεν «ακούγεται» σωστά, διόρθωσέ το — και πάτα «Αποθήκευση».','ok');$('#lx-who',el).scrollIntoView({behavior:'smooth',block:'center'});};
  const ld=$('#lx-def',el);if(ld)ld.onclick=()=>{S.data.settings.lex={};save();render();};
  $('#st-lx',el).onclick=()=>{const o={};$$('[data-lx]',el).forEach(i=>{const v=i.value.trim();if(v&&v!==base[i.dataset.lx])o[i.dataset.lx]=v;});S.data.settings.lex=o;save();toast('Αποθηκεύτηκε.','ok');render();};},
 backup(el){backupPage(el);},
 pro(el){const st=proState();el.innerHTML=`<div class="card section">${st.pro?`<div class="prook">⭐ <b>Το Pro είναι ενεργό</b> έως <b>${fmtDate(st.until)}</b>${st.full?' · με το κλειδί GlenApps Full':''}<br><span class="small muted">${esc(st.email||'')}</span></div>`:proPriceHTML()}
   ${proFeatHTML()}<p class="small muted" style="margin:6px 0 0"><span>Όλα τα υπόλοιπα του Ημερολογίου μένουν δωρεάν.</span>${st.pro?'':` <span>${st.left?'Δωρεάν δοκιμή: σου μένει 1 αποστολή συνδέσμου.':'Η δωρεάν αποστολή χρησιμοποιήθηκε.'}</span>`} <span>Το κλειδί GlenApps Full (όλες οι εφαρμογές, ένα κλειδί) ξεκλειδώνει και αυτό.</span></p></div>
  <div class="card section"><h3>${st.pro?'Ανανέωση ή άλλο κλειδί':'Έχω κλειδί'}</h3>${proKeyHTML()}</div>`;proKeyBind(el,()=>render());},
 async apps(el){el.innerHTML=`<p class="small muted" style="margin-top:0">Κι άλλες εφαρμογές GlenApps για τη δουλειά και το σπίτι. Πάτα για να ανοίξει.</p><div id="efm-l" class="efm-page"><p class="small muted">Φόρτωση…</p></div>`;
   try{await loadScript('efarmoges-mas.js');const E=window.EfarmogesMas;E.init({app:'imerologio',isPro,lang:()=>window.LANG||'el'});E.page($('#efm-l',el),{skip:['imerologio']});}catch(_){$('#efm-l',el).innerHTML='<p class="small muted">Η λίστα δεν φορτώθηκε. Χρειάζεται σύνδεση στο διαδίκτυο.</p>';}},
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
  try{const fh=await d.getFileHandle('imerologio-'+todayISO()+'.json',{create:true});const out=await backupOut();if(!out)return false;const w=await fh.createWritable();await w.write(out);await w.close();
    const names=[];for await(const[n,h]of d.entries())if(h.kind==='file'&&/^imerologio-\d{4}-\d{2}-\d{2}\.json$/.test(n))names.push(n);names.sort().reverse().slice(30).forEach(n=>d.removeEntry(n).catch(()=>{}));
    S.data.meta.folderLast=Date.now();return true;}catch(e){return false;}}
async function fsList(){const root=await fsRoot(false);if(!root)return[];const d=await fsDir(root);if(!d)return[];const L=[];try{for await(const[n,h]of d.entries())if(h.kind==='file'&&n.endsWith('.json'))L.push([n,h]);}catch(e){}return L.sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10);}
// μέσα στην εφαρμογή (ιδιωτικός χώρος του φυλλομετρητή)
async function opfsDir(){try{const r=await navigator.storage.getDirectory();return await r.getDirectoryHandle('imerologio-antigrafa',{create:true});}catch(e){return null;}}
async function opfsSave(){const d=await opfsDir();if(!d)return false;const out=await backupOut();if(!out)return false;try{const fh=await d.getFileHandle('imerologio-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.json',{create:true});const w=await fh.createWritable();await w.write(out);await w.close();
  const L=[];for await(const[n,h]of d.entries())if(h.kind==='file')L.push(n);L.sort().reverse().slice(BK_KEEP).forEach(n=>d.removeEntry(n).catch(()=>{}));S.data.meta.opfsLast=Date.now();return true;}catch(e){return false;}}
async function opfsList(){const d=await opfsDir();if(!d)return[];const L=[];try{for await(const[n,h]of d.entries())if(h.kind==='file')L.push([n,h]);}catch(e){}return L.sort((a,b)=>b[0].localeCompare(a[0]));}
function backupText(){return JSON.stringify({app:'imerologio',version:APP_VERSION,savedAt:new Date().toISOString(),data:S.data});}
/* ---------- κρυπτογράφηση αντιγράφων με κωδικό (AES-GCM 256, κλειδί από τον κωδικό με PBKDF2-SHA256) ----------
   Το κλειδί (όχι ο κωδικός) φυλάγεται στη συσκευή ως μη εξαγώγιμο, για να γίνονται τα αυτόματα αντίγραφα χωρίς ερώτηση.
   Αν λείπει το κλειδί ενώ η κρυπτογράφηση είναι ανοιχτή, ΔΕΝ γράφεται αντίγραφο σε απλό κείμενο. */
const ENC_V='glen-aes-gcm-1',ENC_ITER=310000;
const encOn=()=>!!(S.data.settings.bkEnc&&S.data.settings.bkEnc.on);
async function encDerive(pass,salt){const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:ENC_ITER},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
const encKeyGet=()=>fsDo('readonly',st=>st.get('imerologio-enckey')),encKeyPut=k=>fsDo('readwrite',st=>st.put(k,'imerologio-enckey')),encKeyDel=()=>fsDo('readwrite',st=>st.delete('imerologio-enckey'));
/* το κείμενο που γράφεται: κρυπτογραφημένο αν είναι ανοιχτή η κρυπτογράφηση· null = δεν πρέπει να γραφτεί τίποτα */
async function backupOut(){const plain=backupText();if(!encOn())return plain;const K=await encKeyGet();if(!K||!K.key||!K.salt)return null;
  const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},K.key,new TextEncoder().encode(plain)));
  return JSON.stringify({app:'imerologio',enc:ENC_V,kdf:{name:'PBKDF2',hash:'SHA-256',iter:ENC_ITER,salt:b64uEnc(K.salt)},iv:b64uEnc(iv),ct:b64uEnc(ct),version:APP_VERSION,savedAt:new Date().toISOString(),count:{people:S.data.students.length,appts:(S.data.appts||[]).length}});}
async function encDecrypt(o,pass){const salt=b64uDec(o.kdf.salt);const key=await encDerive(pass,salt);const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64uDec(o.iv)},key,b64uDec(o.ct));return new TextDecoder().decode(pt);}
function passDlg(title,{twice=false,note=''}={}){return new Promise(res=>{let done=false;const md=modal(`<h3 style="margin-top:0">${title}</h3>${note?`<p class="small muted" style="margin-top:0">${note}</p>`:''}
   <form id="pw"><div class="field"><label class="f" for="pw1">Κωδικός</label><input class="in" id="pw1" type="password" autocomplete="new-password" minlength="${twice?8:1}" required></div>
   ${twice?`<div class="field"><label class="f" for="pw2">Ξανά ο κωδικός</label><input class="in" id="pw2" type="password" autocomplete="new-password" required></div>`:''}
   <label class="check small"><input type="checkbox" id="pws"> Εμφάνιση κωδικού</label>
   <div class="row" style="justify-content:flex-end;margin-top:10px"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Εντάξει</button></div></form>`,{guard:false,onClose:()=>{if(!done)res(null);}});
  setTimeout(()=>$('#pw1',md.el).focus(),60);$('#pws',md.el).onchange=e=>$$('input[type=password],input.pwv',md.el).forEach(i=>{i.type=e.target.checked?'text':'password';i.classList.add('pwv');});
  $('#pw',md.el).onsubmit=e=>{e.preventDefault();const a=$('#pw1',md.el).value;if(twice){if(a.length<8)return toast('Τουλάχιστον 8 χαρακτήρες.','bad');if(a!==$('#pw2',md.el).value)return toast('Οι δύο κωδικοί δεν είναι ίδιοι.','bad');}done=true;md.close();res(a);};});}
async function encSetup(){const p=await passDlg('🔐 Κωδικός για τα αντίγραφα',{twice:true,note:'Με αυτόν κλειδώνουν τα αντίγραφα (φάκελος, σύννεφο, κοινοποίηση, μέσα στην εφαρμογή). <b>Αν τον ξεχάσεις, τα αντίγραφα δεν ανοίγουν με κανέναν τρόπο</b> — γράψ\' τον κάπου ασφαλές. Τουλάχιστον 8 χαρακτήρες.'});if(!p)return false;
  const salt=crypto.getRandomValues(new Uint8Array(16));const key=await encDerive(p,salt);await encKeyPut({key,salt});
  S.data.settings.bkEnc={on:true,since:new Date().toISOString()};save();await opfsSave();toast('Τα αντίγραφα κρυπτογραφούνται πλέον με τον κωδικό σου.','ok');return true;}
async function encOff(){if(!await confirmDlg('Να σταματήσει η κρυπτογράφηση; Τα επόμενα αντίγραφα θα είναι απλό κείμενο και όποιος τα βρει θα τα διαβάζει.',{ok:'Σταμάτησε',danger:true}))return;
  await encKeyDel();S.data.settings.bkEnc={on:false};save();toast('Η κρυπτογράφηση σταμάτησε.');render();}
async function encNeedKey(){if(!encOn())return true;const K=await encKeyGet();if(K&&K.key)return true;
  toast('Λείπει το κλειδί των αντιγράφων σε αυτή τη συσκευή — όρισε ξανά τον κωδικό.','bad');return encSetup();}
const bkName=()=>'imerologio-'+todayISO()+'.json';
function bkWays(){return Object.assign({folder:false,cloud:false},S.data.settings.bkWays||{});}
function markBacked(){S.data.meta.lastBackup=Date.now();S.data.meta.changes=0;try{localStorage.setItem(STORE,JSON.stringify(S.data));}catch(e){}}
function bkStatusShort(){const m=S.data.meta;return m.lastBackup?'Τελευταίο: '+fmtShort(isoDate(new Date(m.lastBackup)))+(m.changes?' · '+m.changes+' αλλαγές από τότε':''):'Δεν έχει κρατηθεί ακόμα';}
async function cloudShare(){if(!await encNeedKey())return false;const out=await backupOut();if(!out)return false;const f=new File([out],bkName(),{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'Αντίγραφο Ημερολογίου'});S.data.meta.cloudLast=Date.now();markBacked();toast('Έτοιμο. Αν διάλεξες το σύννεφο, το αρχείο ανέβηκε εκεί.','ok');return true;}catch(e){if(e&&e.name==='AbortError'){toast('Ακυρώθηκε· δεν ανέβηκε τίποτα.');return false;}}}
  downloadText(bkName(),out,'application/json');markBacked();toast('Το αρχείο κατέβηκε στις λήψεις. Ανέβασέ το στο σύννεφό σου.','ok');return true;}
async function backupAllNow(){if(!await encNeedKey())return;const W=bkWays(),ok=[],no=[];await opfsSave();ok.push('μέσα στην εφαρμογή');
  if(W.folder){(await fsSave(await fsRoot(true)))?ok.push('φάκελος'):no.push('φάκελος');}
  if(W.cloud){(await cloudShare())?ok.push('σύννεφο'):no.push('σύννεφο');}
  markBacked();toast('✓ Αντίγραφο σε: '+ok.join(', ')+'.'+(no.length?' Δεν έγινε σε: '+no.join(', ')+'.':'')+(!W.folder&&!W.cloud?' Διάλεξε και έναν τρόπο έξω από την εφαρμογή.':''),no.length?'bad':'ok');render();}
// αυτόματο: μία φορά τη μέρα μέσα στην εφαρμογή και στον φάκελο (αν έχει ήδη άδεια)
async function autoBackup(){const m=S.data.meta;if(!S.data.students.length&&!(S.data.appts||[]).length)return;const day=24*36e5;
  if(Date.now()-(m.opfsLast||0)>day)await opfsSave();if(bkWays().folder&&Date.now()-(m.folderLast||0)>day)await fsSave();try{localStorage.setItem(STORE,JSON.stringify(S.data));}catch(e){}}
async function backupPage(el){const W=bkWays(),m=S.data.meta;const root=fsOK()?await fsGet():null;const ago=t=>t?fmtShort(isoDate(new Date(t))):'ποτέ';
  el.innerHTML=`<div class="card section bkhead"><p class="small" style="margin:0 0 10px">${m.lastBackup?'Τελευταίο αντίγραφο: <b>'+fmtDate(new Date(m.lastBackup).toISOString())+'</b>.':'<b>Δεν έχει κρατηθεί ακόμα αντίγραφο.</b>'} Αλλαγές από τότε: ${m.changes||0}.</p>
   <button class="btn pri wide" id="bk-all">🛟 Κράτα αντίγραφο τώρα</button>
   <p class="tiny muted" style="margin:8px 0 0">Μέσα στην εφαρμογή κρατιέται πάντα αντίγραφο μόνο του. Για ασφάλεια διάλεξε και έναν τρόπο έξω από αυτήν.</p></div>
  <div class="card section encard ${encOn()?'on':''}"><div class="spread"><b>🔐 Κρυπτογράφηση αντιγράφων</b><span class="small ${encOn()?'':'muted'}">${encOn()?'✓ Ενεργή':'Ανενεργή'}</span></div>
   <p class="small" style="margin:6px 0 10px">${encOn()?'Όλα τα αντίγραφα (φάκελος, σύννεφο, αρχείο, μέσα στην εφαρμογή) κλειδώνουν με τον κωδικό σου. Χωρίς αυτόν δεν ανοίγουν.':`Τα αντίγραφα έχουν ονόματα, τηλέφωνα${isHealthProf()?' ασθενών':''} και ραντεβού. Με κωδικό, όποιος βρει το αρχείο δεν μπορεί να το διαβάσει.${isHealthProf()?' <b>Για επάγγελμα υγείας το συνιστούμε έντονα.</b>':''}`}</p>
   ${encOn()?`<div class="row"><button class="btn" id="enc-ch">🔑 Αλλαγή κωδικού</button><button class="btn ghost" id="enc-off">Σταμάτημα</button></div><p class="tiny muted" style="margin:8px 0 0">Τα παλιότερα αντίγραφα ανοίγουν με τον κωδικό που είχαν όταν φτιάχτηκαν.</p>`:`<button class="btn pri" id="enc-on">🔐 Όρισε κωδικό</button>`}</div>
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
  $('#bk-share',el).onclick=cloudShare;$('#bk-dl',el).onclick=async()=>{if(!await encNeedKey())return;const out=await backupOut();if(!out)return;downloadText(bkName(),out,'application/json');markBacked();toast('Το αρχείο αποθηκεύτηκε στις λήψεις.','ok');};
  if(encOn())encKeyGet().then(K=>{if(K&&K.key)return;const c=$('.encard',el);if(c)c.insertAdjacentHTML('beforeend',`<div class="note small" style="margin-top:10px">⚠️ <b>Σε αυτή τη συσκευή λείπει το κλειδί των αντιγράφων</b>, οπότε δεν κρατιούνται αντίγραφα. Πάτα «Αλλαγή κωδικού» και γράψε κωδικό.</div>`);});
  {const eo=$('#enc-on',el);if(eo)eo.onclick=async()=>{if(await encSetup())render();};const ec=$('#enc-ch',el);if(ec)ec.onclick=async()=>{if(await encSetup())render();};const ex=$('#enc-off',el);if(ex)ex.onclick=encOff;}
  $('#bk-file',el).onchange=e=>{const f=e.target.files[0];if(f)f.text().then(restoreFrom).catch(()=>toast('Δεν διαβάστηκε το αρχείο.','bad'));e.target.value='';};
  $$('[data-way]',el).forEach(x=>x.onchange=async()=>{const w=bkWays();w[x.dataset.way]=x.checked;S.data.settings.bkWays=w;save();if(x.dataset.way==='folder'&&x.checked&&!await fsGet())fsChoose();});
  const fp=$('#fs-pick',el);if(fp)fp.onclick=async()=>{const w=bkWays();w.folder=true;S.data.settings.bkWays=w;save();fsChoose();};
  const fx=$('#fs-x',el);if(fx)fx.onclick=async()=>{await fsDel();const w=bkWays();w.folder=false;S.data.settings.bkWays=w;save();toast('Ο φάκελος αποσυνδέθηκε. Τα αρχεία του δεν σβήστηκαν.');render();};
  if(fsOK()&&root){const FL=await fsList();const box=$('#fs-list',el);if(box){box.innerHTML=fileRows(FL,'data-fsr');box.onclick=async e=>{const b=e.target.closest('[data-fsr]');if(b)restoreFrom(await(await FL[+b.dataset.fsr][1].getFile()).text());};}}
  const OL=await opfsList();const ob=$('#op-list',el);if(ob){ob.innerHTML=fileRows(OL,'data-opr');ob.onclick=async e=>{const b=e.target.closest('[data-opr]');if(b)restoreFrom(await(await OL[+b.dataset.opr][1].getFile()).text());};}}
async function restoreFrom(txt){let o=null;try{const t=String(txt||'');o=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));}catch(e){}
  if(o&&o.enc===ENC_V){for(let tries=0;tries<3;tries++){const p=await passDlg('🔐 Κρυπτογραφημένο αντίγραφο',{note:`Γράψε τον κωδικό των αντιγράφων.${o.count?` Έχει ${o.count.people} πρόσωπα και ${o.count.appts} ραντεβού.`:''}`});if(p==null)return;
      try{o=JSON.parse(await encDecrypt(o,p));break;}catch(e){toast('Λάθος κωδικός.','bad');if(tries===2)return;}}}
  const d=o&&o.app==='imerologio'&&o.data;
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
  let reloaded=false,hadCtl=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadCtl){hadCtl=true;return;}if(reloaded)return;reloaded=true;location.reload();});}
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

/* ---------- κράτημα ωρών «για δικούς μου πελάτες» ----------
   Δέσμευση με hold:true: για σένα η ώρα μένει ελεύθερη (κλείνεις κανονικά), αλλά ΔΕΝ φαίνεται
   στον σύνδεσμο κρατήσεων ούτε στον κωδικό QR. Στο ημερολόγιο: «🔒 Κράτημα ωρών» και πατάς πάνω στις ώρες. */
window.HOLD_MODE=(()=>{try{return sessionStorage.getItem('im-hold')==='1';}catch(_){return false;}})();
function holdSet(on){window.HOLD_MODE=on;try{sessionStorage.setItem('im-hold',on?'1':'');}catch(_){}render();
  if(on)toast('🔒 Πάτα πάνω στις κενές ώρες για να τις κρατήσεις για τους δικούς σου '+LX('whoPlL')+'. Ξαναπάτα για να τις ελευθερώσεις.','ok');}
document.addEventListener('click',e=>{if(e.target.closest('#agHold')){e.preventDefault();holdSet(!window.HOLD_MODE);}});
const holdAt=(date,s,e,by)=>blockOcc(date,date,{by:by||'me'}).some(o=>o.blk.hold&&tmin(o.s)<tmin(e)&&tmin(s)<tmin(o.e));
function holdToggle(date,s,by){const pv=by||'me';const L=blocks();const m=tmin(s),step=30;
  const same=b=>b.hold&&b.kind==='once'&&b.date===date&&(b.by||'me')===pv;
  const hit=L.find(b=>same(b)&&tmin(b.s)<=m&&m<tmin(b.e));
  if(hit){// ελευθέρωση μόνο αυτού του μισάωρου (σπάει σε δύο αν χρειαστεί)
    const a=tmin(hit.s),z=tmin(hit.e);if(z-a<=step)S.data.blocks=L.filter(b=>b!==hit);
    else if(m<=a)hit.s=tstr(m+step);else if(m+step>=z)hit.e=tstr(m);
    else{L.push(Object.assign({},hit,{id:uid(),s:tstr(m+step)}));hit.e=tstr(m);}
    save();render();return;}
  if(occ(date,date,{by:pv}).some(o=>tmin(o.s)<m+step&&m<tmin(o.e)))return toast('Εκεί υπάρχει ήδη ραντεβού.','bad');
  let b=L.find(x=>same(x)&&tmin(x.e)===m);const nx=L.find(x=>same(x)&&tmin(x.s)===m+step);
  if(b){b.e=tstr(m+step);if(nx){b.e=nx.e;S.data.blocks=L.filter(x=>x!==nx);}}
  else if(nx)nx.s=s;
  else L.push({id:uid(),kind:'once',date,s,e:tstr(m+step),by:pv==='me'?undefined:pv,hold:true,cat:'hold',ex:{},created:new Date().toISOString()});
  save();render();}
window.holdToggle=holdToggle;
window.IM_BLKTAP=key=>{const[id,date]=key.split('|');const b=blocks().find(x=>x.id===id);if(!b||!b.hold)return false;
  if(window.HOLD_MODE){if(b.kind==='once')S.data.blocks=blocks().filter(x=>x!==b);else{b.ex=b.ex||{};b.ex[date]='skip';}save();render();return true;}
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">🔒 Κρατημένη ώρα</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small" style="margin-top:0"><b>${WDAYS[wdOf(date)]} ${fmtShort(date)} · ${b.s}–${b.e}</b>${b.by?' · '+esc(provById(b.by).short):''}<br><span class="muted">Για τους δικούς σου ${esc(LX('whoPlL'))}: δεν φαίνεται στον σύνδεσμο κρατήσεων, εσύ κλείνεις κανονικά.</span></p>
   <div class="actgrid"><button class="btn pri" data-h="new">${ic('plus',16)}<span>Κλείσε ραντεβού εδώ</span></button>
    <button class="btn" data-h="free">${ic('x',16)}<span>${b.kind==='once'?'Ελευθέρωσέ την':'Ελευθέρωσέ την μόνο '+fmtShort(date)}</span></button>
    ${b.kind==='once'?`<button class="btn" data-h="week">${ic('calendar',16)}<span>Κάθε ${WDAYS[wdOf(date)]}</span></button>`:`<button class="btn" data-h="stop">${ic('l-flag',16)}<span>Τέλος (κάθε εβδομάδα)</span></button>`}
    <button class="btn" data-h="edit">${ic('edit',16)}<span>Αλλαγή ωρών</span></button></div>`,{guard:false});
  md.el.addEventListener('click',e=>{const k=(e.target.closest('[data-h]')||{}).dataset;if(!k||!k.h)return;md.close();
    if(k.h==='new')return apptDialog({date,s:b.s,e:b.e,by:b.by});
    if(k.h==='free'){if(b.kind==='once')S.data.blocks=blocks().filter(x=>x!==b);else{b.ex=b.ex||{};b.ex[date]='skip';}}
    if(k.h==='week'){Object.assign(b,{kind:'weekly',days:[wdOf(date)]});toast('Κρατιέται κάθε '+WDAYS[wdOf(date)]+'.','ok');}
    if(k.h==='stop')S.data.blocks=blocks().filter(x=>x!==b);
    if(k.h==='edit')return blockDialog({b});
    save();render();});return true;};

/* ---------- προσωπικό στο ημερολόγιο: ένα κουμπί «Όλοι ▾» που ανοίγει λίστα ---------- */
document.addEventListener('click',async e=>{if(!e.target.closest('#agPvDd'))return;const PV=providers();let cur='_all';try{cur=localStorage.getItem('imer-agstaff')||'_all';}catch(_){}
  const r=await richPick({title:'Ποιου το πρόγραμμα',sel:[cur],items:[{id:'_all',label:'Όλοι',sub:PV.length+' άτομα',ini:'👥',color:'#8A8F98'}].concat(PV.map(p=>({id:p.id,label:p.id==='me'?(S.data.settings.myName||'Εγώ')+' (εγώ)':p.name,color:p.color,ini:provIni(p),sub:esc(roleName(p.role,p.custom))})))});
  if(!r||!r[0])return;try{localStorage.setItem('imer-agstaff',r[0]==='_all'?'':r[0]);}catch(_){}render();});
/* ---------- ποσό ανά ραντεβού ---------- */
const occPrice=o=>{const x=((o.a.ex||{})[o.date])||{};return x.pr!=null?+x.pr:o.a.price!=null?+o.a.price:null;};
window.IM_LASTPRICE=sid=>{const L=appts().filter(a=>a.sid===sid&&a.price!=null).sort((x,y)=>(y.created||'').localeCompare(x.created||''));return L.length?L[0].price:null;};
/* ποιος αναλαμβάνει αυτό το ραντεβού (μέσα στο φύλλο του ραντεβού) */
const occBy=(a,date)=>(((a.ex||{})[date])||{}).by||provOf(a);
function pvRowHTML(a,date){const PV=providers();const p=provById(occBy(a,date));
  if(PV.length<2)return`<a class="pvrow2" href="#/settings/staff" data-close><span>👤 Ποιος: <b>${esc(p.id==='me'?(S.data.settings.myName||'Εγώ'):p.name)}</b></span><small>+ Πρόσθεσε προσωπικό</small></a>`;
  return`<button type="button" class="pvrow2" id="ap-pv"><i class="pvb" style="background:${p.color}">${provIni(p)}</i><span>Ποιος το αναλαμβάνει: <b>${esc(p.id==='me'?(S.data.settings.myName||'Εγώ')+' (εγώ)':p.name)}</b></span>${ic('down',16)}</button>`;}
async function pvPickFor(a,date,el){const PV=providers();const cur=occBy(a,date);const ex0=((a.ex||{})[date])||{};const s=ex0.s||a.s,e=ex0.e||a.e;
  const r=await richPick({title:'Ποιος το αναλαμβάνει',sel:[cur],hint:`${WDAYS[wdOf(date)]} ${fmtShort(date)} · ${s}–${e}`,
    items:PV.map(p=>{const X=occ(date,date,{by:p.id}).filter(x=>x.a.id!==a.id&&tmin(x.s)<tmin(e)&&tmin(s)<tmin(x.e));const B=blockOcc(date,date,{by:p.id}).filter(x=>!x.blk.hold&&tmin(x.s)<tmin(e)&&tmin(s)<tmin(x.e));
      return{id:p.id,label:p.id==='me'?(S.data.settings.myName||'Εγώ')+' (εγώ)':p.name,color:p.color,ini:provIni(p),sub:esc(roleName(p.role,p.custom)),badge:X.length?`<span class="chip bad">έχει ραντεβού ${X.map(x=>x.s).join(', ')}</span>`:B.length?`<span class="chip bad">${esc(blkTitle(B[0].blk))}</span>`:'<span class="chip ok">ελεύθερος</span>'};})});
  if(!r||!r[0]||r[0]===cur)return;const nb=r[0]==='me'?undefined:r[0];
  if(a.kind==='once'){a.by=nb;if(a.ex&&a.ex[date]){delete a.ex[date].by;if(!Object.keys(a.ex[date]).length)delete a.ex[date];}}
  else{a.ex=a.ex||{};const c=Object.assign({},a.ex[date]||{});if((nb||'me')===provOf(a))delete c.by;else c.by=r[0];if(Object.keys(c).length)a.ex[date]=c;else delete a.ex[date];}
  save();const p=provById(r[0]);const md=el.closest('.ov')||el.parentElement;try{(topModal()||{}).close&&topModal().close(true);}catch(_){}
  render();setTimeout(()=>{apptSheet(a.id+'|'+date);toast('Το αναλαμβάνει '+(p.id==='me'?'εσύ':p.short)+(a.kind!=='once'?' (μόνο '+fmtShort(date)+')':'')+'.','ok');},60);}
function bindPv(a,date,el){const b=$('#ap-pv',el);if(b)b.onclick=()=>pvPickFor(a,date,el);}
window.IM_PRICEROW=(a,date,o)=>pvRowHTML(a,date)+priceRowHTML(a,date);
const priceRowHTML=(a,date)=>{const x=((a.ex||{})[date])||{};const v=x.pr!=null?x.pr:a.price!=null?a.price:'';
  return`<label class="prrow"><span>💶 Ποσό${a.kind!=='once'?' αυτή τη φορά':''}</span><input class="in" id="ap-pr" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(v)}" placeholder="—"><b>€</b></label>`;};
window.IM_PRICEBIND=(el,a,date)=>{bindPv(a,date,el);const pe=$('#ap-pr',el);if(!pe)return;pe.onchange=()=>{const v=pe.value.trim();const n=v===''?null:+v;if(v!==''&&(isNaN(n)||n<0))return;
  a.ex=a.ex||{};const cur=Object.assign({},a.ex[date]||{});
  if(a.kind==='once'){if(n==null)delete a.price;else a.price=n;delete cur.pr;}else{if(n==null||n===a.price)delete cur.pr;else cur.pr=n;}
  if(Object.keys(cur).length)a.ex[date]=cur;else delete a.ex[date];save();toast('Το ποσό αποθηκεύτηκε.','ok');};};

/* ---------- στατιστικά (Pro) ---------- */
let STP=(()=>{try{return sessionStorage.getItem('im-stp')||'90';}catch(_){return'90';}})(),STSORT='rev';
function statsCalc(per){const t=todayISO();const from=per==='all'?((appts().map(a=>a.date).sort()[0])||t):per==='year'?t.slice(0,4)+'-01-01':addDays(t,-(+per)+1);
  const first0=(appts().map(a=>a.date).sort()[0])||t;const ALL=occ(first0<from?first0:from,t,{withCancel:true,by:''});
  const visit=o=>o.st==='done'||(o.st===''&&o.date<t);
  const firstV={},cnt={},rev={},last={},dates={};
  for(const o of ALL){if(!visit(o))continue;const s=o.a.sid;if(!firstV[s]||o.date<firstV[s])firstV[s]=o.date;(dates[s]=dates[s]||[]).push(o.date);}
  const P=ALL.filter(o=>o.date>=from);const V=P.filter(visit);
  const R={from,to:t,visits:V.length,cancel:P.filter(o=>o.st==='cancel').length,absent:P.filter(o=>o.st==='absent').length,rev:0,priced:0,clients:new Set(),newC:new Set(),online:0,byPv:{},heat:[...Array(7)].map(()=>[...Array(24)].fill(0)),mon:{}};
  for(const o of V){const s=o.a.sid,p=occPrice(o);R.clients.add(s);if(firstV[s]>=from)R.newC.add(s);cnt[s]=(cnt[s]||0)+1;if(p!=null){R.rev+=p;R.priced++;rev[s]=(rev[s]||0)+p;}
    if(!last[s]||o.date>last[s])last[s]=o.date;const pv=provOcc(o)||'me';const B=(R.byPv[pv]=R.byPv[pv]||{v:0,rev:0,min:0});B.v++;B.rev+=p||0;B.min+=tmin(o.e)-tmin(o.s);
    R.heat[wdOf(o.date)][+o.s.slice(0,2)]++;}
  R.online=appts().filter(a=>a.src==='link'&&(a.created||'').slice(0,10)>=from).length;
  // επιστροφή: νέοι της περιόδου που ήρθαν και 2η φορά (οποτεδήποτε μετά)
  R.ret=[...R.newC].filter(s=>(dates[s]||[]).length>1).length;
  // πληρότητα: λεπτά ραντεβού / διαθέσιμα λεπτά εργασίας (ανά άτομο)
  const c=agCfg();let avail=0;const PV=providers();for(let d=from;d<t;d=addDays(d,1)){if(!workDay(d)||isClosed(d))continue;let m=0;for(let x=tmin(c.from);x+15<=tmin(c.to);x+=15)if(inWork(x,15))m+=15;avail+=m*PV.length;}
  const used=Object.values(R.byPv).reduce((a,b)=>a+b.min,0);R.util=avail?Math.min(100,Math.round(used/avail*100)):null;R.availPer=avail/PV.length;
  // ανά μήνα (τελευταίοι 12)
  const M12=occ(addDays(t.slice(0,7)+'-01',-335).slice(0,7)+'-01',t,{withCancel:true,by:''}).filter(visit);
  for(const o of M12){const k=o.date.slice(0,7);const X=(R.mon[k]=R.mon[k]||{v:0,rev:0});X.v++;X.rev+=occPrice(o)||0;}
  // πελάτες
  R.list=Object.keys(cnt).map(s=>{const L=(dates[s]||[]).slice().sort();let gap=null;if(L.length>1)gap=Math.round((new Date(L[L.length-1])-new Date(L[0]))/864e5/(L.length-1));
    return{s,p:stOf(s),v:cnt[s],rev:rev[s]||0,avg:rev[s]?rev[s]/cnt[s]:0,last:last[s],gap,all:L.length};}).filter(x=>x.p);
  // σε κίνδυνο: ήρθαν 2+ φορές, έχουν περάσει > 1,5× το συνηθισμένο τους διάστημα και δεν έχουν επόμενο ραντεβού
  const fut=new Set(occ(t,addDays(t,180),{by:''}).map(o=>o.a.sid));
  R.risk=Object.keys(dates).map(s=>{const L=dates[s].slice().sort();if(L.length<2)return null;const gap=(new Date(L[L.length-1])-new Date(L[0]))/864e5/(L.length-1);const since=Math.round((new Date(t)-new Date(L[L.length-1]))/864e5);
    return gap>=3&&since>gap*1.5&&!fut.has(s)&&stOf(s)?{s,p:stOf(s),since,gap:Math.round(gap),tot:L.reduce((a,d)=>a,0)}:null;}).filter(Boolean).sort((a,b)=>b.since/b.gap-a.since/a.gap);
  return R;}
const eur=n=>(Math.round(n*100)/100).toLocaleString(window.LANG==='en'?'en-GB':'el-GR',{maximumFractionDigits:n%1?2:0})+' €';
function viewStats(){const fb=$('#fab');if(fb)fb.remove();const pro=isPro()||S.data.settings.demo;const R=statsCalc(STP);const PV=providers();const t=todayISO();
  const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';const sched=R.visits+R.cancel+R.absent;
  const kpi=(k,v,s,cls)=>`<div class="kpi ${cls||''}"><div class="k">${k}</div><div class="v sm">${v}</div>${s?`<div class="tiny muted">${s}</div>`:''}</div>`;
  const months=[];{let d=t.slice(0,7)+'-01';for(let i=0;i<12;i++){months.unshift(d.slice(0,7));d=addDays(d,-1).slice(0,7)+'-01';}}
  const hasRev=R.priced>0;const mx=Math.max(1,...months.map(m=>hasRev?(R.mon[m]||{}).rev||0:(R.mon[m]||{}).v||0));
  const bars=months.map(m=>{const X=R.mon[m]||{v:0,rev:0};const val=hasRev?X.rev:X.v;return`<div class="sbar" title="${MONTHS[+m.slice(5)-1]} ${m.slice(0,4)}: ${X.v} επισκέψεις${hasRev?' · '+eur(X.rev):''}"><span class="sbv">${val?(hasRev?Math.round(val):val):''}</span><i style="height:${Math.round(val/mx*100)}%"></i><small>${MONTHS[+m.slice(5)-1].slice(0,3)}</small></div>`;}).join('');
  const hm=Math.max(1,...R.heat.flat());const c=agCfg();const h0=Math.floor(tmin(c.from)/60),h1=Math.ceil(tmin(c.to)/60);const hrs=[];for(let h=h0;h<h1;h++)hrs.push(h);
  const heat=`<div class="heat" style="grid-template-columns:auto repeat(${hrs.length},minmax(0,1fr))"><span></span>${hrs.map(h=>`<small>${h}</small>`).join('')}${DAY_ORDER.map(d=>`<small>${WDAYS_S[d]}</small>${hrs.map(h=>{const n=R.heat[d][h];return`<i style="opacity:${n?.15+.85*n/hm:.06}" title="${WDAYS[d]} ${h}:00 · ${n}"></i>`;}).join('')}`).join('')}</div>`;
  const dayTot=DAY_ORDER.map(d=>[d,R.heat[d].reduce((a,b)=>a+b,0)]).filter(x=>agCfg().days.includes(x[0]));const best=dayTot.slice().sort((a,b)=>b[1]-a[1]);
  const L=R.list.slice().sort((a,b)=>STSORT==='v'?b.v-a.v||b.rev-a.rev:STSORT==='last'?(b.last||'').localeCompare(a.last||''):b.rev-a.rev||b.v-a.v);
  const per=[['30','30 μέρες'],['90','3 μήνες'],['365','12 μήνες'],['year','Φέτος'],['all','Από την αρχή']];
  M().innerHTML=`${pageHead('📊 Στατιστικά',fmtShort(R.from)+' – '+fmtShort(R.to),`<button class="btn" id="st-csv">${ic('download',16)} Excel</button>`)}
  <div class="seg field segwrap" id="st-per">${per.map(([k,l])=>`<button type="button" data-per="${k}" class="${STP===k?'on':''}">${l}</button>`).join('')}</div>
  <div class="statwrap ${pro?'':'locked'}">
  <div class="kpis section">${kpi('Επισκέψεις',R.visits,R.clients.size+' '+LX('whoPlL'))}${kpi('Έσοδα',hasRev?eur(R.rev):'—',hasRev?(R.priced<R.visits?'από '+R.priced+' με ποσό':''):'γράψε ποσό στα ραντεβού')}${kpi('Μέση απόδειξη',hasRev?eur(R.rev/R.priced):'—','ανά επίσκεψη')}${kpi('Νέοι '+LX('whoPlL'),R.newC.size,R.newC.size?'ξαναήρθαν '+pct(R.ret,R.newC.size):'')}
   ${kpi('Πληρότητα',R.util==null?'—':R.util+'%','χρόνος με ραντεβού / ωράριο')}${kpi('Ακυρώσεις',pct(R.cancel,sched),R.cancel+' φορές')}${kpi('Δεν ήρθαν',pct(R.absent,sched),R.absent+' φορές','')}${kpi('Από τον σύνδεσμο',R.online,'κρατήσεις μόνοι τους')}</div>
  <div class="card section"><div class="card-h"><h3>${hasRev?'Έσοδα':'Επισκέψεις'} ανά μήνα</h3><span class="tiny muted">τελευταίοι 12 μήνες</span></div><div class="sbars">${bars}</div></div>
  <div class="grid g2" style="align-items:start">
   <div class="card section"><div class="card-h"><h3>Πότε έρχονται</h3></div>${heat}<p class="small" style="margin:10px 0 0">${best.length&&best[0][1]?`<span>Πιο γεμάτη μέρα: ${WDAYS[best[0][0]]}</span> · <span>πιο άδεια: ${WDAYS[best[best.length-1][0]]}</span>`:'Δεν υπάρχουν ακόμα επισκέψεις.'}</p></div>
   <div class="card section"><div class="card-h"><h3>⚠️ Έχουν καιρό να έρθουν</h3><span class="tiny muted">${R.risk.length}</span></div>${R.risk.length?`<div class="slist">${R.risk.slice(0,12).map(x=>`<a class="srow" href="#/person/${x.s}"><span class="grow"><b>${esc(stuName(x.p))}</b><small>συνήθως κάθε ${x.gap} μέρες · τώρα ${x.since}</small></span>${ic('right',16)}</a>`).join('')}</div><p class="tiny muted" style="margin:8px 0 0">Στείλε τους ένα μήνυμα ή τον σύνδεσμο κρατήσεων από την καρτέλα τους.</p>`:'<p class="small muted" style="margin:0">Κανείς — όλοι έρχονται στην ώρα τους. 👌</p>'}</div></div>
  ${PV.length>1?`<div class="card section"><div class="card-h"><h3>Ανά άτομο</h3></div><div class="tblw"><table class="stbl"><tr><th></th><th>Επισκέψεις</th>${hasRev?'<th>Έσοδα</th>':''}<th>Πληρότητα</th></tr>${PV.map(p=>{const B=R.byPv[p.id]||{v:0,rev:0,min:0};return`<tr><td><i class="pvb" style="background:${p.color}">${provIni(p)}</i> ${esc(p.short)}</td><td>${B.v}</td>${hasRev?`<td>${eur(B.rev)}</td>`:''}<td>${R.availPer?Math.min(100,Math.round(B.min/R.availPer*100))+'%':'—'}</td></tr>`;}).join('')}</table></div></div>`:''}
  <div class="card section"><div class="card-h" style="flex-wrap:wrap;gap:8px"><h3>${esc(LX('whoPl'))}</h3><div class="seg segwrap" id="st-sort"><button type="button" data-ss="rev" class="${STSORT==='rev'?'on':''}">Έσοδα</button><button type="button" data-ss="v" class="${STSORT==='v'?'on':''}">Επισκέψεις</button><button type="button" data-ss="last" class="${STSORT==='last'?'on':''}">Πρόσφατοι</button></div></div>
   ${L.length?`<div class="tblw"><table class="stbl"><tr><th>#</th><th></th><th>Επισκ.</th>${hasRev?'<th>Έσοδα</th><th>Μέση</th>':''}<th>Τελευταία</th><th>Κάθε</th></tr>${L.slice(0,50).map((x,i)=>`<tr data-go="${x.s}"><td class="muted">${i+1}</td><td><b>${esc(stuName(x.p))}</b></td><td>${x.v}</td>${hasRev?`<td>${x.rev?eur(x.rev):'—'}</td><td>${x.avg?eur(x.avg):'—'}</td>`:''}<td>${fmtShort(x.last)}</td><td>${x.gap?x.gap+' μ.':'—'}</td></tr>`).join('')}</table></div>${L.length>50?`<p class="tiny muted">και ${L.length-50} ακόμα — όλοι στο Excel.</p>`:''}`:'<p class="small muted" style="margin:0">Δεν υπάρχουν επισκέψεις σε αυτό το διάστημα.</p>'}
   ${hasRev?'':`<div class="note small" style="margin-top:10px">💶 Για έσοδα ανά ${esc(LX('who')).toLowerCase()}: γράψε <b>Ποσό</b> όταν κλείνεις ραντεβού, ή πάτα ένα ραντεβού που έγινε και γράψε πόσο πλήρωσε.</div>`}</div>
  </div>${pro?'':`<div class="statlock"><div class="card"><h3 style="margin-top:0">⭐ Τα στατιστικά είναι μέρος του Pro</h3><p class="small">Δες ποιοι ${esc(LX('whoPlL'))} φέρνουν τα περισσότερα έσοδα, πόσο συχνά έρχεται ο καθένας, ποιοι έχουν καιρό να έρθουν, ποιες μέρες και ώρες γεμίζεις και πόσο γεμάτο είναι το πρόγραμμά σου.</p><button class="btn pri" id="st-pro">⭐ Δες το Pro</button></div></div>`}`;
  $$('[data-per]').forEach(b=>b.onclick=()=>{STP=b.dataset.per;try{sessionStorage.setItem('im-stp',STP);}catch(_){}render();});
  $$('[data-ss]').forEach(b=>b.onclick=()=>{STSORT=b.dataset.ss;render();});
  $$('tr[data-go]').forEach(r=>r.onclick=()=>go('person/'+r.dataset.go));
  const sp=$('#st-pro');if(sp)sp.onclick=()=>proSheet('st');
  $('#st-csv').onclick=()=>{if(!pro)return proSheet('st');const rows=[['Όνομα','Τηλέφωνο','Επισκέψεις','Έσοδα €','Μέση €','Τελευταία','Κάθε (μέρες)']].concat(R.list.sort((a,b)=>b.rev-a.rev).map(x=>[stuName(x.p),x.p.phone||'',x.v,x.rev||'',x.avg?Math.round(x.avg*100)/100:'',x.last,x.gap||'']));
    const csv='﻿'+rows.map(r=>r.map(v=>{v=String(v);return/[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}).join(';')).join('\r\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='statistika-'+R.from+'-'+R.to+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500);};}

/* ---------- έναρξη ---------- */
S.data=loadData();{const L=S.data&&S.data.settings&&S.data.settings.lex;if(L&&/^Ιδιοκτήτ/.test(L.who||'')){['who','whoAcc','whoGen','whoPl','whoPlL'].forEach(k=>delete L[k]);try{save();}catch(_){}}}applyIdentity();
/* έναρξη: η οθόνη που διάλεξες στις Ρυθμίσεις (ή η τελευταία) — μόνο στο πρώτο άνοιγμα, όχι σε σύνδεσμο προς συγκεκριμένη σελίδα */
{let first=true;try{first=!sessionStorage.getItem('im-started');sessionStorage.setItem('im-started','1');}catch(_){}
 const plain=!location.hash||/^#\/?(today|agenda)?$/.test(location.hash);
 if(first&&plain&&S.data&&S.data.settings&&S.data.settings.prof&&!new URLSearchParams(location.search).get('book')&&!new URLSearchParams(location.search).get('mine')){
  let k=S.data.settings.startView||'last';if(k==='last'){try{k=localStorage.getItem('imer-lasthome')||'';}catch(_){k='';}}
  const h=k==='today'?'#/today':['day','week','month','year','list'].includes(k)?'#/agenda?view='+k:'';
  if(h){history.replaceState(null,'',h);NAVSTK[0]=h;}}}
if(!location.hash)history.replaceState(null,'','#/today');
render();
setTimeout(autoBackup,5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&/^#\/agenda/.test(location.hash)&&!topModal())render();});

/* ---------- 1.51: προβολή «Έτος» — 12 μήνες, πόσα ραντεβού έχει κάθε μέρα, άδειες και κλειστές μέρες ---------- */
function offIcon(r){return(OFF_REASONS.find(x=>x[0]===r)||[0,'🔒'])[1];}
/* γιατί είναι κλειστή η μέρα: αργία, δηλωμένη άδεια/κλειστό ή ρεπό */
function offWhy(d){const C=closedDays();if(C[d]===false)return'';if(C[d])return typeof C[d]==='string'?C[d]:'Κλειστό';const h=holidayOf(d);if(h)return h;return'';}
/* ραντεβού μίας φοράς που έπεσαν σε κλειστή μέρα: το ημερολόγιο δεν τα δείχνει, άρα πρέπει να φωνάξουμε */
function hiddenOnce(from,to){const SID=new Set(S.data.students.map(x=>x.id));return appts().filter(a=>a.kind==='once'&&a.date>=from&&a.date<=to&&SID.has(a.sid)&&isClosed(a.date)&&!((a.ex||{})[a.date]&&['cancel','moved'].includes(a.ex[a.date].st))).map(a=>({a,date:a.date,s:a.s,sid:a.sid}));}
function yearCounts(Y){const M={},W={};occ(`${Y}-01-01`,`${Y}-12-31`,{by:''}).forEach(o=>{if(o.st==='cancel')return;M[o.date]=(M[o.date]||0)+1;});hiddenOnce(`${Y}-01-01`,`${Y}-12-31`).forEach(o=>{W[o.date]=(W[o.date]||0)+1;});return{M,W};}
function viewYear(r){const t=todayISO();const Y=+(r.q.y||(r.q.d||t).slice(0,4));try{localStorage.setItem('imer-agview','year');}catch(e){}
  const YC=yearCounts(Y),N=YC.M,W=YC.W;const DD=dromoData();const DJ=DD?DD.busy:{};const mx=Math.max(3,...Object.values(N));
  const mini=mo=>{const ym=`${Y}-${pad(mo)}`;const first=ym+'-01',last=isoDate(new Date(Y,mo,0));const start=mondayOf(first);const cells=[];for(let d=start;d<=last;d=addDays(d,1))cells.push(d);
    let busy=0;cells.forEach(d=>{if(d.slice(0,7)===ym)busy+=N[d]||0;});
    return`<div class="ymo"><a class="ymh" href="#/agenda?view=month&m=${ym}"><b>${MONTHS[mo-1]}</b>${busy?`<span>${busy}</span>`:''}</a><div class="ywd">${DAY_ORDER.map(d=>`<i>${WDAYS_S[d][0]}</i>`).join('')}</div><div class="ydays">${cells.map(d=>{if(d.slice(0,7)!==ym)return'<span></span>';
      const n=N[d]||0;const why=offWhy(d);const rest=!why&&!workDay(d);const pk=YEAR_PICK&&YEAR_PICK.a&&(d>=YEAR_PICK.a&&d<=(YEAR_PICK.b||YEAR_PICK.a));
      const lv=n?Math.min(4,Math.ceil(n/mx*4)):0;
      return`<button type="button" class="yd ${why?'off':''} ${rest?'rest':''} ${d===t?'today':''} ${pk?'pk':''} ${lv?'h'+lv:''}${djCls(DD,d)}" data-yd="${d}" title="${esc(fmtDate(d)+(DJ[d]?' · '+(DD.open[d]?DD.open[d]+' ενεργές δουλειές':DJ[d]+' δουλειές (κλεισμένες)')+' στο Δρομολόγιο':'')+(why?' · '+why:'')+(n?' · '+n+' ραντεβού':'')+(W[d]?' · '+W[d]+' ραντεβού σε κλειστή μέρα!':''))}"><small>${+d.slice(8)}</small>${djHTML(DD,d)}${W[d]?`<b class="yw">⚠${W[d]}</b>`:n?`<b>${n}</b>`:why&&!/^(Άδεια|Κλειστό|Σεμινάριο|Ταξίδι|Προσωπικό)$/.test(why)?'':why?`<em>${offIcon(why)}</em>`:''}</button>`;}).join('')}</div></div>`;};
  /* λίστα δηλωμένων: συνεχόμενες μέρες με τον ίδιο λόγο γίνονται ένα διάστημα */
  const C=closedDays();const D=Object.keys(C).filter(d=>d.startsWith(Y+'-')&&C[d]).sort();const R=[];D.forEach(d=>{const why=typeof C[d]==='string'?C[d]:'Κλειστό';const L=R[R.length-1];if(L&&L.why===why&&addDays(L.b,1)===d)L.b=d;else R.push({a:d,b:d,why});});
  const H=holList(Y).filter(h=>holOn(h)&&!biz().holOff);
  M().innerHTML=`<div class="agbar"><div class="seg">${[['day','Ημέρα'],['week','Εβδομάδα'],['month','Μήνας'],['year','Έτος'],['list','Λίστα']].map(([k,l])=>`<a href="#/agenda?view=${k}${k==='year'?'&y='+Y:'&d='+(Y===+t.slice(0,4)?t:Y+'-01-01')}" class="${k==='year'?'on':''}">${l}</a>`).join('')}</div></div>
   ${periodHead([`#/agenda?view=year&y=${Y-1}`,'',`#/agenda?view=year&y=${Y+1}`],String(Y),Y===+t.slice(0,4),`#/agenda?view=year&y=${t.slice(0,4)}`)}
   ${YEAR_PICK?`<div class="ypick"><b>🏖️ ${YEAR_PICK.a?'Τώρα πάτα την τελευταία μέρα':'Πάτα την πρώτη μέρα'}</b><span class="small">${YEAR_PICK.a?'Για μία μόνο μέρα, πάτα την ίδια ξανά.':'της άδειας ή του κλεισίματος. Για να ανοίξεις ξανά μια κλειστή μέρα, πάτα την δύο φορές.'}</span><button class="btn sm" id="y-cx">Άκυρο</button></div>`:`<div class="ybtns"><button class="btn pri" id="y-off">🏖️ Άδεια / κλειστό</button><button class="btn" id="y-fs">⛶ Όλο το έτος</button></div>`}
   <div class="ylegend small"><span><i class="yd h2"></i> ραντεβού (ο αριθμός)</span><span><i class="yd off"></i> κλειστό · αργία · άδεια</span><span><i class="yd rest"></i> ρεπό</span>${DD?'<span><i class="yd djon"></i> ενεργές δουλειές Δρομολογίου <i class="ydj" style="position:static">2</i></span>':''}</div>
   <div class="ygrid">${[1,2,3,4,5,6,7,8,9,10,11,12].map(mini).join('')}</div>
   <div class="card section" style="margin-top:14px"><div class="card-h"><h3>Άδειες και κλειστές μέρες ${Y}</h3></div>
    ${R.length?`<div class="yoffl">${R.map((x,i)=>`<div class="yoff"><span>${offIcon(x.why)}</span><span class="grow"><b>${esc(x.why)}</b><small>${x.a===x.b?esc(WDAYS_S[wdOf(x.a)]+' '+fmtShort(x.a)):esc(fmtShort(x.a)+' – '+fmtShort(x.b))}${x.a!==x.b?` · ${Math.round((new Date(x.b)-new Date(x.a))/864e5)+1} μέρες`:''}${(n=>n?` · <b class="ywt">⚠️ ${n} ραντεβού μένουν μέσα</b>`:'')(hiddenOnce(x.a,x.b).length)}</small></span><button class="rngx" data-yrm="${i}" aria-label="Αφαίρεση">✕</button></div>`).join('')}</div>`:'<p class="small muted" style="margin:0">Δεν έχεις δηλώσει άδειες. Πάτα «Δήλωσε άδεια ή κλειστό».</p>'}
</div>
   <div class="card section" style="margin-top:14px"><div class="card-h"><h3>Αργίες ${Y}</h3><span class="small muted">${H.length} κλειστές</span></div>
    <p class="small muted" style="margin:0 0 8px">Ξετσέκαρε όσες δουλεύεις. Ισχύει κάθε χρόνο.</p>
    <label class="switch"><span><b>Κλειστά στις επίσημες αργίες</b></span><input type="checkbox" id="yh-on" ${biz().holOff?'':'checked'}></label>
    <div style="margin-top:8px;${biz().holOff?'opacity:.5;pointer-events:none':''}">${holList(Y).map(h=>`<label class="holrow ${h.date<t?'past':''}"><span class="hd">${WDAYS_S[wdOf(h.date)]} ${fmtShort(h.date)}</span><span class="grow">${esc(h.name)}</span><input type="checkbox" data-yhol="${h.id}" ${holOn(h)?'checked':''}></label>`).join('')}</div>
    <button type="button" class="btn sm ghost" id="y-holr" style="margin-top:10px">↩︎ Επαναφορά στις βασικές αργίες</button></div>`;
  M().onchange=e=>{const B=biz();if(e.target.id==='yh-on'){B.holOff=!e.target.checked;save();return render();}const h=e.target.closest('[data-yhol]');if(h){B.hol=B.hol||{};B.hol[h.dataset.yhol]=h.checked;save();render();}};
  M().onclick=e=>{const rm=e.target.closest('[data-yrm]');if(rm){const x=R[+rm.dataset.yrm];if(!confirm(`Να ανοίξουν ξανά οι μέρες ${fmtShort(x.a)}${x.a!==x.b?' – '+fmtShort(x.b):''};`))return;for(let d=x.a;d<=x.b;d=addDays(d,1))delete C[d];save();glenOutbox('open',x.a,x.b);toast('Οι μέρες άνοιξαν ξανά.','ok');return render();}
    if(e.target.closest('#y-fs'))return yearFull(Y);if(e.target.closest('#y-holr'))return holReset();
    if(e.target.closest('#y-off')){YEAR_PICK={};return render();}if(e.target.closest('#y-cx')){YEAR_PICK=null;return render();}
    const b=e.target.closest('[data-yd]');if(!b)return;const d=b.dataset.yd;
    if(!YEAR_PICK)return go(`agenda?view=day&d=${d}`);
    if(!YEAR_PICK.a){YEAR_PICK.a=d;return render();}
    let a=YEAR_PICK.a,z=d;if(z<a)[a,z]=[z,a];YEAR_PICK.b=z;YEAR_PICK.a=a;render();offDialog(a,z);};}
function offDialog(a,z){const days=[];for(let d=a;d<=z;d=addDays(d,1))days.push(d);const C=closedDays();
  const allOff=days.every(d=>offWhy(d));
  const X=occ(a,z,{by:''}).filter(o=>o.st!=='cancel').concat(hiddenOnce(a,z));
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">${a===z?esc(WDAYS[wdOf(a)]+' '+fmtDate(a)):esc(fmtShort(a)+' – '+fmtShort(z))+` <span class="muted small">(${days.length} μέρες)</span>`}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   ${allOff?`<p class="small" style="margin-top:0">${a===z?'Αυτή η μέρα είναι ήδη κλειστή':'Αυτές οι μέρες είναι ήδη κλειστές'} (${esc(offWhy(a))}).</p><button class="btn pri" id="of-open" style="width:100%">🔓 Άνοιξέ ${a===z?'την':'τες'} ξανά</button><p class="small muted">ή άλλαξε τον λόγο:</p>`:`<p class="small muted" style="margin-top:0">Τι είναι; Δεν θα κλείνονται ραντεβού, ούτε από τον σύνδεσμο κρατήσεων.</p>`}
   <div class="ofr">${OFF_REASONS.map(([n,i])=>`<button class="btn" data-ofr="${esc(n)}">${i} ${esc(n)}</button>`).join('')}</div>
   ${X.length?`<div class="note small" style="margin-top:12px">⚠️ <b>Έχεις ${X.length} ραντεβού ${a===z?'αυτή τη μέρα':'αυτές τις μέρες'}.</b> Δεν σβήνονται — μετακίνησέ τα ή ακύρωσέ τα:<div style="margin-top:6px">${X.slice(0,8).map(o=>`<a class="chipt" href="#/agenda?view=day&d=${o.date}">${esc(fmtShort(o.date)+' '+o.s+' '+stuName(stOf(o.a.sid)))}</a>`).join(' ')}${X.length>8?' …':''}</div></div>`:''}`,{guard:false,onClose:()=>{YEAR_PICK=null;render();if(window._yfsDraw)_yfsDraw();}});
  md.el.addEventListener('click',e=>{const r=e.target.closest('[data-ofr]');if(r){days.forEach(d=>{C[d]=r.dataset.ofr;});save();glenOutbox('close',a,z,r.dataset.ofr);toast(`Δηλώθηκε: ${r.dataset.ofr} (${days.length} ${days.length===1?'μέρα':'μέρες'}).`,'ok');md.close();return;}
    if(e.target.closest('#of-open')){days.forEach(d=>{if(holidayOf(d))C[d]=false;else delete C[d];});save();glenOutbox('open',a,z);toast('Άνοιξαν ξανά.','ok');md.close();}});}
/* κοινή «βιτρίνα» για τις άλλες εφαρμογές GlenApps (π.χ. Δρομολόγιο): ποιες μέρες είσαι κλειστός και πόσα ραντεβού έχεις — μόνο στο ίδιο κινητό */
function glenShare(){clearTimeout(_shT);_shT=setTimeout(()=>{try{if(!S.data||!S.data.settings)return;const t=todayISO();const off={},busy={};const to=addDays(t,400);
  occ(addDays(t,-31),to,{by:''}).concat(hiddenOnce(addDays(t,-31),to)).forEach(o=>{if(o.st==='cancel')return;busy[o.date]=(busy[o.date]||0)+1;});
  for(let d=addDays(t,-31);d<=to;d=addDays(d,1)){const w=offWhy(d);if(w)off[d]=w;else if(!workDay(d))off[d]='Ρεπό';}
  const c=agCfg();const clients=S.data.students.filter(p=>!p.demo&&!p.archived).map(p=>({id:p.id,n:stuName(p),ph:p.phone||'',a:(p.loc&&p.loc.addr)||'',lat:p.loc&&p.loc.lat!=null?p.loc.lat:null,lng:p.loc&&p.loc.lng!=null?p.loc.lng:null}));
  localStorage.setItem('glenapps-imerologio',JSON.stringify({v:1,at:Date.now(),name:S.data.settings.myName||'',from:c.from,to:c.to,days:c.days,off,busy,clients,url:location.href.split('#')[0]}));}catch(e){}},400);}
/* ---------- 1.52: ανταλλαγή αδειών με το Δρομολόγιο (ίδιο κινητό) ----------
   Κάθε εφαρμογή γράφει ΜΟΝΟ στα δικά της δεδομένα. Για αλλαγή στην άλλη αφήνει αίτημα:
   localStorage 'glenapps-aitimata-<εφαρμογή>' = [{t:'close'|'open', a:'YYYY-MM-DD', b:'YYYY-MM-DD', why, apo, at}] */
function glenOutbox(t,a,b,why){try{const K='glenapps-aitimata-dromologio';const L=JSON.parse(localStorage.getItem(K)||'[]');L.push({t,a,b,why:why||'',apo:'imerologio',at:Date.now()});localStorage.setItem(K,JSON.stringify(L.slice(-200)));}catch(e){}}
function glenInbox(){try{if(!S.data||!S.data.settings)return;const K='glenapps-aitimata-imerologio';const L=JSON.parse(localStorage.getItem(K)||'[]');if(!L.length)return;localStorage.removeItem(K);
  const C=closedDays();let nc=0,no=0;L.forEach(x=>{if(!x||!x.a)return;for(let d=x.a;d<=(x.b||x.a);d=addDays(d,1)){if(x.t==='close'){if(!offWhy(d)){C[d]=x.why||'Κλειστό';nc++;}}else if(x.t==='open'){if(offWhy(d)){if(holidayOf(d))C[d]=false;else delete C[d];no++;}}}});
  if(nc||no){save();toast('Από το Δρομολόγιο: '+[nc?`κλειστές ${nc} μέρες`:'',no?`άνοιξαν ${no} μέρες`:''].filter(Boolean).join(' · ')+'.','ok');if(/^#\/(agenda|today)?/.test(location.hash))render();}}catch(e){}}
function dromoData(){try{const D=JSON.parse(localStorage.getItem('glenapps-dromologio')||'null');if(!D||!D.busy)return null;return{busy:D.busy,open:D.open||D.busy};}catch(e){return null;}}
/* πελάτες του Δρομολογίου στο ίδιο κινητό: όσοι δεν υπάρχουν ήδη εδώ (ίδιο τηλέφωνο ή ίδιο όνομα) */
function dromoClients(){try{const D=JSON.parse(localStorage.getItem('glenapps-dromologio')||'null');const L=D&&Array.isArray(D.clients)?D.clients:[];
  return L.filter(c=>c&&c.n&&!(c.ph&&byPhone(c.ph))&&!S.data.students.some(p=>normNm(p.name)===normNm(c.n))).map((c,i)=>({id:c.id!=null?c.id:'d'+i,n:String(c.n),ph:c.ph||'',a:c.a||'',lat:c.lat!=null?+c.lat:null,lng:c.lng!=null?+c.lng:null}));}catch(e){return[];}}
function dromoBusy(){const D=dromoData();return D&&D.busy||null;}
/* σήμα δουλειών Δρομολογίου: πράσινο = ενεργές (δεν έχουν κλείσει), γκρι = όλες κλεισμένες */
function djHTML(DD,d){if(!DD)return'';const o=DD.open[d]||0,a=DD.busy[d]||0;if(!a&&!o)return'';return o?`<i class="ydj">${o}</i>`:`<i class="ydj done">${a}</i>`;}
function djCls(DD,d){return DD&&DD.open[d]?' djon':'';}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)glenInbox();});setTimeout(glenInbox,900);setTimeout(()=>window.glenShare&&glenShare(),1200);

/* όλο το έτος σε μία οθόνη: 12 μήνες χωρίς κύλισμα· πάτημα σε μέρα → η μέρα· και δήλωση άδειας από εδώ */
function yearFull(Y){const fsc=()=>md.el.classList.toggle('fs',!!document.fullscreenElement);
  const md=modal('<div id="yfs"></div>',{guard:false,onClose:()=>{window._yfsDraw=null;YEAR_PICK=null;document.removeEventListener('fullscreenchange',fsc);try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}}});
  md.el.classList.add('yfsdlg');md.el.parentElement.classList.add('yfsov');document.addEventListener('fullscreenchange',fsc);
  /* σύρσιμο: κάτω → κλείνει · αριστερά/δεξιά → άλλο έτος */
  {let x0=null,y0=0,t0=0;md.el.addEventListener('touchstart',e=>{const p=e.touches[0];x0=p.clientX;y0=p.clientY;t0=Date.now();},{passive:true});
   md.el.addEventListener('touchend',e=>{if(x0==null)return;const p=e.changedTouches[0];const dx=p.clientX-x0,dy=p.clientY-y0;x0=null;if(Date.now()-t0>900)return;
     if(dy>90&&Math.abs(dx)<70){md.el.dataset.swiped='1';md.close();return;}
     if(Math.abs(dx)>80&&Math.abs(dy)<60){md.el.dataset.swiped='1';Y+=dx<0?1:-1;draw();}},{passive:true});}try{if(innerWidth<900&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});}catch(e){}
  const t=todayISO();
  const draw=()=>{const YC=yearCounts(Y),N=YC.M,W=YC.W;const DD=dromoData();const DJ=DD?DD.busy:{};const mx=Math.max(3,...Object.values(N));
    const mini=mo=>{const ym=`${Y}-${pad(mo)}`;const last=isoDate(new Date(Y,mo,0));const cells=[];for(let d=mondayOf(ym+'-01');d<=last;d=addDays(d,1))cells.push(d);while(cells.length<42)cells.push('');
      let busy=0;cells.forEach(d=>{if(d&&d.slice(0,7)===ym)busy+=N[d]||0;});
      return`<div class="yfm"><div class="yfh"><b>${MONTHS[mo-1]}</b>${busy?`<span>${busy}</span>`:''}</div><div class="yfw">${DAY_ORDER.map(d=>`<i>${WDAYS_S[d][0]}</i>`).join('')}</div><div class="yfd">${cells.map(d=>{if(!d||d.slice(0,7)!==ym)return'<span></span>';
        const n=N[d]||0,why=offWhy(d),rest=!why&&!workDay(d),lv=n?Math.min(4,Math.ceil(n/mx*4)):0;const pk=YEAR_PICK&&YEAR_PICK.a&&d>=YEAR_PICK.a&&d<=(YEAR_PICK.b||YEAR_PICK.a);
        return`<button type="button" class="yd ${why?'off':''} ${rest?'rest':''} ${d===t?'today':''} ${pk?'pk':''} ${lv?'h'+lv:''}${djCls(DD,d)}" data-yfd="${d}"><small>${+d.slice(8)}</small>${W[d]?`<b class="yw">⚠${W[d]}</b>`:n?`<b>${n}</b>`:''}${djHTML(DD,d)}</button>`;}).join('')}</div></div>`;};
    $('#yfs',md.el).innerHTML=`<div class="yfbar"><button class="iconbtn" data-yfy="${Y-1}" aria-label="Προηγούμενο έτος">${ic('left',20)}</button><b>${Y}</b><button class="iconbtn" data-yfy="${Y+1}" aria-label="Επόμενο έτος">${ic('right',20)}</button>
      <span class="grow small">${YEAR_PICK?(YEAR_PICK.a?'Πάτα την τελευταία μέρα':'Πάτα την πρώτη μέρα'):''}</span>
      <button class="btn sm ${YEAR_PICK?'':'pri'}" id="yf-off">${YEAR_PICK?'Άκυρο':'🏖️ Άδεια'}</button><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',20)}</button></div>
      <div class="yfgrid">${[1,2,3,4,5,6,7,8,9,10,11,12].map(mini).join('')}</div><div class="yfhint">Σύρε κάτω για κλείσιμο · αριστερά/δεξιά για άλλο έτος</div>`;};
  window._yfsDraw=draw;draw();
  md.el.addEventListener('click',e=>{if(md.el.dataset.swiped){delete md.el.dataset.swiped;return;}const y=e.target.closest('[data-yfy]');if(y){Y=+y.dataset.yfy;return draw();}
    if(e.target.closest('#yf-off')){YEAR_PICK=YEAR_PICK?null:{};return draw();}
    const b=e.target.closest('[data-yfd]');if(!b)return;const d=b.dataset.yfd;
    if(!YEAR_PICK){md.close();return setTimeout(()=>go(`agenda?view=day&d=${d}`),160);}
    if(!YEAR_PICK.a){YEAR_PICK.a=d;return draw();}
    let a=YEAR_PICK.a,z=d;if(z<a)[a,z]=[z,a];YEAR_PICK.a=a;YEAR_PICK.b=z;draw();offDialog(a,z);});}

/* επαναφορά στις βασικές αργίες: ό,τι άλλαξες στις αργίες γυρίζει όπως ήταν (οι δικές σου άδειες μένουν) */
function holReset(){const B=biz();const C=closedDays();const n=Object.keys(B.hol||{}).length+Object.keys(C).filter(d=>C[d]===false).length+(B.holOff?1:0);
  if(!n){toast('Οι αργίες είναι ήδη οι βασικές.','ok');return;}
  confirmDlg('Να γυρίσουν οι αργίες στις βασικές; Ξανακλείνουν όλες οι επίσημες αργίες (και Καθαρά Δευτέρα, Πάσχα, Αγίου Πνεύματος). Οι άδειες και οι κλειστές μέρες που δήλωσες εσύ μένουν όπως είναι.',{ok:'Επαναφορά'}).then(ok=>{if(!ok)return;
    delete B.hol;B.holOff=false;Object.keys(C).forEach(d=>{if(C[d]===false)delete C[d];});save();toast('Οι αργίες γύρισαν στις βασικές.','ok');render();if(window._yfsDraw)_yfsDraw();});}
