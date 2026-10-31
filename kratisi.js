/* Σελίδα κράτησης του «Ημερολογίου» (GlenApps) — © 2026 Ανδρέας Μ. Γλεντζάκης. Ξεχωριστό αρχείο για να ισχύει ο αυστηρός κανόνας ασφαλείας (CSP). */
'use strict';
/* ---------- γλώσσα ---------- */
const T={
 el:{svT:'Τι θα κάνουμε;',svPet:'Το κατοικίδιό σου',svNew:'＋ Νέο',svName:'Όνομα κατοικιδίου',svSp:'Είδος',svSpL:{dog:'🐕 Σκύλος',cat:'🐈 Γάτα',other:'🐾 Άλλο'},svBr:'Ράτσα',svSz:'Μέγεθος',svW:'Βάρος (κιλά, προαιρετικό)',svNeed:'Έχει ιδιαίτερη ανάγκη (π.χ. φοβικό, ηλικιωμένο)',svNeedP:'Γράψε τι χρειάζεται',
  svTot:'Διάρκεια',svBuf:'',svPick:'Διάλεξε πρώτα τι θα γίνει — μετά θα δεις τις ώρες που χωράνε.',svNoFit:'Δεν υπάρχει αρκετά μεγάλο κενό για αυτή τη διάρκεια. Δοκίμασε λιγότερες υπηρεσίες ή πάρε τηλέφωνο.',svAp:'Λόγω της ειδικής περίπτωσης, το κατάστημα θα δει πρώτα το αίτημα και θα σου απαντήσει.',
  svKeep:'Τα στοιχεία του κατοικιδίου μένουν μόνο σε αυτό το κινητό, για να μην τα ξαναγράφεις.',svForget:'Σβήσ\' τα από εδώ',svNeedPet:'Γράψε το όνομα του κατοικιδίου.',svMsg:'Υπηρεσίες',svMsgPet:'Κατοικίδιο',svMsgAp:'⚠ Θέλει έγκριση',min:m=>m<60?m+'′':Math.floor(m/60)+' ώρ'+(m>=120?'ες':'α')+(m%60?' '+(m%60)+'′':''),
  title:'Κράτηση ραντεβού',pick:'Διάλεξε μέρα',time:'Διάλεξε ώρα',free:n=>n+(n===1?' ώρα':' ώρες'),none:'Δεν υπάρχουν ελεύθερες ώρες αυτή τη μέρα.',
  you:'Τα στοιχεία σου',name:'Ονοματεπώνυμο',phone:'Τηλέφωνο',note:'Σημείωση (προαιρετικό)',hpNote:'Μη γράφετε εδώ συμπτώματα ή στοιχεία υγείας — θα τα πείτε από κοντά.',promo:'Θέλω να λαμβάνω και προσφορές και νέα (μπορώ να το σταματήσω όποτε θέλω).',
  sendWith:'Στείλε την κράτηση με',sms:'SMS',viber:'Viber',wa:'WhatsApp',mail:'Email',
  priv:b=>`Τα στοιχεία σου πηγαίνουν μόνο στον/στην «${b}», μέσα από την εφαρμογή μηνυμάτων σου. Η σελίδα αυτή δεν τα αποθηκεύει και δεν τα στέλνει πουθενά αλλού.`,
  asOf:d=>'Ελεύθερες ώρες όπως ήταν στις '+d,expired:'Ο σύνδεσμος έχει λήξει. Ζήτησε νέο σύνδεσμο.',withWho:'Με ποιον θέλεις;',wantWho:'Θέλεις συγκεκριμένο άτομο;',askT:'Έστειλες το μήνυμα;',askP:b=>`Η κράτηση φτάνει στον/στην «${b}» μόνο αν πατήσεις «Αποστολή» μέσα στην εφαρμογή μηνυμάτων. Αν δεν άνοιξε ή δεν το έστειλες, δοκίμασε ξανά ή στείλε με SMS.`,askYes:'Ναι, το έστειλα',askRe:'Άνοιξέ το ξανά',trySms:'Στείλε με SMS (πιο σίγουρο)',
 vbT:'Στείλε το με Viber',vb1:'Το μήνυμα αντιγράφηκε.',vb2:(b,p)=>`Πάτα το μωβ κουμπί: ανοίγει η συνομιλία με «${b}»${p?' ('+p+')':''}.`,vb3:'Αν το κουτί γραφής είναι άδειο: πάτα παρατεταμένα μέσα του → «Επικόλληση».',vb4:'Πάτα «Αποστολή» και γύρνα εδώ.',vbOpen:b=>`Άνοιξε τη συνομιλία με «${b}»`,vbCopy:'Αντιγραφή μηνύματος ξανά',copied:'Αντιγράφηκε',anyone:'Οποιονδήποτε',with:'με',off:'Η κράτηση από εδώ δεν είναι ενεργή αυτή τη στιγμή. Επικοινώνησε μαζί μας για ραντεβού.',call:'Κάλεσε',bad:'Ο σύνδεσμος δεν είναι σωστός. Ζήτησε νέο σύνδεσμο.',
  needName:'Γράψε το όνομά σου.',needPhone:'Γράψε ένα τηλέφωνο για να σε ειδοποιήσουν.',needSlot:'Διάλεξε πρώτα μέρα και ώρα.',
  sentT:'Η κράτηση στάλθηκε!',sentP:b=>`Μόλις την επιβεβαιώσει ο/η «${b}», θα σου απαντήσει. Αν δεν άνοιξε η εφαρμογή μηνυμάτων, δοκίμασε άλλο κουμπί.`,again:'Πίσω',
  msg:(o,when,n,ph,no,link,pr,ca,ad)=>`Καλησπέρα! Θα ήθελα ${o.toLowerCase()} ${when}.\nΌνομα: ${n}\nΤηλ: ${ph}${ad?'\nΔιεύθυνση: '+ad:''}${no?'\nΣημείωση: '+no:''}\nΜηνύματα για το ραντεβού: ${ca?'ΝΑΙ':'ΟΧΙ'} · Προσφορές: ${pr?'ΝΑΙ':'ΟΧΙ'}\n\nΓια καταχώρηση στο ημερολόγιο πατήστε:\n${link}`,
  vbHint:b=>`Viber: διάλεξε τη συνομιλία με «${b}». Αν το μήνυμα δεν μπήκε μόνο του, πάτα παρατεταμένα στο κουτί γραφής → «Επικόλληση» → Αποστολή.`,cut:'Ο σύνδεσμος κόπηκε στη μέση από την εφαρμογή μηνυμάτων. Ζήτησε να σου τον στείλουν ξανά με SMS ή με «Κοινοποίηση».',
  hi:f=>`Γεια σου ${f}! Διάλεξε ώρα και πάτα αποστολή`,hiTop:f=>`Γεια σου ${f} 👋 Διάλεξε μέρα και ώρα`,permNote:b=>`Αυτές είναι οι ώρες λειτουργίας. Ο/Η «${b}» θα σου επιβεβαιώσει την ώρα ή θα σου προτείνει άλλη.`,addrS:'+ Διεύθυνση (προαιρετικό — π.χ. αν έρχονται στο σπίτι σου)',addrP:'Οδός, αριθμός, περιοχή',consT:'Τι θέλεις να σου στέλνουν;',consA:b=>`Μηνύματα για το ραντεβού μου (επιβεβαίωση, υπενθύμιση, αλλαγή) από «${b}»`,consNote:'Τα αλλάζεις όποτε θέλεις: απάντησε ΣΤΟΠ για τις προσφορές ή ΣΤΟΠ ΟΛΑ για όλα.',useMe:n=>`Είσαι ο/η ${n}; Πάτα για να μπουν τα στοιχεία σου`,notMe:n=>`Δεν είσαι ο/η ${n}; Γράψε τα στοιχεία σου`,
  addMine:'Κράτα το στο δικό μου Ημερολόγιο (εφαρμογή)',calV:'Ημερολόγιο',listV:'Λίστα',legFree:'Ελεύθερο',legBusy:'Πιασμένο',yours:'Το ραντεβού σου',yoursS:'Εσύ',tapGreen:'Πάτα ένα πράσινο κουτάκι για να διαλέξεις ώρα.',
  addCal:'Βάλ\' το στο ημερολόγιο του κινητού μου',pending:'Περιμένει επιβεβαίωση από την επιχείρηση.',ownT:'Θέλεις κι εσύ τέτοιο ημερολόγιο;',ownP:'Για τη δουλειά σου ή για εσένα — δωρεάν, στα ελληνικά, τα δεδομένα μένουν στο κινητό σου.',ownB:'Κατέβασε το Ημερολόγιο',
  at:'στις',subj:'Κράτηση ραντεβού',wd:['Κυρ','Δευ','Τρί','Τετ','Πέμ','Παρ','Σάβ'],wdL:['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'],today:'Σήμερα',tomorrow:'Αύριο'},
 en:{svT:'What would you like?',svPet:'Your pet',svNew:'＋ New',svName:'Pet’s name',svSp:'Type',svSpL:{dog:'🐕 Dog',cat:'🐈 Cat',other:'🐾 Other'},svBr:'Breed',svSz:'Size',svW:'Weight (kg, optional)',svNeed:'Has a special need (e.g. anxious, elderly)',svNeedP:'Tell us what is needed',
  svTot:'Duration',svBuf:'',svPick:'First choose what you need — then you will see the times that fit.',svNoFit:'There is no gap long enough for this. Try fewer services or give us a call.',svAp:'Because this is a special case, the shop will review the request first and reply.',
  svKeep:'Your pet’s details stay only on this phone, so you don’t have to type them again.',svForget:'Delete them from here',svNeedPet:'Please type your pet’s name.',svMsg:'Services',svMsgPet:'Pet',svMsgAp:'⚠ Needs approval',min:m=>m<60?m+' min':Math.floor(m/60)+' h'+(m%60?' '+(m%60)+' min':''),
  title:'Book an appointment',pick:'Choose a day',time:'Choose a time',free:n=>n+(n===1?' slot':' slots'),none:'No free times on this day.',
  you:'Your details',name:'Full name',phone:'Phone',note:'Note (optional)',hpNote:'Please don\'t write symptoms or health details here — you\'ll discuss them in person.',promo:'I also want to receive offers and news (I can stop anytime).',
  sendWith:'Send the booking via',sms:'SMS',viber:'Viber',wa:'WhatsApp',mail:'Email',
  priv:b=>`Your details go only to “${b}”, through your own messaging app. This page does not store them or send them anywhere else.`,
  asOf:d=>'Free times as of '+d,expired:'This link has expired. Please ask for a new one.',withWho:'Who would you like?',wantWho:'Want someone specific?',askT:'Did you send the message?',askP:b=>`The booking reaches “${b}” only if you tap “Send” in the messaging app. If it didn’t open or you didn’t send it, try again or send by SMS.`,askYes:'Yes, I sent it',askRe:'Open it again',trySms:'Send by SMS (more reliable)',
 vbT:'Send it with Viber',vb1:'The message has been copied.',vb2:(b,p)=>`Tap the purple button: the chat with “${b}”${p?' ('+p+')':''} opens.`,vb3:'If the text box is empty: long-press inside it → “Paste”.',vb4:'Tap “Send” and come back here.',vbOpen:b=>`Open the chat with “${b}”`,vbCopy:'Copy the message again',copied:'Copied',anyone:'Anyone',with:'with',off:'Online booking from here is not active right now. Please contact us for an appointment.',call:'Call',bad:'This link is not valid. Please ask for a new one.',
  needName:'Please type your name.',needPhone:'Please type a phone number so they can reach you.',needSlot:'Choose a day and time first.',
  sentT:'Booking sent!',sentP:b=>`“${b}” will reply once they confirm it. If your messaging app didn’t open, try another button.`,again:'Back',
  msg:(o,when,n,ph,no,link,pr,ca,ad)=>`Hello! I would like to book ${when}.\nName: ${n}\nPhone: ${ph}${ad?'\nAddress: '+ad:''}${no?'\nNote: '+no:''}\nAppointment messages: ${ca?'YES':'NO'} · Offers: ${pr?'YES':'NO'}\n\nTo add it to the calendar tap:\n${link}`,
  vbHint:b=>`Viber: pick the chat with “${b}”. If the message didn’t appear, long-press the text box → “Paste” → Send.`,cut:'The link was cut short by the messaging app. Ask them to send it again by SMS or “Share”.',
  hi:f=>`Hi ${f}! Pick a time and send`,hiTop:f=>`Hi ${f} 👋 Pick a day and time`,permNote:b=>`These are the opening hours. “${b}” will confirm your time or suggest another.`,addrS:'+ Address (optional — e.g. if they visit your home)',addrP:'Street, number, area',consT:'What would you like to receive?',consA:b=>`Messages about my appointment (confirmation, reminder, change) from “${b}”`,consNote:'Change anytime: reply STOP for offers or STOP ALL for everything.',useMe:n=>`Are you ${n}? Tap to fill in your details`,notMe:n=>`Not ${n}? Enter your details`,
  addMine:'Keep it in my own Calendar app',calV:'Calendar',listV:'List',legFree:'Free',legBusy:'Taken',yours:'Your appointment',yoursS:'You',tapGreen:'Tap a green box to pick a time.',
  addCal:'Add it to my phone calendar',pending:'Waiting for confirmation from the business.',ownT:'Want a calendar like this?',ownP:'For your work or for yourself — free, your data stays on your phone.',ownB:'Get the Calendar app',
  at:'at',subj:'Appointment booking',wd:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],wdL:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],today:'Today',tomorrow:'Tomorrow'}};
