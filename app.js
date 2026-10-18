(() => {
'use strict';
const KEY = 'hapia-kas-v2', KEY1 = 'hapia-kas-v1';
const KM = ['Iuran', 'Donasi', 'Sponsor', 'Penjualan', 'Saldo awal', 'Lainnya'];
const KK = ['Konsumsi', 'Perlengkapan', 'Transportasi', 'Dokumentasi', 'Honor & hadiah', 'Sewa tempat', 'Lainnya'];
const WARNA = ['#12a150', '#f7b500', '#ef4444', '#a56b2e', '#0a6b38', '#e08a00', '#7a8f2a'];
const $ = (s, r = document) => r.querySelector(s);
const rp = n => (n < 0 ? '−' : '') + 'Rp ' + Math.round(Math.abs(n)).toLocaleString('id-ID');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hariIni = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const bulanIni = () => hariIni().slice(0, 7);
const tgl = s => new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const bln = ym => new Date(ym + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short' });
const blnPanjang = ym => new Date(ym + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

/* Data */
let db = { events: [], trx: [] };
try {
  const d2 = JSON.parse(localStorage.getItem(KEY));
  if (d2 && Array.isArray(d2.trx)) db = d2;
  else { const d1 = JSON.parse(localStorage.getItem(KEY1)); if (Array.isArray(d1)) db.trx = d1.map(t => ({ ...t, ev: null })); }
} catch { /* mulai kosong */ }
const simpan = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { toast('Penyimpanan peramban diblokir atau penuh'); } };
const toast = t => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove('on'), 2400); };

const sum = (a, j) => a.filter(t => t.jenis === j).reduce((s, t) => s + t.nominal, 0);
const byKat = (a, j) => { const m = {}; a.filter(t => t.jenis === j).forEach(t => m[t.kat] = (m[t.kat] || 0) + t.nominal); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
const urut = a => [...a].sort((x, y) => y.tgl.localeCompare(x.tgl) || y.id - x.id);
const trxEv = id => db.trx.filter(t => (t.ev ?? null) === id);
const evList = () => [...db.events].sort((a, b) => b.tgl.localeCompare(a.tgl));
const warnaEv = e => WARNA[Math.max(0, db.events.indexOf(e)) % WARNA.length];
const namaEv = id => id == null ? 'Kas umum' : (db.events.find(e => e.id === id) || {}).nama || 'Kas umum';

/* Grafik */
const smooth = p => p.map((q, i) => i ? `C${(p[i - 1][0] + q[0]) / 2},${p[i - 1][1]} ${(p[i - 1][0] + q[0]) / 2},${q[1]} ${q[0]},${q[1]}` : `M${q[0]},${q[1]}`).join(' ');
function garis() {
  const b = [], d = new Date();
  for (let i = 5; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); b.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')); }
  const v = b.map(m => { const a = db.trx.filter(t => t.tgl.startsWith(m)); return [sum(a, 'masuk'), sum(a, 'keluar')]; });
  const mx = Math.max(1, ...v.flat()), W = 560, H = 240, L = 10, R = 10, T = 16, B = 30, pw = W - L - R, ph = H - T - B;
  const X = i => L + pw * i / 5, Y = n => T + ph - ph * n / mx;
  const pm = v.map((q, i) => [X(i), Y(q[0])]), pk = v.map((q, i) => [X(i), Y(q[1])]);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik arus kas 6 bulan terakhir" style="width:100%;height:auto"><defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12a150" stop-opacity=".35"/><stop offset="1" stop-color="#12a150" stop-opacity="0"/></linearGradient></defs>`;
  for (let i = 0; i < 4; i++) s += `<line x1="${L}" x2="${W - R}" y1="${T + ph * i / 3}" y2="${T + ph * i / 3}" stroke="currentColor" opacity=".08"/>`;
  s += `<path d="${smooth(pm)} L${X(5)},${T + ph} L${X(0)},${T + ph}Z" fill="url(#gm)"/><path d="${smooth(pm)}" fill="none" stroke="#12a150" stroke-width="3.5" stroke-linecap="round"/><path d="${smooth(pk)}" fill="none" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/>`;
  v.forEach((q, i) => {
    s += `<circle cx="${X(i)}" cy="${Y(q[0])}" r="5" fill="#fff" stroke="#12a150" stroke-width="3"><title>${blnPanjang(b[i])}: masuk ${rp(q[0])}</title></circle><circle cx="${X(i)}" cy="${Y(q[1])}" r="5" fill="#fff" stroke="#ef4444" stroke-width="3"><title>${blnPanjang(b[i])}: keluar ${rp(q[1])}</title></circle>`;
    s += `<text x="${X(i)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === 5 ? 'end' : 'middle'}" font-size="12" font-weight="700" fill="currentColor" opacity=".55">${bln(b[i])}</text>`;
  });
  return s + '</svg>';
}
function donat(items, pusat) {
  const T = items.reduce((s, x) => s + x[1], 0);
  if (!T) return '<div class="empty">Belum ada data</div>';
  const r = 54, C = 2 * Math.PI * r; let off = 0, c = '', lg = '';
  items.forEach(([n, v], i) => {
    const w = WARNA[i % WARNA.length], len = Math.max(v / T * C - (items.length > 1 ? 3 : 0), 1);
    c += `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${w}" stroke-width="18" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
    off += v / T * C;
    lg += `<div><i style="background:${w}"></i><span>${esc(n)}</span><em>${rp(v)} · ${Math.round(v / T * 100)}%</em></div>`;
  });
  return `<div class="donut"><svg class="d" viewBox="0 0 140 140" role="img" aria-label="Komposisi">${c}<text x="70" y="66" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" opacity=".55">${pusat}</text><text x="70" y="84" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">${rp(T).replace('Rp ', '')}</text></svg><div class="legend">${lg}</div></div>`;
}
const hbar = (items, w) => items.length ? items.map(([n, v]) => { const T = items[0][1]; return `<div class="hbar"><div><span>${esc(n)}</span><span class="num">${rp(v)}</span></div><div class="t"><i style="width:${v / T * 100}%;background:${w}"></i></div></div>`; }).join('') : '<div class="empty">Belum ada data</div>';

