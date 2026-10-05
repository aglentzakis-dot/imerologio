/* Ημερολόγιο — κοινό κομμάτι ραντεβού για όλες τις εφαρμογές GlenApps.
   © 2026 Ανδρέας Μ. Γλεντζάκης (Andreas M. Glentzakis). Με την επιφύλαξη παντός δικαιώματος. All rights reserved.
   Απαγορεύεται η αντιγραφή, τροποποίηση και διάθεση, εν όλω ή εν μέρει, χωρίς προηγούμενη γραπτή άδεια του κατόχου.

   Προέλευση: το ημερολόγιο «Ραντεβού» του LUMIO, απομονωμένο και γενικό για κάθε επάγγελμα.
   Τι πρέπει να δίνει η εφαρμογή που το φιλοξενεί (όπως κάνει το app.js του «Ημερολογίου»):
     S.data.students   τα πρόσωπα (πελάτες, ασθενείς, μαθητές…) — {id,name,phone,contacts:[{name,phone,email}],color,loc}
     S.data.settings / business / appts / blocks / closed / waitlist / remSent  (δημιουργούνται μόνα τους)
     S.user.name, S.meta.org
     save(), render(), getStudent(id), myStudents(), stuName(p)
     LX(λέξη)  οι λέξεις του επαγγέλματος: who, whoAcc, whoPl, whoPlL, one
     IM_DEF    προεπιλογές νέου ραντεβού: kind() 'once'|'weekly', dur() λεπτά, start(ημερομηνία) 'ΩΩ:ΛΛ'
     IM_NEWPERSON(όνομα)  φτιάχνει νέο πρόσωπο και γυρίζει το id του
     LOGO, markPNG()  (λογότυπο στα PDF)
   Ο χώρος σελίδας είναι το #main και η πλοήγηση γίνεται με #/agenda?view=…
*/
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)).replace(/-/g,'').slice(0,16);
const pad=n=>String(n).padStart(2,'0');
const isoDate=(d=new Date())=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayISO=()=>isoDate(new Date());
const MONTHS=['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'];
const MONTHS_G=['Ιανουαρίου','Φεβρουαρίου','Μαρτίου','Απριλίου','Μαΐου','Ιουνίου','Ιουλίου','Αυγούστου','Σεπτεμβρίου','Οκτωβρίου','Νοεμβρίου','Δεκεμβρίου'];
const fmtDate=iso=>{if(!iso)return'';const d=new Date(iso.length<=10?iso+'T12:00':iso);return d.getDate()+' '+MONTHS_G[d.getMonth()]+' '+d.getFullYear();};
const fmtShort=iso=>{if(!iso)return'';const d=new Date(iso.length<=10?iso+'T12:00':iso);return pad(d.getDate())+'/'+pad(d.getMonth()+1);};
function toast(msg,type=''){let t=$('.toasts');if(!t){t=document.createElement('div');t.className='toasts';document.body.appendChild(t);}const e=document.createElement('div');e.className='toast '+type;e.textContent=msg;t.appendChild(e);setTimeout(()=>e.remove(),type==='bad'?5200:3200);}
const MODALS=[];
let HSKIP=0,NAVQ=null,SPARE=0;
const topModal=()=>{for(let i=MODALS.length-1;i>=0;i--){if(MODALS[i].ov.isConnected)return MODALS[i];MODALS.splice(i,1);}return null;};
const DIRTY_Q='Έχεις αλλαγές που δεν αποθηκεύτηκαν. Να κλείσει χωρίς αποθήκευση;';
function modal(html,{wide=false,onClose,noHist=false,guard=true}={}){const ov=document.createElement('div');ov.className='ov';ov.innerHTML=`<div class="dlg ${wide?'wide':''}" role="dialog">${html}</div>`;document.body.appendChild(ov);
  const rec={ov,dirty:false,pushed:false};
  if(guard){const mark=e=>{if(!e.target.closest('form')||e.target.closest('[data-nodirty],#rp-q,input[type=search]'))return;rec.dirty=true;};ov.addEventListener('input',mark);ov.addEventListener('change',mark);
    ov.addEventListener('click',e=>{const b=e.target.closest('form button[type=button],form .tsb button');if(b&&!b.closest('[data-close],.hlp'))rec.dirty=true;},true);}
  if(!noHist){if(SPARE>0){SPARE--;rec.pushed=true;}else{try{history.pushState({lm:Date.now()},'');rec.pushed=true;}catch(e){}}}
  MODALS.push(rec);
  const close=(fromPop)=>{if(!ov.isConnected)return;ov.remove();const i=MODALS.indexOf(rec);if(i>=0)MODALS.splice(i,1);if(rec.pushed&&fromPop!==true){SPARE++;setTimeout(()=>{if(SPARE>0){SPARE--;HSKIP++;try{history.back();}catch(e){HSKIP--;}}else if(NAVQ&&!HSKIP){const h=NAVQ;NAVQ=null;location.hash=h;}},120);}onClose&&onClose();};
  rec.close=close;
  const ask=async()=>!rec.dirty||await confirmDlg(DIRTY_Q,{ok:'Κλείσιμο χωρίς αποθήκευση',danger:true});
  ov.addEventListener('click',async e=>{const c=e.target===ov||e.target.closest('[data-close]');if(!c)return;const a=e.target.closest&&e.target.closest('a[href^="#"][data-close]');if(a)e.preventDefault();
    if(!await ask())return;if(a){const h=a.getAttribute('href');if(rec.pushed)NAVQ=h;close();if(!rec.pushed)location.hash=h;return;}close();});
  return{el:ov.firstElementChild,close:()=>close(),dirty:v=>{rec.dirty=v!==false;}};}
function confirmDlg(text,{ok='Ναι',danger=false,cancel='Άκυρο'}={}){return new Promise(res=>{const m=modal(`<p style="margin-top:0">${text}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-x="0">${esc(cancel)}</button><button class="btn ${danger?'danger':'pri'}" data-x="1">${esc(ok)}</button></div>`,{onClose:()=>res(false),noHist:true,guard:false});m.el.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(b){res(b.dataset.x==='1');m.el.parentElement.remove();}});});}
function promptDlg(title,{type='text',placeholder='',value='',okText='Εντάξει'}={}){return new Promise(res=>{const m=modal(`<h3>${title}</h3><input class="in" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}" autocomplete="off"><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-x="0">Άκυρο</button><button class="btn pri" data-x="1">${esc(okText)}</button></div>`,{onClose:()=>res(null),noHist:true,guard:false});const inp=$('input',m.el);setTimeout(()=>inp.focus(),50);const done=v=>{res(v);m.el.parentElement.remove();};inp.addEventListener('keydown',e=>{if(e.key==='Enter')done(inp.value);});m.el.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(b)done(b.dataset.x==='1'?inp.value:null);});});}
const _libs={};
function loadScript(src){if(_libs[src])return _libs[src];_libs[src]=new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>{delete _libs[src];rej(new Error('Δεν φορτώθηκε η βιβλιοθήκη — χρειάζεται σύνδεση στο διαδίκτυο.'));};document.head.appendChild(s);});return _libs[src];}
async function makePDF(el,filename){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');let mk=null;try{mk=await markPNG();}catch(e){}
  /* το html2pdf αντιγράφει το στοιχείο με τα στυλ του: αν είναι κρυμμένο έξω από την οθόνη, η αντιγραφή βγαίνει κι αυτή έξω → κενό PDF. Το κρύβουμε σε περιτύλιγμα και το αφήνουμε κανονικό. */
  let wrap=null;if(el.style&&/fixed|absolute/.test(el.style.position)&&parseInt(el.style.left)<0){wrap=document.createElement('div');wrap.style.cssText='position:fixed;left:-10000px;top:0;width:794px;overflow:hidden';el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);el.style.position='static';el.style.left='0';el.style.top='0';el.style.width='794px';el.style.background='#fff';}
  try{await makePDF2(el,filename,mk);}finally{if(wrap){wrap.parentNode&&wrap.parentNode.insertBefore(el,wrap);wrap.remove();}}}
async function makePDF2(el,filename,mk){
  await window.html2pdf().set({margin:[10,10,12,10],filename,image:{type:'jpeg',quality:.95},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['li','.s','.card','svg']}}).from(el).toPdf().get('pdf').then(pdf=>{if(!mk)return;const n=pdf.internal.getNumberOfPages();for(let i=1;i<=n;i++){pdf.setPage(i);pdf.addImage(mk,'PNG',0,0,210,297,'mark','FAST');}}).save();}
