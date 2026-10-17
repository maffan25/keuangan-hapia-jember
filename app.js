const $=s=>document.querySelector(s),N=n=>Math.round(n).toLocaleString('id-ID'),R=n=>(n<0?'-':'')+'Rp '+N(Math.abs(n));
const BLN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const sum=a=>a.reduce((s,t)=>s+t.v,0),pct=n=>(n*100).toFixed(0)+'%',tgl=d=>d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
let D;

function parse(buf){
  const wb=XLSX.read(buf,{type:'array',cellDates:true}),g=n=>XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:null}),P=wb.Sheets.Pengaturan,c=a=>P[a]?P[a].v:'';
  const cfg={org:c('C5'),year:c('C6'),alamat:c('C7'),ketua:c('C8'),bend:c('C9'),kas0:+c('C10')||0,bank0:+c('C11')||0,sek:c('C12'),rek:c('C13'),tgl:c('C14')instanceof Date?c('C14'):new Date(),batas:+c('C15')||.8};
  // Transaksi: header di baris 5, data mulai baris 6 (kolom B..O)
  const tx=g('Transaksi').slice(5).filter(r=>(r[4]=='Pemasukan'||r[4]=='Pengeluaran')&&+r[8]>0&&r[2]).map(r=>({d:new Date(+new Date(r[2])+432e5),no:r[3]||'',j:r[4],k:r[5]||'-',a:r[6]||'',u:r[7]||'',v:+r[8],e:r[14]||''}));
  const inc=tx.filter(t=>t.j=='Pemasukan'),exp=tx.filter(t=>t.j=='Pengeluaran'),net=a=>sum(tx.filter(t=>t.a==a&&t.j=='Pemasukan'))-sum(tx.filter(t=>t.a==a&&t.j=='Pengeluaran'));
  const kas=cfg.kas0+net('Kas Tunai'),bank=cfg.bank0+net('Bank');
  const mIn=Array(12).fill(0),mOut=Array(12).fill(0);tx.forEach(t=>(t.j=='Pemasukan'?mIn:mOut)[t.d.getMonth()]+=t.v);
  let s=cfg.kas0+cfg.bank0;const mSaldo=mIn.map((v,i)=>s+=v-mOut[i]);
  const by=a=>[...new Set(a.map(t=>t.k))].map(x=>({k:x,v:sum(a.filter(t=>t.k==x))}));
  // Anggaran: dua tabel, masing-masing diawali baris judul "Kategori"
  const sec=[];let cur=null;g('Anggaran').forEach(r=>{if(r[2]=='Kategori'){cur=[];sec.push(cur)}else if(cur&&r[2]&&typeof r[3]=='number')cur.push({k:r[2],t:r[3]});else cur=null});
  const bi=(sec[0]||[]).map(x=>({...x,r:sum(inc.filter(t=>t.k==x.k))})),bo=(sec[1]||[]).map(x=>({...x,r:sum(exp.filter(t=>t.k==x.k))}));
  bo.forEach(x=>{const u=x.t?x.r/x.t:0;x.u=u;x.s=u>1?'Melebihi':u>=cfg.batas?'Waspada':'Aman'});
  bi.forEach(x=>{const u=x.t?x.r/x.t:0;x.u=u;x.s=u>=1?'Tercapai':u>=.5?'Berjalan':'Rendah'});
  // Event
  const ev=g('Event').slice(8).filter(r=>typeof r[2]=='string'&&r[2]).map(r=>{const e={n:r[2],lok:r[5]||'',pj:r[6]||'',b:+r[7]||0},x=tx.filter(t=>t.e==e.n);e.in=sum(x.filter(t=>t.j=='Pemasukan'));e.out=sum(x.filter(t=>t.j=='Pengeluaran'));e.net=e.in-e.out;e.u=e.b?e.out/e.b:0;e.s=e.u>1?'Melebihi':e.u>=cfg.batas?'Waspada':'Aman';return e});
  return{cfg,tx,tIn:sum(inc),tOut:sum(exp),kas,bank,mIn,mOut,mSaldo,bi,bo,ev,rIn:by(inc).sort((a,b)=>b.v-a.v),rOut:by(exp).sort((a,b)=>b.v-a.v)};
}