/* Bagian tampilan */
const IK = { masuk: '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>', keluar: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 9v8H9"/></svg>' };
const EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/></svg>';
const DEL = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
const baris = (t, aksi, tampilEv) => `<li class="row ${t.jenis === 'keluar' ? 'k' : ''}"><div class="ico">${IK[t.jenis]}</div><div class="t"><b>${esc(t.ket || t.kat)}</b><small>${esc(t.kat)}${tampilEv ? ' · ' + esc(namaEv(t.ev)) : ''} · ${tgl(t.tgl)}</small></div><div class="n num">${t.jenis === 'keluar' ? '−' : '+'} ${rp(t.nominal)}</div>${aksi ? `<button class="ib" data-a="edit" data-id="${t.id}" aria-label="Ubah">${EDIT}</button><button class="ib del" data-a="del" data-id="${t.id}" aria-label="Hapus">${DEL}</button>` : ''}</li>`;
const hero = (lbl, a) => { const m = sum(a, 'masuk'), k = sum(a, 'keluar'); return `<section class="hero"><div class="lbl">${lbl}</div><div class="big num">${rp(m - k)}</div><div class="stats"><div class="stat"><span><i class="dot m"></i>Pemasukan</span><b class="num">${rp(m)}</b></div><div class="stat"><span><i class="dot k"></i>Pengeluaran</span><b class="num">${rp(k)}</b></div><div class="stat"><span><i class="dot s"></i>Catatan</span><b>${a.length} transaksi</b></div></div></section>`; };
const kosongTrx = '<div class="empty"><b>Belum ada transaksi</b>Catat pemasukan atau pengeluaran pertama.</div>';

function vBeranda() {
  const all = db.trx, umum = trxEv(null);
  const rows = [...evList().map(e => [e.id, e.nama, trxEv(e.id)]), ...(umum.length ? [[null, 'Kas umum', umum]] : [])];
  return `<div class="head"><div><h1>Ringkasan keseluruhan</h1><p class="sub">Gabungan semua event dan kas umum HAPIA</p></div></div>${hero('Total saldo kas', all)}
  <div class="g2"><div class="card"><div class="card-h"><h2>Arus kas 6 bulan terakhir</h2><span class="sub"><i class="dot m"></i> Masuk &nbsp;<i class="dot k"></i> Keluar</span></div>${garis()}</div>
  <div class="card"><div class="card-h"><h2>Sumber pemasukan</h2></div>${donat(byKat(all, 'masuk'), 'Total masuk')}</div></div>
  <div class="g2"><div class="card"><div class="card-h"><h2>Per event</h2><button class="link" data-go="event">Kelola event</button></div>${rows.length ? `<ul class="list">${rows.map(([id, n, a]) => { const m = sum(a, 'masuk'), k = sum(a, 'keluar'); return `<li class="row"><a class="t" href="#/event/${id ?? 'umum'}"><b>${esc(n)}</b><small>Masuk ${rp(m)} · Keluar ${rp(k)}</small></a><div class="n num" style="color:${m - k < 0 ? 'var(--koral)' : 'var(--z5)'}">${rp(m - k)}</div></li>`; }).join('')}</ul>` : '<div class="empty"><b>Belum ada event</b>Buat event agar pemasukan dan pengeluaran terkelompok rapi.<br><button class="btn green sm" data-a="evt-baru">Buat event</button></div>'}</div>
  <div class="card"><div class="card-h"><h2>Transaksi terbaru</h2><button class="link" data-go="transaksi">Semua</button></div>${all.length ? `<ul class="list">${urut(all).slice(0, 5).map(t => baris(t, false, true)).join('')}</ul>` : kosongTrx}</div></div>`;
}

function vEvent() {
  const L = evList();
  return `<div class="head"><div><h1>Event</h1><p class="sub">Pilih event untuk melihat rincian, grafik, dan ringkasannya</p></div><button class="btn green" data-a="evt-baru">Event baru</button></div>
  <div class="evgrid">${L.map(e => { const a = trxEv(e.id), m = sum(a, 'masuk'), k = sum(a, 'keluar'); return `<a class="ev" href="#/event/${e.id}" style="--ac:${warnaEv(e)}"><span class="tag">${tgl(e.tgl)}</span><h3>${esc(e.nama)}</h3><div class="sal num"><small>Saldo event</small>${rp(m - k)}</div>${e.anggaran ? `<div class="prog ${k > e.anggaran ? 'over' : ''}" style="margin-top:12px"><i style="width:${Math.min(100, k / e.anggaran * 100)}%"></i></div>` : ''}<div class="mm"><span class="up num">+ ${rp(m)}</span><span class="dn num">− ${rp(k)}</span></div></a>`; }).join('')}
  <a class="ev add-ev" href="#/event/umum"><span>Kas umum<br><small>Transaksi di luar event: ${trxEv(null).length}</small></span></a>
  <button class="ev add-ev" data-a="evt-baru"><span>+ Tambah event</span></button></div>`;
}
let tab = 'masuk';
function vDetail(id) {
  const virt = id === 'umum', e = virt ? { id: null, nama: 'Kas umum', cat: 'Transaksi yang tidak terikat event', tgl: hariIni() } : db.events.find(x => String(x.id) === id);
  if (!e) return '<div class="card empty"><b>Event tidak ditemukan</b><a class="btn green sm" href="#/event">Kembali ke daftar event</a></div>';
  const a = trxEv(e.id), m = sum(a, 'masuk'), k = sum(a, 'keluar'), bm = byKat(a, 'masuk'), bk = byKat(a, 'keluar'), list = urut(a.filter(t => t.jenis === tab));
  const ring = !a.length ? 'Belum ada transaksi di sini. Catat iuran, donasi, atau pengeluaran pertama.' :
    `Terkumpul ${rp(m)}${bm.length ? `, terbesar dari ${esc(bm[0][0])} (${Math.round(bm[0][1] / m * 100)}%)` : ''}. Pengeluaran ${rp(k)}${bk.length ? `, terbesar untuk ${esc(bk[0][0])}` : ''}. ${m - k >= 0 ? 'Sisa saldo' : 'Kekurangan'} ${rp(Math.abs(m - k))}.`;
  return `<a class="back" href="#/event">← Semua event</a><div class="head"><div><h1>${esc(e.nama)}</h1><p class="sub">${virt ? esc(e.cat) : tgl(e.tgl) + (e.cat ? ' · ' + esc(e.cat) : '')}</p></div>
  <div class="tools"><button class="btn gold sm" data-a="trx-baru" data-ev="${virt ? '' : e.id}">+ Catat transaksi</button>${virt ? '' : `<button class="btn soft sm" data-a="evt-ubah" data-id="${e.id}">Ubah</button><button class="btn red sm" data-a="evt-hapus" data-id="${e.id}">Hapus</button>`}</div></div>
  ${hero('Saldo event', a)}
  ${e.anggaran ? `<div class="card" style="margin-top:16px"><div class="card-h"><h2>Penggunaan anggaran</h2><span class="chip ${k > e.anggaran ? 'red' : ''}">${Math.round(k / e.anggaran * 100)}%</span></div><div class="prog ${k > e.anggaran ? 'over' : ''}"><i style="width:${Math.min(100, k / e.anggaran * 100)}%"></i></div><p class="sub num">${rp(k)} terpakai dari ${rp(e.anggaran)}</p></div>` : ''}
  <div class="g2" style="grid-template-columns:1fr 1fr"><div class="card"><div class="card-h"><h2>Pemasukan per kategori</h2></div>${donat(bm, 'Total masuk')}</div><div class="card"><div class="card-h"><h2>Pengeluaran per kategori</h2></div>${hbar(bk, '#ef4444')}</div></div>
  <div class="sumtxt">${ring}</div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h2>Rincian transaksi</h2><div class="tabs"><button class="${tab === 'masuk' ? 'on' : ''}" data-a="tab" data-t="masuk">Pemasukan</button><button class="${tab === 'keluar' ? 'on' : ''}" data-a="tab" data-t="keluar">Pengeluaran</button></div></div>
  ${list.length ? `<ul class="list">${list.map(t => baris(t, true)).join('')}</ul>` : `<div class="empty"><b>Belum ada ${tab === 'masuk' ? 'pemasukan' : 'pengeluaran'}</b><button class="btn green sm" data-a="trx-baru" data-ev="${virt ? '' : e.id}" data-j="${tab}">Catat sekarang</button></div>`}</div>`;
}

const F = { q: '', j: '', e: '', b: '' };
function filt() { const q = F.q.toLowerCase(); return urut(db.trx).filter(t => (!F.j || t.jenis === F.j) && (!F.e || (F.e === 'umum' ? t.ev == null : String(t.ev) === F.e)) && (!F.b || t.tgl.startsWith(F.b)) && (!q || (t.ket + ' ' + t.kat + ' ' + namaEv(t.ev)).toLowerCase().includes(q))); }
function vTrx() {
  return `<div class="head"><div><h1>Semua transaksi</h1><p class="sub">Seluruh catatan dari semua event dan kas umum</p></div></div><div class="card"><div class="filters"><input type="search" id="q" placeholder="Cari keterangan, kategori, event" value="${esc(F.q)}"><select id="fj"><option value="">Semua jenis</option><option value="masuk">Pemasukan</option><option value="keluar">Pengeluaran</option></select><select id="fe"><option value="">Semua event</option><option value="umum">Kas umum</option>${evList().map(e => `<option value="${e.id}">${esc(e.nama)}</option>`).join('')}</select><input type="month" id="fb" value="${F.b}"></div><div id="lst"></div></div>`;
}
const isiLst = () => { const a = filt(); $('#lst').innerHTML = a.length ? `<ul class="list">${a.map(t => baris(t, true, true)).join('')}</ul>` : `<div class="empty"><b>${db.trx.length ? 'Tidak ada hasil' : 'Belum ada transaksi'}</b>${db.trx.length ? 'Ubah kata kunci atau filter.' : 'Pilih Catat untuk memulai.'}</div>`; };

let lapB = bulanIni();
function vLaporan() {
  return `<div class="head"><div><h1>Laporan</h1><p class="sub">Rekap bulanan, ekspor data, dan cadangan</p></div></div><div class="g2" style="grid-template-columns:1fr 1fr"><div class="card"><div class="card-h"><h2>Rekap bulanan</h2><input type="month" id="lb" value="${lapB}"></div><div id="rekap"></div></div>
  <div class="card"><div class="card-h"><h2>Data &amp; cadangan</h2></div><p class="sub" style="margin-bottom:16px">Data tersimpan di peramban perangkat ini. Unduh cadangan secara berkala dan simpan di tempat aman.</p><div class="tools"><button class="btn soft sm" data-a="csv">Unduh CSV</button><button class="btn soft sm" data-a="cetak">Cetak laporan</button><button class="btn soft sm" data-a="backup">Unduh cadangan</button><button class="btn soft sm" data-a="restore">Pulihkan cadangan</button><button class="btn red sm" data-a="reset">Hapus semua data</button></div></div></div>`;
}
const isiRekap = () => { const a = db.trx.filter(t => t.tgl.startsWith(lapB)), m = sum(a, 'masuk'), k = sum(a, 'keluar'); $('#rekap').innerHTML = a.length ? `<div class="stats" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:18px"><div><span class="sub">Masuk</span><b class="up num" style="display:block">${rp(m)}</b></div><div><span class="sub">Keluar</span><b class="dn num" style="display:block">${rp(k)}</b></div><div><span class="sub">Selisih</span><b class="num" style="display:block">${rp(m - k)}</b></div></div><h2 style="margin-bottom:12px;font-size:14px">Pemasukan</h2>${hbar(byKat(a, 'masuk'), '#12a150')}<h2 style="margin:18px 0 12px;font-size:14px">Pengeluaran</h2>${hbar(byKat(a, 'keluar'), '#ef4444')}` : '<div class="empty"><b>Tidak ada data</b>Belum ada transaksi di bulan ini.</div>'; };

/* Router */
function render() {
  const [, r = 'beranda', p] = location.hash.replace('#', '').split('/');
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === r));
  const root = $('#root'); root.innerHTML = r === 'event' ? (p ? vDetail(p) : vEvent()) : r === 'transaksi' ? vTrx() : r === 'laporan' ? vLaporan() : vBeranda();
  root.style.animation = 'none'; void root.offsetWidth; root.style.animation = '';
  if (r === 'transaksi') { $('#fj').value = F.j; $('#fe').value = F.e; isiLst(); }
  if (r === 'laporan') isiRekap();
}
addEventListener('hashchange', () => { render(); scrollTo(0, 0); });