let L=(()=>{try{const s=localStorage.getItem('glen-lang');if(s==='el'||s==='en')return s;}catch(_){}return String(navigator.language||'el').toLowerCase().startsWith('el')?'el':'en';})();
const t=k=>T[L][k];

/* ---------- βοηθητικά ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const isoDate=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const tstr=m=>pad(Math.floor(m/60))+':'+pad(m%60);
function b64uDec(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
function b64uEnc(u){let b='';for(let i=0;i<u.length;i++)b+=String.fromCharCode(u[i]);return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
/* κρυπτογράφηση συνδέσμων (AES-GCM, τυχαίο κλειδί μέσα στον σύνδεσμο, μετά το «#»): «e» + δεδομένα + «.» + κλειδί */
async function sealTxt(type,obj){const key=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const k=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['encrypt']);
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(type+JSON.stringify(obj))));const buf=new Uint8Array(12+ct.length);buf.set(iv);buf.set(ct,12);return'e'+b64uEnc(buf)+'.'+b64uEnc(key);}
/* ανοίγει «e…» και γυρίζει τον παλιό κωδικό (τύπος + base64) για να τον διαβάσουν οι υπάρχουσες συναρτήσεις· οι παλιοί σύνδεσμοι περνούν όπως είναι */
async function openTxt(s){s=String(s||'');if(s[0]!=='e')return s;try{const[a,b]=s.slice(1).split('.');const buf=b64uDec(a),key=b64uDec(b);const k=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['decrypt']);
  const pt=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:buf.slice(0,12)},k,buf.slice(12)));return pt[0]+b64uEnc(new TextEncoder().encode(pt.slice(1)));}catch(e){return'';}}