const bars=()=>{const W=640,H=250,m=Math.max(...D.mIn,...D.mOut,1),bw=(W-50)/12;let o=`<svg viewBox="0 0 ${W} ${H}" width="100%">`;
  for(let i=0;i<=4;i++){const y=20+(H-50)*i/4;o+=`<line x1="44" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="40" y="${y+4}" text-anchor="end">${N(m*(1-i/4)/1e6*10)/10}jt</text>`}
  D.mIn.forEach((v,i)=>{const x=48+i*bw,h1=v/m*(H-50),h2=D.mOut[i]/m*(H-50);o+=`<rect x="${x}" y="${H-30-h1}" width="${bw*.38}" height="${h1}" rx="3" fill="var(--in)"><title>${BLN[i]} masuk: ${R(v)}</title></rect><rect x="${x+bw*.4}" y="${H-30-h2}" width="${bw*.38}" height="${h2}" rx="3" fill="var(--out)"><title>${BLN[i]} keluar: ${R(D.mOut[i])}</title></rect><text x="${x+bw*.38}" y="${H-12}" text-anchor="middle">${BLN[i].slice(0,3)}</text>`});
  return o+'</svg>'};
const line=()=>{const W=640,H=250,v=D.mSaldo,mx=Math.max(...v),mn=Math.min(...v,0),p=v.map((y,i)=>[48+i*(W-70)/11,H-30-(y-mn)/(mx-mn||1)*(H-60)]),d=p.map((q,i)=>(i?'L':'M')+q[0]+' '+q[1]).join('');
  return`<svg viewBox="0 0 ${W} ${H}" width="100%"><defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--gold)" stop-opacity=".35"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></linearGradient></defs><path d="${d}L${p[11][0]} ${H-30}L48 ${H-30}Z" fill="url(#gg)"/><path d="${d}" fill="none" stroke="var(--gold)" stroke-width="3" stroke-linejoin="round"/>${p.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="4" fill="var(--gold)"><title>${BLN[i]}: ${R(v[i])}</title></circle><text x="${q[0]}" y="${H-12}" text-anchor="middle">${BLN[i].slice(0,3)}</text>`).join('')}<text x="44" y="24" text-anchor="end">${(mx/1e6).toFixed(1)}jt</text></svg>`};
const prog=(a,col)=>a.map(x=>`<div class="row"><span>${x.k}</span><span><b style="font-weight:600">${R(x.r)}</b> <span style="color:var(--mut)">/ ${R(x.t)}</span> <span class="tag ${x.s}">${pct(x.u)}</span></span></div><div class="bar"><i style="width:${Math.min(x.u,1)*100}%;background:${x.s=='Melebihi'?'var(--out)':x.s=='Waspada'?'var(--gold)':col}"></i></div>`).join('');

function render(){
  const{cfg,tIn,tOut}=D,sur=tIn-tOut,k=(l,v,s,cl='')=>`<div class="card"><label>${l}</label><b class="${cl}">${R(v)}</b><em>${s}</em></div>`;
  $('#org').textContent=cfg.org;$('#yr').textContent=cfg.year;$('#sub').textContent=`${cfg.alamat} • Bendahara: ${cfg.bend} • Posisi ${tgl(cfg.tgl)}`;
  const evTot=D.ev.reduce((s,e)=>s+e.net,0);
  $('#app').innerHTML=`<div class="grid k">${k('Total Saldo',D.kas+D.bank,`Kas ${R(D.kas)} • Bank ${R(D.bank)}`)}${k('Total Pemasukan',tIn,D.tx.filter(t=>t.j=='Pemasukan').length+' transaksi','pos')}${k('Total Pengeluaran',tOut,D.tx.filter(t=>t.j=='Pengeluaran').length+' transaksi','neg')}${k('Surplus / (Defisit)',sur,'Pemasukan − Pengeluaran',sur<0?'neg':'pos')}</div>
  <h2>Arus Kas Bulanan</h2><div class="grid two"><div class="card"><label>Pemasukan <span class="pos">■</span> vs Pengeluaran <span class="neg">■</span></label>${bars()}</div><div class="card"><label>Perkembangan Saldo</label>${line()}</div></div>
  <h2>Anggaran vs Realisasi</h2><div class="grid two"><div class="card"><label>Pemasukan (target)</label><br><br>${prog(D.bi,'var(--in)')}</div><div class="card"><label>Pengeluaran (anggaran)</label><br><br>${prog(D.bo,'var(--in)')}</div></div>
  <h2>Keuangan per Event <small style="font:500 14px 'Plus Jakarta Sans';color:var(--mut)">hasil bersih ${R(evTot)}</small></h2><div class="card tw"><table><tr><th>Event</th><th>Lokasi</th><th class="r">Anggaran</th><th class="r">Pemasukan</th><th class="r">Pengeluaran</th><th class="r">Hasil Bersih</th><th>Status</th></tr>${D.ev.map(e=>`<tr><td><b>${e.n}</b></td><td>${e.lok}</td><td class="r">${N(e.b)}</td><td class="r">${N(e.in)}</td><td class="r">${N(e.out)}</td><td class="r ${e.net<0?'neg':'pos'}">${N(e.net)}</td><td><span class="tag ${e.s}">${e.s} ${pct(e.u)}</span></td></tr>`).join('')}</table></div>
  <h2>Jurnal Transaksi</h2><div class="card"><div class="tools"><input id="q" placeholder="🔍 Cari uraian, kategori, event…"><select id="f"><option value="">Semua jenis</option><option>Pemasukan</option><option>Pengeluaran</option></select></div><div class="tw"><table id="tb"></table></div></div>`;
  const draw=()=>{const q=$('#q').value.toLowerCase(),f=$('#f').value;
    $('#tb').innerHTML='<tr><th>Tanggal</th><th>Bukti</th><th>Uraian</th><th>Kategori</th><th>Akun</th><th class="r">Jumlah (Rp)</th></tr>'+[...D.tx].sort((a,b)=>b.d-a.d).filter(t=>(!f||t.j==f)&&(t.u+t.k+t.e+t.no).toLowerCase().includes(q)).map(t=>`<tr><td>${tgl(t.d)}</td><td>${t.no}</td><td>${t.u}${t.e?`<br><small style="color:var(--mut)">${t.e}</small>`:''}</td><td>${t.k}</td><td>${t.a}</td><td class="r ${t.j=='Pemasukan'?'pos':'neg'}">${t.j=='Pemasukan'?'+':'−'}${N(t.v)}</td></tr>`).join('')};
  $('#q').oninput=$('#f').onchange=draw;draw();$('#msg').hidden=true;$('#app').hidden=false;$('#pdf').disabled=false;
}

function pdf(){
  const{jsPDF}=window.jspdf,p=new jsPDF({unit:'pt',format:'a4'}),W=p.internal.pageSize.getWidth(),{cfg,tIn,tOut}=D,G=[184,144,31],H=[15,46,42];
  p.setFillColor(...H);p.rect(0,0,W,92,'F');p.setFillColor(...G);p.rect(0,92,W,3,'F');p.setTextColor(255);p.setFont('helvetica','bold').setFontSize(20).text('LAPORAN KEUANGAN',40,42);
  p.setFontSize(11).setFont('helvetica','normal').text(`${cfg.org} • Tahun Buku ${cfg.year}`,40,60).text(`${cfg.alamat} • Posisi ${tgl(cfg.tgl)}`,40,76);p.setTextColor(30);
  let Y=120;const T=(title,head,body,c={},x={})=>{if(Y>740){p.addPage();Y=50}p.setFont('helvetica','bold').setFontSize(11).setTextColor(...H).text(title,40,Y);
    p.autoTable({startY:Y+6,head:[head],body,theme:'striped',headStyles:{fillColor:H,textColor:255},styles:{fontSize:8.5,cellPadding:4},margin:{left:40,right:40},columnStyles:c,didParseCell:d=>{if(d.section=='body'&&/^(TOTAL|SALDO AKHIR|SURPLUS)/.test(String(d.row.raw[0])))d.cell.styles.fontStyle='bold'},...x});Y=p.lastAutoTable.finalY+24};
  const f=(a,j)=>sum(D.tx.filter(t=>t.a==a&&t.j==j)),rt={1:{halign:'right'},2:{halign:'right'},3:{halign:'right'},4:{halign:'right'}};
  T('I. LAPORAN ARUS KAS',['Uraian','Kas Tunai','Bank','Total'],[['Saldo Awal',R(cfg.kas0),R(cfg.bank0),R(cfg.kas0+cfg.bank0)],['(+) Total Penerimaan',R(f('Kas Tunai','Pemasukan')),R(f('Bank','Pemasukan')),R(tIn)],['(-) Total Pengeluaran',R(f('Kas Tunai','Pengeluaran')),R(f('Bank','Pengeluaran')),R(tOut)],['SALDO AKHIR',R(D.kas),R(D.bank),R(D.kas+D.bank)]],rt);
  T('II. RINCIAN PEMASUKAN',['Kategori','Jumlah','%'],[...D.rIn.map(x=>[x.k,R(x.v),pct(x.v/tIn)]),['TOTAL PEMASUKAN',R(tIn),'100%']],rt);
  T('III. RINCIAN PENGELUARAN',['Kategori','Jumlah','%'],[...D.rOut.map(x=>[x.k,R(x.v),pct(x.v/tOut)]),['TOTAL PENGELUARAN',R(tOut),'100%']],rt);
  T('IV. ANGGARAN PENGELUARAN vs REALISASI',['Kategori','Anggaran','Realisasi','Terserap','Status'],D.bo.map(x=>[x.k,R(x.t),R(x.r),pct(x.u),x.s]),rt);
  T('V. REKAP BULANAN',['Bulan','Pemasukan','Pengeluaran','Saldo Akhir'],BLN.map((b,i)=>[b,R(D.mIn[i]),R(D.mOut[i]),R(D.mSaldo[i])]),rt);
  T('VI. KEUANGAN PER EVENT',['Event','Anggaran','Pemasukan','Pengeluaran','Hasil Bersih'],D.ev.map(e=>[e.n,R(e.b),R(e.in),R(e.out),R(e.net)]),rt);
  T('VII. HASIL PERIODE',['Keterangan','Jumlah'],[['SURPLUS / (DEFISIT)',R(tIn-tOut)]],rt);
  T('VIII. JURNAL TRANSAKSI',['Tanggal','Bukti','Uraian','Kategori','Akun','Masuk','Keluar'],[...D.tx].sort((a,b)=>a.d-b.d).map(t=>[tgl(t.d),t.no,t.u,t.k,t.a,t.j=='Pemasukan'?N(t.v):'',t.j=='Pengeluaran'?N(t.v):'']),{5:{halign:'right'},6:{halign:'right'}},{styles:{fontSize:7.5,cellPadding:3}});
  let ys=Y+10;if(ys>690){p.addPage();ys=60}
  p.setFontSize(10).setFont('helvetica','normal').setTextColor(30).text(`Jember, ${tgl(cfg.tgl)}`,W-200,ys).text('Mengetahui,',60,ys+16).text('Bendahara,',W-200,ys+16).text('Ketua',60,ys+32).setFont('helvetica','bold').text(`( ${cfg.ketua} )`,60,ys+92).text(`( ${cfg.bend} )`,W-200,ys+92);
  const n=p.getNumberOfPages();for(let i=1;i<=n;i++){p.setPage(i);p.setFontSize(8).setTextColor(130).setFont('helvetica','normal').text(`${cfg.org} • Laporan Keuangan ${cfg.year} • Halaman ${i}/${n}`,W/2,822,{align:'center'})}
  p.save(`Laporan_Keuangan_${cfg.org.replace(/\s+/g,'_')}_${cfg.year}.pdf`);
}

const load=b=>{try{D=parse(b);render()}catch(e){console.error(e);$('#msg').hidden=false;$('#msg').innerHTML='⚠️ Gagal membaca file Excel.<br>Pastikan nama sheet tidak diubah (Pengaturan, Transaksi, Anggaran, Event).'}};
$('#pdf').onclick=pdf;$('#up').onchange=e=>e.target.files[0]&&e.target.files[0].arrayBuffer().then(load);
fetch('data/Data_Keuangan.xlsx?v='+Date.now()).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(load).catch(()=>{$('#msg').innerHTML='Tidak dapat memuat <code>data/Data_Keuangan.xlsx</code>.<br>Jalankan lewat server (mis. <code>npx serve</code>) atau gunakan tombol <b>Pratinjau Excel</b>.'});