function downloadText(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
const ICONS={
home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
chart:'<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/>',
calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
file:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
wallet:'<path d="M3 7a2 2 0 0 1 2-2h12v2"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>',
settings:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
right:'<path d="m9 6 6 6-6 6"/>',left:'<path d="m15 6-6 6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',up:'<path d="m18 15-6-6-6 6"/>',
sparkles:'<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
game:'<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4M15.5 12h.01M18 14h.01"/>',
puzzle:'<path d="M10 4a2 2 0 0 1 4 0v2h4v4h-2a2 2 0 0 0 0 4h2v4h-4v-2a2 2 0 0 0-4 0v2H6v-4H4a2 2 0 0 1 0-4h2V6h4z"/>',
book:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>',
upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',download:'<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
shield:'<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/>',
cloud:'<path d="M7 18a5 5 0 0 1-.6-10A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
refresh:'<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
play:'<path d="M7 5v14l12-7z"/>',
send:'<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m10 13 4-4"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
printer:'<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
more:'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
x:'<path d="M6 6l12 12M18 6 6 18"/>',check:'<path d="m5 12 5 5 9-10"/>',
bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
repeat:'<path d="M4 12V9a3 3 0 0 1 3-3h13l-3-3M20 12v3a3 3 0 0 1-3 3H4l3 3"/>',
link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
building:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
volume:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
folder:'<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
image:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/>',
alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
trend:'<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
inbox:'<path d="M3 13h5l1 3h6l1-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>',
undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
logout:'<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
question:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5M12 16.8h.01"/>',
cards:'<rect x="3" y="7" width="13" height="14" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/>',
clip:'<path d="m20 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.4 3.4 0 0 1 4.8 4.8l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/>',
userplus:'<circle cx="9" cy="8" r="4"/><path d="M2 21c.7-4 3.6-6 7-6s6.3 2 7 6M19 8v6M16 11h6"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
minus:'<path d="M5 12h14"/>',
palette:'<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1.1.2-2.2 1.4-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
route:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>'
};
function ic(n,s=18){return`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||ICONS.info}</svg>`;}
const telLink=p=>String(p||'').replace(/[^\d+]/g,'');
function sessMin(s,e){if(!s||!e)return 0;const[a,b]=s.split(':').map(Number),[c,d]=e.split(':').map(Number);let m=(c*60+d)-(a*60+b);if(m<0)m+=1440;return m;}
const M=()=>$('#main');
const fd=form=>Object.fromEntries(new FormData(form).entries());
const opt=(v,l,sel)=>`<option value="${esc(v)}" ${String(sel)===String(v)?'selected':''}>${esc(l??v)}</option>`;
function go(path){if(HSKIP||SPARE){NAVQ='#/'+path;return;}location.hash='#/'+path;}
const pageHead=(title,sub,actions='',eyebrow='')=>`<div class="page-head"><div>${eyebrow?`<div class="eyebrow">${eyebrow}</div>`:''}<h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
const emptyHTML=(icon,title,text,action='')=>`<div class="card empty"><div class="e">${ic(icon,34)}</div><b>${title}</b>${text?`<div class="small">${text}</div>`:''}${action?`<div style="margin-top:14px">${action}</div>`:''}</div>`;
function busy(text){const m=modal(`<div class="loading"><div class="sun">${LOGO}</div><b style="color:var(--ink)">${text}</b></div>`);m.el.parentElement.onclick=null;return m;}
const hoursTxt=min=>`${Math.floor(min/60)}ώ ${pad(min%60)}λ`;
const hoursNum=min=>(min/60).toLocaleString('el-GR',{maximumFractionDigits:2});
const WDAYS=['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'];
const WDAYS_S=['Κυρ','Δευ','Τρί','Τετ','Πέμ','Παρ','Σάβ'];
const DAY_ORDER=[1,2,3,4,5,6,0];
const wdOf=iso=>new Date(iso+'T12:00').getDay();
const tmin=t=>{const[a,b]=String(t||'0:0').split(':').map(Number);return a*60+(b||0);};
const tstr=m=>pad(Math.floor(m/60)%24)+':'+pad(m%60);
const addDays=(iso,n)=>{const d=new Date(iso+'T12:00');d.setDate(d.getDate()+n);return isoDate(d);};
const mondayOf=iso=>{const d=new Date(iso+'T12:00');const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return isoDate(d);};
const REPEAT=[['once','Μία φορά'],['weekly','Κάθε εβδομάδα'],['biweekly','Κάθε 2 εβδομάδες']];
function appts(){return S.data.appts=S.data.appts||[];}
function agCfg(){return S.data.settings.agenda=Object.assign({from:'09:00',to:'21:00',step:60,days:[1,2,3,4,5,6]},S.data.settings.agenda||{});}
function closedDays(){return S.data.closed=S.data.closed||{};}
function orthEaster(y){const a=y%4,b=y%7,c=y%19,d=(19*c+15)%30,e=(2*a+4*b-d+34)%7;const mo=Math.floor((d+e+114)/31),da=(d+e+114)%31+1;const j=new Date(y,mo-1,da,12);j.setDate(j.getDate()+13);return isoDate(j);}
function grHolidays(y){const E=orthEaster(y);const F=(m,d)=>`${y}-${pad(m)}-${pad(d)}`;
  return[['ny',F(1,1),'Πρωτοχρονιά',1],['epi',F(1,6),'Θεοφάνεια',1],['tri',F(1,30),'Τριών Ιεραρχών (σχολεία)',0],['kd',addDays(E,-48),'Καθαρά Δευτέρα',1],['25m',F(3,25),'25η Μαρτίου',1],
   ['mp',addDays(E,-2),'Μεγάλη Παρασκευή',1],['ms',addDays(E,-1),'Μεγάλο Σάββατο',1],['pa',E,'Κυριακή του Πάσχα',1],['dp',addDays(E,1),'Δευτέρα του Πάσχα',1],['pm',F(5,1),'Πρωτομαγιά',1],
   ['ap',addDays(E,50),'Αγίου Πνεύματος',1],['15a',F(8,15),'Κοίμηση της Θεοτόκου',1],['28o',F(10,28),'Επέτειος του «Όχι»',1],['pol',F(11,17),'Πολυτεχνείο (σχολεία)',0],
   ['xm',F(12,24),'Παραμονή Χριστουγέννων',0],['xr',F(12,25),'Χριστούγεννα',1],['sy',F(12,26),'Σύναξη της Θεοτόκου',1],['pp',F(12,31),'Παραμονή Πρωτοχρονιάς',0]].map(([id,date,name,def])=>({id,date,name,def:!!def}));}
const HOLC={};
function holList(y){return HOLC[y]=HOLC[y]||grHolidays(y);}
function holOn(h){const H=biz().hol||{};return H[h.id]!==undefined?!!H[h.id]:h.def;}
function holidayOf(d){if(biz().holOff)return'';const h=holList(+d.slice(0,4)).find(x=>x.date===d&&holOn(x));return h?h.name:'';}
function isClosed(d){const C=closedDays();if(C[d]===false)return false;return!!C[d]||!!holidayOf(d);}
let ROLES=[['owner','Υπεύθυνος',1],['staff','Συνεργάτης',1],['assistant','Βοηθός',1],['secretary','Γραμματεία',0],['other','Άλλη ειδικότητα',1]];
const STAFF_COLORS=['#7462B4','#3A8A61','#C77A3A','#2F7FA8','#B4527A','#8A7A2E','#5A6ACF','#A0522D','#2E8C8C','#9C5BB5'];
function biz(){const B=S.data.business=S.data.business||{};const D={name:'',meTeaches:true,meRole:'owner',meColor:'#7462B4',staff:[]};for(const k in D)if(B[k]===undefined)B[k]=Array.isArray(D[k])?[]:D[k];return B;}
const roleName=(r,custom)=>r==='other'&&custom?custom:(ROLES.find(x=>x[0]===r)||[0,'Άλλη ειδικότητα'])[1];
const roleTeaches=r=>!!(ROLES.find(x=>x[0]===r)||[0,0,1])[2];
function providers(){const B=biz();const L=[];if(B.meTeaches)L.push({id:'me',name:S.user.name||'Εγώ',short:'Εγώ',color:B.meColor||'#7462B4',role:B.meRole});
  B.staff.filter(x=>x.appts).forEach(x=>L.push({id:x.id,name:x.name,short:(x.name||'').split(' ')[0],color:x.color,role:x.role,custom:x.custom}));
  if(!L.length)L.push({id:'me',name:S.user.name||'Εγώ',short:'Εγώ',color:B.meColor||'#7462B4',role:B.meRole});return L;}
const provOf=a=>(a&&a.by)||'me';
const provOcc=o=>(o&&o.by)||provOf(o&&o.a);
function provById(id){const B=biz();if(id==='me')return{id:'me',name:S.user.name||'Εγώ',short:'Εγώ',color:B.meColor||'#7462B4',role:B.meRole};const x=B.staff.find(y=>y.id===id);return x?{id,name:x.name,short:(x.name||'').split(' ')[0],color:x.color,role:x.role,custom:x.custom}:{id,name:'—',short:'—',color:'#999'};}
const provIni=p=>(p.id==='me'?'Ε':(p.name||'?').trim()[0]||'?').toUpperCase();
let AGF='';
function agStaff(){try{const v=localStorage.getItem('imer-agstaff')||'';return providers().some(p=>p.id===v)&&providers().length>1?v:'';}catch(e){return'';}}
function occ(from,to,{sid,withCancel,by}={}){const out=[];const cl=closedDays();const B=by!==undefined?by:AGF;
  for(const a of appts()){if(sid&&a.sid!==sid)continue;if(!S.data.students.some(s=>s.id===a.sid))continue;
    const push=d=>{if(d<from||d>to||isClosed(d))return;const x=(a.ex||{})[d];if(x&&x.st==='moved')return;if(x&&x.st==='cancel'&&!withCancel)return;const done=!!(x&&x.st==='done');out.push({a,date:d,s:a.s,e:a.e,by:(x&&x.by)||undefined,st:x&&x.st==='cancel'?'cancel':x&&x.st==='absent'?'absent':done?'done':'',key:a.id+'|'+d});};
    if(a.kind==='once'){push(a.date);continue;}
    let d=from>a.date?from:a.date;const wd=+a.d;const off=(wd-wdOf(d)+7)%7;d=addDays(d,off);
    for(;d<=to;d=addDays(d,7)){if(a.until&&d>a.until)break;if(a.kind==='biweekly'){const wk=Math.round((new Date(mondayOf(d))-new Date(mondayOf(a.date)))/6048e5);if(wk%2)continue;}push(d);}}
  return(B?out.filter(o=>provOcc(o)===B):out).sort((x,y)=>(x.date+x.s).localeCompare(y.date+y.s));}
function weeklySlots(sid){return appts().filter(a=>a.sid===sid&&a.kind!=='once'&&(!a.until||a.until>=todayISO())).map(a=>({id:a.id,d:+a.d,s:a.s,e:a.e,kind:a.kind}));}
function conflicts(date,s,e,skipId,by){return occ(date,date,{by:by||''}).concat(blockOcc(date,date,{by:by||''})).filter(o=>o.a.id!==skipId&&(!by||provOcc(o)===by)&&tmin(o.s)<tmin(e)&&tmin(s)<tmin(o.e));}
function freeSlots(date){const c=agCfg();if(!c.days.includes(wdOf(date))||isClosed(date))return[];const L=occ(date,date).concat(blockOcc(date,date));const P=AGF?[AGF]:providers().map(p=>p.id);const out=[];for(let t=tmin(c.from);t+c.step<=tmin(c.to);t+=c.step){const s=tstr(t);if(P.some(pid=>!L.some(o=>provOcc(o)===pid&&tmin(o.s)<t+c.step&&t<tmin(o.e))))out.push(s);}return out;}
function nextFree(){const now=new Date();let d=todayISO();for(let i=0;i<21;i++,d=addDays(d,1)){const F=freeSlots(d).filter(s=>i>0||tmin(s)>now.getHours()*60+now.getMinutes());if(F.length)return{date:d,s:F[0]};}return null;}
const stOf=id=>S.data.students.find(s=>s.id===id);
function pvBadge(a,full){const pid=a&&a.a?provOcc(a):provOf(a);if(providers().length<2&&pid==='me')return'';const p=provById(pid);return full?`<span class="pvtag"><i style="background:${p.color}">${provIni(p)}</i>${esc(p.short)}</span>`:`<i class="pvb" style="background:${p.color}" title="${esc(p.name)}">${provIni(p)}</i>`;}
const kindTxt=k=>k==='weekly'?'Πάγιο':k==='biweekly'?'Ανά 2 εβδ.':'Μία φορά';
function apptCard(o,{compact}={}){const st=stOf(o.a.sid)||{};return`<button type="button" class="appt ${apStateCls(o)} k-${o.a.kind} ${st.color?'hasc':''}" data-ap="${o.key}" ${st.color?`style="--sc:${st.color}"`:''}><span class="av">${st.avatar||'🙂'}</span><span class="grow"><b>${esc(stuName(st))}</b><small>${pvBadge(o,1)}${o.s}–${o.e}${compact?'':' · '+kindTxt(o.a.kind)}${o.st==='done'?' · ήρθε':o.st==='absent'?' · απουσία':o.st==='cancel'?' · ακυρώθηκε':''}</small></span>${o.st==='done'?ic('check',15):o.st==='absent'||o.st==='cancel'?ic('x',15):''}</button>`;}
function laneLayout(list){const L=list.slice().sort((a,b)=>tmin(a.s)-tmin(b.s)||(tmin(b.e)-tmin(b.s))-(tmin(a.e)-tmin(a.s)));const out=[];let cl=[],clEnd=-1;
  const flush=()=>{const cols=[];cl.forEach(o=>{let i=cols.findIndex(end=>end<=tmin(o.s));if(i<0){i=cols.length;cols.push(0);}cols[i]=tmin(o.e);o.lane=i;});cl.forEach(o=>{o.lanes=cols.length;
    let span=1;for(let j=o.lane+1;j<cols.length;j++){if(cl.some(p=>p.lane===j&&tmin(p.s)<tmin(o.e)&&tmin(o.s)<tmin(p.e)))break;span++;}o.span=span;out.push(o);});cl=[];clEnd=-1;};
  L.forEach(o=>{if(cl.length&&tmin(o.s)>=clEnd)flush();cl.push(o);clEnd=Math.max(clEnd,tmin(o.e));});if(cl.length)flush();return out;}
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
const isLive=o=>o.date===todayISO()&&!o.st&&tmin(o.s)<=nowMin()&&nowMin()<tmin(o.e);
const isActive=o=>!o.st&&(o.date>todayISO()||(o.date===todayISO()&&tmin(o.e)>nowMin()));
function apStateCls(o){return o.st==='cancel'?'cancel':o.st==='done'?'done':o.st==='absent'?'absent':isLive(o)?'live':isActive(o)?'active':'past';}
let PPM=(()=>{try{const v=+localStorage.getItem('imer-agzoom');return v>=.5&&v<=3?v:1.15;}catch(e){return 1.15;}})();
function agLock(){try{const o=JSON.parse(localStorage.getItem('imer-aglock')||'null');if(o&&o.from&&o.to)return o;}catch(e){}const c=agCfg();return{on:false,from:c.from,to:c.to};}
function agRange(){const L=agLock();if(L.on){const f=tmin(L.from),t=Math.max(tmin(L.to),f+60);return[f,t];}return[0,1440];}
function timelineHTML(days,L){const c=agCfg();const[f,t]=agRange();const wf=tmin(c.from),wt=tmin(c.to);const H=Math.round((t-f)*PPM);const today=todayISO();const nm=nowMin();
  const hours=[];for(let m=Math.ceil(f/60)*60;m<=t;m+=60)hours.push(m);
  return`<div class="tl" style="--cols:${days.length}"><div class="tl-head">${days.length>1?'<div></div>':''}${days.map(d=>{const la=loadAttr(d);if(days.length===1)return agDayHead(d,today,la,c);return`<a href="#/agenda?view=day&d=${d}" class="tl-dh ${la.cls} ${isClosed(d)?'closed':''} ${d===today?'today':''} ${c.days.includes(wdOf(d))&&!isClosed(d)?'':'off'}" style="${la.sty}" title="${la.tip}"><span>${WDAYS_S[wdOf(d)]}</span><b>${+d.slice(8)}</b>${la.txt?`<small class="ldt">${la.txt}</small>`:''}${day24HTML(d)}</a>`;}).join('')}</div>
   <div class="tl-scroll" id="tlScroll"><div class="tl-body" style="height:${H}px"><div class="tl-times">${hours.map(m=>`<span style="top:${Math.round((m-f)*PPM)}px">${tstr(m)}</span>`).join('')}</div>
   ${days.map(d=>{const off=!c.days.includes(wdOf(d))||isClosed(d);const X=laneLayout(L.filter(o=>o.date===d).concat(blockOcc(d,d)));
     return`<div class="tl-col ${off?'off':''} ${isClosed(d)?'closed':''} ${d===today?'today':''}" data-col="${d}">${hours.map(m=>`<i class="tl-line" style="top:${Math.round((m-f)*PPM)}px"></i>`).join('')}${wf>f?`<i class="tl-offh" style="top:0;height:${Math.round((Math.min(wf,t)-f)*PPM)}px"></i>`:''}${wt<t?`<i class="tl-offh" style="top:${Math.round((Math.max(wt,f)-f)*PPM)}px;bottom:0"></i>`:''}
      ${X.map(o=>{const top=Math.round((tmin(o.s)-f)*PPM),h=Math.max(22,Math.round((tmin(o.e)-tmin(o.s))*PPM)-2);const w=100/o.lanes;
        if(o.blk){const b=o.blk;return`<button type="button" class="tl-ev tl-blk" data-blk="${o.key}" data-s="${o.s}" data-e="${o.e}" style="top:${top}px;height:${h}px;left:calc(${o.lane*w}% + 2px);width:calc(${w*o.span}% - 4px);--bc:${blkColor(b)}" title="${esc(blkTitle(b))} ${o.s}–${o.e}">${pvBadge(o)}<b>${blkCat(b)[2]} ${esc(blkTitle(b))}</b><small>${o.s}–${o.e}</small><i class="rsz" aria-hidden="true"></i></button>`;}
        const st=getStudent(o.a.sid)||stOf(o.a.sid)||{};
        return`<button type="button" class="tl-ev ${apStateCls(o)} k-${o.a.kind} ${st.color?'hasc':''}" data-ap="${o.key}" data-s="${o.s}" data-e="${o.e}" style="top:${top}px;height:${h}px;left:calc(${o.lane*w}% + 2px);width:calc(${w*o.span}% - 4px)${st.color?';--sc:'+st.color:''}" title="${esc(stuName(st))} ${o.s}–${o.e}">${pvBadge(o)}<b>${st.avatar||''} ${esc(stuName(st))}</b><small>${o.s}–${o.e}${isLive(o)?' · τώρα':''}</small><i class="rsz" aria-hidden="true"></i></button>`;}).join('')}
      ${(()=>{const all=L.filter(o=>o.date===d).concat(blockOcc(d,d));const up=all.filter(o=>tmin(o.e)<=f),dn=all.filter(o=>tmin(o.s)>=t);return(up.length?`<span class="tl-more up" title="${up.map(o=>o.s).join(', ')}">↑ ${up.length} πριν τις ${tstr(f)}</span>`:'')+(dn.length?`<span class="tl-more dn" title="${dn.map(o=>o.s).join(', ')}">↓ ${dn.length} μετά τις ${tstr(t)}</span>`:'');})()}${d===today&&nm>=f&&nm<=t?`<i class="tl-now" style="top:${Math.round((nm-f)*PPM)}px"></i>`:''}</div>`;}).join('')}</div></div></div>`;}
function dayLoad(d){const c=agCfg();const f=tmin(c.from),t=Math.max(tmin(c.to),f+30);const cap=t-f;if(!c.days.includes(wdOf(d))||isClosed(d))return{off:true,busy:0,cap,frac:0};
  const P=AGF?[AGF]:providers().map(p=>p.id);const O=occ(d,d).concat(blockOcc(d,d));let busy=0;
  for(const pid of P){const iv=O.filter(o=>provOcc(o)===pid).map(o=>[Math.max(f,tmin(o.s)),Math.min(t,tmin(o.e))]).filter(x=>x[1]>x[0]).sort((a,b)=>a[0]-b[0]);let cs=-1,ce=-1;
    for(const[a,b]of iv){if(a>ce){busy+=Math.max(0,ce-cs);cs=a;ce=b;}else ce=Math.max(ce,b);}busy+=Math.max(0,ce-cs);}
  const capT=cap*P.length;return{off:false,busy,cap:capT,frac:Math.min(1,busy/capT),n:P.length};}
const hN=m=>{const h=m/60;return Number.isInteger(h)?String(h):h.toFixed(1).replace('.',',');};
function loadAttr(d){const L=dayLoad(d);if(L.off)return{cls:'',sty:'',txt:'',tip:''};const fr=L.frac;const hue=Math.round(130*(1-fr));
  return{cls:`ld ${fr>=1?'ld-full':''}`,sty:`--ld:${Math.round(fr*100)}%;--lc:hsl(${hue} 68% 55%)`,txt:`${hN(L.busy)}/${hN(L.cap)}`,tip:`Πληρότητα: ${hN(L.busy)} από ${hN(L.cap)} ώρες ραντεβού${L.n>1?` (${L.n} άτομα × ${hN(L.cap/L.n)} ώρες)`:''} — ${Math.round(fr*100)}%`};}
function monthHTML(ym,sel){const c=agCfg();const[Y,Mo]=ym.split('-').map(Number);const first=`${ym}-01`;const start=mondayOf(first);const last=isoDate(new Date(Y,Mo,0));const end=addDays(mondayOf(last),6);
  const L=occ(start,end,{withCancel:true});const LB=blockOcc(start,end);const today=todayISO();const f=tmin(c.from),t=tmin(c.to);const slots=[];for(let m=f;m<t;m+=60)slots.push(m);const cells=[];for(let d=start;d<=end;d=addDays(d,1))cells.push(d);
  return`<div class="mgrid"><div class="mwd">${DAY_ORDER.map(d=>`<span>${WDAYS_S[d]}</span>`).join('')}</div><div class="mdays">${cells.map(d=>{const X=L.filter(o=>o.date===d);const off=!c.days.includes(wdOf(d))||isClosed(d);const out=d.slice(0,7)!==ym;
    const act=X.filter(o=>isLive(o)||isActive(o)).length;
    const XB=LB.filter(o=>o.date===d);const bar=off?'':`<div class="hbar" title="Ώρες εργασίας: πιασμένες και ελεύθερες">${slots.map(m=>{const n=X.filter(o=>o.st!=='cancel'&&tmin(o.s)<m+60&&m<tmin(o.e)).length;const bk=XB.find(o=>tmin(o.s)<m+60&&m<tmin(o.e));return bk&&!n?`<i class="hb" style="background:${blkColor(bk.blk)}"></i>`:`<i class="h${Math.min(n,3)}"></i>`;}).join('')}</div>`;
    const la=out?{cls:'',sty:'',tip:''}:loadAttr(d);return`<a href="#/agenda?view=day&d=${d}" style="${la.sty}" title="${la.tip}" class="mday ${la.cls} ${isClosed(d)&&!out?'closed':''} ${d===sel?'sel':''} ${d===today?'today':''} ${out?'out':''} ${off?'off':''}">${isClosed(d)&&!out?`<span class="mhol">${esc(holidayOf(d)||'Κλειστά')}</span>`:''}<div class="mtop"><b>${+d.slice(8)}</b>${X.filter(o=>o.st!=='cancel').length?`<span class="mcount ${act?'act':''}">${X.filter(o=>o.st!=='cancel').length}</span>`:''}</div>${bar}${out?'':day24HTML(d)}
     <div class="mev">${X.slice().sort((p,q)=>{const r=o=>isLive(o)?0:isActive(o)?1:2;return r(p)-r(q)||p.s.localeCompare(q.s);}).slice(0,3).sort((p,q)=>p.s.localeCompare(q.s)).map(o=>{const st=stOf(o.a.sid)||{};return`<span class="mchip ${apStateCls(o)}">${o.s} ${esc((stuName(st)||'').split(' ')[0])}</span>`;}).join('')}${X.length>3?`<span class="mmore">+${X.length-3} ακόμα</span>`:''}</div></a>`;}).join('')}</div></div>`;}
function viewAgenda(r){AGF=agStaff();try{return viewAgenda2(r);}finally{AGF='';}}
function viewAgenda2(r){const c=agCfg();const t=todayISO();const PV=providers();const by=AGF;let view=r.q.view;if(!['month','week','day','list'].includes(view)){try{view=localStorage.getItem('imer-agview');}catch(e){}if(!['month','week','day','list'].includes(view))view=innerWidth>960?'week':'day';}try{localStorage.setItem('imer-agview',view);}catch(e){}
  const sel=r.q.d||(view==='month'&&r.q.m?(r.q.m===t.slice(0,7)?t:r.q.m+'-01'):t);const w=mondayOf(r.q.w||sel);const ym=r.q.m||sel.slice(0,7);
  const nav=view==='month'?(()=>{const[Y,Mo]=ym.split('-').map(Number);const p=isoDate(new Date(Y,Mo-2,1)).slice(0,7),n=isoDate(new Date(Y,Mo,1)).slice(0,7);return[`#/agenda?view=month&m=${p}`,`#/agenda?view=month`,`#/agenda?view=month&m=${n}`,`${MONTHS[Mo-1]} ${Y}`];})()
    :view==='week'?[`#/agenda?view=week&w=${addDays(w,-7)}`,`#/agenda?view=week`,`#/agenda?view=week&w=${addDays(w,7)}`,`Εβδομάδα ${fmtShort(w)} – ${fmtShort(addDays(w,6))}`]
    :[`#/agenda?view=day&d=${addDays(sel,-1)}`,`#/agenda?view=day`,`#/agenda?view=day&d=${addDays(sel,1)}`,`${WDAYS[wdOf(sel)]} ${fmtDate(sel)}`];
  const days=[...Array(7)].map((_,i)=>addDays(w,i));const LWa=occ(w,addDays(w,6),{withCancel:true});const LW=LWa.filter(o=>o.st!=='cancel');const work=days.filter(d=>c.days.includes(wdOf(d)));const freeN=work.reduce((a,d)=>a+freeSlots(d).length,0);const mins=LW.reduce((a,o)=>a+sessMin(o.s,o.e),0);
  M().innerHTML=`${agHead(pageHead('Ραντεβού',nav[3],`<button class="btn pri" id="agNew">${ic('plus',16)} Ραντεβού</button><button class="btn" id="agBlk" title="Ώρες που δεν είσαι διαθέσιμος: διάλειμμα, δεύτερη δουλειά, προσωπικά">${ic('plus',16)} Δέσμευση</button><button class="iconbtn" id="agCfg" aria-label="Ωράριο" title="Ωράριο">${ic('settings',18)}</button><button class="iconbtn" id="agPdf" aria-label="Εκτύπωση / PDF" title="Εκτύπωση / PDF">${ic('printer',18)}</button>`))}
   <div class="agbar"><div class="seg">${[['month','Μήνας'],['week','Εβδομάδα'],['day','Ημέρα'],['list','Λίστα']].map(([k,l])=>`<a href="#/agenda?view=${k}&d=${sel}" class="${view===k?'on':''}">${l}</a>`).join('')}</div>
<button type="button" class="btn sm" id="agRem" title="Μηνύματα υπενθύμισης">${ic('bell',15)} Υπενθυμίσεις</button>${view==='week'?`<button type="button" class="btn sm" id="agCopyW" title="Αντιγραφή των ραντεβού μίας φοράς σε άλλη εβδομάδα">${ic('copy',15)} Αντιγραφή εβδομάδας</button>`:''}<button type="button" class="btn sm" id="agWait" title="Όσοι περιμένουν ελεύθερη θέση">${ic('users',15)} Αναμονή${waitlist().length?` <span class="rbadge">${waitlist().length}</span>`:''}</button>${view==='week'||view==='day'?(()=>{const L=agLock();return`<button type="button" class="btn sm ${L.on?'soft':''}" id="agLock" title="Ποιες ώρες φαίνονται">${ic(L.on?'lock':'clock',15)} ${L.on?L.from+'–'+L.to:'24ωρο'}</button>`;})():''}</div>
   <div class="aglegend"><span><i class="live"></i>Τώρα</span><span><i class="active"></i>Ενεργό</span><span><i class="done"></i>Ολοκληρώθηκε</span><span><i class="cancel"></i>Ακυρώθηκε</span><span><i class="absent"></i>Απουσία</span><span><i class="once"></i>Μία φορά</span><span><i class="blk"></i>Δέσμευση</span></div>
   ${PV.length>1?`<div class="pvbar" role="group" aria-label="Προσωπικό"><button type="button" class="pvf ${by?'':'on'}" data-pvf="">${ic('users',14)} Όλοι <small>${PV.length}</small></button>${PV.map(p=>`<button type="button" class="pvf ${by===p.id?'on':''}" data-pvf="${p.id}"><i style="background:${p.color}">${provIni(p)}</i>${esc(p.short)}<small>${esc(roleName(p.role,p.custom))}</small></button>`).join('')}</div>`:''}
   ${view==='list'?agListHTML(r):view==='month'?`${periodHead(nav,nav[3],ym===t.slice(0,7),nav[1])}${monthHTML(ym,sel)}<div class="card section" style="margin-top:14px"><div class="card-h"><h3>${WDAYS[wdOf(sel)]} ${fmtDate(sel)}</h3><a class="btn sm" href="#/agenda?view=day&d=${sel}">Ανάλυση ημέρας ${ic('right',14)}</a></div>${(()=>{const X=occ(sel,sel,{withCancel:true});const XB=blockOcc(sel,sel);const F=freeSlots(sel);return(X.length?`<div class="aglist">${X.map(o=>apptCard(o)).join('')}</div>`:'<p class="small muted" style="margin:0">Κανένα ραντεβού.</p>')+(XB.length?`<div class="aglist" style="margin-top:8px">${XB.map(blockChipHTML).join('')}</div>`:'')+(F.length?`<div class="small" style="margin-top:12px"><b>Ελεύθερες ώρες:</b> ${F.map(s=>`<button class="chipt" data-new="${sel}|${s}">${s}</button>`).join(' ')}</div>`:'');})()}</div>`
    :`<div class="kpis kmini section"><div class="kpi"><div class="k">Ραντεβού εβδομάδας</div><div class="v sm">${LW.length}</div></div><div class="kpi"><div class="k">Ώρες ραντεβού</div><div class="v sm">${hoursNum(mins)}</div></div><div class="kpi"><div class="k">Ελεύθερες ώρες</div><div class="v sm" style="color:var(--ok)">${freeN*c.step/60}</div></div><div class="kpi"><div class="k">Πάγιοι ${LX('whoPlL')}</div><div class="v sm">${new Set(appts().filter(a=>a.kind!=='once'&&(!a.until||a.until>=t)).map(a=>a.sid)).size}</div></div></div>
     ${view==='day'?`${daystripHTML(sel,t)}
       <div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="small muted">${isClosed(sel)?`<b style="color:var(--bad)">Κλειστά${holidayOf(sel)?' — '+esc(holidayOf(sel)):''}</b> — τα πάγια αυτής της μέρας δεν εμφανίζονται.`:'Πάτα σε κενό σημείο για νέο ραντεβού εκείνη την ώρα.'}</span><button class="btn sm ghost" data-close-day="${sel}">${isClosed(sel)?'Άνοιγμα ημέρας':'Κλειστά αυτή τη μέρα'}</button></div>`:''}
     ${view==='week'?periodHead(nav,nav[3].replace('Εβδομάδα ',''),w===mondayOf(t),nav[1]):''}${timelineHTML(view==='week'?days:[sel],LWa.concat(view==='day'&&!days.includes(sel)?occ(sel,sel,{withCancel:true}):[]))}`}`;
  $('#agNew').onclick=()=>apptDialog({date:sel,by});$('#agBlk').onclick=()=>blockDialog({date:sel,by});const lk=$('#agLock');if(lk)lk.onclick=agLockDialog;$('#agWait').onclick=waitlistDialog;$('#agRem').onclick=()=>remindDialog(view==='day'&&sel>todayISO()?sel:undefined);const cw=$('#agCopyW');if(cw)cw.onclick=()=>copyWeekDialog(w);const zo=$('#agZo');if(zo){zo.onclick=()=>agZoom(PPM/1.25);$('#agZi').onclick=()=>agZoom(PPM*1.25);}agGestures(view,nav);if(view==='list')agListBind();$$('[data-pvf]').forEach(b=>b.onclick=()=>{try{localStorage.setItem('imer-agstaff',b.dataset.pvf);}catch(e){}render();});$('#agCfg').onclick=agendaCfgDialog;$('#agPdf').onclick=()=>exportDialog('pdf',{sel,w,ym});
  $$('.tl-col').forEach(col=>col.addEventListener('click',e=>{if(e.target.closest('.tl-ev')||col.classList.contains('off'))return;const y=e.clientY-col.getBoundingClientRect().top;const[rf,rt]=agRange();const m=rf+Math.floor(y/PPM/30)*30;apptDialog({date:col.dataset.col,s:tstr(Math.max(rf,Math.min(m,rt-30))),by});}));
  clearInterval(viewAgenda.tk);viewAgenda.tk=setInterval(()=>{if(!/^#\/agenda/.test(location.hash))return clearInterval(viewAgenda.tk);const n=$('.tl-now');if(n){const f=agRange()[0];n.style.top=Math.round((nowMin()-f)*PPM)+'px';}},60000);
  const ds=$('#dstrip');if(ds){const on=$('.dchip.on',ds);if(on)ds.scrollLeft=on.offsetLeft-ds.clientWidth/2+on.clientWidth/2;}
  const sc=$('#tlScroll');if(sc){const[rf]=agRange();const nl=$('.tl-now');const target=nl?nowMin()-60:Math.max(rf,tmin(c.from)-30);sc.scrollTop=Math.max(0,(target-rf)*PPM);}
  agPosRestore();}
function daystripHTML(sel,t){const c=agCfg();const ym=sel.slice(0,7);const[Y,Mo]=ym.split('-').map(Number);const last=+isoDate(new Date(Y,Mo,0)).slice(8);
  const mv=k=>{const d=new Date(Y,Mo-1+k,1);const dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(+sel.slice(8),dim));const iso=isoDate(d);return iso.slice(0,7)===t.slice(0,7)?t:iso;};
  const days=[...Array(last)].map((_,i)=>`${ym}-${pad(i+1)}`);const O=occ(`${ym}-01`,`${ym}-${pad(last)}`);
  const nf=nextFreeFrom(t);let busyD=0,fullD=0,workD=0;
  const chips=days.map(d=>{const off=!c.days.includes(wdOf(d))||isClosed(d);const n=O.filter(o=>o.date===d).length;const la=loadAttr(d);const F=off?[]:freeSlots(d).filter(x=>d!==t||tmin(x)>nowMin());
    if(!off){workD++;if(n)busyD++;if(!freeSlots(d).length)fullD++;}
    const full=!off&&!freeSlots(d).length;const sub=isClosed(d)?(holidayOf(d)?'αργία':'κλειστά'):off?'ρεπό':d<t||(d===t&&!F.length&&!full)?(n?n+' ραντ.':'—'):full?'γεμάτη':`κενό ${F[0]}`;
    return`<a href="#/agenda?view=day&d=${d}" data-dd="${d}" class="dchip ${la.cls} ${isClosed(d)?'closed':''} ${d===sel?'on':''} ${d===t?'today':''} ${d<t?'pastd':''} ${off?'off':''} ${wdOf(d)===1?'wk':''}" style="${la.sty}" title="${isClosed(d)?esc(holidayOf(d)||'Κλειστά'):la.tip}"><span>${WDAYS_S[wdOf(d)]}</span><b>${+d.slice(8)}</b>${n?`<em class="dn">${n}</em>`:''}<small class="${F.length&&d>=t?'fr':''}">${sub}</small>${la.txt?`<small class="ldt">${la.txt}</small>`:''}${day24HTML(d)}</a>`;}).join('');
  return`<div class="dstrip-h"><div class="seg" style="align-items:center"><a href="#/agenda?view=day&d=${mv(-1)}" aria-label="Προηγούμενος μήνας">${ic('left',16)}</a><a href="#/agenda?view=day&d=${mv(0)===t?t:ym+'-01'}" class="dsm">${MONTHS[Mo-1]} ${Y}</a><a href="#/agenda?view=day&d=${mv(1)}" aria-label="Επόμενος μήνας">${ic('right',16)}</a></div>
    <div class="row" style="gap:6px">${sel!==t?`<a class="btn sm" href="#/agenda?view=day&d=${t}">${ic('calendar',14)} Σήμερα</a>`:''}${nf?`<button type="button" class="btn sm soft" data-new="${nf.date}|${nf.s}" title="Κλείσε ραντεβού στο πρώτο ελεύθερο κενό">${ic('plus',14)} Πρώτο κενό: ${nf.date===t?'σήμερα':WDAYS_S[wdOf(nf.date)]+' '+fmtShort(nf.date)} ${nf.s}</button>`:''}</div></div>
   <div class="dstrip" id="dstrip">${chips}</div>
   <div class="dstat tiny muted">${MONTHS[Mo-1]}: ${O.length} ραντεβού · ${busyD}/${workD} εργάσιμες με ραντεβού · ${fullD?`<b style="color:var(--bad)">${fullD} γεμάτες</b>`:'καμία γεμάτη'}</div>`;}
function agDayHead(sel,t,la,c){const dd=Math.round((new Date(sel+'T12:00')-new Date(t+'T12:00'))/864e5);const rel=dd===0?'Σήμερα':dd===1?'Αύριο':dd===-1?'Χθες':'';const y=+sel.slice(0,4);const off=!c.days.includes(wdOf(sel))||isClosed(sel);
  return`<div class="tl-dh one dayhd ${la.cls} ${dd===0?'today':''} ${isClosed(sel)?'closed':''} ${off?'offday':''}" style="${la.sty}" title="${la.tip}"><a class="dayarr" href="#/agenda?view=day&d=${addDays(sel,-1)}" aria-label="Προηγούμενη μέρα">${ic('left',22)}</a>
    <div class="dayt"><b>${WDAYS[wdOf(sel)]} ${+sel.slice(8)} ${MONTHS_G[+sel.slice(5,7)-1]}${y!==+t.slice(0,4)?' '+y:''}</b><span class="daysub">${rel?`<span class="dayrel">${rel}</span>`:''}${off?`<span class="dayoff">${isClosed(sel)?'Κλειστά':'Μη εργάσιμη'}</span>`:''}${la.txt?`<small class="ldt">${la.txt}</small>`:''}</span>${day24HTML(sel)}</div>
    <a class="dayarr" href="#/agenda?view=day&d=${addDays(sel,1)}" aria-label="Επόμενη μέρα">${ic('right',22)}</a></div>`;}
const agHead=h=>h.replace('class="page-head"','class="page-head aghd"');
function periodHead(nav,label,cur,todayHref){return`<div class="perhd"><a class="dayarr" href="${nav[0]}" aria-label="Προηγούμενο">${ic('left',22)}</a><div class="dayt"><b>${esc(label)}</b>${cur?'':`<a class="dayrel" href="${todayHref}">Σήμερα</a>`}</div><a class="dayarr" href="${nav[2]}" aria-label="Επόμενο">${ic('right',22)}</a></div>`;}
function nextFreeFrom(t){const now=nowMin();let d=t;for(let i=0;i<45;i++,d=addDays(d,1)){const F=freeSlots(d).filter(s=>i>0||tmin(s)>now);if(F.length)return{date:d,s:F[0]};}return null;}
function richPick({title,items,sel=[],multi=false,search=false,hint='',onNew=null}){return new Promise(res=>{let cur=sel.slice();let done=false;
  const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">${esc(title)}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>${hint?`<p class="small muted" style="margin-top:0">${hint}</p>`:''}
   ${search?`<input class="in" id="rp-q" placeholder="Αναζήτηση…" autocomplete="off" style="margin-bottom:10px">`:''}<div class="rplist" id="rp"></div>
   ${multi?`<div class="row" style="justify-content:space-between;margin-top:14px"><span class="small muted" id="rp-n"></span><span class="row"><button class="btn" data-close>Άκυρο</button><button class="btn pri" id="rp-ok">${ic('check',16)} Εντάξει</button></span></div>`:''}`,{onClose:()=>{if(!done)res(null);}});
  const draw=()=>{const q=(($('#rp-q',md.el)||{}).value||'').trim().toLowerCase();$('#rp',md.el).innerHTML=(onNew?`<button type="button" class="rprow rpnew" data-rpnew="1"><span class="av">${ic('plus',18)}</span><span class="grow"><b>${q?'Νέος: «'+esc(q)+'»':'Νέος'}</b><small>Μπαίνει στη λίστα και επιλέγεται</small></span></button>`+(window.IM_CONTACTS_OK&&IM_CONTACTS_OK()?`<button type="button" class="rprow rpnew" data-rpcon="1"><span class="av">${ic('users',18)}</span><span class="grow"><b>Από τις επαφές του κινητού</b><small>Διάλεξε έναν ή περισσότερους</small></span></button>`:''):'')+items.filter(x=>!q||(x.label+' '+(x.sub||'')).toLowerCase().includes(q)).map(x=>`<button type="button" class="rprow ${cur.includes(x.id)?'on':''} ${x.dim?'dim':''}" data-rp="${x.id}">${x.av?`<span class="av">${x.av}</span>`:x.color?`<i class="pvb" style="background:${x.color}">${x.ini||''}</i>`:''}<span class="grow"><b>${esc(x.label)}</b>${x.sub?`<small>${x.sub}</small>`:''}</span>${x.badge||''}<span class="rpck">${cur.includes(x.id)?ic('check',18):''}</span></button>`).join('')||'<p class="small muted">Δεν βρέθηκε.</p>';const n=$('#rp-n',md.el);if(n)n.textContent=cur.length?`Επιλέχθηκαν ${cur.length}`:'';};draw();
  const q=$('#rp-q',md.el);if(q){q.oninput=draw;setTimeout(()=>innerWidth>700&&q.focus(),60);}
  $('#rp',md.el).onclick=async e=>{if(onNew&&e.target.closest('[data-rpcon]')){const L=await IM_PICKCONTACTS(multi);if(!L||!L.length)return;const ids=L.map(c=>{const id=onNew(c.name,c);items.unshift({id,label:c.name,av:c.name[0].toUpperCase()});return id;});if(!multi){done=true;md.close();return res([ids[0]]);}cur=cur.concat(ids);draw();return;}if(onNew&&e.target.closest('[data-rpnew]')){let nm=(($('#rp-q',md.el)||{}).value||'').trim();if(!nm)nm=((await promptDlg('Όνομα'))||'').trim();if(!nm)return;const id=onNew(nm);items.unshift({id,label:nm,av:nm[0].toUpperCase()});const qq=$('#rp-q',md.el);if(qq)qq.value='';if(!multi){done=true;md.close();return res([id]);}cur=cur.concat(id);draw();return;}const b=e.target.closest('[data-rp]');if(!b)return;const id=b.dataset.rp;if(!multi){done=true;md.close();return res([id]);}cur=cur.includes(id)?cur.filter(y=>y!==id):cur.concat(id);draw();};
  const ok=$('#rp-ok',md.el);if(ok)ok.onclick=()=>{done=true;md.close();res(cur);};});}
function slotsFor(date,pv,dur,skipId){const c=agCfg();if(!c.days.includes(wdOf(date))||isClosed(date))return[];const L=occ(date,date,{by:pv}).concat(blockOcc(date,date,{by:pv})).filter(o=>o.a.id!==skipId);const out=[];const now=date===todayISO()?nowMin():-1;
  for(let t=tmin(c.from);t+dur<=tmin(c.to);t+=30){if(t<=now)continue;if(!L.some(o=>tmin(o.s)<t+dur&&t<tmin(o.e)))out.push(tstr(t));}return out;}
function apptDialog({date,s,e:e0,a,by,sids}={}){const c=agCfg();const st=myStudents();const edit=!!a;const PV=providers();let pv=a?provOf(a):(by||PV[0].id);const multiPV=PV.length>1||(a&&a.by);
  let sel=a?[a.sid]:(sids||[]).slice();let kind=a?a.kind:IM_DEF.kind();const st0=a?a.s:(s||IM_DEF.start(date));let wk=mondayOf(a?a.date:date||todayISO());
  const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">${edit?'Αλλαγή ραντεβού':'Νέο ραντεβού'}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   ${edit?'':`<button type="button" class="btn sm ghost" id="a-blk" style="margin:-4px 0 8px">${ic('l-flag',14)} Δεν είναι ραντεβού; Δήλωσε δέσμευση (διάλειμμα, προσωπικό…)</button>`}<form id="af"><label class="f">${LX('who')}</label><button type="button" class="pickbtn field" id="a-st" ${edit?'disabled':''}></button>
   ${multiPV?`<label class="f">Ποιος το αναλαμβάνει</label><button type="button" class="pickbtn field" id="a-pv"></button>`:''}
   <div class="seg field" id="ak">${REPEAT.map(([k,l])=>`<button type="button" data-k="${k}" class="${kind===k?'on':''}">${l}</button>`).join('')}</div>
   <div class="field"><label class="f" for="a-d">Ημερομηνία</label><input class="in" type="date" id="a-d" name="date" required value="${a?a.date:date||todayISO()}"></div>
   <div class="avail field" id="a-av"></div>
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="a-s">Έναρξη</label><input class="in" type="time" id="a-s" name="s" required value="${st0}"></div><div class="field"><label class="f" for="a-e">Λήξη</label><input class="in" type="time" id="a-e" name="e" required value="${a?a.e:e0||tstr(tmin(st0)+IM_DEF.dur())}"></div></div>
   <div class="field" id="a-uw"><label class="f" for="a-u">Μέχρι (προαιρετικό)</label><input class="in" type="date" id="a-u" name="until" value="${a&&a.until||''}"><div class="tiny muted" style="margin-top:4px">Π.χ. τέλος σχολικής χρονιάς. Κενό = χωρίς λήξη.</div></div>
   <div class="field"><label class="f" for="a-n">Σημείωση</label><input class="in" id="a-n" name="note" value="${esc(a&&a.note||'')}"></div>
   <div id="a-cf"></div>
   <div class="row" style="justify-content:space-between">${edit?`<button type="button" class="btn danger" id="a-del">${ic('trash',16)} Διαγραφή</button>`:'<span></span>'}<span class="row"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Αποθήκευση</button></span></div></form>`,{wide:true});
  const f=$('#af',md.el);const dur=()=>Math.max(15,tmin(f.e.value)-tmin(f.s.value)||IM_DEF.dur());
  const busyTxt=(pid)=>{const X=occ(f.date.value,f.date.value,{by:pid}).filter(o=>(!a||o.a.id!==a.id)&&tmin(o.s)<tmin(f.e.value)&&tmin(f.s.value)<tmin(o.e));return X.length?`έχει ραντεβού ${X.map(o=>o.s+'–'+o.e).join(', ')}`:'';};
  const drawSt=()=>{const L=sel.map(stOf).filter(Boolean);$('#a-st',md.el).innerHTML=L.length?`<span class="pkav">${L.slice(0,4).map(x=>`<span class="av">${x.avatar||'🙂'}</span>`).join('')}</span><span class="grow"><b>${L.map(x=>esc(stuName(x))).join(', ')}</b>${L.length>1?`<small>${L.length} ${LX('whoPlL')} — ένα ραντεβού για τον καθένα</small>`:''}</span>${edit?'':ic('down',18)}`:`<span class="grow muted">Διάλεξε ${LX('whoAcc')}…</span>${ic('down',18)}`;};
  const drawPv=()=>{const b=$('#a-pv',md.el);if(!b)return;const p=provById(pv);const bz=busyTxt(pv);b.innerHTML=`<i class="pvb" style="background:${p.color}">${provIni(p)}</i><span class="grow"><b>${esc(p.id==='me'?(S.user.name||'Εγώ')+' (εγώ)':p.name)}</b><small>${esc(roleName(p.role,p.custom))}${bz?` · <span style="color:var(--bad)">${bz}</span>`:''}</small></span>${ic('down',18)}`;};
  const drawAv=()=>{const d=f.date.value;if(!d)return;if(mondayOf(d)!==wk&&!$('#a-av',md.el).dataset.nav)wk=mondayOf(d);delete $('#a-av',md.el).dataset.nav;const days=[...Array(7)].map((_,i)=>addDays(wk,i));const t=todayISO();const du=dur();
    const F=slotsFor(d,pv,du,a&&a.id);const p=provById(pv);
    $('#a-av',md.el).innerHTML=`<div class="spread" style="margin-bottom:6px"><label class="f" style="margin:0">Διαθεσιμότητα${multiPV?` · ${esc(p.id==='me'?'εσύ':p.short)}`:''}</label><span class="seg"><button type="button" data-wk="-7" aria-label="Προηγούμενη εβδομάδα">${ic('left',14)}</button><button type="button" data-wk="7" aria-label="Επόμενη εβδομάδα">${ic('right',14)}</button></span></div>
     <div class="avdays">${days.map(x=>{const cl=isClosed(x),off=!c.days.includes(wdOf(x));const n=slotsFor(x,pv,du,a&&a.id).length;const past=x<t;
       return`<button type="button" class="avd ${x===d?'on':''} ${cl?'closed':''} ${off&&!cl?'off':''} ${past?'past':''} ${!cl&&!off&&!past?(n?'free':'full'):''}" data-avd="${x}" ${past?'disabled':''}><span>${WDAYS_S[wdOf(x)]}</span><b>${+x.slice(8)}</b><small>${cl?(holidayOf(x)?'αργία':'κλειστά'):off?'ρεπό':past?'—':n?n+' κενά':'γεμάτη'}</small></button>`;}).join('')}</div>
     <div class="avslots">${isClosed(d)?`<span class="small" style="color:var(--bad)">${ic('x',14)} ${esc(holidayOf(d)||'Κλειστά')} — διάλεξε άλλη μέρα.</span>`:!c.days.includes(wdOf(d))?'<span class="small muted">Εκτός ωραρίου λειτουργίας.</span>':F.length?`<span class="tiny muted" style="width:100%">Ελεύθερα για ${hoursTxt(du)} — πάτα για να μπει η ώρα:</span>${F.map(x=>`<button type="button" class="chipt ${x===f.s.value?'on':''}" data-avs="${x}">${x}</button>`).join('')}`:'<span class="small" style="color:var(--bad)">Δεν υπάρχει ελεύθερο κενό αυτή τη μέρα για αυτή τη διάρκεια.</span>'}</div>`;};
  const chk=()=>{$('#a-uw',md.el).style.display=kind==='once'?'none':'';const C=conflicts(f.date.value,f.s.value,f.e.value,a&&a.id,pv).filter(o=>!sel.includes(o.a.sid));const cl=isClosed(f.date.value);
    $('#a-cf',md.el).innerHTML=(cl?`<div class="note small field" style="background:var(--cxbg);color:var(--cxtx)">${ic('alert',14)} Η μέρα είναι κλειστή${holidayOf(f.date.value)?' ('+esc(holidayOf(f.date.value))+')':''} — το ραντεβού δεν θα εμφανίζεται.</div>`:'')+(C.length?`<div class="note small field" style="background:var(--pink)">${ic('alert',14)} Την ίδια ώρα${multiPV?' με '+esc(pv==='me'?'εσένα':provById(pv).short):''}: ${C.map(o=>esc(stuName(stOf(o.a.sid)))+' '+o.s+'–'+o.e).join(', ')}.${kind!=='once'?' (έλεγχος για την πρώτη φορά)':''}</div>`:'');drawPv();drawAv();};
  let mats=a?(a.mats||[]).slice():[];
  drawSt();
  $('#a-st',md.el).onclick=async()=>{if(edit)return;const r=await richPick({title:LX('whoPl'),multi:true,search:true,onNew:IM_NEWPERSON,sel,hint:'Διάλεξε έναν ή περισσότερους — μπαίνει ένα ραντεβού για τον καθένα.',items:st.map(x=>{const w=weeklySlots(x.id);return{id:x.id,label:stuName(x),av:x.avatar||'🙂',sub:w.length?'Πάγιο: '+w.map(y=>WDAYS_S[y.d]+' '+y.s).join(', '):''};})});
    if(!r)return;sel=r;md.dirty();if(sel.length===1&&!a){const w=weeklySlots(sel[0])[0];if(w)f.e.value=tstr(tmin(f.s.value)+sessMin(w.s,w.e));}drawSt();chk();};
  const pvb=$('#a-pv',md.el);if(pvb)pvb.onclick=async()=>{const L=PV.some(p=>p.id===pv)?PV:PV.concat(provById(pv));const r=await richPick({title:'Ποιος το αναλαμβάνει',sel:[pv],hint:`${WDAYS[wdOf(f.date.value)]} ${fmtShort(f.date.value)} · ${f.s.value}–${f.e.value}`,
    items:L.map(p=>{const bz=busyTxt(p.id);return{id:p.id,label:p.id==='me'?(S.user.name||'Εγώ')+' (εγώ)':p.name,color:p.color,ini:provIni(p),sub:esc(roleName(p.role,p.custom)),badge:bz?`<span class="chip bad">${esc(bz)}</span>`:`<span class="chip ok">ελεύθερος</span>`};})});if(r){pv=r[0];md.dirty();chk();}};
  md.el.addEventListener('click',e=>{const k=e.target.closest('[data-k]');if(k){kind=k.dataset.k;$$('[data-k]',md.el).forEach(x=>x.classList.toggle('on',x===k));chk();}
    const w=e.target.closest('[data-wk]');if(w){wk=addDays(wk,+w.dataset.wk);$('#a-av',md.el).dataset.nav=1;drawAv();}
    const dd=e.target.closest('[data-avd]');if(dd){f.date.value=dd.dataset.avd;chk();const F=slotsFor(f.date.value,pv,dur(),a&&a.id);if(F.length&&!F.includes(f.s.value)){const du=dur();f.s.value=F[0];f.e.value=tstr(tmin(F[0])+du);chk();}}
    const sb=e.target.closest('[data-avs]');if(sb){const du=dur();f.s.value=sb.dataset.avs;f.e.value=tstr(tmin(sb.dataset.avs)+du);chk();}});
  f.oninput=chk;f.addEventListener('change',chk);chk();
  const ab=$('#a-blk',md.el);if(ab)ab.onclick=()=>{const d=f.date.value,s0=f.s.value;md.close();blockDialog({date:d,s:s0,by:pv});};
  const del=$('#a-del',md.el);if(del)del.onclick=async()=>{if(!await confirmDlg(a.kind==='once'?'Διαγραφή ραντεβού;':'Διαγραφή όλου του πάγιου ραντεβού (όλες οι εβδομάδες);',{danger:true,ok:'Διαγραφή'}))return;S.data.appts=appts().filter(x=>x.id!==a.id);save();md.close();render();};
  f.onsubmit=e=>{e.preventDefault();const o=fd(f);if(!sel.length){toast('Διάλεξε '+LX('whoAcc')+'.','bad');return $('#a-st',md.el).click();}if(!sessMin(o.s,o.e)||tmin(o.e)<=tmin(o.s))return toast('Έλεγξε τις ώρες.','bad');
    const base={kind,date:o.date,d:wdOf(o.date),s:o.s,e:o.e,until:kind==='once'?null:(o.until||null),note:o.note||'',by:pv==='me'?undefined:pv,mats:mats.length?mats:undefined};
    if(edit)Object.assign(a,base);else sel.forEach(id=>appts().push(Object.assign({id:uid(),sid:id,ex:{},created:new Date().toISOString()},base)));
    if(!edit&&sids&&sids.length){const n0=waitlist().length;S.data.waitlist=waitlist().filter(w=>!sel.includes(w.sid));if(waitlist().length<n0)toast('Βγήκε και από τη λίστα αναμονής.');}
    save();md.close();toast(edit?'Το ραντεβού άλλαξε.':sel.length>1?`Κλείστηκαν ${sel.length} ραντεβού.`:'Το ραντεβού κλείστηκε.','ok');render();};}
function apptSheet(key){const[id,date]=key.split('|');const a=appts().find(x=>x.id===id);if(!a)return;const st=stOf(a.sid)||{};const o=occ(date,date,{sid:a.sid,withCancel:true}).find(x=>x.a.id===id)||{st:''};const rec=a.kind!=='once';
  const par=(st.contacts||[]).filter(c=>c.phone||c.email);const msg=`Καλησπέρα! Υπενθύμιση για το ραντεβού ${st.name?'του/της '+st.name:''} την ${WDAYS[wdOf(date)]} ${fmtShort(date)} στις ${a.s}. ${biz().name||S.user.name}`;
  const smsSep=/iP(hone|ad|od)/.test(navigator.userAgent)?'&':'?';
  const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">Ραντεβού</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <button type="button" class="qsum qedit" data-a="quick" aria-label="Αλλαγή ραντεβού"><span class="av lg">${st.avatar||'🙂'}</span><div class="grow"><b>${esc(stuName(st))}</b><div class="small">${WDAYS[wdOf(date)]} ${fmtDate(date)} · ${a.s}–${a.e}</div><div class="tiny muted">${pvBadge(o.a?o:a,1)}${kindTxt(a.kind)}${a.until?' μέχρι '+fmtShort(a.until):''}${a.note?' · '+esc(a.note):''}</div></div><span class="qeic">${ic('edit',16)}<small>Αλλαγή</small></span></button>
   ${o.st==='done'?`<div class="stbox ok">${ic('check',18)} <b>Ήρθε — ολοκληρώθηκε.</b></div>`:o.st==='absent'?`<div class="stbox gray">${ic('x',18)} <b>Σημειώθηκε απουσία.</b></div>`:o.st==='cancel'?`<div class="stbox bad">${ic('x',18)} <b>Ακυρώθηκε αυτή τη φορά.</b></div>`:''}
   ${st.loc&&st.loc.home!==false?`<div class="note small field" style="display:flex;gap:8px;align-items:center;justify-content:space-between"><span>📍 ${esc(placeTxt(st.loc))}</span>${st.loc.lat!=null?`<a class="btn sm" target="_blank" rel="noopener" href="${dirHref(st.loc.lat,st.loc.lng)}">${ic('route',14)} Οδηγίες</a>`:''}</div>`:''}
   <div class="actgrid">
    ${o.st===''?`<button class="btn came" data-a="came">${ic('check',16)}<span>Ήρθε</span></button><button class="btn" data-a="absent">${ic('x',16)}<span>Απουσία</span></button>`:''}
    ${o.st==='done'?`<button class="btn" data-a="undone">${ic('undo',16)}<span>Αναίρεση «ήρθε»</span></button>`:''}
    ${o.st==='absent'?`<button class="btn" data-a="unabsent">${ic('undo',16)}<span>Αναίρεση απουσίας</span></button>`:''}
    ${o.st==='cancel'?`<button class="btn" data-a="uncancel">${ic('undo',16)}<span>Επαναφορά ραντεβού</span></button>`:''}
    ${o.st===''||o.st==='cancel'?`<button class="btn" data-a="move">${ic('clock',16)}<span>${rec?'Μετακίνηση (μόνο αυτή τη φορά)':'Μετακίνηση'}</span></button>`:''}
    ${rec&&o.st===''?`<button class="btn" data-a="cancel">${ic('x',16)}<span>Ακύρωση (μόνο αυτή τη φορά)</span></button>`:''}
    ${o.st===''&&date>=todayISO()?`<button class="btn" data-a="remind">${ic('bell',16)}<span>Υπενθύμιση με μήνυμα</span></button>`:''}<button class="btn" data-a="ics">${ic('calendar',16)}<span>Στο ημερολόγιο κινητού</span></button>
    <button class="btn" data-a="edit">${ic('edit',16)}<span>${rec?'Αλλαγή πάγιου':'Αλλαγή'}</span></button>
    ${rec?`<button class="btn" data-a="stop">${ic('l-flag',16)}<span>Τέλος πάγιου από εδώ</span></button>`:`<button class="btn danger" data-a="del">${ic('trash',16)}<span>Διαγραφή</span></button>`}
   </div>
   <div class="scolrow"><span class="small muted">Χρώμα στο ημερολόγιο</span><span class="scols">${STU_COLORS.map(c=>`<button type="button" data-scol="${c}" style="background:${c}" class="${st.color===c?'on':''}" aria-label="Χρώμα"></button>`).join('')}<button type="button" data-scol="" class="none ${st.color?'':'on'}" aria-label="Χωρίς χρώμα">${ic('x',12)}</button></span></div>
   ${par.length?`<div class="card-h" style="margin-top:16px"><h3 style="font-size:.95rem">Υπενθύμιση</h3></div><div class="row" style="gap:6px">${par.map(c=>`${c.phone?`<a class="btn sm" href="sms:${telLink(c.phone)}${smsSep}body=${encodeURIComponent(msg)}">${ic('l-message-square',15)} ${esc((c.name||c.role).split(' ')[0])} · SMS</a>`:''}${c.email?`<a class="btn sm" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Υπενθύμιση ραντεβού')}&body=${encodeURIComponent(msg)}">${ic('send',15)} Email</a>`:''}`).join('')}</div>`:''}
   <a class="btn ghost sm" href="#/person/${a.sid}" data-close style="margin-top:12px">${ic('user',15)} Καρτέλα</a>`);
  const ex=(a.ex=a.ex||{});
  const snap=agSnap();
  md.el.addEventListener('click',async e=>{const sw=e.target.closest('[data-scol]');if(sw){const s0=getStudent(a.sid)||stOf(a.sid);if(s0){s0.color=sw.dataset.scol||undefined;save();md.close();render();return apptSheet(key);}}const b=e.target.closest('[data-a]');if(!b)return;const k=b.dataset.a;
    
    
    if(k==='remind'){md.close();return remindDialog(date);}
    if(k==='ics'){md.close();return icsDialog(rec?{a}:{a,date,s:o.s||a.s,e:o.e||a.e});}
    if(k==='came'){ex[date]={...(ex[date]||{}),st:'done'};save();md.close();toast('Σημειώθηκε ότι ήρθε.','ok');return render();}
    if(k==='undone'){if(ex[date]&&ex[date].by)ex[date]={by:ex[date].by};else delete ex[date];save();md.close();return render();}
    if(k==='absent'){ex[date]={...(ex[date]||{}),st:'absent'};save();md.close();toast('Σημειώθηκε απουσία.');return render();}
    if(k==='unabsent'){if(ex[date]&&ex[date].by)ex[date]={by:ex[date].by};else delete ex[date];save();md.close();return render();}
    if(k==='uncancel'){if(ex[date]&&ex[date].by)ex[date]={by:ex[date].by};else delete ex[date];save();md.close();toast('Το ραντεβού επανήλθε.','ok');return render();}
    if(k==='cancel'){if(!await confirmDlg(`Ακύρωση μόνο για ${fmtShort(date)}; Οι επόμενες εβδομάδες μένουν.`,{ok:'Ακύρωση'}))return;ex[date]={...(ex[date]||{}),st:'cancel'};save();md.close();render();undoBar('Ακυρώθηκε για αυτή τη φορά.',snap);return waitSuggest(date,a.s,a.e,provOf(a));}
    if(k==='del'){if(!await confirmDlg('Διαγραφή ραντεβού;',{danger:true,ok:'Διαγραφή'}))return;S.data.appts=appts().filter(x=>x.id!==id);save();md.close();render();undoBar('Το ραντεβού διαγράφηκε.',snap);return waitSuggest(date,a.s,a.e,provOf(a));}
    if(k==='stop'){if(!await confirmDlg(`Το πάγιο σταματά από ${fmtShort(date)} και μετά. Τα προηγούμενα μένουν.`,{ok:'Τέλος πάγιου'}))return;a.until=addDays(date,-1);save();md.close();render();undoBar('Το πάγιο σταμάτησε.',snap);return;}
    if(k==='edit'){md.close();return apptDialog({a});}
    if(k==='quick'){md.close();return apptQuick(a,date,o);}
    if(k==='move'){md.close();const m2=modal(`<h3 style="margin-top:0">Μετακίνηση${rec?' αυτή τη φορά':''}</h3><form id="mf"><div class="grid g3" style="gap:10px"><div class="field"><label class="f">Νέα μέρα</label><input class="in" type="date" name="date" value="${date}" required></div><div class="field"><label class="f">Έναρξη</label><input class="in" type="time" name="s" value="${a.s}" required></div><div class="field"><label class="f">Λήξη</label><input class="in" type="time" name="e" value="${a.e}" required></div></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">Μετακίνηση</button></div></form>`);
      $('#mf',m2.el).onsubmit=ev=>{ev.preventDefault();const v=fd(ev.target);if(tmin(v.e)<=tmin(v.s))return toast('Έλεγξε τις ώρες.','bad');if(rec){const ob=(ex[date]&&ex[date].by)||a.by;ex[date]={st:'moved'};appts().push({id:uid(),sid:a.sid,kind:'once',date:v.date,d:wdOf(v.date),s:v.s,e:v.e,note:a.note||'',ex:{},ref:a.id,by:ob,created:new Date().toISOString()});}else Object.assign(a,{date:v.date,d:wdOf(v.date),s:v.s,e:v.e});save();m2.close();toast('Μετακινήθηκε.','ok');render();};}});}