async function unpack(s){const k=s[0],body=s.slice(1);let bytes=b64uDec(body);
  if(k==='c'){const o=JSON.parse(new TextDecoder().decode(bytes));const out=[];
    if(o.pm&&Array.isArray(o.w)){if(!o.x||o.x<isoDate(new Date())){o.s=[];o.off=1;o.v=1;return o;}const dec=h=>{const L=[];for(let j=0;j<h.length;j++){const v=parseInt(h[j],16);for(let b=0;b<4;b++)if(v&(8>>b))L.push(o.t0+(j*4+b)*15);}return L;};const W=o.w.map(h=>h?dec(h):[]);if(o.sv){const C=[];const t1=new Date();for(let i=0;i<(o.dd||14);i++){const dt=new Date(t1.getFullYear(),t1.getMonth(),t1.getDate()+i,12);const L=W[dt.getDay()]||[];if(L.length)C.push([isoDate(dt),L]);}o.cells=C;o.s=[];o.v=1;return o;}
      const t0=new Date();for(let i=0;i<(o.dd||14);i++){const dt=new Date(t0.getFullYear(),t0.getMonth(),t0.getDate()+i,12);const L=W[dt.getDay()]||[];if(L.length)out.push([isoDate(dt),L]);}o.s=out;o.v=1;return o;}
    const base=new Date(o.b+'T12:00');
    const days=arr=>{const R=[];(arr||[]).forEach((h,i)=>{if(!h)return;const L=[];for(let j=0;j<h.length;j++){const v=parseInt(h[j],16);for(let b=0;b<4;b++)if(v&(8>>b))L.push(o.t0+(j*4+b)*15);}const dt=new Date(base.getTime()+i*864e5);if(L.length)R.push([isoDate(dt),L]);});return R;};
    if(o.fc&&o.sv){o.cells=days(o.fc);o.s=[];if(Array.isArray(o.pv))o.pv.forEach(p=>{p.cells=days(p.fc);p.s=[];});o.v=1;return o;}
    o.s=days(o.d);if(Array.isArray(o.pv))o.pv.forEach(p=>{if(Array.isArray(p.d))p.s=days(p.d);});o.v=1;return o;}
  if(k==='z'){const ds=new DecompressionStream('deflate-raw');bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer());}
  return JSON.parse(new TextDecoder().decode(bytes));}
const intl=ph=>{let d=String(ph||'').replace(/[^\d+]/g,'');if(d.startsWith('00'))d='+'+d.slice(2);if(!d.startsWith('+')){d=d.replace(/\D/g,'');if(/^(69|2)\d{8}$/.test(d))d='+30'+d;else d='+'+d;}return d;};
const clip=(s,n)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,n);

/* ---------- κατάσταση ---------- */
let D=null,day=null,slot=null,PC=null,other=false,mode='cal',wk=0,who='',pvOpen=false;
/* ---------- υπηρεσίες με διάρκεια (ίδιος υπολογισμός με την εφαρμογή) ---------- */
let SV={ids:[],g:{},pet:{sp:'dog',sz:1,g:{}},need:false,needT:'',newPet:false},PETS=[];
const svOn=()=>!!(D&&D.sv&&Array.isArray(D.sv.l)&&D.sv.l.length);
function svCalc(){const c=D.sv,hs=Array.isArray(c.sz)&&c.sz.length;const sz=SV.pet.sz|0;let m=0,ap=false;const n=[],why=[];
  c.l.forEach(([id,nm,M])=>{if(!SV.ids.includes(id))return;m+=+(M[hs?Math.min(sz,M.length-1):0])||0;n.push(nm);});
  (c.g||[]).forEach(([gid,gn,O])=>{const k=c.pet&&(gid==='ct'||gid==='cc')?SV.pet.g[gid]:SV.g[gid];const o=O[k|0];if(!o)return;m+=+o[1]||0;if(o[2]){ap=true;why.push(o[0]);}});
  const b=c.pet?(c.br||[]).find(x=>x[0]===(SV.pet.br||'')):null;if(b&&n.length)m+=+b[2]||0;if(c.need&&SV.need){ap=true;why.push(SV.needT||t('svNeed'));}
  return{m:n.length?Math.ceil(m/5)*5:0,n,ap,why};}
