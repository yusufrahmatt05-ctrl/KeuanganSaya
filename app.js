const months=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"],fullMonths=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
let selectedMonth=new Date().getMonth(),year=new Date().getFullYear();
let data=JSON.parse(localStorage.getItem("keuanganYusuf")||"[]");

// Versi 6: tanggal transaksi dinormalisasi agar filter bulan/tahun konsisten,
// terutama pada iPhone/PWA yang dapat berbeda timezone.
const LOGIC_VERSION=4;
let savingsBase=Number(localStorage.getItem("keuanganYusufSavingsBase"));
const storedLogicVersion=Number(localStorage.getItem("keuanganYusufLogicVersion")||0);

// Pertahankan saldo dasar dari versi sebelumnya. Jika instalasi lama belum punya
// savingsBase, gunakan saldo tabungan manual yang sudah tersimpan sebagai titik awal.
if(!Number.isFinite(savingsBase)){
  savingsBase=data.filter(x=>x.type==="saving").reduce((a,x)=>a+Number(x.amount||0),0);
  localStorage.setItem("keuanganYusufSavingsBase",String(savingsBase));
}

// Dari versi 5 ke atas, balanceApplied sudah menentukan transaksi baru yang
// memengaruhi saldo. Untuk data yang belum memiliki flag, anggap histori lama
// sehingga tidak mengubah saldo secara tiba-tiba.
if(storedLogicVersion<2){
  data=data.map(x=>Object.prototype.hasOwnProperty.call(x,"balanceApplied")?x:{...x,balanceApplied:false});
}

data=data.map(x=>({
  ...x,
  amount:Number(x.amount)||0,
  date:normalizeDate(x.date)
}));
localStorage.setItem("keuanganYusuf",JSON.stringify(data));
localStorage.setItem("keuanganYusufLogicVersion",String(Math.max(storedLogicVersion,LOGIC_VERSION)));

const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();

function normalizeDate(value){
  if(!value)return new Date().toISOString();
  const s=String(value);
  // ISO YYYY-MM-DD... — simpan tanggal yang sama tanpa menggeser hari karena timezone.
  const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(iso)return `${iso[1]}-${iso[2]}-${iso[3]}T12:00:00.000Z`;
  // Format Indonesia DD/MM/YYYY jika ada pada data lama.
  const id=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if(id)return `${id[3]}-${String(id[2]).padStart(2,"0")}-${String(id[1]).padStart(2,"0")}T12:00:00.000Z`;
  const d=new Date(value);
  if(!Number.isNaN(d.getTime()))return new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),12)).toISOString();
  return new Date().toISOString();
}
function dateParts(value){
  const s=normalizeDate(value).slice(0,10).split("-").map(Number);
  return {year:s[0],month:s[1]-1,day:s[2]};
}
function dateInput(value){return normalizeDate(value).slice(0,10)}
function dateLabel(value){
  const p=dateParts(value);
  return `${String(p.day).padStart(2,"0")}/${String(p.month+1).padStart(2,"0")}/${p.year}`;
}
function save(){
  localStorage.setItem("keuanganYusuf",JSON.stringify(data));
  localStorage.setItem("keuanganYusufSavingsBase",String(savingsBase));
  localStorage.setItem("keuanganYusufLogicVersion",String(LOGIC_VERSION));
  render();
}
function list(){return data.filter(x=>{const p=dateParts(x.date);return p.year===year&&p.month===selectedMonth})}
function total(type,l=list()){return l.filter(x=>x.type===type).reduce((a,x)=>a+Number(x.amount||0),0)}

// LOGIKA SALDO:
// Pemasukan tidak menambah tabungan.
// Pengeluaran mengurangi tabungan.
// Tabungan/investasi manual menambah tabungan.
function effect(x){
  if(!x.balanceApplied)return 0;
  const amount=Number(x.amount)||0;
  if(x.type==="expense")return -amount;
  if(x.type==="saving")return amount;
  return 0;
}
function savingBalance(){return savingsBase+data.reduce((sum,x)=>sum+effect(x),0)}
function monthlySavings(l=list()){return total("saving",l)}