function apptQuick(a,date,o){const rec=a.kind!=='once';const ex=(a.ex=a.ex||{});const st=stOf(a.sid)||{};const PV=providers();let pv=(o&&o.by)||provOf(a);const pv0=pv;
  const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">Αλλαγή ραντεβού</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <div class="qsum"><span class="av lg">${st.avatar||'🙂'}</span><div><b>${esc(stuName(st))}</b><div class="small">${WDAYS[wdOf(date)]} ${fmtDate(date)} · ${kindTxt(a.kind)}</div></div></div>
   <form id="qf"><label class="f">Ποιος το αναλαμβάνει</label><button type="button" class="pickbtn field" id="q-pv"></button>
    <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="q-s">Έναρξη</label><input class="in" type="time" id="q-s" name="s" value="${a.s}" required></div><div class="field"><label class="f" for="q-e">Λήξη</label><input class="in" type="time" id="q-e" name="e" value="${a.e}" required></div></div>
    <div class="field"><label class="f" for="q-n">Σημείωση</label><input class="in" id="q-n" name="note" value="${esc(a.note||'')}"></div>
    ${rec?`<label class="f">Ισχύει για</label><div class="seg field" id="q-sc"><button type="button" data-sc="once" class="on">Μόνο ${fmtShort(date)}</button><button type="button" data-sc="all">Όλες τις φορές (πάγιο)</button></div>`:''}
    <div id="q-cf"></div>
    <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><span class="row" style="gap:6px"><button type="button" class="btn sm ghost" id="q-full">${ic('edit',15)} Όλα τα στοιχεία</button><a class="btn sm ghost" href="#/person/${a.sid}" data-close>${ic('user',15)} Καρτέλα</a></span><span class="row"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Αποθήκευση</button></span></div></form>`);
  const f=$('#qf',md.el);let sc='once';
  const draw=()=>{const p=provById(pv);const X=occ(date,date,{by:pv}).filter(x=>x.a.id!==a.id&&tmin(x.s)<tmin(f.e.value)&&tmin(f.s.value)<tmin(x.e));
    $('#q-pv',md.el).innerHTML=`<i class="pvb" style="background:${p.color}">${provIni(p)}</i><span class="grow"><b>${esc(p.id==='me'?(S.user.name||'Εγώ')+' (εγώ)':p.name)}</b><small>${esc(roleName(p.role,p.custom))}${pv!==pv0?' · <span style="color:var(--ok)">αλλαγή</span>':''}</small></span>${ic('down',18)}`;
    $('#q-cf',md.el).innerHTML=X.length?`<div class="note small field" style="background:var(--pink)">${ic('alert',14)} ${esc(p.id==='me'?'Εσύ έχεις':p.short+' έχει')} ήδη ραντεβού: ${X.map(x=>esc(stuName(stOf(x.a.sid)))+' '+x.s+'–'+x.e).join(', ')}.</div>`:'';};draw();
  f.addEventListener('input',draw);f.addEventListener('change',draw);
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-sc]');if(b){sc=b.dataset.sc;$$('[data-sc]',md.el).forEach(x=>x.classList.toggle('on',x===b));}});
  $('#q-pv',md.el).onclick=async()=>{const L=PV.some(p=>p.id===pv)?PV:PV.concat(provById(pv));const r=await richPick({title:'Ποιος το αναλαμβάνει',sel:[pv],hint:`${WDAYS[wdOf(date)]} ${fmtShort(date)} · ${f.s.value}–${f.e.value}`,
    items:L.map(p=>{const X=occ(date,date,{by:p.id}).filter(x=>x.a.id!==a.id&&tmin(x.s)<tmin(f.e.value)&&tmin(f.s.value)<tmin(x.e));return{id:p.id,label:p.id==='me'?(S.user.name||'Εγώ')+' (εγώ)':p.name,color:p.color,ini:provIni(p),sub:esc(roleName(p.role,p.custom)),badge:X.length?`<span class="chip bad">έχει ραντεβού ${X.map(x=>x.s).join(', ')}</span>`:'<span class="chip ok">ελεύθερος</span>'};})});if(r){pv=r[0];md.dirty();draw();}};
  $('#q-full',md.el).onclick=()=>{md.close();apptDialog({a});};
  f.onsubmit=e=>{e.preventDefault();const v=fd(f);if(tmin(v.e)<=tmin(v.s))return toast('Έλεγξε τις ώρες.','bad');const by=pv==='me'?undefined:pv;
    if(rec&&sc==='once'){const timeCh=v.s!==a.s||v.e!==a.e||(v.note||'')!==(a.note||'');
      if(timeCh){ex[date]={st:'moved'};appts().push({id:uid(),sid:a.sid,kind:'once',date,d:wdOf(date),s:v.s,e:v.e,note:v.note||'',ex:{},ref:a.id,by,created:new Date().toISOString()});}
      else{const cur={...(ex[date]||{})};if(pv===provOf(a))delete cur.by;else cur.by=pv;if(Object.keys(cur).length)ex[date]=cur;else delete ex[date];}}
    else{Object.assign(a,{s:v.s,e:v.e,note:v.note||'',by});if(ex[date]&&ex[date].by){delete ex[date].by;if(!Object.keys(ex[date]).length)delete ex[date];}}
    save();md.close();toast(rec&&sc==='once'?`Άλλαξε μόνο για ${fmtShort(date)}.`:'Το ραντεβού άλλαξε.','ok');render();};}
function agendaCfgDialog(){const c=agCfg();const md=modal(`<h3 style="margin-top:0">Ωράριο λειτουργίας</h3><p class="small muted">Από αυτό βγαίνουν τα ελεύθερα κενά και η πληρότητα κάθε ημέρας (το χρωματιστό γέμισμα στα κουτάκια των ημερών). Το προσωπικό που κάνει ραντεβού το ορίζεις στις <a href="#/settings/business" data-close>Ρυθμίσεις → Η επιχείρησή μου</a>.</p><form id="cf"><div class="grid g3" style="gap:10px"><div class="field"><label class="f">Από</label><input class="in" type="time" name="from" value="${c.from}"></div><div class="field"><label class="f">Έως</label><input class="in" type="time" name="to" value="${c.to}"></div><div class="field"><label class="f">Διάστημα</label><select class="in" name="step">${[[30,'30 λεπτά'],[45,'45 λεπτά'],[60,'1 ώρα'],[90,'1,5 ώρα']].map(([v,l])=>opt(v,l,String(c.step))).join('')}</select></div></div>
  <label class="f">Μέρες εργασίας</label><div class="chips" style="margin-bottom:14px">${DAY_ORDER.map(d=>`<label class="chipt ${c.days.includes(d)?'on':''}"><input type="checkbox" name="d${d}" ${c.days.includes(d)?'checked':''} style="display:none">${WDAYS[d]}</label>`).join('')}</div>
  <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">Αποθήκευση</button></div></form>`);
  md.el.addEventListener('change',e=>{const l=e.target.closest('label.chipt');if(l)l.classList.toggle('on',e.target.checked);});
  $('#cf',md.el).onsubmit=e=>{e.preventDefault();const f=e.target;if(tmin(f.to.value)<=tmin(f.from.value))return toast('Έλεγξε τις ώρες.','bad');Object.assign(c,{from:f.from.value,to:f.to.value,step:+f.step.value,days:DAY_ORDER.filter(d=>f['d'+d].checked)});save();md.close();render();};}
