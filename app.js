const months=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"],fullMonths=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
let selectedMonth=new Date().getMonth(),year=new Date().getFullYear();
let data=JSON.parse(localStorage.getItem("keuanganYusuf")||"[]");

// Saldo tabungan yang sudah ada sebelum sistem saldo otomatis digunakan.
// Nilai ini dipertahankan agar data lama tidak dihitung ulang.
let savingsBase=Number(localStorage.getItem("keuanganYusufSavingsBase"));
if(!Number.isFinite(savingsBase)){
  // Untuk instalasi lama yang belum mempunyai saldo awal, gunakan total tabungan manual yang sudah tercatat.
  savingsBase=data.filter(x=>x.type==="saving").reduce((a,x)=>a+Number(x.amount||0),0);
  localStorage.setItem("keuanganYusufSavingsBase",String(savingsBase));
  data=data.map(x=>({...x,balanceApplied:false}));
  localStorage.setItem("keuanganYusuf",JSON.stringify(data));
}

const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
const mOf=d=>new Date(d).getMonth(),yOf=d=>new Date(d).getFullYear();
function save(){localStorage.setItem("keuanganYusuf",JSON.stringify(data));localStorage.setItem("keuanganYusufSavingsBase",String(savingsBase));render()}
function list(){return data.filter(x=>yOf(x.date)===year&&mOf(x.date)===selectedMonth)}
function total(type,l=list()){return l.filter(x=>x.type===type).reduce((a,x)=>a+Number(x.amount||0),0)}

// Hanya transaksi yang dibuat setelah sistem saldo otomatis aktif (balanceApplied=true)
// yang memengaruhi saldo tabungan. Data lama tetap menjadi histori dan tidak dihitung ulang.
function effect(x){
  if(!x.balanceApplied)return 0;
  const amount=Number(x.amount)||0;
  if(x.type==="income")return amount;
  if(x.type==="expense")return -amount;
  if(x.type==="saving")return amount;
  return 0;
}
function savingBalance(){return savingsBase+data.reduce((sum,x)=>sum+effect(x),0)}
function monthlyBalanceChange(l=list()){return l.reduce((sum,x)=>sum+effect(x),0)}

function render(){yearLabel.textContent=year;tableYear.textContent=year;renderMonths();renderSummary();renderChart();renderTable();renderLists()}
function renderMonths(){monthScroller.innerHTML="";months.forEach((m,i)=>{const b=document.createElement("button");b.className="month "+(i===selectedMonth?"active":"");b.textContent=m;b.onclick=()=>{selectedMonth=i;render()};monthScroller.appendChild(b)})}
function renderSummary(){
  const l=list(),inc=total("income",l),exp=total("expense",l),net=monthlyBalanceChange(l);
  incomeTotal.textContent=rupiah(inc);
  expenseTotal.textContent=rupiah(exp);
  savingTotal.textContent=rupiah(net);
  allSavingTotal.textContent=rupiah(savingBalance());
  totalSavingBadge.textContent=rupiah(savingBalance());
  monthIncome.textContent=rupiah(inc);
  monthExpense.textContent=rupiah(exp);
  monthSaving.textContent=rupiah(net);
  expenseDate.value ||= new Date().toISOString().slice(0,10);
  savingDate.value ||= new Date(year,selectedMonth,1).toISOString().slice(0,10);
}
function renderChart(){
  chart.innerHTML="";
  const vals=months.map((_,m)=>{
    const l=data.filter(x=>yOf(x.date)===year&&mOf(x.date)===m);
    return [total("income",l),total("expense",l),monthlyBalanceChange(l)];
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
    const l=data.filter(x=>yOf(x.date)===year&&mOf(x.date)===m),i=total("income",l),e=total("expense",l),s=monthlyBalanceChange(l);
    a+=i;b+=e;c+=s;
    annualBody.innerHTML+=`<tr class="${m===selectedMonth?"active":""}"><td>${m+1}</td><td>${fullMonths[m]}</td><td class="green">${rupiah(i)}</td><td class="red">${rupiah(e)}</td><td class="purple">${rupiah(s)}</td></tr>`;
  }
  annualFoot.innerHTML=`<tr><td colspan="2">TOTAL SETAHUN</td><td>${rupiah(a)}</td><td>${rupiah(b)}</td><td>${rupiah(c)}</td></tr>`;
}
function renderLists(){
  const l=list(),i=l.filter(x=>x.type==="income"),e=l.filter(x=>x.type==="expense"),s=l.filter(x=>x.type==="saving");
  incomeEmpty.style.display=i.length?"none":"block";expenseEmpty.style.display=e.length?"none":"block";savingEmpty.style.display=s.length?"none":"block";
  incomeList.innerHTML=i.map(tx).join("");expenseList.innerHTML=e.map(tx).join("");savingList.innerHTML=s.map(tx).join("");
}
function tx(x){
  const label=x.type==="income"?x.category:(x.category||"Pengeluaran");
  const marker=x.balanceApplied?"":" • histori lama";
  return `<div class="tx"><div><strong>${esc(label)}</strong><br><small>${esc(x.note||"")} · ${new Date(x.date).toLocaleDateString("id-ID")}${marker}</small></div><div class="tx-actions">${rupiah(x.amount)} <button class="edit" onclick="editTx('${x.id}')">✎</button><button class="delete" onclick="removeTx('${x.id}')">×</button></div></div>`;
}
function editTx(k){
  const x=data.find(v=>v.id===k);if(!x)return;
  const label=prompt("Nama / keterangan",x.category||x.note||"");if(label===null)return;
  const raw=prompt("Jumlah (contoh 2000000)",x.amount);if(raw===null)return;
  const amount=num(raw);if(!amount)return alert("Jumlah tidak valid.");
  x.amount=amount;x.category=label;save();
}
function removeTx(k){if(confirm("Hapus transaksi ini?")){data=data.filter(x=>x.id!==k);save()}}
function num(v){return Number(String(v).replace(/\./g,"").replace(/,/g,"."))||0}
function addIncome(){
  const amount=num(incomeAmount.value);if(!amount)return alert("Masukkan jumlah.");
  data.push({id:uid(),type:"income",amount,date:new Date(year,selectedMonth,1).toISOString(),category:incomeType.value,note:incomeNote.value,balanceApplied:true});
  incomeAmount.value="";incomeNote.value="";save();
}
function addExpense(){
  const amount=num(expenseAmount.value);if(!amount)return alert("Masukkan jumlah.");
  const d=expenseDate.value||new Date(year,selectedMonth+1,0).toISOString().slice(0,10);
  data.push({id:uid(),type:"expense",amount,date:new Date(d+"T12:00:00").toISOString(),category:expenseCategory.value,note:"",balanceApplied:true});
  expenseAmount.value="";expenseCategory.value="";save();
}
function addSaving(){
  const amount=num(savingAmount.value);if(!amount)return alert("Masukkan jumlah.");
  const d=savingDate.value||new Date(year,selectedMonth+1,0).toISOString().slice(0,10);
  data.push({id:uid(),type:"saving",amount,date:new Date(d+"T12:00:00").toISOString(),category:savingCategory.value||"Tabungan",note:"",balanceApplied:true});
  savingAmount.value="";savingCategory.value="";save();
}
function exportData(){
  const payload={version:4,savingsBase,data};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`keuangan-${year}.json`;a.click();URL.revokeObjectURL(a.href);
}
function clearAll(){if(confirm("Hapus semua data? Tindakan ini tidak bisa dibatalkan.")){data=[];savingsBase=0;save()}}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