function editTotalSavings(){
  const current=savingBalance();
  const raw=prompt("Edit Total Tabungan\n\nMasukkan saldo tabungan saat ini:", String(Math.round(current)));
  if(raw===null)return;
  const desired=num(raw);
  if(!Number.isFinite(desired) || desired<0)return alert("Nominal tabungan tidak valid.");

  // Jadikan angka yang diedit sebagai saldo aktual/base baru.
  // Efek transaksi yang sudah tercatat tetap dipertahankan sehingga transaksi
  // berikutnya tetap menambah/mengurangi saldo secara normal.
  const appliedEffects=data.reduce((sum,x)=>sum+effect(x),0);
  savingsBase=desired-appliedEffects;
  if(savingsBase<0 && desired>=0){
    // Base boleh negatif secara teknis agar saldo aktual tetap persis sesuai
    // nominal yang dimasukkan user; jangan mengubah histori transaksi.
  }
  localStorage.setItem("keuanganYusufSavingsBase",String(savingsBase));
  render();
  alert("Total Tabungan berhasil diubah menjadi " + rupiah(desired) + ".");
}

function render(){
  yearLabel.textContent=year;
  tableYear.textContent=year;
  renderMonths();
  renderSummary();
  renderChart();
  renderTable();
  renderLists();
}
function renderMonths(){
  monthScroller.innerHTML="";
  months.forEach((m,i)=>{
    const b=document.createElement("button");
    b.className="month "+(i===selectedMonth?"active":"");
    b.textContent=m;
    b.onclick=()=>{selectedMonth=i;render()};
    monthScroller.appendChild(b);
  });
}
function renderSummary(){
  const l=list();
  const inc=total("income",l),exp=total("expense",l),sav=monthlySavings(l);
  incomeTotal.textContent=rupiah(inc);
  expenseTotal.textContent=rupiah(exp);
  savingTotal.textContent=rupiah(sav);
  allSavingTotal.textContent=rupiah(savingBalance());
  totalSavingBadge.textContent=rupiah(savingBalance());
  monthIncome.textContent=rupiah(inc);
  monthExpense.textContent=rupiah(exp);
  monthSaving.textContent=rupiah(sav);

  // Default tanggal selalu mengikuti bulan yang sedang dipilih.
  const selectedDefault=new Date(year,selectedMonth+1,0).toISOString().slice(0,10);
  if(!expenseDate.value || dateParts(expenseDate.value).year!==year || dateParts(expenseDate.value).month!==selectedMonth)expenseDate.value=selectedDefault;
  if(!savingDate.value || dateParts(savingDate.value).year!==year || dateParts(savingDate.value).month!==selectedMonth)savingDate.value=selectedDefault;
}
function renderChart(){
  chart.innerHTML="";
  const vals=months.map((_,m)=>{
    const l=data.filter(x=>{const p=dateParts(x.date);return p.year===year&&p.month===m});
    return [total("income",l),total("expense",l),monthlySavings(l)];
  });
  const max=Math.max(1,...vals.flat().map(v=>Math.abs(v)));
  vals.forEach((v,i)=>{
    const c=document.createElement("div");c.className="chart-col";
    c.innerHTML=`<div class="bars"><i class="bar green" style="height:${Math.max(0,v[0])/max*150}px"></i><i class="bar red" style="height:${Math.max(0,v[1])/max*150}px"></i><i class="bar purple" style="height:${Math.max(0,v[2])/max*150}px"></i></div><div class="chart-label">${months[i]}</div>`;
    chart.appendChild(c);
  });
}
function renderTable(){
  annualBody.innerHTML="";let a=0,b=0,c=0;
  for(let m=0;m<12;m++){
    const l=data.filter(x=>{const p=dateParts(x.date);return p.year===year&&p.month===m});
    const i=total("income",l),e=total("expense",l),s=monthlySavings(l);
    a+=i;b+=e;c+=s;
    annualBody.innerHTML+=`<tr class="${m===selectedMonth?"active":""}"><td>${m+1}</td><td>${fullMonths[m]}</td><td class="green">${rupiah(i)}</td><td class="red">${rupiah(e)}</td><td class="purple">${rupiah(s)}</td></tr>`;
  }
  annualFoot.innerHTML=`<tr><td colspan="2">TOTAL SETAHUN</td><td>${rupiah(a)}</td><td>${rupiah(b)}</td><td>${rupiah(c)}</td></tr>`;
}
function renderLists(){
  const l=list(),i=l.filter(x=>x.type==="income"),e=l.filter(x=>x.type==="expense"),s=l.filter(x=>x.type==="saving");
  incomeEmpty.style.display=i.length?"none":"block";
  expenseEmpty.style.display=e.length?"none":"block";
  savingEmpty.style.display=s.length?"none":"block";
  incomeList.innerHTML=i.map(tx).join("");
  expenseList.innerHTML=e.map(tx).join("");
  savingList.innerHTML=s.map(tx).join("");
}
function tx(x){
  const label=x.type==="income"?x.category:(x.category||"Pengeluaran");
  const marker=x.balanceApplied?"":" • histori lama";
  return `<div class="tx"><div><strong>${esc(label)}</strong><br><small>${esc(x.note||"")} · ${dateLabel(x.date)}${marker}</small></div><div class="tx-actions">${rupiah(x.amount)} <button class="edit" onclick="editTx('${x.id}')">✎</button><button class="delete" onclick="removeTx('${x.id}')">×</button></div></div>`;
}
function editTx(k){
  const x=data.find(v=>v.id===k);if(!x)return;
  const label=prompt("Nama / keterangan",x.category||x.note||"");if(label===null)return;
  const raw=prompt("Jumlah (contoh 2000000)",x.amount);if(raw===null)return;
  const amount=num(raw);if(!amount)return alert("Jumlah tidak valid.");
  const oldDate=dateInput(x.date);
  const newDate=prompt("Tanggal YYYY-MM-DD",oldDate);if(newDate===null)return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(newDate))return alert("Format tanggal harus YYYY-MM-DD.");
  x.amount=amount;x.category=label;x.date=normalizeDate(newDate);
  save();
}
function removeTx(k){if(confirm("Hapus transaksi ini?")){data=data.filter(x=>x.id!==k);save()}}
function num(v){return Number(String(v).replace(/\./g,"").replace(/,/g,"."))||0}
function addIncome(){
  const amount=num(incomeAmount.value);if(!amount)return alert("Masukkan jumlah.");
  data.push({id:uid(),type:"income",amount,date:normalizeDate(`${year}-${String(selectedMonth+1).padStart(2,"0")}-01`),category:incomeType.value,note:incomeNote.value,balanceApplied:true});
  incomeAmount.value="";incomeNote.value="";save();
}
function addExpense(){
  const amount=num(expenseAmount.value);if(!amount)return alert("Masukkan jumlah.");
  const d=expenseDate.value||`${year}-${String(selectedMonth+1).padStart(2,"0")}-01`;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return alert("Tanggal tidak valid.");
  data.push({id:uid(),type:"expense",amount,date:normalizeDate(d),category:expenseCategory.value||"Pengeluaran",note:"",balanceApplied:true});
  // Setelah menambah transaksi, pindah otomatis ke bulan transaksi agar kartu dan daftar pasti sinkron.
  const p=dateParts(d);year=p.year;selectedMonth=p.month;
  expenseAmount.value="";expenseCategory.value="";save();
}
function addSaving(){
  const amount=num(savingAmount.value);if(!amount)return alert("Masukkan jumlah.");
  const d=savingDate.value||`${year}-${String(selectedMonth+1).padStart(2,"0")}-01`;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return alert("Tanggal tidak valid.");
  data.push({id:uid(),type:"saving",amount,date:normalizeDate(d),category:savingCategory.value||"Tabungan",note:"",balanceApplied:true});
  const p=dateParts(d);year=p.year;selectedMonth=p.month;
  savingAmount.value="";savingCategory.value="";save();
}
function exportData(){
  const payload={version:7,logicVersion:LOGIC_VERSION,savingsBase,data};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`keuangan-${year}.json`;a.click();URL.revokeObjectURL(a.href);
}
function clearAll(){if(confirm("Hapus semua data? Tindakan ini tidak bisa dibatalkan.")){data=[];savingsBase=0;save()}}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js?v=7").catch(()=>{});
render();