function svStarts(cells,T){const bf=+D.sv.bf||0,st=+D.sv.st||30,out=[];
  for(const[d,L]of cells||[]){const set=new Set(L),mx=Math.max(...L);const R=[];for(const m of L){if(m%st)continue;let ok=true;for(let x=m;x<m+T;x+=15)if(!set.has(x)){ok=false;break;}
      if(ok)for(let x=m+T;x<m+T+bf;x+=15)if(!set.has(x)&&x<=mx){ok=false;break;}if(ok)R.push(m);}if(R.length)out.push([d,R]);}return out;}
function svApply(){if(!svOn())return;const r=svCalc();D.u=r.m||D.u0;D.s=r.m?svStarts(D.cells,r.m):[];if(Array.isArray(D.pv))D.pv.forEach(p=>{p.s=r.m?svStarts(p.cells,r.m):[];});}
function petsLoad(){let L=[];try{L=JSON.parse(localStorage.getItem('kr-pets')||'[]');}catch(_){}if(!Array.isArray(L))L=[];(D.pets||[]).forEach(p=>{if(p&&p.n&&!L.some(x=>x.n===p.n))L.unshift(p);});return L.slice(0,8);}
function svBlock(){if(!svOn())return'';const c=D.sv,hs=Array.isArray(c.sz)&&c.sz.length;const r=svCalc();const P=SV.pet;const ch=(on,attr,txt)=>`<button type="button" class="time ${on?'on':''}" ${attr}>${txt}</button>`;
  return`<div class="card svc"><h2>${esc(t('svT'))}</h2>
   ${c.pet?`<label class="f">${esc(t('svPet'))}</label><div class="times">${PETS.map((p,i)=>ch(!SV.newPet&&P.n===p.n,`data-kp="${i}"`,esc(p.n))).join('')}${PETS.length?ch(SV.newPet,'data-kpn="1"',esc(t('svNew'))):''}</div>
    ${!PETS.length||SV.newPet?`<label class="f" for="kp-n">${esc(t('svName'))}</label><input class="in" id="kp-n" maxlength="40" value="${esc(P.n||'')}">
     <label class="f">${esc(t('svSp'))}</label><div class="times">${['dog','cat','other'].map(k=>ch(P.sp===k,`data-ksp="${k}"`,esc(t('svSpL')[k]))).join('')}</div>
     <label class="f" for="kp-br">${esc(t('svBr'))}</label><input class="in" id="kp-br" list="kp-brl" maxlength="40" value="${esc(P.br||'')}"><datalist id="kp-brl">${(c.br||[]).map(b=>`<option value="${esc(b[0])}">`).join('')}</datalist>
     <label class="f" for="kp-w">${esc(t('svW'))}</label><input class="in" id="kp-w" type="number" inputmode="decimal" min="0" max="150" step="0.5" value="${P.w||''}">`:''}`:''}
   ${hs?`<label class="f">${esc(t('svSz'))}</label><div class="times">${c.sz.map((x,k)=>ch((P.sz|0)===k,`data-ksz="${k}"`,esc(x))).join('')}</div>`:''}
   ${(c.g||[]).map(([gid,gn,O])=>{const pg=c.pet&&(gid==='ct'||gid==='cc');const cur=(pg?P.g[gid]:SV.g[gid])|0;return`<label class="f">${esc(gn)}</label><div class="times">${O.map((o,k)=>ch(cur===k,`data-kg="${esc(gid)}" data-kk="${k}"`,esc(o[0]))).join('')}</div>`;}).join('')}
   <label class="f">${esc(t('svMsg'))}</label><div class="svl">${c.l.map(([id,nm,M])=>{const m=+(M[hs?Math.min(P.sz|0,M.length-1):0])||0;return`<label class="chk svk"><input type="checkbox" data-ks="${esc(id)}" ${SV.ids.includes(id)?'checked':''}><span class="grow">${esc(nm)}</span><span class="tiny muted">${esc(t('min')(m))}</span></label>`;}).join('')}</div>
   ${c.need?`<label class="chk"><input type="checkbox" id="kp-need" ${SV.need?'checked':''}><span>${esc(t('svNeed'))}</span></label>${SV.need?`<input class="in" id="kp-nt" maxlength="120" placeholder="${esc(t('svNeedP'))}" value="${esc(SV.needT)}" style="margin-top:6px">`:''}`:''}
   <div class="svtot">⏱ ${esc(t('svTot'))}: <b>${r.m?esc(t('min')(r.m)):'—'}</b></div>${r.ap?`<p class="small apn">🛑 ${esc(t('svAp'))}</p>`:''}
   ${c.pet?`<p class="tiny muted" style="margin:8px 0 0">🔒 ${esc(t('svKeep'))}${PETS.length?` <button type="button" class="linkb" id="kp-forget">${esc(t('svForget'))}</button>`:''}</p>`:''}</div>`;}
function svBind(){if(!svOn())return;const app=$('#app');const re=()=>{const k=keepF0();svApply();slot=null;draw();backF0(k);};
  app.querySelectorAll('[data-ks]').forEach(x=>x.onchange=()=>{const i=SV.ids.indexOf(x.dataset.ks);if(x.checked&&i<0)SV.ids.push(x.dataset.ks);if(!x.checked&&i>=0)SV.ids.splice(i,1);re();});
  app.querySelectorAll('[data-ksz]').forEach(b=>b.onclick=()=>{SV.pet.sz=+b.dataset.ksz;re();});
  app.querySelectorAll('[data-ksp]').forEach(b=>b.onclick=()=>{SV.pet.sp=b.dataset.ksp;re();});
  app.querySelectorAll('[data-kg]').forEach(b=>b.onclick=()=>{const g=b.dataset.kg;if(D.sv.pet&&(g==='ct'||g==='cc'))SV.pet.g[g]=+b.dataset.kk;else SV.g[g]=+b.dataset.kk;re();});
  app.querySelectorAll('[data-kp]').forEach(b=>b.onclick=()=>{const p=PETS[+b.dataset.kp];SV.newPet=false;SV.pet=JSON.parse(JSON.stringify(Object.assign({sp:'dog',sz:1,g:{}},p,{g:Object.assign({},p.g)})));re();});
  {const n=$('[data-kpn]');if(n)n.onclick=()=>{SV.newPet=true;SV.pet={sp:'dog',sz:1,g:{}};re();};}
  {const n=$('#kp-n');if(n)n.oninput=()=>{SV.pet.n=n.value;};const w=$('#kp-w');if(w)w.oninput=()=>{SV.pet.w=+w.value||0;};
   const br=$('#kp-br');if(br){br.oninput=()=>{SV.pet.br=br.value;};br.onchange=()=>{SV.pet.br=br.value.trim();const b=(D.sv.br||[]).find(x=>x[0]===SV.pet.br);if(b)SV.pet.sz=+b[1]||0;re();};}}
  {const nd=$('#kp-need');if(nd)nd.onchange=()=>{SV.need=nd.checked;re();};const nt=$('#kp-nt');if(nt)nt.oninput=()=>{SV.needT=nt.value;};}
  {const f=$('#kp-forget');if(f)f.onclick=()=>{try{localStorage.removeItem('kr-pets');}catch(_){}PETS=(D.pets||[]).slice();SV.newPet=!PETS.length;re();};}}