async function agendaPDF(from,to,title){const days=[];for(let d=from;d<=to;d=addDays(d,1))days.push(d);const L=occ(from,to,{withCancel:true});const multi=providers().length>1;const B=biz();
  const el=document.createElement('div');el.className='report';el.style.cssText='position:fixed;left:-9999px;top:0;width:794px';
  const stx={done:'Ήρθε',absent:'Απουσία',cancel:'Ακυρώθηκε','':''};
  el.innerHTML=`<div class="rh">${LOGO}<div><h2 style="margin:0">${esc(title)}</h2><div class="small">${esc(B.name||S.user.name)}${AGF?' · '+esc(provById(AGF).name):''}</div></div></div>
   ${days.map(d=>{const X=L.filter(o=>o.date===d);const hol=holidayOf(d);const cl=isClosed(d);if(!X.length&&!cl)return'';
     return`<h3 style="margin:14px 0 6px">${WDAYS[wdOf(d)]} ${fmtDate(d)}${cl?` <span style="color:#C2524A;font-size:.85em">· κλειστά${hol?' ('+esc(hol)+')':''}</span>`:''}</h3>${X.length?`<table class="t"><tr><th style="width:110px">Ώρα</th><th>${LX('who')}</th>${multi?'<th>Με ποιον</th>':''}<th>Είδος</th><th>Κατάσταση</th></tr>${X.map(o=>`<tr${o.st==='cancel'?' style="color:#999;text-decoration:line-through"':''}><td>${o.s}–${o.e}</td><td>${esc(stuName(stOf(o.a.sid)))}</td>${multi?`<td>${esc(provById(provOcc(o)).name)}</td>`:''}<td>${kindTxt(o.a.kind)}</td><td>${stx[o.st]||''}</td></tr>`).join('')}</table>`:''}`;}).join('')||'<p>Δεν υπάρχουν ραντεβού σε αυτό το διάστημα.</p>'}
   <p class="small" style="margin-top:16px;color:#888">Σύνολο: ${L.filter(o=>o.st!=='cancel').length} ραντεβού · ${hoursNum(L.filter(o=>o.st!=='cancel').reduce((a,o)=>a+sessMin(o.s,o.e),0))} ώρες</p>`;
  document.body.appendChild(el);try{await makePDF(el,`rantevou-${from}${to!==from?'_'+to:''}.pdf`);toast('Το PDF κατέβηκε.','ok');}catch(e){toast('Δεν φτιάχτηκε το PDF — χρειάζεται σύνδεση στο διαδίκτυο.','bad');}el.remove();}