/* Form */
const dT = $('#dTrx'), fT = $('#fTrx'), dE = $('#dEvt'), fE = $('#fEvt');
let editT = null, editE = null;
const angka = v => +String(v).replace(/\D/g, '');
const fmt = i => i.oninput = () => { const d = angka(i.value); i.value = d ? d.toLocaleString('id-ID') : ''; };
fmt(fT.nominal); fmt(fE.anggaran);
const isiKat = (j, p) => fT.kat.innerHTML = (j === 'masuk' ? KM : KK).map(k => `<option${k === p ? ' selected' : ''}>${k}</option>`).join('');
fT.querySelectorAll('[name=jenis]').forEach(r => r.onchange = () => isiKat(r.value));
function bukaTrx(id, ev, jenis) {
  editT = id || null; const t = id ? db.trx.find(x => x.id === id) : null;
  $('#tTrx').textContent = t ? 'Ubah transaksi' : 'Catat transaksi';
  fT.event.innerHTML = '<option value="">Kas umum (tanpa event)</option>' + evList().map(e => `<option value="${e.id}">${esc(e.nama)}</option>`).join('');
  const j = t ? t.jenis : jenis || 'masuk'; fT.jenis.value = j; isiKat(j, t && t.kat);
  fT.event.value = t ? (t.ev ?? '') : (ev ?? '');
  fT.tgl.value = t ? t.tgl : hariIni(); fT.nominal.value = t ? t.nominal.toLocaleString('id-ID') : ''; fT.ket.value = t ? t.ket : '';
  dT.showModal();
}
fT.onsubmit = e => {
  e.preventDefault(); const n = angka(fT.nominal.value); if (!n) return toast('Isi nominal lebih dari 0');
  const t = { jenis: fT.jenis.value, tgl: fT.tgl.value, kat: fT.kat.value, nominal: n, ket: fT.ket.value.trim(), ev: fT.event.value ? +fT.event.value : null };
  if (editT) Object.assign(db.trx.find(x => x.id === editT), t); else db.trx.push({ id: Date.now(), ...t });
  simpan(); dT.close(); render(); toast(editT ? 'Perubahan disimpan' : 'Transaksi disimpan');
};
function bukaEvt(id) {
  editE = id || null; const e = id ? db.events.find(x => x.id === id) : null;
  $('#tEvt').textContent = e ? 'Ubah event' : 'Event baru';
  fE.nama.value = e ? e.nama : ''; fE.tgl.value = e ? e.tgl : hariIni(); fE.anggaran.value = e && e.anggaran ? e.anggaran.toLocaleString('id-ID') : ''; fE.cat.value = e ? e.cat || '' : '';
  dE.showModal();
}
fE.onsubmit = e => {
  e.preventDefault(); const v = { nama: fE.nama.value.trim(), tgl: fE.tgl.value, anggaran: angka(fE.anggaran.value) || 0, cat: fE.cat.value.trim() };
  if (!v.nama) return;
  if (editE) Object.assign(db.events.find(x => x.id === editE), v); else { const n = { id: Date.now(), ...v }; db.events.push(n); location.hash = '#/event/' + n.id; }
  simpan(); dE.close(); render(); toast('Event disimpan');
};
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
$('#tambah').onclick = () => { const p = location.hash.split('/'); bukaTrx(null, p[1] === 'event' && p[2] && p[2] !== 'umum' ? p[2] : ''); };

