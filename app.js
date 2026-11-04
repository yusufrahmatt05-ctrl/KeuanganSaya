const KEY="keuanganSayaV7";
const SEED_URL="data-2026.json";
let s=JSON.parse(localStorage.getItem(KEY)||"null");
const $=x=>document.getElementById(x), rp=n=>"Rp "+Number(n||0).toLocaleString("id-ID"), dateOnly=x=>String(x||"").slice(0,10), dt=x=>new Date(dateOnly(x)+"T00:00:00"), sum=a=>a.reduce((t,x)=>t+Number(x.amount||0),0);
function normalize(x){return {id:String(x.id??(Date.now()+Math.random())),date:dateOnly(x.date),desc:String(x.desc??x.category??"Transaksi"),amount:Number(x.amount)||0};}
async function init(){
  if(!s){
    try { const r=await fetch(SEED_URL,{cache:"no-store"}); if(r.ok){const backup=await r.json();s={baseBalance:Number(backup.savingsBase)||0,income:[],expense:[],saving:[],year:2026,month:new Date().getMonth()};backup.data.forEach(x=>{const t=x.type;if(s[t])s[t].push(normalize(x));});} } catch(e) {}
  }
  if(!s)s={baseBalance:0,income:[],expense:[],saving:[],year:new Date().getFullYear(),month:new Date().getMonth()};
  s.baseBalance=Number(s.baseBalance)||0;["income","expense","saving"].forEach(t=>s[t]=(s[t]||[]).map(normalize));
  s.year=Number(s.year)||2026;s.month=Number.isInteger(s.month)?s.month:new Date().getMonth();
  save(false);render();
}
function years(){const ys=new Set([2026,2027,s.year]);["income","expense","saving"].forEach(t=>s[t].forEach(x=>ys.add(dt(x.date).getFullYear())));return [...ys].sort((a,b)=>a-b);}
function allBefore(y){return s.baseBalance+sum(s.saving.filter(x=>dt(x.date).getFullYear()<y))-sum(s.expense.filter(x=>dt(x.date).getFullYear()<y));}
function total(){return Math.max(0,allBefore(s.year)+sum(s.saving.filter(x=>dt(x.date).getFullYear()===s.year))-sum(s.expense.filter(x=>dt(x.date).getFullYear()===s.year)));}
function save(doRender=true){localStorage.setItem(KEY,JSON.stringify(s));if(doRender)render();}
function esc(x){return String(x).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function cur(a){return a.filter(x=>{let d=dt(x.date);return d.getFullYear()===s.year&&d.getMonth()===s.month;});}
function render(){ $("year").textContent=s.year;$("summaryYear").textContent=s.year;$("totalSaving").textContent=rp(total());$("totalBadge").textContent=rp(total());$("incomeTotal").textContent=rp(sum(cur(s.income)));$("expenseTotal").textContent=rp(sum(cur(s.expense)));$("savingMonth").textContent=rp(sum(cur(s.saving)));
  $("yearSelect").innerHTML=years().map(y=>`<option value="${y}" ${y===s.year?"selected":""}>${y}</option>`).join("");
  let names=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  $("months").innerHTML=names.map((n,i)=>`<button class="${i===s.month?"active":""}" onclick="s.month=${i};save()">${n}</button>`).join("");renderLists();renderSummary();renderChart();
}
function renderLists(){["income","expense","saving"].forEach(t=>{let a=cur(s[t]).sort((x,y)=>y.date.localeCompare(x.date));$(t+"List").innerHTML=a.length?a.map(x=>`<div class="item ${t}"><div><b>${esc(x.desc)}</b><small>• ${dt(x.date).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</small></div><div><span class="amount">${rp(x.amount)}</span> <button class="del" onclick="editTx('${t}','${esc(x.id)}')">✎</button> <button class="del" onclick="del('${t}','${esc(x.id)}')">×</button></div></div>`).join(""):`<p class="hint">Belum ada data bulan ini.</p>`;});}
function renderSummary(){let names=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];$("summary").innerHTML=names.map((n,i)=>{let filt=a=>a.filter(x=>{let d=dt(x.date);return d.getFullYear()===s.year&&d.getMonth()===i;});return `<tr><td>${i+1}</td><td>${n}</td><td>${rp(sum(filt(s.income)))}</td><td>${rp(sum(filt(s.expense)))}</td><td>${rp(sum(filt(s.saving)))}</td></tr>`;}).join("");}
function renderChart(){let names=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];$ ("chart").innerHTML=names.map((n,i)=>{let f=a=>sum(a.filter(x=>{let d=dt(x.date);return d.getFullYear()===s.year&&d.getMonth()===i;}));let vals=[f(s.income),f(s.expense),f(s.saving)],max=Math.max(...vals,1);return `<div class="barset"><div><div class="bar in" style="height:${Math.max(3,vals[0]/max*145)}px"></div></div><div><div class="bar out" style="height:${Math.max(3,vals[1]/max*145)}px"></div></div><div><div class="bar sav" style="height:${Math.max(3,vals[2]/max*145)}px"></div></div><div class="monthlabel">${n}</div></div>`;}).join("");}
function add(t,f){f.preventDefault();let i=[...f.querySelectorAll("input")];s[t].push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),date:i[0].value,desc:i[1].value,amount:+i[2].value});f.reset();save();}
["income","expense","saving"].forEach(t=>$(t+"Form").onsubmit=e=>add(t,e));
window.del=(t,id)=>{if(confirm("Hapus transaksi ini?")){s[t]=s[t].filter(x=>String(x.id)!==String(id));save();}};
window.editTx=(t,id)=>{let x=s[t].find(v=>String(v.id)===String(id));if(!x)return;let d=prompt("Tanggal (YYYY-MM-DD)",x.date);if(d===null)return;let desc=prompt("Keterangan",x.desc);if(desc===null)return;let amount=prompt("Jumlah (angka)",String(x.amount));if(amount===null)return;if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Number(amount))||Number(amount)<0){alert("Tanggal atau jumlah tidak valid.");return;}Object.assign(x,{date:d,desc,amount:Number(amount)});save();};
$("yearSelect").onchange=e=>{s.year=Number(e.target.value);save();};
$("editTotal").onclick=()=>{$("balanceInput").value=total();$("dlg").showModal();};
$("saveBalance").onclick=e=>{e.preventDefault();let v=Number($("balanceInput").value);if(!Number.isFinite(v)||v<0)return;const before=allBefore(s.year),thisYearSavings=sum(s.saving.filter(x=>dt(x.date).getFullYear()===s.year)),thisYearExpenses=sum(s.expense.filter(x=>dt(x.date).getFullYear()===s.year));s.baseBalance=v-thisYearSavings+thisYearExpenses-(before-s.baseBalance);save();$("dlg").close();};
$("clear").onclick=()=>{if(confirm("Hapus semua data? Tindakan ini tidak bisa dibatalkan.")){localStorage.removeItem(KEY);location.reload();}};
function download(name,obj){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}));a.download=name;a.click();URL.revokeObjectURL(a.href);}
$("export").onclick=()=>download("keuangan-saya-backup.json",{version:8,baseBalance:s.baseBalance,income:s.income,expense:s.expense,saving:s.saving,year:s.year,month:s.month});
$("importBackup").onclick=()=>$("importFile").click();
$("importFile").onchange=async e=>{let file=e.target.files[0];if(!file)return;try{let b=JSON.parse(await file.text());let incoming={income:[],expense:[],saving:[]};if(Array.isArray(b.data)){incoming.baseBalance=Number(b.savingsBase)||0;b.data.forEach(x=>{if(incoming[x.type])incoming[x.type].push(normalize(x));});}else{incoming.baseBalance=Number(b.baseBalance)||0;["income","expense","saving"].forEach(t=>incoming[t]=(b[t]||[]).map(normalize));}
 if(!confirm("Impor backup? Transaksi dengan ID yang sama tidak akan digandakan. Data yang sudah ada tetap dipertahankan."))return;
 ["income","expense","saving"].forEach(t=>{let ids=new Set(s[t].map(x=>String(x.id)));incoming[t].forEach(x=>{if(!ids.has(String(x.id)))s[t].push(x);});});if(!s.baseBalance)s.baseBalance=incoming.baseBalance;save();alert("Backup berhasil diimpor.");}catch(err){alert("File backup tidak valid atau tidak bisa dibaca.");}finally{e.target.value="";}};
init();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