function exportDialog(kind,{sel,w,ym}){const[Y,Mo]=ym.split('-').map(Number);const mlast=isoDate(new Date(Y,Mo,0));const by=agStaff();
  const months=[-2,-1,0,1,2].map(k=>{const d=new Date(Y,Mo-1+k,1);return isoDate(d).slice(0,7);});
  const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">${kind==='pdf'?'Εκτύπωση / PDF':'Κατέβασμα Excel'}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <form id="xf">${kind==='pdf'?`<div class="field"><label class="f">Τι θέλεις να βγει;</label><div class="seg" id="xr"><button type="button" data-r="day">Ημέρα</button><button type="button" data-r="week" class="on">Εβδομάδα</button><button type="button" data-r="month">Μήνας</button></div></div>`:''}
    <div class="field" id="xmw" style="${kind==='pdf'?'display:none':''}"><label class="f" for="xm">Μήνας</label><select class="in" id="xm">${months.map(m=>opt(m,MONTHS[+m.slice(5)-1]+' '+m.slice(0,4),ym)).join('')}</select></div>
    <div class="note small field" id="xs"></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('download',16)} ${kind==='pdf'?'Δημιουργία PDF':'Κατέβασμα'}</button></div></form>`);
  let r='week';const rng=()=>{if(kind!=='pdf'||r==='month'){const m=$('#xm',md.el).value;const[y,mo]=m.split('-').map(Number);return[m+'-01',isoDate(new Date(y,mo,0)),`Ραντεβού ${MONTHS[mo-1]} ${y}`];}
    if(r==='day')return[sel,sel,`Ραντεβού ${WDAYS[wdOf(sel)]} ${fmtDate(sel)}`];return[w,addDays(w,6),`Πρόγραμμα εβδομάδας ${fmtShort(w)} – ${fmtShort(addDays(w,6))}`];};
  const sum=()=>{const[a,b,t]=rng();AGF=by;const n=occ(a,b).length;AGF='';$('#xs',md.el).innerHTML=`${ic('info',14)} <b>${esc(t)}</b> — ${n} ραντεβού${by?' ('+esc(provById(by).short)+')':''}.${kind==='xl'?(S.earnKey?' Μαζί οι συνεδρίες και τα σύνολα ανά μαθητή.':' Ξεκλείδωσε το Ταμείο για να μπουν και οι συνεδρίες.'):''}`;};
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(!b)return;r=b.dataset.r;$$('[data-r]',md.el).forEach(x=>x.classList.toggle('on',x===b));$('#xmw',md.el).style.display=r==='month'?'':'none';sum();});
  $('#xm',md.el).onchange=sum;sum();
  $('#xf',md.el).onsubmit=async e=>{e.preventDefault();const[a,b,t]=rng();md.close();if(kind==='pdf'){AGF=by;const pr=agendaPDF(a,b,t);AGF='';await pr;}};}
function todayAgendaHTML(){const t=todayISO();const L=occ(t,t,{withCancel:true});const nf=nextFree();const now=new Date();const nowM=now.getHours()*60+now.getMinutes();const nxt=L.find(o=>tmin(o.e)>nowM&&o.st==='');
  return`<section class="hsec"><div class="card agtoday"><div class="card-h"><h3>${ic('l-calendar-clock',18)} Σήμερα, ${WDAYS[wdOf(t)]} ${+t.slice(8)} ${MONTHS_G[+t.slice(5,7)-1]}</h3><a class="btn sm" href="#/agenda">Όλα τα ραντεβού ${ic('right',14)}</a></div>
   ${L.length?`<div class="aglist">${L.map(o=>apptCard(o)).join('')}</div>`:`<p class="small muted" style="margin:0 0 6px">Κανένα ραντεβού σήμερα.</p>`}
   <div class="agfoot">${nxt?`<span>${ic('clock',15)} Επόμενο: <b>${o2txt(nxt)}</b></span>`:''}${nf?`<span>${ic('plus',15)} Πρώτο κενό: <a href="#/agenda?d=${nf.date}"><b>${nf.date===t?'σήμερα':WDAYS[wdOf(nf.date)]+' '+fmtShort(nf.date)} ${nf.s}</b></a></span>`:''}${(()=>{const tm=addDays(t,1);const n=occ(tm,tm).filter(o=>o.st==='').length;const R=S.data.remSent||{};const left=occ(tm,tm).filter(o=>o.st===''&&!R[o.key]).length;return n?`<button class="btn sm" id="agRemT">${ic('bell',15)} Υπενθυμίσεις για αύριο${left?` <span class="rbadge">${left}</span>`:' ✓'}</button>`:'';})()}<button class="btn sm pri" id="agQuick">${ic('plus',15)} Νέο ραντεβού</button></div></div></section>`;}
const o2txt=o=>`${o.s} ${esc(stuName(stOf(o.a.sid)))}`;
document.addEventListener('click',e=>{if(!S.user||!e.target.closest)return;const ap=e.target.closest('[data-ap]');if(ap){if(window.AG_SUP&&Date.now()-window.AG_SUP<450)return;return apptSheet(ap.dataset.ap);}const nw=e.target.closest('[data-new]');if(nw&&nw.closest('#main')){const[d,s]=nw.dataset.new.split('|');return apptDialog({date:d,s,by:agStaff()});}
  if(e.target.closest('#agQuick'))return apptDialog({date:todayISO()});if(e.target.closest('#agRemT'))return remindDialog();const cd=e.target.closest('[data-close-day]');if(cd){const d=cd.dataset.closeDay;const C=closedDays();if(isClosed(d)){if(holidayOf(d))C[d]=false;else delete C[d];}else{if(C[d]===false)delete C[d];else C[d]=true;}save();render();}});
function enhanceTimes(root){root.querySelectorAll('input[type=time]:not([data-tsx])').forEach(el=>{el.dataset.tsx=1;const w=document.createElement('span');w.className='tstep';el.parentNode.insertBefore(w,el);w.appendChild(el);
  const b=document.createElement('span');b.className='tsb';b.innerHTML=`<button type="button" data-ts="30" aria-label="Μισή ώρα αργότερα" tabindex="-1">${ic('up',16)}</button><button type="button" data-ts="-30" aria-label="Μισή ώρα νωρίτερα" tabindex="-1">${ic('down',16)}</button>`;w.appendChild(b);});}
function tsPair(el){let p=el.parentElement;while(p&&p!==document.body&&p.querySelectorAll('input[type=time]').length<2)p=p.parentElement;if(!p||p===document.body)return null;const L=[...p.querySelectorAll('input[type=time]')];const i=L.indexOf(el);const k=(el.name||el.dataset.k||el.id||'').toLowerCase();
  return /^(s|start|from|a-s|s-s)$/.test(k)&&L[i+1]?L[i+1]:null;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ts]');if(!b)return;e.preventDefault();const el=b.closest('.tstep').querySelector('input');const d=+b.dataset.ts;
  const cur=el.value?tmin(el.value):(d>0?tmin(agCfg().from)-d:tmin(agCfg().from)-d);let nv=Math.round((cur+d)/30)*30;if(nv===cur&&cur%30)nv=d>0?Math.ceil(cur/30)*30:Math.floor(cur/30)*30;nv=Math.max(0,Math.min(23*60+30,nv));
  const pr=tsPair(el);if(pr&&pr.value&&el.value){const dur=tmin(pr.value)-cur;if(dur>0){const ne=Math.min(23*60+59,nv+dur);pr.value=tstr(ne);pr.dispatchEvent(new Event('input',{bubbles:true}));pr.dispatchEvent(new Event('change',{bubbles:true}));}}
  el.value=tstr(nv);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
new MutationObserver(()=>enhanceTimes(document.body)).observe(document.documentElement,{childList:true,subtree:true});
function agLockDialog(){const L=agLock();const c=agCfg();
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Ποιες ώρες φαίνονται</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Χωρίς κλείδωμα, η μέρα δείχνει όλο το 24ωρο και κυλάς πάνω–κάτω με το δάχτυλο. Με κλείδωμα, φαίνονται μόνο οι ώρες που διαλέγεις.</p>
   <form id="lf"><div class="seg field"><button type="button" data-lk="0" class="${L.on?'':'on'}">${ic('clock',14)} Όλο το 24ωρο</button><button type="button" data-lk="1" class="${L.on?'on':''}">${ic('lock',14)} Κλείδωμα ωρών</button></div>
    <div id="lw" style="${L.on?'':'display:none'}"><div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="lk-f">Από</label><input class="in" type="time" id="lk-f" name="from" value="${L.from}"></div><div class="field"><label class="f" for="lk-t">Έως</label><input class="in" type="time" id="lk-t" name="to" value="${L.to}"></div></div>
     <div class="chips field">${[['Ωράριο λειτουργίας',c.from,c.to],['07:00–23:00','07:00','23:00'],['Πρωί 08–14','08:00','14:00'],['Απόγευμα 14–22','14:00','22:00']].map(([l,a,b])=>`<button type="button" class="chipt" data-lp="${a}|${b}">${l}</button>`).join('')}</div></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Εφαρμογή</button></div></form>`);
  let on=L.on;const f=$('#lf',md.el);
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-lk]');if(b){on=b.dataset.lk==='1';$$('[data-lk]',md.el).forEach(x=>x.classList.toggle('on',x===b));$('#lw',md.el).style.display=on?'':'none';}
    const p=e.target.closest('[data-lp]');if(p){const[a,bb]=p.dataset.lp.split('|');f.from.value=a;f.to.value=bb;}});
  f.onsubmit=e=>{e.preventDefault();if(on&&tmin(f.to.value)<=tmin(f.from.value))return toast('Έλεγξε τις ώρες.','bad');try{localStorage.setItem('imer-aglock',JSON.stringify({on,from:f.from.value,to:f.to.value}));}catch(x){}md.close();render();};}
