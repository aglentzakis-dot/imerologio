/* Ημερολόγιο — ρύθμιση παραλήπτη «Μεταφορά στοιχείων» (από aglentzakis-dot.github.io/imerologio/ στο imerologio.glenapps.gr).
   © 2026 Ανδρέας Μ. Γλεντζάκης. Τα κλειδιά βγήκαν από τον κώδικα της εφαρμογής (1.71).
   Δεν μεταφέρεται η βάση «shared-backups»: είναι κοινή με άλλες εφαρμογές και κρατά την επιλογή φακέλου (δεν περνά σε άλλη διεύθυνση)
   και το κλειδί αντιγράφων της συσκευής — στη νέα διεύθυνση ζητείται ξανά ο κωδικός αντιγράφων και ξαναδιαλέγεται ο φάκελος. */
window.GLEN_METAFORA={
  app:"imerologio",
  onoma:"Ημερολόγιο",
  ls:["imerologio-data","imerologio-lock","imer-",
      "im-after-person","im-hold","im-lockf","im-lockw","im-mine-msg","im-rem-back","im-started","im-stp","im-weak",
      "kr-me","kr-pets","glenapps-imerologio","glenapps-aitimata-imerologio",
      "glenapps-kleidi","glen-lang"],
  idb:[],
  opfs:["imerologio-antigrafa/"],
  exei:function(){try{var d=localStorage.getItem("imerologio-data");if(!d)return false;var o=JSON.parse(d);return !!(o&&(o.enc||(o.students&&o.students.length)||(o.appts&&o.appts.length)||(o.settings&&o.settings.prof)));}catch(e){return false}}
};
