/* glossa.js — κοινή γλώσσα GlenApps (Ελληνικά / English)
   © 2026 Ανδρέας Μ. Γλεντζάκης. Με την επιφύλαξη παντός δικαιώματος.

   Πώς δουλεύει:
   - Η εφαρμογή γράφεται κανονικά στα ελληνικά.
   - Αν ο χρήστης διαλέξει αγγλικά, κάθε ελληνικό κείμενο που εμφανίζεται στην οθόνη
     μεταφράζεται τη στιγμή που μπαίνει, από το λεξικό window.EN_DICT (αρχείο en.js).
   - Το λεξικό έχει «{}» στα σημεία που αλλάζουν (αριθμοί, ονόματα, ημερομηνίες).
   - Η επιλογή κρατιέται στο κλειδί «glen-lang», κοινό για όλες τις εφαρμογές GlenApps
     της ίδιας διεύθυνσης: διαλέγεις μία φορά, ισχύει παντού.
   - Ό,τι γράφει ο χρήστης (ονόματα, σημειώσεις, πεδία) δεν αγγίζεται.
   Για νέα εφαρμογή: φόρτωσε en.js (το δικό της λεξικό) και μετά glossa.js, πριν από τον κώδικά της.
*/
(function(){
'use strict';
const KEY='glen-lang';
let L=null;try{L=localStorage.getItem(KEY);}catch(_){}
if(L!=='el'&&L!=='en')L=String(navigator.language||'el').toLowerCase().startsWith('el')?'el':'en';
window.LANG=L;
document.documentElement.lang=L;

const GR=/[Ͱ-Ͽἀ-῿]/;
const norm=s=>String(s).replace(/\s+/g,' ').trim();
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

/* ---- λεξικό ---- */
const exact=new Map(),pats=[];
function addEntry(g,e){
  if(!g.includes('{}')){if(!exact.has(g))exact.set(g,e);return;}
  const parts=g.split('{}');
  pats.push({re:new RegExp('^'+parts.map(reEsc).join('([\\s\\S]*?)')+'$'),e,pre:parts[0],lit:parts.join('').length});
}
function load(D){
  for(const[g0,e0]of Object.entries(D||{})){const g=norm(g0),e=String(e0).trim();addEntry(g,e);
    // παραλλαγή χωρίς {} στην αρχή/τέλος (συνήθως εικονίδιο που δεν είναι κείμενο)
    const seen=new Set([g]),Q=[[g,e]];
    while(Q.length){const[a,b]=Q.shift();const V=[];
      if(a.startsWith('{}')&&b.startsWith('{}'))V.push([a.slice(2).trim(),b.slice(2).trim()]);
      if(a.endsWith('{}')&&b.endsWith('{}'))V.push([a.slice(0,-2).trim(),b.slice(0,-2).trim()]);
      for(const[x,y]of V)if(x&&!seen.has(x)&&GR.test(x)&&!/\{\d+\}/.test(y)){seen.add(x);addEntry(x,y);Q.push([x,y]);}}}
  pats.sort((a,b)=>b.lit-a.lit);
}
load(window.EN_DICT);

/* ημέρες / μήνες για ό,τι ξεφύγει */
const WORDS=[['Κυριακή','Sunday'],['Δευτέρα','Monday'],['Τρίτη','Tuesday'],['Τετάρτη','Wednesday'],['Πέμπτη','Thursday'],['Παρασκευή','Friday'],['Σάββατο','Saturday'],
 ['Ιανουαρίου','January'],['Φεβρουαρίου','February'],['Μαρτίου','March'],['Απριλίου','April'],['Μαΐου','May'],['Ιουνίου','June'],['Ιουλίου','July'],['Αυγούστου','August'],['Σεπτεμβρίου','September'],['Οκτωβρίου','October'],['Νοεμβρίου','November'],['Δεκεμβρίου','December'],
 ['Ιανουάριος','January'],['Φεβρουάριος','February'],['Μάρτιος','March'],['Απρίλιος','April'],['Μάιος','May'],['Ιούνιος','June'],['Ιούλιος','July'],['Αύγουστος','August'],['Σεπτέμβριος','September'],['Οκτώβριος','October'],['Νοέμβριος','November'],['Δεκέμβριος','December'],
 ['Κυρ','Sun'],['Δευ','Mon'],['Τρί','Tue'],['Τετ','Wed'],['Πέμ','Thu'],['Παρ','Fri'],['Σάβ','Sat'],
 ['σήμερα','today'],['αύριο','tomorrow'],['χθες','yesterday'],['ραντεβού','appointments'],['π.μ.','AM'],['μ.μ.','PM']];
const wordRe=new RegExp('(^|[^\\u0370-\\u03FF\\u1F00-\\u1FFF])('+WORDS.map(w=>reEsc(w[0])).join('|')+')(?=$|[^\\u0370-\\u03FF\\u1F00-\\u1FFF])','g');
const wordMap=new Map(WORDS);
const words=s=>s.replace(wordRe,(m,a,w)=>a+wordMap.get(w));

const cache=new Map();
function fill(e,g){let i=0;return e.replace(/\{(\d*)\}/g,(_,n)=>{const v=n?g[+n-1]:g[i++];return v==null?'':v;});}
const EDGE=/^([^\p{L}\p{N}«“"(]*)([\s\S]*?)([^\p{L}\p{N}.!?»”")]*)$/u;
function tr1(k,d){
  if(exact.has(k))return exact.get(k);
  const em=EDGE.exec(k);if(em&&(em[1]||em[3])&&exact.has(em[2].trim()))return em[1]+exact.get(em[2].trim())+em[3];
  for(const p of pats){if(p.pre&&!k.startsWith(p.pre))continue;const m=p.re.exec(k);
    if(m)return fill(p.e,m.slice(1).map(x=>{if(!(d<3&&GR.test(x)))return x;const l=x.match(/^\s*/)[0],t=x.match(/\s*$/)[0];return l+tr1(norm(x),d+1)+t;}));}
  if(em&&(em[1]||em[3])&&d<4){const mid=em[2].trim();if(mid&&mid!==k&&GR.test(mid)){const t=tr1(mid,d+1);if(t!==mid)return em[1]+t+em[3];}}
  for(const sep of[' · ',' — ',' – ','\n']){if(k.includes(sep)){const P=k.split(sep);const T=P.map(x=>GR.test(x)?tr1(norm(x),d+1):x);if(T.some((x,i)=>x!==P[i]))return T.join(sep);}}
  return words(k);
}
/* μετάφραση ενός κειμένου (κρατά κενά αρχής/τέλους) */
function tr(s){
  if(LANG!=='en'||s==null)return s;s=String(s);if(!GR.test(s))return s;
  if(exact.has(s))return exact.get(s);
  if(s.includes('\n')&&!exact.has(norm(s)))return s.split('\n').map(tr).join('\n');
  const lead=s.match(/^\s*/)[0],trail=s.match(/\s*$/)[0],k=norm(s);
  let r=cache.get(k);if(r===undefined){r=tr1(k,0);cache.set(k,r);}
  return lead+r+trail;
}
window.tr=tr;
window.glossaAdd=D=>{load(D);cache.clear();};

/* ---- αλλαγή γλώσσας ---- */
window.setLang=l=>{try{localStorage.setItem(KEY,l);}catch(_){}location.reload();};
window.LANGS=[{k:'el',f:'🇬🇷',n:'Ελληνικά'},{k:'en',f:'🇬🇧',n:'English'}];
window.langFlag=()=>LANG==='en'?'🇬🇧':'🇬🇷';

if(LANG!=='en')return;

/* ---- μετάφραση της οθόνης ---- */
const SKIP='script,style,textarea,code,pre,[data-notr],[contenteditable="true"]';
const ATTRS=['placeholder','title','aria-label'];
let busy=false;
function trText(n){
  const p=n.parentElement;if(!p||p.closest(SKIP))return;
  const v=n.data;if(!GR.test(v)||v===n._en)return;
  const t=tr(v);if(t!==v){n._en=t;n.data=t;}
}
function trAttrs(el){
  for(const a of ATTRS){const v=el.getAttribute&&el.getAttribute(a);if(v&&GR.test(v)){const t=tr(v);if(t!==v)el.setAttribute(a,t);}}
  if(el.tagName==='INPUT'&&/^(button|submit)$/i.test(el.type)&&GR.test(el.value))el.value=tr(el.value);
  if(el.tagName==='OPTION'&&!el.closest(SKIP)){/* κείμενο option = text node, το πιάνει η κανονική διαδρομή */}
}
function trTree(root){
  if(!root)return;busy=true;
  try{
    if(root.nodeType===3){trText(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1){if(root.closest(SKIP))return;trAttrs(root);}
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:n=>n.nodeType===1&&n.matches(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    let n;while((n=w.nextNode())){if(n.nodeType===3)trText(n);else trAttrs(n);}
  }finally{busy=false;}
}
window.trTree=trTree;
const mo=new MutationObserver(list=>{
  if(busy)return;
  for(const m of list){
    if(m.type==='childList')m.addedNodes.forEach(trTree);
    else if(m.type==='characterData')trTree(m.target);
    else if(m.type==='attributes'&&m.target.nodeType===1)trAttrs(m.target);
  }
});
function start(){trTree(document.body);document.title=tr(document.title);
  mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start);

/* αναδυόμενα του φυλλομετρητή */
const _c=window.confirm.bind(window),_a=window.alert.bind(window),_p=window.prompt.bind(window);
window.confirm=m=>_c(tr(m));window.alert=m=>_a(tr(m));window.prompt=(m,d)=>_p(tr(m),d);
})();