const BLOCK_CATS_DEF=[['break','Διάλειμμα / φαγητό','☕','#5FA57E'],['personal','Προσωπικό','🏠','#8A8F98'],['job','Δεύτερη δουλειά','💼','#C98A3A'],['study','Σχολή / σεμινάριο','🎓','#5A8DC8'],['travel','Μετακίνηση','🚗','#9C7BC0'],['other','Άλλο','📌','#C46A7A']];
function blocks(){return S.data.blocks=S.data.blocks||[];}
function bcats(){const L=S.data&&S.data.settings&&S.data.settings.blockCats;return L&&L.length?L:BLOCK_CATS_DEF;}
const blkCat=b=>bcats().find(c=>c[0]===b.cat)||['other','Άλλο','📌','#C46A7A'];
const blkColor=b=>b.color||blkCat(b)[3];
const blkTitle=b=>b.title||blkCat(b)[1];
function blockOcc(from,to,{by}={}){const B=by!==undefined?by:AGF;const out=[];
  for(const b of blocks()){const pv=b.by||'me';if(B&&pv!==B)continue;const push=d=>{if(d<from||d>to)return;if((b.ex||{})[d]==='skip')return;out.push({blk:b,a:{id:b.id,by:b.by,kind:b.kind,sid:null},by:b.by,date:d,s:b.s,e:b.e,st:'',key:b.id+'|'+d});};
    if(b.kind==='once'){push(b.date);continue;}
    for(let d=from>b.date?from:b.date;d<=to;d=addDays(d,1)){if(b.until&&d>b.until)break;if((b.days||[]).includes(wdOf(d)))push(d);}}
  return out.sort((x,y)=>(x.date+x.s).localeCompare(y.date+y.s));}
function blockChipHTML(o){const b=o.blk;return`<button type="button" class="appt blk" data-blk="${o.key}" style="--bc:${blkColor(b)}"><span class="av">${blkCat(b)[2]}</span><span class="grow"><b>${esc(blkTitle(b))}</b><small>${o.s}–${o.e} · ${esc(blkCat(b)[1])}${b.kind==='weekly'?' · κάθε εβδομάδα':''}</small></span></button>`;}
function blockDialog({date,s,b,by}={}){const edit=!!b;const PV=providers();let pv=b?(b.by||'me'):(by||PV[0].id);let cat=b?b.cat:bcats()[0][0];let kind=b?b.kind:'weekly';let days=b?(b.days||[]).slice():[wdOf(date||todayISO())];const st0=b?b.s:(s||'09:00');
  const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">${edit?'Αλλαγή δέσμευσης':'Νέα δέσμευση'}</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <p class="small muted" style="margin-top:0">Ώρες που δεν είσαι διαθέσιμος για ραντεβού — π.χ. διάλειμμα, προσωπικές υποχρεώσεις ή μια δεύτερη δουλειά. Φαίνονται με δικό τους χρώμα και δεν προτείνονται ως ελεύθερες.</p>
   <form id="bf">${PV.length>1||(b&&b.by)?`<label class="f">Ποιου είναι η δέσμευση</label><button type="button" class="pickbtn field" id="b-pv"></button>`:''}<div class="spread"><label class="f" style="margin:0">Τι είναι</label><button type="button" class="btn sm ghost" id="b-ed">${ic('edit',14)} Ετικέτες</button></div><div class="bcats field" id="b-cats" style="margin-top:6px">${bcats().map(([k,l,e,c])=>`<button type="button" class="bcat ${cat===k?'on':''}" data-bc="${k}" style="--bc:${c}"><span>${e}</span>${esc(l)}</button>`).join('')}</div>
    <div class="field"><label class="f" for="b-t">Τίτλος (προαιρετικό)</label><input class="in" id="b-t" name="title" value="${esc(b&&b.title||'')}" placeholder="π.χ. Φαγητό, Τράπεζα, Γυμναστήριο"></div>
    <div class="seg field" id="bk"><button type="button" data-bk="weekly" class="${kind==='weekly'?'on':''}">Κάθε εβδομάδα</button><button type="button" data-bk="once" class="${kind==='once'?'on':''}">Μία φορά</button></div>
    <div class="field" id="b-dw"><label class="f">Ποιες μέρες</label><div class="chips">${DAY_ORDER.map(d=>`<button type="button" class="chipt ${days.includes(d)?'on':''}" data-bd="${d}">${WDAYS_S[d]}</button>`).join('')}</div></div>
    <div class="field" id="b-ow"><label class="f" for="b-d">${kind==='once'?'Ημερομηνία':'Από'}</label><input class="in" type="date" id="b-d" name="date" required value="${b?b.date:date||todayISO()}"></div>
    <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="b-s">Από ώρα</label><input class="in" type="time" id="b-s" name="s" required value="${st0}"></div><div class="field"><label class="f" for="b-e">Έως ώρα</label><input class="in" type="time" id="b-e" name="e" required value="${b?b.e:tstr(tmin(st0)+120)}"></div></div>
    <div class="field" id="b-uw"><label class="f" for="b-u">Μέχρι (προαιρετικό)</label><input class="in" type="date" id="b-u" name="until" value="${b&&b.until||''}"><div class="tiny muted" style="margin-top:4px">Π.χ. τέλος εξαμήνου. Κενό = χωρίς λήξη.</div></div>
    <div id="b-cf"></div>
    <div class="row" style="justify-content:space-between">${edit?`<button type="button" class="btn danger" id="b-del">${ic('trash',16)} Διαγραφή</button>`:'<span></span>'}<span class="row"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Αποθήκευση</button></span></div></form>`);
  const f=$('#bf',md.el);
  $('#b-ed',md.el).onclick=async()=>{await blockCatsEditor();$('#b-cats',md.el).innerHTML=bcats().map(([k,l,e,c])=>`<button type="button" class="bcat ${cat===k?'on':''}" data-bc="${k}" style="--bc:${c}"><span>${e}</span>${esc(l)}</button>`).join('');};
  const draw=()=>{$('#b-dw',md.el).style.display=kind==='weekly'?'':'none';$('#b-uw',md.el).style.display=kind==='weekly'?'':'none';$('#b-ow label',md.el).textContent=kind==='once'?'Ημερομηνία':'Από';
    const d0=f.date.value;const chk=kind==='once'?[d0]:[...Array(14)].map((_,i)=>addDays(d0,i)).filter(d=>days.includes(wdOf(d)));const pid=pv;
    const C=chk.flatMap(d=>occ(d,d,{by:pid})).filter(o=>tmin(o.s)<tmin(f.e.value)&&tmin(f.s.value)<tmin(o.e));
    $('#b-cf',md.el).innerHTML=C.length?`<div class="note small field" style="background:var(--pink)">${ic('alert',14)} Πέφτει πάνω σε ραντεβού: ${C.slice(0,4).map(o=>esc(stuName(stOf(o.a.sid)))+' '+WDAYS_S[wdOf(o.date)]+' '+o.s).join(', ')}${C.length>4?'…':''}. Μετακίνησέ τα ή άλλαξε τις ώρες.</div>`:'';};
  const drawPv=()=>{const bt=$('#b-pv',md.el);if(!bt)return;const p=provById(pv);bt.innerHTML=`<i class="pvb" style="background:${p.color}">${provIni(p)}</i><span class="grow"><b>${esc(p.id==='me'?(S.user.name||'Εγώ')+' (εγώ)':p.name)}</b><small>${esc(roleName(p.role,p.custom))}</small></span>${ic('down',18)}`;};drawPv();
  const bpv=$('#b-pv',md.el);if(bpv)bpv.onclick=async()=>{const L=PV.some(p=>p.id===pv)?PV:PV.concat(provById(pv));const r=await richPick({title:'Ποιου είναι η δέσμευση',sel:[pv],hint:'Οι ώρες της δέσμευσης δεν θα προτείνονται ως ελεύθερες για αυτό το άτομο.',items:L.map(p=>({id:p.id,label:p.id==='me'?(S.user.name||'Εγώ')+' (εγώ)':p.name,color:p.color,ini:provIni(p),sub:esc(roleName(p.role,p.custom))}))});if(r){pv=r[0];md.dirty();drawPv();draw();}};
  draw();f.addEventListener('input',draw);f.addEventListener('change',draw);
  md.el.addEventListener('click',e=>{const c=e.target.closest('[data-bc]');if(c){cat=c.dataset.bc;$$('[data-bc]',md.el).forEach(x=>x.classList.toggle('on',x===c));}
    const k=e.target.closest('[data-bk]');if(k){kind=k.dataset.bk;$$('[data-bk]',md.el).forEach(x=>x.classList.toggle('on',x===k));draw();}
    const d=e.target.closest('[data-bd]');if(d){const v=+d.dataset.bd;days=days.includes(v)?days.filter(x=>x!==v):days.concat(v);d.classList.toggle('on');draw();}});
  const del=$('#b-del',md.el);if(del)del.onclick=async()=>{if(!await confirmDlg(b.kind==='weekly'?'Διαγραφή της δέσμευσης για όλες τις εβδομάδες;':'Διαγραφή δέσμευσης;',{danger:true,ok:'Διαγραφή'}))return;S.data.blocks=blocks().filter(x=>x.id!==b.id);save();md.close();render();};
  f.onsubmit=e=>{e.preventDefault();const o=fd(f);if(tmin(o.e)<=tmin(o.s))return toast('Έλεγξε τις ώρες.','bad');if(kind==='weekly'&&!days.length)return toast('Διάλεξε τουλάχιστον μία μέρα.','bad');
    const rec={cat,title:(o.title||'').trim(),by:pv==='me'?undefined:pv,kind,date:o.date,days:kind==='weekly'?days.slice().sort():[],s:o.s,e:o.e,until:kind==='weekly'?(o.until||null):null};
    if(edit)Object.assign(b,rec);else blocks().push({id:uid(),ex:{},created:new Date().toISOString(),...rec});save();md.close();toast(edit?'Η δέσμευση άλλαξε.':'Η δέσμευση μπήκε στο ημερολόγιο.','ok');render();};}
function blockSheet(key){const[id,date]=key.split('|');const b=blocks().find(x=>x.id===id);if(!b)return;const c=blkCat(b);
  const md=modal(`<div class="spread" style="margin-bottom:8px"><h3 style="margin:0">Δέσμευση</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div>
   <div class="qsum" style="border-left:5px solid ${blkColor(b)}"><span class="av lg">${c[2]}</span><div><b>${esc(blkTitle(b))}</b><div class="small">${WDAYS[wdOf(date)]} ${fmtDate(date)} · ${b.s}–${b.e}</div><div class="tiny muted">${esc(c[1])}${b.kind==='weekly'?' · κάθε '+b.days.map(d=>WDAYS_S[d]).join(', '):''}${b.until?' · μέχρι '+fmtShort(b.until):''}</div></div></div>
   <div class="actgrid"><button class="btn" data-b="edit">${ic('edit',16)}<span>Αλλαγή</span></button>${b.kind==='weekly'?`<button class="btn" data-b="skip">${ic('x',16)}<span>Όχι αυτή τη φορά</span></button><button class="btn" data-b="stop">${ic('l-flag',16)}<span>Τέλος από εδώ</span></button>`:''}<button class="btn danger" data-b="del">${ic('trash',16)}<span>Διαγραφή</span></button></div>`);
  md.el.addEventListener('click',async e=>{const x=e.target.closest('[data-b]');if(!x)return;const k=x.dataset.b;
    if(k==='edit'){md.close();return blockDialog({b});}
    if(k==='skip'){b.ex=b.ex||{};b.ex[date]='skip';save();md.close();toast('Αυτή τη φορά είσαι ελεύθερος.','ok');return render();}
    if(k==='stop'){b.until=addDays(date,-1);save();md.close();return render();}
    if(k==='del'){if(!await confirmDlg('Διαγραφή δέσμευσης;',{danger:true,ok:'Διαγραφή'}))return;S.data.blocks=blocks().filter(y=>y.id!==b.id);save();md.close();return render();}});}
document.addEventListener('click',e=>{if(!S.user||!e.target.closest)return;const b=e.target.closest('[data-blk]');if(b&&window.AG_SUP&&Date.now()-window.AG_SUP<450){e.stopPropagation();e.preventDefault();return;}if(b){e.stopPropagation();blockSheet(b.dataset.blk);}},true);
const BLK_SW=['#5A8DC8','#2F7FA8','#3A8A61','#5FA57E','#8A7A2E','#C98A3A','#D9822B','#C46A7A','#B4527A','#9C7BC0','#7462B4','#8A8F98'];
function blockCatsEditor(){return new Promise(res=>{let L=bcats().map(x=>x.slice());
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Ετικέτες δεσμεύσεων</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><p class="small muted" style="margin-top:0">Άλλαξε όνομα, εικονίδιο και χρώμα· τα βελάκια αλλάζουν τη σειρά.</p><form id="bce"><div id="bcl"></div><button type="button" class="btn sm" id="bca" style="margin-top:8px">${ic('plus',14)} Νέα ετικέτα</button>
   <div class="row" style="justify-content:space-between;margin-top:14px"><button type="button" class="btn ghost sm" id="bcr">${ic('undo',14)} Αρχικές</button><span class="row"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Αποθήκευση</button></span></div></form>`,{onClose:()=>res()});
  const draw=()=>{$('#bcl',md.el).innerHTML=L.map(([k,l,e,c],i)=>`<div class="bcrow" data-i="${i}"><input class="in bce" value="${esc(e)}" data-f="e" maxlength="4" aria-label="Εικονίδιο"><input class="in" value="${esc(l)}" data-f="l" aria-label="Όνομα"><label class="bcsw" style="background:${c}" title="Χρώμα"><input type="color" value="${c}" data-f="c"></label><span class="bcarr"><button type="button" data-mv="-1" ${i?'':'disabled'} aria-label="Πάνω">${ic('up',14)}</button><button type="button" data-mv="1" ${i<L.length-1?'':'disabled'} aria-label="Κάτω">${ic('down',14)}</button></span><button type="button" class="iconbtn" data-rm aria-label="Διαγραφή">${ic('trash',15)}</button></div><div class="bcsws" data-i="${i}">${BLK_SW.map(x=>`<button type="button" style="background:${x}" data-sw="${x}" class="${x.toLowerCase()===c.toLowerCase()?'on':''}" aria-label="Χρώμα"></button>`).join('')}</div>`).join('');};draw();
  const read=()=>{$$('.bcrow',md.el).forEach(r=>{const i=+r.dataset.i;L[i][2]=$('[data-f=e]',r).value.trim()||'📌';L[i][1]=$('[data-f=l]',r).value.trim()||'Ετικέτα';L[i][3]=$('[data-f=c]',r).value;});};
  md.el.addEventListener('input',e=>{if(e.target.dataset.f==='c'){e.target.closest('.bcsw').style.background=e.target.value;}});
  md.el.addEventListener('click',async e=>{const r=e.target.closest('[data-i]');
    const mv=e.target.closest('[data-mv]');if(mv){read();const i=+r.dataset.i,j=i+ +mv.dataset.mv;[L[i],L[j]]=[L[j],L[i]];draw();return;}
    const sw=e.target.closest('[data-sw]');if(sw){read();L[+r.dataset.i][3]=sw.dataset.sw;draw();return;}
    if(e.target.closest('[data-rm]')){read();const i=+r.dataset.i;const k=L[i][0];const used=blocks().filter(b=>b.cat===k).length;if(L.length<=1)return toast('Χρειάζεται τουλάχιστον μία ετικέτα.','bad');
      if(used&&!await confirmDlg(`Η ετικέτα «${esc(L[i][1])}» χρησιμοποιείται σε ${used} ${used===1?'δέσμευση':'δεσμεύσεις'}. Θα περάσουν στην «${esc(L[i===0?1:0][1])}».`,{ok:'Διαγραφή',danger:true}))return;
      L.splice(i,1);L._moved=(L._moved||[]).concat([[k,L[0][0]]]);draw();return;}
    if(e.target.closest('#bca')){read();L.push(['c'+uid().slice(0,6),'Νέα ετικέτα','⭐',BLK_SW[L.length%BLK_SW.length]]);draw();const ins=$$('[data-f=l]',md.el);ins[ins.length-1].select();return;}
    if(e.target.closest('#bcr')){if(!await confirmDlg('Επαναφορά των αρχικών ετικετών;',{ok:'Επαναφορά'}))return;L=BLOCK_CATS_DEF.map(x=>x.slice());draw();}});
  $('#bce',md.el).onsubmit=e=>{e.preventDefault();read();(L._moved||[]).forEach(([from,to])=>blocks().forEach(b=>{if(b.cat===from)b.cat=L.some(x=>x[0]===to)?to:L[0][0];}));blocks().forEach(b=>{if(!L.some(x=>x[0]===b.cat))b.cat=L[0][0];});
    S.data.settings.blockCats=L.map(x=>x.slice(0,4));save();md.close();toast('Οι ετικέτες αποθηκεύτηκαν.','ok');};});}
function day24HTML(d){const by=AGF;const A=occ(d,d,{by}).filter(o=>o.st!=='cancel');const Bk=blockOcc(d,d,{by});if(!A.length&&!Bk.length)return'';
  const seg=(s,e,col,t)=>`<i style="left:${(tmin(s)/1440*100).toFixed(2)}%;width:${Math.max(.8,(tmin(e)-tmin(s))/1440*100).toFixed(2)}%;background:${col}" title="${esc(t)}"></i>`;
  return`<span class="d24" aria-hidden="true">${Bk.map(o=>seg(o.s,o.e,blkColor(o.blk),blkTitle(o.blk)+' '+o.s+'–'+o.e)).join('')}${A.map(o=>seg(o.s,o.e,'var(--lilac-d)',o.s+'–'+o.e)).join('')}</span>`;}
const STU_COLORS=['#7462B4','#3A8A61','#2F7FA8','#C77A3A','#B4527A','#8A7A2E','#C46A7A','#5A6ACF','#2E8C8C','#9C5BB5'];
function agSnap(){return JSON.stringify({appts:S.data.appts||[],blocks:S.data.blocks||[],waitlist:S.data.waitlist||[]});}
function undoBar(msg,snap){document.querySelectorAll('.undobar').forEach(x=>x.remove());const b=document.createElement('div');b.className='undobar';b.innerHTML=`<span>${esc(msg)}</span><button type="button">${ic('undo',15)} Αναίρεση</button>`;document.body.appendChild(b);
  const t=setTimeout(()=>b.remove(),7000);b.querySelector('button').onclick=()=>{clearTimeout(t);b.remove();const o=JSON.parse(snap);S.data.appts=o.appts;S.data.blocks=o.blocks;S.data.waitlist=o.waitlist;save();toast('Αναιρέθηκε.','ok');render();};}