/* Aksi */
function unduh(n, s, t) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: t })); a.download = n; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1e3); }
$('#root').addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { location.hash = '#/' + g.dataset.go; return; }
  const b = e.target.closest('[data-a]'); if (!b) return; const id = +b.dataset.id, a = b.dataset.a;
  if (a === 'trx-baru') bukaTrx(null, b.dataset.ev, b.dataset.j);
  else if (a === 'edit') bukaTrx(id);
  else if (a === 'del') { if (confirm('Hapus transaksi ini?')) { db.trx = db.trx.filter(t => t.id !== id); simpan(); render(); toast('Transaksi dihapus'); } }
  else if (a === 'evt-baru') bukaEvt();
  else if (a === 'evt-ubah') bukaEvt(id);
  else if (a === 'evt-hapus') { if (confirm('Hapus event ini? Transaksinya dipindahkan ke Kas umum.')) { db.trx.forEach(t => { if (t.ev === id) t.ev = null; }); db.events = db.events.filter(x => x.id !== id); simpan(); location.hash = '#/event'; render(); toast('Event dihapus'); } }
  else if (a === 'tab') { tab = b.dataset.t; render(); }
  else if (a === 'cetak') print();
  else if (a === 'backup') unduh('cadangan-kas-hapia-' + hariIni() + '.json', JSON.stringify({ v: 2, ...db }), 'application/json');
  else if (a === 'restore') $('#berkas').click();
  else if (a === 'csv') {
    if (!db.trx.length) return toast('Belum ada data');
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    unduh('kas-hapia-' + hariIni() + '.csv', '\ufeff' + ['Tanggal,Event,Jenis,Kategori,Keterangan,Nominal', ...urut(db.trx).reverse().map(t => [t.tgl, q(namaEv(t.ev)), t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran', q(t.kat), q(t.ket), t.nominal].join(','))].join('\n'), 'text/csv;charset=utf-8');
  } else if (a === 'reset' && confirm('Hapus SEMUA event dan transaksi? Unduh cadangan dulu jika perlu.') && confirm('Yakin? Tindakan ini tidak bisa dibatalkan.')) { db = { events: [], trx: [] }; simpan(); render(); toast('Semua data dihapus'); }
});
$('#root').addEventListener('input', e => {
  const i = e.target.id;
  if (i === 'q') F.q = e.target.value; else if (i === 'fj') F.j = e.target.value; else if (i === 'fe') F.e = e.target.value; else if (i === 'fb') F.b = e.target.value;
  if (['q', 'fj', 'fe', 'fb'].includes(i)) isiLst();
  if (i === 'lb' && e.target.value) { lapB = e.target.value; isiRekap(); }
});
$('#berkas').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text()), tr = Array.isArray(j) ? j.map(t => ({ ...t, ev: null })) : j.trx, ev = Array.isArray(j) ? [] : j.events || [];
    if (!Array.isArray(tr) || !tr.every(t => t && ['masuk', 'keluar'].includes(t.jenis) && /^\d{4}-\d{2}-\d{2}$/.test(t.tgl) && Number.isFinite(t.nominal))) throw 0;
    if (!confirm(`Pulihkan ${ev.length} event dan ${tr.length} transaksi? Data saat ini diganti.`)) return;
    db = { events: ev.map(x => ({ id: x.id, nama: String(x.nama), tgl: x.tgl, anggaran: +x.anggaran || 0, cat: String(x.cat || '') })), trx: tr.map((t, i) => ({ id: t.id || Date.now() + i, jenis: t.jenis, tgl: t.tgl, kat: String(t.kat || 'Lainnya'), nominal: t.nominal, ket: String(t.ket || ''), ev: t.ev ?? null })) };
    simpan(); render(); toast('Cadangan dipulihkan');
  } catch { toast('Berkas cadangan tidak valid'); }
  e.target.value = '';
};
render();
})();