const pvList=()=>Array.isArray(D&&D.pv)&&D.pv.length>1?D.pv:null;
const whoObj=()=>who&&pvList()?pvList().find(p=>p.i===who):null;
function applyColor(c){if(!/^#[0-9a-f]{6}$/i.test(c||''))return;const r=document.documentElement.style;r.setProperty('--brand',c);
  const n=parseInt(c.slice(1),16),R=n>>16,G=n>>8&255,B=n&255;r.setProperty('--brand-soft',`rgba(${R},${G},${B},.16)`);document.querySelector('meta[name=theme-color]').content=c;}
function dayLabel(d){const td=isoDate(new Date()),tm=isoDate(new Date(Date.now()+864e5));const dt=new Date(d+'T12:00');
  return{top:d===td?t('today'):d===tm?t('tomorrow'):t('wd')[dt.getDay()],num:dt.getDate()+'/'+(dt.getMonth()+1),long:t('wdL')[dt.getDay()]+' '+dt.getDate()+'/'+(dt.getMonth()+1)};}
function liveSlots(){const now=new Date(),td=isoDate(now),nm=now.getHours()*60+now.getMinutes()+30;const out=[];const W=whoObj();
  for(const[d,list]of(W&&W.s?W.s:D.s)){if(d<td)continue;const L2=list.filter(m=>d>td||m>=nm);if(L2.length)out.push([d,L2]);}return out;}

function draw(){const app=$('#app');document.title=t('title')+(D?' · '+D.n:'');document.documentElement.lang=L;
  if(!D){app.innerHTML=`<div class="card done"><div class="big">🔗</div><p>${esc(window.__err||t('bad'))}</p>${window.__why?`<p class="tiny muted">(${esc(window.__why)})</p>`:''}</div>`;return;}
  if(svOn()&&!svCalc().m){app.innerHTML=`<div class="head"><div class="logo">📅</div><div><h1>${esc(D.n||t('title'))}</h1><p>${esc(t('title'))}</p></div><button class="lang" id="lg" aria-label="Language">${L==='el'?'🇬🇧':'🇬🇷'}</button></div>`+svBlock()+`<div class="card"><p class="small muted" style="margin:0">👆 ${esc(t('svPick'))}</p></div><footer>Ημερολόγιο · GlenApps</footer>`;bindLang();svBind();return;}
  const S=liveSlots();
  const head=`<div class="head"><div class="logo">📅</div><div><h1>${esc(D.n||t('title'))}</h1><p>${esc(PC&&!other?t('hiTop')(PC.n.split(' ')[0]):t('title'))}</p></div><button class="lang" id="lg" aria-label="Language">${L==='el'?'🇬🇧':'🇬🇷'}</button></div>`;
  if(!S.length){app.innerHTML=head+svBlock()+`<div class="card done"><div class="big">⏳</div><p>${esc(svOn()&&!D.off&&svCalc().m?t('svNoFit'):t(D.off?'off':'expired'))}</p>${D.off&&D.ph?`<a class="send" style="display:inline-block;margin-top:10px;background:var(--brand)" href="tel:${esc(intl(D.ph))}">📞 ${esc(t('call'))} ${esc(D.ph)}</a>`:''}</div>`;bindLang();svBind();return;}
  if(!day||!S.some(x=>x[0]===day))day=S[0][0];const cur=(S.find(x=>x[0]===day)||[,[]])[1];if(slot&&!cur.includes(slot))slot=null;
  const g=new Date(D.g);const ch=String(D.ch||'svwe');
  const saved=(()=>{try{return JSON.parse(localStorage.getItem('kr-me')||'{}');}catch(_){return{};}})();
  app.innerHTML=head+svBlock()+`
  <div class="card">${pvList()?(!pvOpen&&!who?`<button type="button" class="pvask" id="pvask">👤 ${esc(t('wantWho'))}</button>`:`<div class="pvrow"><b class="small">${esc(t('withWho'))}</b><div class="pvchips"><button type="button" class="pvc ${who?'':'on'}" data-pv="">${esc(t('anyone'))}</button>${pvList().map(p=>`<button type="button" class="pvc ${who===p.i?'on':''}" data-pv="${esc(p.i)}"><i style="background:${/^#[0-9a-f]{6}$/i.test(p.c||'')?p.c:'#999'}"></i>${esc(p.n)}</button>`).join('')}</div></div>`):''}<div class="vtabs"><button class="${mode==='cal'?'on':''}" data-mode="cal">📅 ${esc(t('calV'))}</button><button class="${mode==='list'?'on':''}" data-mode="list">☰ ${esc(t('listV'))}</button></div>
  ${mode==='cal'?weekHTML(S):`<div><h2>${esc(t('pick'))}</h2><div class="days">${S.map(([d,l])=>{const x=dayLabel(d);return`<button class="day ${d===day?'on':''}" data-d="${d}"><small>${esc(x.top)}</small><b>${esc(x.num)}</b><i>${esc(t('free')(l.length))}</i></button>`;}).join('')}</div>
   <h2 style="margin-top:14px">${esc(t('time'))}</h2><div class="times">${cur.map(m=>`<button class="time ${m===slot?'on':''}" data-m="${m}">${tstr(m)}</button>`).join('')||`<p class="muted small">${esc(t('none'))}</p>`}</div>
</div>`}
   <p class="tiny muted" style="margin:10px 0 0">${D.pm?esc(t('permNote')(D.n||'')):esc(t('asOf')(g.toLocaleString(L==='el'?'el-GR':'en-GB',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})))}</p></div>
  <div class="card"><h2>${esc(PC&&!other?t('hi')(PC.n.split(' ')[0]):t('you'))}</h2>
   ${slot?`<div class="sum">📅 ${esc(dayLabel(day).long)} · ${tstr(slot)}${whoObj()?` · 👤 ${esc(whoObj().n)}`:''}</div>`:''}
   <div class="${PC&&!other?'hidden':''}"><label class="f" for="nm">${esc(t('name'))}</label><input class="in" id="nm" autocomplete="name" maxlength="80" value="${esc(PC&&!other?PC.n:'')}">
   <label class="f" for="ph">${esc(t('phone'))}</label><input class="in" id="ph" type="tel" inputmode="tel" autocomplete="tel" maxlength="25" value="${esc(PC&&!other?PC.ph:'')}"></div>${!(PC&&!other)&&saved.n?`<button type="button" class="linkb" id="useme">${esc(t('useMe')(saved.n))}</button>`:''}
   ${PC&&!other?`<button type="button" class="linkb" id="notme">${esc(t('notMe')(PC.n))}</button>`:''}
   <label class="f" for="no">${esc(t('note'))}</label><textarea class="in" id="no" rows="2" maxlength="200"${D.hp?` placeholder="${esc(t('hpNote'))}"`:''}></textarea>${D.hp?`<p class="tiny muted" style="margin:4px 0 0">🩺 ${esc(t('hpNote'))}</p>`:''}
   <details class="adr"><summary class="small">${esc(t('addrS'))}</summary><input class="in" id="ad" autocomplete="street-address" maxlength="120" placeholder="${esc(t('addrP'))}" style="margin-top:8px"></details>
   <div class="cons"><b class="small">${esc(t('consT'))}</b>
    <label class="chk"><input type="checkbox" id="ca" checked><span>${esc(t('consA')(D.n||''))}</span></label>
    <label class="chk"><input type="checkbox" id="pr"><span>${esc(t('promo'))}</span></label>
    <p class="tiny muted" style="margin:6px 0 0">${esc(t('consNote'))}</p></div>
   <div class="err" id="er"></div>
   <h2 style="margin-top:12px">${esc(t('sendWith'))}</h2>
   <div class="sends">${D.ph&&ch.includes('v')?`<a class="send viber" data-via="v">${esc(t('viber'))}</a>`:''}${D.ph&&ch.includes('s')?`<a class="send sms" data-via="s">${esc(t('sms'))}</a>`:''}${D.ph&&ch.includes('w')?`<a class="send wa" data-via="w">${esc(t('wa'))}</a>`:''}${D.em&&ch.includes('e')?`<a class="send mail" data-via="e">${esc(t('mail'))}</a>`:''}</div>
   <p class="tiny muted" style="margin:12px 0 0">🔒 ${esc(t('priv')(D.n||''))}</p></div>
  <footer>Ημερολόγιο · GlenApps</footer>`;
  bindLang();svBind();const nm2=$('#notme');if(nm2)nm2.onclick=()=>{other=true;draw();};const um=$('#useme');if(um)um.onclick=()=>{$('#nm').value=saved.n||'';$('#ph').value=saved.p||'';um.remove();};
  app.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{day=b.dataset.d;slot=null;draw();});
  app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;draw();});
  {const pa=$('#pvask');if(pa)pa.onclick=()=>{const k=keepF0();pvOpen=true;draw();backF0(k);};}
  app.querySelectorAll('[data-pv]').forEach(b=>b.onclick=()=>{const k=keepF0();who=b.dataset.pv;draw();backF0(k);});
  app.querySelectorAll('[data-wk]').forEach(b=>b.onclick=()=>{wk+=+b.dataset.wk;draw();});
  const keepF=()=>Object.fromEntries([...app.querySelectorAll('input[id],textarea[id]')].map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));
  const backF=o=>{for(const[k,v]of Object.entries(o)){const e=document.getElementById(k);if(!e)continue;if(e.type==='checkbox')e.checked=v;else e.value=v;}};
  app.querySelectorAll('[data-wd]').forEach(b=>b.onclick=()=>{const k=keepF();day=b.dataset.wd;slot=+b.dataset.wm;draw();backF(k);$('.sum').scrollIntoView({behavior:'smooth',block:'center'});});
  app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const k=keepF();slot=+b.dataset.m;draw();backF(k);$('.sum').scrollIntoView({behavior:'smooth',block:'center'});});
  app.querySelectorAll('[data-via]').forEach(a=>a.onclick=e=>{e.preventDefault();send(a.dataset.via);});}