function agZoom(v,keepMin){const old=PPM;PPM=Math.max(.5,Math.min(3,v));try{localStorage.setItem('imer-agzoom',String(PPM));}catch(e){}
  const sc=$('#tlScroll');const[rf]=agRange();const mid=keepMin!=null?keepMin:(sc?rf+(sc.scrollTop+sc.clientHeight/2)/old:null);const y=window.scrollY;render();window.scrollTo(0,y);
  const sc2=$('#tlScroll');if(sc2&&mid!=null)sc2.scrollTop=Math.max(0,(mid-rf)*PPM-sc2.clientHeight/2);}
function agPosSave(){const sc=document.getElementById('tlScroll');let min=null;if(sc){const[rf]=agRange();min=rf+sc.scrollTop/PPM;}
  const ds=document.getElementById('dstrip');window.AGPOS={y:window.scrollY,min,ds:ds?ds.scrollLeft:null};}
function agPosRestore(){const p=window.AGPOS;window.AGPOS=null;if(!p)return;const sc=$('#tlScroll');if(sc&&p.min!=null){const[rf]=agRange();sc.scrollTop=Math.max(0,(p.min-rf)*PPM);}
  window.scrollTo(0,p.y);requestAnimationFrame(()=>window.scrollTo(0,p.y));}
function agGestures(view,nav){const sc=$('#tlScroll');if(!sc)return;const body=$('.tl-body',sc);let st=null,pinch=null,swipe=null,suppress=false,multi=false;
  const cols=()=>[...body.querySelectorAll('.tl-col')];
  const colAt=x=>cols().find(c=>{const r=c.getBoundingClientRect();return x>=r.left-2&&x<=r.right+2;});
  const minAt=(y,col)=>{const[rf,rt]=agRange();const r=(col||cols()[0]).getBoundingClientRect();return Math.max(rf,Math.min(rt,rf+Math.round((y-r.top)/PPM/15)*15));};
  const label=(el,s,e)=>{let l=el.querySelector('.dlab');if(!l){l=document.createElement('span');l.className='dlab';el.appendChild(l);}l.textContent=`${tstr(s)}–${tstr(e)}`;};
  const end=()=>{if(st&&st.timer)clearTimeout(st.timer);document.body.classList.remove('agdragging');st=null;};
  sc.addEventListener('click',e=>{if(suppress){e.stopPropagation();e.preventDefault();suppress=false;}},true);
  body.addEventListener('pointerdown',e=>{if(pinch||(e.button&&e.button>0))return;const col=e.target.closest('.tl-col');if(!col)return;const ev=e.target.closest('.tl-ev');if(ev&&ev.classList.contains('cancel'))return;
    st={x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,ev,col,rs:!!e.target.closest('.rsz'),mode:null,touch:e.pointerType!=='mouse'};
    if(!ev&&col.classList.contains('off'))st.offcol=true;
    const begin=()=>{if(!st||st.mode)return;st.mode=st.ev?(st.rs?'resize':'move'):'create';document.body.classList.add('agdragging');try{navigator.vibrate&&navigator.vibrate(15);}catch(x){}
      if(st.ev){st.s0=tmin(st.ev.dataset.s);st.e0=tmin(st.ev.dataset.e);st.top0=parseFloat(st.ev.style.top);st.h0=parseFloat(st.ev.style.height);st.ev.classList.add('dragging');st.ns=st.s0;st.ne=st.e0;st.ncol=st.col;label(st.ev,st.s0,st.e0);}
      else{st.ms=minAt(st.y0,st.col);const g=document.createElement('div');g.className='tl-ghost';st.col.appendChild(g);st.g=g;upd();}};
    st.begin=begin;if(st.touch)st.timer=setTimeout(begin,380);});
  const upd=()=>{if(!st||!st.mode)return;const[rf,rt]=agRange();
    if(st.mode==='create'){const m=minAt(st.y,st.col);const a=Math.min(st.ms,m),b=Math.max(st.ms+15,m);st.ns=a;st.ne=Math.max(a+15,b);st.g.style.top=(a-rf)*PPM+'px';st.g.style.height=(st.ne-a)*PPM+'px';label(st.g,st.ns,st.ne);return;}
    const dm=Math.round((st.y-st.y0)/PPM/15)*15;
    if(st.mode==='resize'){st.ne=Math.max(st.s0+15,Math.min(rt,st.e0+dm));st.ev.style.height=Math.max(22,(st.ne-st.s0)*PPM-2)+'px';label(st.ev,st.s0,st.ne);return;}
    const dur=st.e0-st.s0;st.ns=Math.max(rf,Math.min(rt-dur,st.s0+dm));st.ne=st.ns+dur;st.ev.style.top=(st.ns-rf)*PPM+'px';
    const c=colAt(st.x);if(c&&c!==st.ncol){st.ncol=c;c.appendChild(st.ev);st.ev.style.left='2px';st.ev.style.width='calc(100% - 4px)';}label(st.ev,st.ns,st.ne);};
  body.addEventListener('pointermove',e=>{if(!st)return;st.x=e.clientX;st.y=e.clientY;
    if(!st.mode){const d=Math.hypot(st.x-st.x0,st.y-st.y0);if(st.touch){if(d>8){clearTimeout(st.timer);st=null;}}else if(d>5&&!st.offcol)st.begin();return;}
    upd();
    const r=sc.getBoundingClientRect();if(st.y<r.top+30)sc.scrollTop-=12;else if(st.y>r.bottom-30)sc.scrollTop+=12;});
  sc.addEventListener('touchmove',e=>{if(st&&st.mode)e.preventDefault();},{passive:false});
  const finish=async()=>{if(!st)return;const s0=st;end();if(!s0.mode)return;suppress=true;window.AG_SUP=Date.now();setTimeout(()=>suppress=false,400);
    if(s0.mode==='create'){s0.g.remove();if(s0.ne-s0.ns<15)return;return apptDialog({date:s0.col.dataset.col,s:tstr(s0.ns),e:tstr(s0.ne),by:agStaff()});}
    s0.ev.classList.remove('dragging');const nd=(s0.ncol||s0.col).dataset.col,od=s0.col.dataset.col;
    if(nd===od&&s0.ns===s0.s0&&s0.ne===s0.e0)return render();
    if(s0.ev.dataset.blk)return agMoveBlock(s0.ev.dataset.blk,nd,tstr(s0.ns),tstr(s0.ne));
    return agMoveAppt(s0.ev.dataset.ap,nd,tstr(s0.ns),tstr(s0.ne));};
  body.addEventListener('pointerup',finish);body.addEventListener('pointercancel',()=>{if(st&&st.mode){if(st.g)st.g.remove();end();render();}else end();});
  /* δύο δάχτυλα: μεγέθυνση · ένα δάχτυλο οριζόντια: προηγούμενη/επόμενη */
  sc.addEventListener('touchstart',e=>{if(e.touches.length>=2){swipe=null;multi=true;if(st){clearTimeout(st.timer);st=null;}const[a,b]=e.touches;const[rf]=agRange();const cy=(a.clientY+b.clientY)/2-body.getBoundingClientRect().top;pinch={d0:Math.abs(a.clientY-b.clientY)+Math.abs(a.clientX-b.clientX)*.3,p0:PPM,k:1,mid:rf+cy/PPM};body.style.transformOrigin=`50% ${cy}px`;}
    else if(e.touches.length===1&&!multi)swipe={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now()};},{passive:true});
  sc.addEventListener('touchmove',e=>{if(pinch&&e.touches.length===2){e.preventDefault();const[a,b]=e.touches;const d=Math.abs(a.clientY-b.clientY)+Math.abs(a.clientX-b.clientX)*.3;pinch.k=Math.max(.5/pinch.p0,Math.min(3/pinch.p0,d/Math.max(20,pinch.d0)));body.style.transform=`scaleY(${pinch.k})`;}},{passive:false});
  sc.addEventListener('touchend',e=>{if(!e.touches.length)setTimeout(()=>multi=false,50);if(pinch&&e.touches.length<2){const p=pinch;pinch=null;swipe=null;body.style.transform='';suppress=true;window.AG_SUP=Date.now();setTimeout(()=>suppress=false,400);if(Math.abs(p.k-1)>.05)agZoom(p.p0*p.k,p.mid);return;}if(multi){swipe=null;return;}
    if(swipe&&!document.body.classList.contains('agdragging')&&e.changedTouches.length){const t=e.changedTouches[0];const dx=t.clientX-swipe.x,dy=t.clientY-swipe.y;if(Math.abs(dx)>55&&Math.abs(dx)>1.4*Math.abs(dy)&&Date.now()-swipe.t<900){suppress=true;setTimeout(()=>suppress=false,400);window.AG_SUP=Date.now();location.hash=dx<0?nav[2]:nav[0];}}swipe=null;},{passive:true});}
function scopeAsk(title,dateTxt){return new Promise(res=>{const m=modal(`<h3 style="margin-top:0">${esc(title)}</h3><div class="stack" style="gap:8px"><button class="btn block" data-sc="once">${ic('calendar',16)} Μόνο ${esc(dateTxt)}</button><button class="btn pri block" data-sc="all">${ic('repeat',16)} Όλες τις φορές (πάγιο)</button></div>`,{onClose:()=>res(null),noHist:true,guard:false});m.el.addEventListener('click',e=>{const b=e.target.closest('[data-sc]');if(b){res(b.dataset.sc);m.close();}});});}
async function agMoveAppt(key,nd,ns,ne){const[id,date]=key.split('|');const a=appts().find(x=>x.id===id);if(!a)return render();const snap=agSnap();a.ex=a.ex||{};
  if(a.kind==='once'){Object.assign(a,{date:nd,d:wdOf(nd),s:ns,e:ne});}
  else{const sc=await scopeAsk('Η αλλαγή ισχύει για…',`${WDAYS_S[wdOf(date)]} ${fmtShort(date)}`);if(!sc)return render();
    if(sc==='once'){const x=a.ex[date]||{};a.ex[date]={st:'moved'};appts().push({id:uid(),sid:a.sid,kind:'once',date:nd,d:wdOf(nd),s:ns,e:ne,note:a.note||'',ex:{},ref:a.id,by:x.by||a.by,mats:x.mats||a.mats,created:new Date().toISOString()});}
    else{a.s=ns;a.e=ne;if(nd!==date){a.d=wdOf(nd);}}}
  save();render();const C=conflicts(nd,ns,ne,a.id,provOf(a)).filter(o=>o.a.sid!==a.sid);undoBar(C.length?`Μετακινήθηκε — προσοχή: πέφτει πάνω σε ${C.length===1?'άλλο ραντεβού':C.length+' ραντεβού'}.`:`Μετακινήθηκε: ${WDAYS_S[wdOf(nd)]} ${fmtShort(nd)} ${ns}–${ne}`,snap);}
async function agMoveBlock(key,nd,ns,ne){const[id,date]=key.split('|');const b=blocks().find(x=>x.id===id);if(!b)return render();const snap=agSnap();b.ex=b.ex||{};
  if(b.kind==='once'){Object.assign(b,{date:nd,s:ns,e:ne});}
  else{const sc=await scopeAsk('Η αλλαγή της δέσμευσης ισχύει για…',`${WDAYS_S[wdOf(date)]} ${fmtShort(date)}`);if(!sc)return render();
    if(sc==='once'){b.ex[date]='skip';blocks().push({id:uid(),cat:b.cat,title:b.title,by:b.by,kind:'once',date:nd,days:[],s:ns,e:ne,until:null,ex:{},created:new Date().toISOString()});}
    else{b.s=ns;b.e=ne;if(nd!==date){const od=wdOf(date),nw=wdOf(nd);b.days=[...new Set((b.days||[]).map(d=>d===od?nw:d))].sort();}}}
  save();render();undoBar(`Η δέσμευση μετακινήθηκε: ${ns}–${ne}`,snap);}
function agListHTML(r){const t=todayISO();const past=r.q.past==='1';const from=past?addDays(t,-60):t,to=addDays(t,90);const L=occ(from,to,{withCancel:true});const B=blockOcc(from,to);
  const all=L.map(o=>({o,blk:false})).concat(B.map(o=>({o,blk:true}))).sort((x,y)=>(x.o.date+x.o.s).localeCompare(y.o.date+y.o.s));
  const days=[...new Set(all.map(x=>x.o.date))];
  return`<div class="aglisthd"><input class="in" id="agQ" type="search" placeholder="Αναζήτηση ονόματος ή δέσμευσης…" autocomplete="off"><label class="check small"><input type="checkbox" id="agQb" checked> Δεσμεύσεις</label>
   <a class="btn sm ghost" href="#/agenda?view=list${past?'':'&past=1'}">${ic('history',14)} ${past?'Μόνο επόμενα':'Και τα προηγούμενα'}</a></div>
   ${days.length?days.map(d=>`<section class="aglday" data-day="${d}"><h3 class="${d===t?'today':''}">${d===t?'Σήμερα · ':d===addDays(t,1)?'Αύριο · ':''}${WDAYS[wdOf(d)]} ${fmtDate(d)}</h3><div class="aglist">${all.filter(x=>x.o.date===d).map(x=>x.blk?`<div class="aglrow" data-q="${esc(blkTitle(x.o.blk).toLowerCase())}" data-blkrow>${blockChipHTML(x.o)}</div>`:`<div class="aglrow" data-q="${esc((stuName(stOf(x.o.a.sid))||'').toLowerCase())}">${apptCard(x.o)}</div>`).join('')}</div></section>`).join('')
   :emptyHTML('calendar','Δεν υπάρχουν ραντεβού','Τα επόμενα 90 ημέρες είναι κενές.')}
   <p class="tiny muted" style="text-align:center">Εμφανίζονται ${past?'οι τελευταίες 60 και ':''}οι επόμενες 90 ημέρες.</p>`;}
function agListBind(){const q=$('#agQ'),bq=$('#agQb');if(!q)return;const f=()=>{const v=q.value.trim().toLowerCase();$$('.aglrow').forEach(r=>{r.style.display=(!v||r.dataset.q.includes(v))&&(bq.checked||!r.hasAttribute('data-blkrow'))?'':'none';});$$('.aglday').forEach(s=>{s.style.display=[...s.querySelectorAll('.aglrow')].some(r=>r.style.display!=='none')?'':'none';});};q.oninput=f;bq.onchange=f;
  const td=$('.aglday h3.today');if(td)setTimeout(()=>td.scrollIntoView({block:'start'}),50);}
function waitlist(){return S.data.waitlist=S.data.waitlist||[];}
const waitTxt=w=>[(w.days||[]).length?w.days.map(d=>WDAYS_S[d]).join(', '):'οποιαδήποτε μέρα',w.from||w.to?`${w.from||'…'}–${w.to||'…'}`:'οποιαδήποτε ώρα'].join(' · ');
function waitMatches(date,s,e){const wd=wdOf(date);return waitlist().filter(w=>(!(w.days||[]).length||w.days.includes(wd))&&(!w.from||tmin(w.from)<tmin(e))&&(!w.to||tmin(s)<tmin(w.to))&&getStudent(w.sid));}
function waitlistDialog(){const L=waitlist().filter(w=>getStudent(w.sid));
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Λίστα αναμονής</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><p class="small muted" style="margin-top:0">Όσοι περιμένουν ελεύθερη θέση. Όταν ακυρώνεται ή σβήνεται ένα ραντεβού, η εφαρμογή σου προτείνει ποιος ταιριάζει.</p>
   ${L.length?`<div class="rglist">${L.map(w=>{const st=getStudent(w.sid);return`<div class="rgrow"><span class="av">${st.avatar||'🙂'}</span><div class="grow"><b>${esc(stuName(st))}</b><small>${esc(waitTxt(w))} · από ${fmtShort(w.created.slice(0,10))}</small>${w.note?`<div class="small" style="margin-top:3px">${esc(w.note)}</div>`:''}</div><div class="rgact"><button class="btn sm pri" data-wbook="${w.id}">${ic('plus',14)} Ραντεβού</button><button class="btn sm" data-wrm="${w.id}">${ic('check',14)} Βγάλ' τον</button></div></div>`;}).join('')}</div>`:'<p class="small muted">Κανείς σε αναμονή.</p>'}
   <button class="btn pri" id="wadd" style="margin-top:12px">${ic('plus',16)} Προσθήκη στην αναμονή</button>`,{wide:true});
  md.el.addEventListener('click',async e=>{if(e.target.closest('#wadd')){md.close();return waitAddDialog();}
    const bk=e.target.closest('[data-wbook]');if(bk){const w=waitlist().find(x=>x.id===bk.dataset.wbook);md.close();return apptDialog({sids:[w.sid],date:todayISO()});}
    const rm=e.target.closest('[data-wrm]');if(rm){const snap=agSnap();S.data.waitlist=waitlist().filter(x=>x.id!==rm.dataset.wrm);save();md.close();undoBar('Βγήκε από την αναμονή.',snap);waitlistDialog();}});}
async function waitAddDialog(){const st=myStudents();const r=await richPick({title:'Ποιος περιμένει θέση',search:true,onNew:IM_NEWPERSON,items:st.map(x=>({id:x.id,label:stuName(x),av:x.avatar||'🙂'}))});if(!r)return;const sid=r[0];let days=[];
  const md=modal(`<h3 style="margin-top:0">Αναμονή · ${esc(stuName(getStudent(sid)))}</h3><form id="wf"><label class="f">Προτιμώμενες μέρες <span class="tiny muted">· καμία = οποιαδήποτε</span></label><div class="chips field">${DAY_ORDER.map(d=>`<button type="button" class="chipt" data-wd="${d}">${WDAYS_S[d]}</button>`).join('')}</div>
   <div class="grid g2" style="gap:10px"><div class="field"><label class="f" for="w-f">Από ώρα</label><input class="in" type="time" id="w-f" name="from"></div><div class="field"><label class="f" for="w-t">Έως ώρα</label><input class="in" type="time" id="w-t" name="to"></div></div>
   <div class="field"><label class="f" for="w-n">Σημείωση</label><input class="in" id="w-n" name="note" placeholder="π.χ. μόνο απόγευμα, προτιμά καθηγήτρια"></div>
   <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Άκυρο</button><button class="btn pri">${ic('check',16)} Προσθήκη</button></div></form>`);
  md.el.addEventListener('click',e=>{const b=e.target.closest('[data-wd]');if(b){const v=+b.dataset.wd;days=days.includes(v)?days.filter(x=>x!==v):days.concat(v);b.classList.toggle('on');}});
  $('#wf',md.el).onsubmit=e=>{e.preventDefault();const o=fd(e.target);waitlist().push({id:uid(),sid,days,from:o.from||'',to:o.to||'',note:(o.note||'').trim(),created:new Date().toISOString()});save();md.close();toast('Μπήκε στη λίστα αναμονής.','ok');render();};}
function waitSuggest(date,s,e){const M=waitMatches(date,s,e);if(!M.length)return;
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">Ελευθερώθηκε θέση</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><p class="small muted" style="margin-top:0">${WDAYS[wdOf(date)]} ${fmtShort(date)} · ${s}–${e}. Από τη λίστα αναμονής ταιριάζουν:</p>
   <div class="rglist">${M.map(w=>{const st=getStudent(w.sid);const ph=(st.contacts||[]).find(c=>c.phone),em=(st.contacts||[]).find(c=>c.email);const msg=`Καλησπέρα! Ελευθερώθηκε θέση για ραντεβού ${WDAYS[wdOf(date)]} ${fmtShort(date)} στις ${s}. Σας ενδιαφέρει; ${biz().name||S.user.name}`;const sep=/iP(hone|ad|od)/.test(navigator.userAgent)?'&':'?';
     return`<div class="rgrow"><span class="av">${st.avatar||'🙂'}</span><div class="grow"><b>${esc(stuName(st))}</b><small>${esc(waitTxt(w))}</small></div><div class="rgact"><button class="btn sm pri" data-wbk="${w.id}">${ic('plus',14)} Κλείσε</button>${ph?`<a class="btn sm" href="sms:${telLink(ph.phone)}${sep}body=${encodeURIComponent(msg)}">SMS</a>`:''}${em?`<a class="btn sm" href="mailto:${esc(em.email)}?subject=${encodeURIComponent('Ελεύθερη θέση μαθήματος')}&body=${encodeURIComponent(msg)}">Email</a>`:''}</div></div>`;}).join('')}</div>`,{wide:true});
  md.el.addEventListener('click',ev=>{const b=ev.target.closest('[data-wbk]');if(b){const w=waitlist().find(x=>x.id===b.dataset.wbk);md.close();apptDialog({sids:[w.sid],date,s,e:e});}});}