/* εβδομάδα σαν το ημερολόγιο: πράσινο = ελεύθερο, γκρι = πιασμένο (χωρίς ονόματα), χρώμα = δικό σου ραντεβού */
function mondayOf(d){const x=new Date(d+'T12:00');const k=(x.getDay()+6)%7;x.setDate(x.getDate()-k);return isoDate(x);}
function addD(d,n){const x=new Date(d+'T12:00');x.setDate(x.getDate()+n);return isoDate(x);}
function weekHTML(S){const map=new Map(S);const td=isoDate(new Date());const first=mondayOf(S[0][0]),last=mondayOf(S[S.length-1][0]);
  const weeks=[];for(let w=first;w<=last;w=addD(w,7))weeks.push(w);if(wk>=weeks.length)wk=weeks.length-1;if(wk<0)wk=0;const w0=weeks[wk];
  const days=[...Array(7)].map((_,i)=>addD(w0,i));const mine=new Map((D.my||[]).map(([d,s])=>[d+' '+s,1]));
  const all=S.flatMap(x=>x[1]).concat((D.my||[]).map(x=>{const[h,m]=x[1].split(':');return +h*60+ +m;}));
  let lo=Math.floor(Math.min(...all)/30)*30,hi=Math.max(...all);const rows=[];for(let m=lo;m<=hi;m+=30)rows.push(m);
  const nowM=new Date().getHours()*60+new Date().getMinutes();
  const head=days.map(d=>{const x=dayLabel(d);return`<div class="wh ${d===td?'today':''}"><small>${esc(t('wd')[new Date(d+'T12:00').getDay()])}</small><b>${new Date(d+'T12:00').getDate()}</b></div>`;}).join('');
  const body=rows.map(m=>`<div class="wt">${tstr(m)}</div>`+days.map(d=>{const L=map.get(d)||[];const key=d+' '+tstr(m);
     if(mine.has(key))return`<div class="wc mine" title="${esc(t('yours'))}">${esc(t('yoursS'))}</div>`;
     const free=L.includes(m)||(L.includes(m+15));const mm=L.includes(m)?m:m+15;
     if(free)return`<button class="wc free ${d===day&&mm===slot?'on':''}" data-wd="${d}" data-wm="${mm}" aria-label="${esc(dayLabel(d).long+' '+tstr(mm))}">${d===day&&mm===slot?'✓':''}</button>`;
     const past=d<td||(d===td&&m<nowM);const closed=!map.has(d);return`<div class="wc ${past?'past':closed?'closed':'busy'}"></div>`;}).join('')).join('');
  return`<div class="wnav"><button class="wbtn" data-wk="-1" ${wk?'':'disabled'}>‹</button><b>${esc(dayLabel(days[0]).num)} – ${esc(dayLabel(days[6]).num)}</b><button class="wbtn" data-wk="1" ${wk<weeks.length-1?'':'disabled'}>›</button></div>
   <div class="wgrid"><div></div>${head}${body}</div>
   <div class="wleg"><span><i class="wc free"></i>${esc(t('legFree'))}</span><span><i class="wc busy"></i>${esc(t('legBusy'))}</span>${(D.my||[]).length?`<span><i class="wc mine"></i>${esc(t('yours'))}</span>`:''}</div>
   ${slot?'':`<p class="small muted" style="margin:8px 0 0">${esc(t('tapGreen'))}</p>`}`;}
const keepF0=()=>Object.fromEntries([...document.querySelectorAll('#app input[id],#app textarea[id]')].map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));
const backF0=o=>{for(const[k,v]of Object.entries(o)){const e=document.getElementById(k);if(!e)continue;if(e.type==='checkbox')e.checked=v;else e.value=v;}};
function bindLang(){const b=$('#lg');if(b)b.onclick=()=>{L=L==='el'?'en':'el';draw();};}

async function send(via){const er=$('#er');er.textContent='';
  if(!slot)return er.textContent=t('needSlot');
  const n=clip($('#nm').value,80),ph=clip($('#ph').value,25),no=clip($('#no').value,200),pr=$('#pr').checked,ca=$('#ca').checked,ad=clip(($('#ad')||{}).value,120);
  if(n.length<2)return er.textContent=t('needName');
  if(ph.replace(/\D/g,'').length<8)return er.textContent=t('needPhone');
  if(!(PC&&!other))try{localStorage.setItem('kr-me',JSON.stringify({n,p:ph}));}catch(_){}
  let SVR=null;if(svOn()){SVR=svCalc();if(!SVR.m)return er.textContent=t('svPick');if(D.sv.pet){const nmP=String(SV.pet.n||'').trim();if(nmP.length<1)return er.textContent=t('svNeedPet');
      try{const L=petsLoad().filter(x=>x.n!==nmP);L.unshift({n:nmP.slice(0,40),sp:SV.pet.sp,br:clip(SV.pet.br,40),sz:SV.pet.sz|0,w:+SV.pet.w||0,g:SV.pet.g});localStorage.setItem('kr-pets',JSON.stringify(L.slice(0,8)));}catch(_){}}}
  const req={v:1,d:day,s:tstr(slot),u:D.u,n,ph,no,pr:pr?1:0,ca:ca?1:0,ad,ts:Date.now(),g:D.g,id:Math.random().toString(36).slice(2,10)};if(whoObj()){req.pv=whoObj().i;req.pn=clip(whoObj().n,40);}if(PC&&!other&&PC.i)req.sid=PC.i;
  if(SVR){req.sv=SVR.n;req.svi=SV.ids.slice(0,12);req.u=SVR.m;if(SVR.ap){req.ap=1;req.apw=clip(SVR.why.join(', '),120);}if(D.sv.pet)req.pt={n:clip(SV.pet.n,40),sp:SV.pet.sp,br:clip(SV.pet.br,40),sz:SV.pet.sz|0,w:+SV.pet.w||0,g:SV.pet.g,nt:SV.need?clip(SV.needT,120):''};}
  const link=new URL(D.a||'./',location.href).href.split('#')[0].split('?')[0].replace(/kratisi\.html$/,'')+'#/book?r='+await sealTxt('j',req);
  const when=dayLabel(day).long+' '+t('at')+' '+tstr(slot)+(whoObj()?' · '+t('with')+' '+whoObj().n:'');
  const svTxt=SVR?[(D.sv.pet&&SV.pet.n?t('svMsgPet')+': '+clip(SV.pet.n,40)+(SV.pet.br?' ('+clip(SV.pet.br,40)+')':''):''),t('svMsg')+': '+SVR.n.join(' + ')+' · '+t('min')(SVR.m),SVR.ap?t('svMsgAp')+': '+SVR.why.join(', '):''].filter(Boolean).join('\n'):'';
  const txt=t('msg')(D.o||'Ραντεβού',when,n,ph,(svTxt?svTxt+(no?'\n':''):'')+no,link,pr,ca,ad);
  let href;const num=intl(D.ph);
  if(via==='s')href=`sms:${num}${/iPhone|iPad|Mac/.test(navigator.userAgent)?'&':'?'}body=${encodeURIComponent(txt)}`;
  else if(via==='w')href=`https://wa.me/${num.replace(/^\+/,'')}?text=${encodeURIComponent(txt)}`;
  else if(via==='v'){LAST={via,txt,when,K:keepF0(),href:''};copyTxt(txt);return showVb();}
  else href=`mailto:${encodeURIComponent(D.em)}?subject=${encodeURIComponent(t('subj')+' — '+when)}&body=${encodeURIComponent(txt)}`;
  LAST={via,txt,when,K:keepF0(),href};openHref(via,href);
  setTimeout(showAsk,900);}
/* Δεν ξέρουμε αν ο πελάτης πάτησε «Αποστολή» μέσα στην εφαρμογή μηνυμάτων: τον ρωτάμε, δεν λέμε «στάλθηκε» από μόνοι μας */
let LAST=null;
function copyTxt(x){try{navigator.clipboard&&navigator.clipboard.writeText(x).catch(()=>{});}catch(_){}}
function openHref(via,href){if(via==='w')window.open(href,'_blank','noopener');else location.href=href;}
const smsHref=txt=>`sms:${intl(D.ph)}${/iPhone|iPad|Mac/.test(navigator.userAgent)?'&':'?'}body=${encodeURIComponent(txt)}`;
function askBtns(){const ch=String(D.ch||'svwe');return`${LAST.via!=='s'&&D.ph&&ch.includes('s')?`<a class="send sms" id="as-sms" style="display:block;margin-top:8px">💬 ${esc(t('trySms'))}</a>`:''}<button class="time" id="as-back" style="margin-top:8px">← ${esc(t('again'))}</button>`;}
function bindAsk(){const y=$('#as-yes');if(y)y.onclick=()=>showSent(LAST.when);const re=$('#as-re');if(re)re.onclick=()=>{openHref(LAST.via,LAST.href);};
  const sm=$('#as-sms');if(sm)sm.onclick=e=>{e.preventDefault();LAST.via='s';LAST.href=smsHref(LAST.txt);location.href=LAST.href;setTimeout(showAsk,900);};
  const bk=$('#as-back');if(bk)bk.onclick=()=>{const K=LAST.K;draw();backF0(K);};}