const REM_TPL_DEF='Καλησπέρα! Υπενθύμιση: {πότε} στις {ώρα} έχουμε ραντεβού. Για αλλαγή, στείλτε μου μήνυμα. {επιχείρηση}';
function remTpl(){return S.data.settings.remTpl||REM_TPL_DEF;}
function remWhen(date){const t=todayISO();return date===t?'σήμερα':date===addDays(t,1)?'αύριο '+WDAYS[wdOf(date)]:WDAYS[wdOf(date)]+' '+fmtShort(date);}
function remText(o,tpl){const st=stOf(o.a.sid)||{};const B=biz();return(tpl||remTpl()).replace(/\{πότε\}/g,remWhen(o.date)).replace(/\{ημέρα\}/g,WDAYS[wdOf(o.date)]+' '+fmtShort(o.date)).replace(/\{ώρα\}/g,o.s).replace(/\{(μαθητής|όνομα)\}/g,stuName(st)).replace(/\{(καθηγητής|υπεύθυνος)\}/g,(provById(provOcc(o))||{}).name||S.user.name).replace(/\{επιχείρηση\}/g,B.name||S.meta.org||S.user.name).replace(/\s+$/,'');}
const smsHref=(ph,txt)=>`sms:${telLink(ph)}${/iPhone|iPad|Mac/.test(navigator.userAgent)?'&':'?'}body=${encodeURIComponent(txt)}`;
const waHref=(ph,txt)=>{let n=telLink(ph).replace(/^\+/,'');if(/^69\d{8}$/.test(n)||/^2\d{9}$/.test(n))n='30'+n;return`https://wa.me/${n}?text=${encodeURIComponent(txt)}`;};
const viberHref=txt=>`viber://forward?text=${encodeURIComponent(txt)}`;
function remSent(){return S.data.remSent=S.data.remSent||{};}
function remPrune(){const R=remSent();const lim=addDays(todayISO(),-30);for(const k in R)if(k.split('|')[1]<lim)delete R[k];}
function remindDialog(date){date=date||addDays(todayISO(),1);let tplEdit=false;
  const md=modal(`<div class="spread" style="margin-bottom:6px"><h3 style="margin:0">${ic('bell',18)} Υπενθυμίσεις</h3><button class="iconbtn" data-close aria-label="Κλείσιμο">${ic('x',18)}</button></div><div id="rmb"></div>`,{wide:true});
  const draw=()=>{const L=occ(date,date).filter(o=>o.st==='');const R=remSent();const t=todayISO();
    $('#rmb',md.el).innerHTML=`<div class="seg field" style="flex-wrap:wrap">${[[t,'Σήμερα'],[addDays(t,1),'Αύριο'],[addDays(t,2),WDAYS_S[wdOf(addDays(t,2))]+' '+fmtShort(addDays(t,2))]].map(([d,l])=>`<button type="button" data-rd="${d}" class="${d===date?'on':''}">${l}</button>`).join('')}<input type="date" class="in" id="rmd" value="${date}" style="max-width:160px"></div>
     <details class="field" ${tplEdit?'open':''}><summary class="small"><b>Κείμενο μηνύματος</b> <span class="muted">— πάτα για αλλαγή</span></summary><textarea class="in" id="rmt" style="min-height:76px;margin-top:6px">${esc(remTpl())}</textarea><div class="tiny muted">Λέξεις που αλλάζουν μόνες τους: {πότε} {ημέρα} {ώρα} {όνομα} {υπεύθυνος} {επιχείρηση}. Προτείνεται χωρίς {όνομα}: τα μηνύματα φαίνονται συχνά στην οθόνη κλειδώματος.</div><div class="row" style="margin-top:6px"><button class="btn sm" id="rmts">${ic('check',14)} Αποθήκευση κειμένου</button><button class="btn sm ghost" id="rmtr">Αρχικό κείμενο</button></div></details>
     ${L.length?`<div class="list">${L.map(o=>{const st=stOf(o.a.sid)||{};const ph=(st.contacts||[]).filter(c=>c.phone);const em=(st.contacts||[]).filter(c=>c.email);const txt=remText(o);const sent=R[o.key];
       return`<div class="rw static wrapm remrow ${sent?'sent':''}"><span class="ricon">${st.avatar||'🙂'}</span><span class="grow"><b>${esc(stuName(st))} · ${o.s}–${o.e}</b><small>${ph.length?ph.map(c=>esc(c.role||c.name)+' '+esc(c.phone)).join(' · '):'Δεν υπάρχει τηλέφωνο γονέα'}${sent?' · <b style="color:var(--ok)">στάλθηκε</b>':''}</small></span>
        <span class="end">${chBtnsHTML(st,txt,'Υπενθύμιση μαθήματος',`data-sent="${o.key}"`)}<button class="btn sm ghost" data-cp="${o.key}" title="Αντιγραφή κειμένου">${ic('copy',14)}</button></span></div>`;}).join('')}</div>
       <p class="tiny muted" style="margin:10px 0 0">Κάθε κουμπί ανοίγει τη δική σου εφαρμογή μηνυμάτων με έτοιμο κείμενο — εσύ πατάς αποστολή. Όσα στάλθηκαν σημειώνονται.</p>`
      :`<p class="small muted">Κανένα ενεργό ραντεβού ${remWhen(date)}.</p>`}`;};
  draw();
  md.el.addEventListener('click',e=>{const d=e.target.closest('[data-rd]');if(d){date=d.dataset.rd;return draw();}
    const s=e.target.closest('[data-sent]');if(s){remSent()[s.dataset.sent]=new Date().toISOString();remPrune();save();setTimeout(draw,600);}
    const c=e.target.closest('[data-cp]');if(c){const o=occ(date,date).find(x=>x.key===c.dataset.cp);if(o){navigator.clipboard&&navigator.clipboard.writeText(remText(o)).then(()=>toast('Αντιγράφηκε.','ok'),()=>{});}}
    if(e.target.closest('#rmts')){S.data.settings.remTpl=$('#rmt',md.el).value.trim()||REM_TPL_DEF;save();tplEdit=true;draw();toast('Αποθηκεύτηκε.','ok');}
    if(e.target.closest('#rmtr')){delete S.data.settings.remTpl;save();tplEdit=true;draw();}});
  md.el.addEventListener('change',e=>{if(e.target.id==='rmd'&&e.target.value){date=e.target.value;draw();}});}
const icsEsc=t=>String(t||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/[,;]/g,m=>'\\'+m);
const icsDT=(d,t)=>d.replace(/-/g,'')+'T'+t.replace(':','')+'00';
function icsFor(list,pre){const B=biz();const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GlenApps Imerologio//EL','CALSCALE:GREGORIAN','BEGIN:VTIMEZONE','TZID:Europe/Athens','BEGIN:STANDARD','DTSTART:19701025T040000','TZOFFSETFROM:+0300','TZOFFSETTO:+0200','RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU','END:STANDARD','BEGIN:DAYLIGHT','DTSTART:19700329T030000','TZOFFSETFROM:+0200','TZOFFSETTO:+0300','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU','END:DAYLIGHT','END:VTIMEZONE'];
  const stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  for(const it of list){const a=it.a,st=stOf(a.sid)||{};const title=LX('one')+': '+stuName(st);
    L.push('BEGIN:VEVENT','UID:'+a.id+(it.date?'-'+it.date:'')+'@imerologio','DTSTAMP:'+stamp,'DTSTART;TZID=Europe/Athens:'+icsDT(it.date||a.date,it.s||a.s),'DTEND;TZID=Europe/Athens:'+icsDT(it.date||a.date,it.e||a.e),'SUMMARY:'+icsEsc(title));
    if(!it.date&&a.kind!=='once'){L.push('RRULE:FREQ=WEEKLY;INTERVAL='+(a.kind==='biweekly'?2:1)+(a.until?';UNTIL='+a.until.replace(/-/g,'')+'T235959Z':''));const exd=Object.keys(a.ex||{}).filter(d=>a.ex[d]&&['cancel','moved'].includes(a.ex[d].st));if(exd.length)L.push('EXDATE;TZID=Europe/Athens:'+exd.map(d=>icsDT(d,a.s)).join(','));}
    if(a.note)L.push('DESCRIPTION:'+icsEsc(a.note));if(B.name)L.push('LOCATION:'+icsEsc(B.name));
    if(pre>0)L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(title),'TRIGGER:-PT'+pre+'M','END:VALARM');L.push('END:VEVENT');}
  L.push('END:VCALENDAR');return L.join('\r\n');}
function icsDialog(one){const pre=S.data.settings.preAlert||15;const by=agStaff();
  const md=modal(`<h3 style="margin-top:0">${ic('calendar',18)} Στο ημερολόγιο του κινητού</h3><p class="small muted">Κατεβαίνει αρχείο που ανοίγει με το ημερολόγιο του κινητού ή του υπολογιστή (Google, Apple, Outlook). Εκεί οι ειδοποιήσεις έρχονται ακόμη κι αν η εφαρμογή είναι κλειστή.</p>
   ${one?'':`<div class="field"><label class="f">Ποια ραντεβού</label><select class="in" id="icw"><option value="fix">Όλα τα πάγια και τα επόμενα μίας φοράς</option><option value="30">Όλα των επόμενων 30 ημερών</option></select></div>`}
   <div class="field"><label class="f">Ειδοποίηση πριν</label><select class="in" id="icp">${[[0,'Χωρίς'],[10,'10 λεπτά'],[15,'15 λεπτά'],[30,'30 λεπτά'],[60,'1 ώρα'],[1440,'1 ημέρα']].map(([v,l])=>opt(v,l,String(pre))).join('')}</select></div>
   <div class="row" style="justify-content:flex-end"><button class="btn" data-close>Άκυρο</button><button class="btn pri" id="icgo">${ic('download',16)} Κατέβασμα</button></div>
   <p class="tiny muted" style="margin:10px 0 0">Αν αλλάξει κάποιο ραντεβού εδώ, κατέβασε ξανά το αρχείο — τα ίδια ραντεβού ενημερώνονται, δεν διπλασιάζονται.</p>`);
  $('#icgo',md.el).onclick=()=>{const p=+$('#icp',md.el).value;let list;const t=todayISO();
    if(one)list=[one];else if($('#icw',md.el).value==='30')list=occ(t,addDays(t,30),{by}).filter(o=>o.st==='').map(o=>({a:o.a,date:o.date,s:o.s,e:o.e}));
    else list=appts().filter(a=>(!by||provOf(a)===by)&&(a.kind!=='once'?(!a.until||a.until>=t):a.date>=t)).map(a=>({a}));
    if(!list.length)return toast('Δεν υπάρχουν ραντεβού.','bad');downloadText(one?`rantevou-${one.date||one.a.date}.ics`:`imerologio-${t}.ics`,icsFor(list,p),'text/calendar');md.close();toast('Άνοιξε το αρχείο για να μπει στο ημερολόγιο.','ok');};}
function copyWeekDialog(w){const by=agStaff();let to=addDays(w,7);
  const md=modal(`<h3 style="margin-top:0">${ic('copy',18)} Αντιγραφή εβδομάδας</h3><p class="small muted">Αντιγράφει τα ραντεβού <b>μίας φοράς</b> και τις δεσμεύσεις μίας φοράς της εβδομάδας ${fmtShort(w)}–${fmtShort(addDays(w,6))} σε άλλη εβδομάδα. Τα πάγια επαναλαμβάνονται ήδη μόνα τους.</p>
   <div class="field"><label class="f">Προς την εβδομάδα που ξεκινά</label><input class="in" type="date" id="cwt" value="${to}"></div><div id="cws"></div>
   <div class="row" style="justify-content:flex-end"><button class="btn" data-close>Άκυρο</button><button class="btn pri" id="cwgo">${ic('copy',16)} Αντιγραφή</button></div>`);
  const plan=()=>{const off=Math.round((new Date(to+'T12:00')-new Date(w+'T12:00'))/864e5);const A=appts().filter(a=>a.kind==='once'&&a.date>=w&&a.date<=addDays(w,6)&&(!by||provOf(a)===by)&&!(a.ex&&a.ex[a.date]&&a.ex[a.date].st==='cancel'));const Bk=blocks().filter(b=>b.kind==='once'&&b.date>=w&&b.date<=addDays(w,6)&&(!by||(b.by||'me')===by));
    const ok=[],clash=[],closed=[];for(const a of A){const nd=addDays(a.date,off);if(isClosed(nd)){closed.push([a,nd]);continue;}const C=conflicts(nd,a.s,a.e,null,provOf(a)).filter(o=>!(o.a.sid===a.sid&&o.s===a.s));(C.length?clash:ok).push([a,nd,C]);}
    return{off,ok,clash,closed,Bk};};
  const show=()=>{const P=plan();$('#cws',md.el).innerHTML=P.off===0?'<div class="note bad small">Διάλεξε άλλη εβδομάδα.</div>':`<div class="note small field"><b>${P.ok.length}</b> ${P.ok.length===1?'ραντεβού θα αντιγραφεί':'ραντεβού θα αντιγραφούν'}${P.Bk.length?` · <b>${P.Bk.length}</b> δεσμεύσεις`:''}${P.clash.length?` · <b style="color:var(--bad)">${P.clash.length===1?'1 σύγκρουση':P.clash.length+' συγκρούσεις'}</b>`:''}${P.closed.length?` · ${P.closed.length} πέφτουν σε κλειστή μέρα (παραλείπονται)`:''}</div>
     ${P.clash.length?`<div class="list field">${P.clash.map(([a,nd,C])=>`<label class="rw static"><input type="checkbox" data-cl="${a.id}"><span class="grow"><b>${esc(stuName(stOf(a.sid)))} · ${WDAYS_S[wdOf(nd)]} ${fmtShort(nd)} ${a.s}</b><small style="white-space:normal">Πέφτει πάνω σε: ${C.map(o=>o.blk?esc(blkTitle(o.blk)):esc(stuName(stOf(o.a.sid)))).join(', ')} — τσέκαρε για να μπει παρ' όλα αυτά</small></span></label>`).join('')}</div>`:''}`;};
  show();$('#cwt',md.el).onchange=e=>{to=mondayOf(e.target.value||to);e.target.value=to;show();};
  $('#cwgo',md.el).onclick=()=>{const P=plan();if(!P.off)return;const force=new Set($$('[data-cl]:checked',md.el).map(x=>x.dataset.cl));const snap=agSnap();let n=0;
    for(const[a,nd]of P.ok.concat(P.clash.filter(([a])=>force.has(a.id)))){appts().push({id:uid(),sid:a.sid,kind:'once',date:nd,d:wdOf(nd),s:a.s,e:a.e,note:a.note||'',ex:{},by:a.by,mats:a.mats,created:new Date().toISOString()});n++;}
    for(const b of P.Bk){const nd=addDays(b.date,P.off);blocks().push(Object.assign(JSON.parse(JSON.stringify(b)),{id:uid(),date:nd,ex:{}}));}
    save();md.close();go(`agenda?view=week&w=${to}`);setTimeout(()=>undoBar(`Αντιγράφηκαν ${n} ραντεβού${P.Bk.length?' και '+P.Bk.length+' δεσμεύσεις':''}.`,snap),300);};}
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const dirHref=(lat,lng)=>`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
function placeTxt(loc){return loc?(loc.addr||`${(+loc.lat).toFixed(5)}, ${(+loc.lng).toFixed(5)}`):'';}
function chOk(st,k){const c=st&&st.consent;if(!c||!c.ch)return true;return!!c.ch[k];}
function chBtnsHTML(st,txt,subj,attr){const ph=(st.contacts||[]).filter(c=>c.phone),em=(st.contacts||[]).filter(c=>c.email);const H=[];
  if(ph.length&&chOk(st,'sms'))ph.slice(0,2).forEach(c=>H.push(`<a class="btn sm" href="${smsHref(c.phone,txt)}" ${attr}>${ic('l-message-square',14)} SMS${ph.length>1?' '+esc((c.role||'').slice(0,3)):''}</a>`));
  if(ph.length&&chOk(st,'wa'))H.push(`<a class="btn sm" href="${waHref(ph[0].phone,txt)}" target="_blank" rel="noopener" ${attr}>WhatsApp</a>`);
  if(ph.length&&chOk(st,'viber'))H.push(`<a class="btn sm" href="${viberHref(txt)}" ${attr}>Viber</a>`);
  if(em.length&&chOk(st,'email'))H.push(`<a class="btn sm" href="mailto:${em.map(c=>c.email).join(',')}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(txt)}" ${attr}>${ic('send',14)} Email</a>`);
  if(!H.length&&(ph.length||em.length))H.push(`<span class="chip" title="Ο γονέας δεν έχει συναινέσει σε κανένα κανάλι">Χωρίς συναίνεση για μηνύματα</span>`);
  return H.join('');}
Object.assign(ICONS,{"l-message-square": "<path d=\"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z\" />", "l-calendar-clock": "<path d=\"M16 14v2.2l1.6 1\" /> <path d=\"M16 2v3\" /> <path d=\"M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338\" /> <path d=\"M3 9h5.859\" /> <path d=\"M8 2v3\" /> <circle cx=\"16\" cy=\"16\" r=\"6\" />", "l-flag": "<path d=\"M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528\" />"});