function showAsk(){$('#app').innerHTML=`<div class="card done"><div class="big">📨</div><h2>${esc(t('askT'))}</h2><p class="small">📅 ${esc(LAST.when)}</p>
   <p class="note small">${esc(t('askP')(D.n||''))}</p>
   <button class="send wa" id="as-yes" style="display:block;width:100%;margin:10px 0 8px">✅ ${esc(t('askYes'))}</button>
   <button class="time" id="as-re">🔁 ${esc(t('askRe'))}</button>${askBtns()}</div>`;bindAsk();}
function showVb(){const num=intl(D.ph);const vh=`viber://chat?number=${encodeURIComponent(num)}&draft=${encodeURIComponent(LAST.txt)}`;LAST.href=vh;
  $('#app').innerHTML=`<div class="card done"><div class="big">💜</div><h2>${esc(t('vbT'))}</h2><p class="small">📅 ${esc(LAST.when)}</p>
   <ol class="steps"><li>${esc(t('vb1'))}</li><li>${esc(t('vb2')(D.n||'',D.ph||''))}</li><li>${esc(t('vb3'))}</li><li>${esc(t('vb4'))}</li></ol>
   <a class="send viber" id="vb-open" href="${esc(vh)}" style="display:block;width:100%;margin:10px 0 8px">💜 ${esc(t('vbOpen')(D.n||''))}</a>
   <button class="time" id="vb-copy">📋 ${esc(t('vbCopy'))}</button>
   <button class="send wa" id="as-yes" style="display:block;width:100%;margin:12px 0 0">✅ ${esc(t('askYes'))}</button>${askBtns()}</div>`;
  $('#vb-open').onclick=()=>copyTxt(LAST.txt);$('#vb-copy').onclick=()=>{copyTxt(LAST.txt);const b=$('#vb-copy');b.textContent='✓ '+t('copied');};bindAsk();}
function icsFile(){const p=n=>String(n).padStart(2,'0');const st=new Date(day+'T'+tstr(slot)+':00');const en=new Date(st.getTime()+(D.u||45)*60000);
  const f=d=>d.getUTCFullYear()+p(d.getUTCMonth()+1)+p(d.getUTCDate())+'T'+p(d.getUTCHours())+p(d.getUTCMinutes())+'00Z';const e=x=>String(x||'').replace(/[\\,;]/g,m=>'\\'+m).replace(/\n/g,'\\n');
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GlenApps Imerologio//EL','BEGIN:VEVENT','UID:'+Date.now()+'@imerologio','DTSTAMP:'+f(new Date()),'DTSTART:'+f(st),'DTEND:'+f(en),'SUMMARY:'+e((D.o||'Ραντεβού')+' — '+(D.n||'')),'DESCRIPTION:'+e(t('pending')),'BEGIN:VALARM','TRIGGER:-PT2H','ACTION:DISPLAY','DESCRIPTION:'+e(D.o||'Ραντεβού'),'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='rantevou.ics';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500);}
function showSent(when){$('#app').innerHTML=`<div class="card done"><div class="big">✅</div><h2>${esc(t('sentT'))}</h2><p class="small">📅 ${esc(when)}</p><p class="muted small">${esc(t('sentP')(D.n||''))}</p>
   <a class="send viber" id="mine" style="display:block;width:100%;margin:12px 0 8px">📅 ${esc(t('addMine'))}</a>
   <button class="send sms" id="ics" style="display:block;width:100%;margin:0 0 8px">📲 ${esc(t('addCal'))}</button><button class="time" id="bk">${esc(t('again'))}</button></div>
   <div class="card promo"><b>${esc(t('ownT'))}</b><p class="small muted" style="margin:4px 0 8px">${esc(t('ownP'))}</p><a class="time" href="${esc(new URL('./',location.href).href)}" target="_blank" rel="noopener">⬇️ ${esc(t('ownB'))}</a></div>`;
  $('#bk').onclick=draw;$('#ics').onclick=icsFile;
  const mq={v:1,d:day,s:tstr(slot),u:D.u,n:D.n||'',ph:D.ph||'',no:'',id:'m'+Math.random().toString(36).slice(2,9)};
  sealTxt('j',mq).then(c=>{const m=$('#mine');if(m)m.href=new URL('./',location.href).href.split('?')[0].split('#')[0]+'#/mine?r='+c;});}

/* ---------- εκκίνηση ---------- */
(async()=>{try{let k=new URLSearchParams(location.hash.slice(1)).get('k')||new URLSearchParams(location.search).get('k');if(!k)throw new Error('χωρίς δεδομένα');k=await openTxt(k);if(!k)throw new Error('ο σύνδεσμος δεν ανοίγει');
    D=await unpack(k);if(!D||D.v!==1||!Array.isArray(D.s))throw 0;
    D.n=clip(D.n,60);D.o=clip(D.o,30);D.ph=clip(D.ph,25);D.em=clip(D.em,80);
    if(D.l==='en'||D.l==='el'){try{if(!localStorage.getItem('glen-lang'))L=String(navigator.language||'').toLowerCase().startsWith('el')?'el':(D.l||L);}catch(_){}}
    if(D.pc&&D.pc.n){PC={i:clip(D.pc.i,60),n:clip(D.pc.n,80),ph:clip(D.pc.ph,25)};}
    if(svOn()){D.u0=D.u;PETS=petsLoad();if(PETS.length){SV.pet=JSON.parse(JSON.stringify(Object.assign({sp:'dog',sz:1,g:{}},PETS[0],{g:Object.assign({},PETS[0].g)})));}else SV.newPet=true;svApply();}
    applyColor(D.c);}catch(e){D=null;window.__err=/Unterminated|Unexpected end|Bad control|JSON/i.test(String(e&&e.message))?(T[L]||T.el).cut:(T[L]||T.el).bad;window.__why=String(e&&e.message||e).slice(0,80);}
  draw();})();
