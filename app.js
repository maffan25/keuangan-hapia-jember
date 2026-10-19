(() => {
'use strict';
const KEY = 'hapia-kas-v2', KEY1 = 'hapia-kas-v1', KS = 'hapia-kas-set';
const KM = ['Iuran', 'Donasi', 'Sponsor', 'Penjualan', 'Saldo awal', 'Lainnya'];
const KK = ['Konsumsi', 'Perlengkapan', 'Transportasi', 'Dokumentasi', 'Honor & hadiah', 'Sewa tempat', 'Lainnya'];
const PAL = ['#f6cf4a', '#f2765f', '#b7a4ff', '#62b4ff', '#7fe3b0', '#e58bd0', '#c9f35c'];
const GR = [['#ffb27d', '#f2765f'], ['#8be3c9', '#f6e27a', '#f4a6cf'], ['#c9b8ff', '#8f7cf0'], ['#f6e27a', '#f0b84a'], ['#a7ea82', '#4fc39a']];
const DEF = { nama: 'HAPIA', tagline: 'Kas & Keuangan', user: 'Pengurus', logo: null, bg: 'ethereal', foto: null, gelap: 35, v: 2 };
const $ = (s, r = document) => r.querySelector(s);
const rp = n => (n < 0 ? '−' : '') + 'Rp ' + Math.round(Math.abs(n)).toLocaleString('id-ID');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hariIni = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const bulanIni = () => hariIni().slice(0, 7);
const prevM = ym => { const [y, m] = ym.split('-').map(Number), d = new Date(y, m - 2, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const tgl = s => new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const bln = ym => new Date(ym + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short' });
const blnP = ym => new Date(ym + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const kc = n => { const a = Math.abs(n); return a >= 1e9 ? (a / 1e9).toFixed(1).replace('.', ',') + ' M' : a >= 1e6 ? (a / 1e6).toFixed(1).replace('.', ',') + ' jt' : a >= 1e3 ? Math.round(a / 1e3) + ' rb' : String(Math.round(a)); };
const big = n => `${n < 0 ? '−' : ''}<small>Rp</small>${Math.abs(Math.round(n)).toLocaleString('id-ID')}`;
const toast = t => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove('on'), 2400); };

/* Data & pengaturan */
let db = { events: [], trx: [] };
try {
  const d2 = JSON.parse(localStorage.getItem(KEY));
  if (d2 && Array.isArray(d2.trx)) db = d2;
  else { const d1 = JSON.parse(localStorage.getItem(KEY1)); if (Array.isArray(d1)) db.trx = d1.map(t => ({ ...t, ev: null })); }
} catch { /* mulai kosong */ }
let S = { ...DEF };
try { Object.assign(S, JSON.parse(localStorage.getItem(KS)) || {}); } catch { /* bawaan */ }
if (S.v !== 2) { S.v = 2; if (S.bg === 'padang') S.bg = 'ethereal'; try { localStorage.setItem(KS, JSON.stringify(S)); } catch { /* abaikan */ } }
const simpan = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { toast('Penyimpanan peramban diblokir atau penuh'); } };
const simpanS = () => { try { localStorage.setItem(KS, JSON.stringify(S)); } catch { toast('Gambar terlalu besar untuk disimpan, coba yang lebih kecil'); } };

const sum = (a, j) => a.filter(t => t.jenis === j).reduce((s, t) => s + t.nominal, 0);
const byKat = (a, j) => { const m = {}; a.filter(t => t.jenis === j).forEach(t => m[t.kat] = (m[t.kat] || 0) + t.nominal); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
const urut = a => [...a].sort((x, y) => y.tgl.localeCompare(x.tgl) || y.id - x.id);
const trxEv = id => db.trx.filter(t => (t.ev ?? null) === id);
const trxB = ym => db.trx.filter(t => t.tgl.startsWith(ym));
const evList = () => [...db.events].sort((a, b) => b.tgl.localeCompare(a.tgl));
const namaEv = id => id == null ? 'Kas umum' : (db.events.find(e => e.id === id) || {}).nama || 'Kas umum';
const grad = e => { const i = e ? Math.max(0, db.events.indexOf(e)) % GR.length : 2; return `linear-gradient(135deg,${GR[i].join(',')})`; };
const pct = (c, p) => p > 0 ? Math.round((c - p) / p * 100) : null;
const chipP = (c, p, naikBaik) => { if (!c && !p) return ''; const x = pct(c, p); return x === null ? '<span class="chip">baru</span>' : `<span class="chip ${(x >= 0) === naikBaik ? 'lime' : 'red'}">${x >= 0 ? '+' : ''}${x}%</span>`; };

/* Terapkan nama dan latar */
function terapkan() {
  let bg = S.bg; if (bg === 'foto' && !S.foto) bg = 'ethereal';
  const b = document.body; b.dataset.bg = bg;
  if (S.foto) b.style.setProperty('--foto', 'url("' + S.foto + '")');
  b.style.setProperty('--gelap', S.gelap / 100);
  $('#brandNama').textContent = S.nama || 'Kas';
  $('#logo').src = S.logo || 'assets/logo.png';
  const ini = (S.user || '').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  $('#ava').textContent = ini || '?';
  document.title = (S.nama || 'Kas') + ' · Kas';
  if (window.latarAktif) window.latarAktif(bg === 'padang');
}

/* Komponen */
const IK = { masuk: '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>', keluar: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 9v8H9"/></svg>' };
const EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/></svg>';
const DEL = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
const PLUS = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
const DOTS = '<svg viewBox="0 0 24 24" class="dots"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>';
const PANAH = '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>';

const trow = (t, aksi, showEv = true) => `<div class="tr ${t.jenis === 'keluar' ? 'k' : ''}"><span class="ic">${IK[t.jenis]}</span><div class="tn"><b>${esc(t.ket || t.kat)}</b><small>${esc(t.kat)}${showEv ? ' · ' + esc(namaEv(t.ev)) : ''}</small></div><span class="st ${t.jenis}">${t.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span><span class="td">${tgl(t.tgl)}</span><b class="ta num">${t.jenis === 'keluar' ? '−' : '+'}${rp(t.nominal)}</b><span class="tx">${aksi ? `<button class="ib" data-a="edit" data-id="${t.id}" aria-label="Ubah">${EDIT}</button><button class="ib del" data-a="del" data-id="${t.id}" aria-label="Hapus">${DEL}</button>` : DOTS}</span></div>`;

const hero = (lbl, a, sub, tombol) => { const m = sum(a, 'masuk'), k = sum(a, 'keluar'); return `<section class="hero2"><i class="sheen"></i><div class="lbl">${lbl}</div><div class="big num">${big(m - k)}</div><p class="s2">${sub}</p><div class="hbtn">${tombol}</div></section>`; };
const stat = (judul, nilai, tanda, sub, chip, cls = '') => `<div class="card stat ${cls}"><h3>${judul}</h3><div class="sv num">${nilai ? tanda : ''}${big(nilai)}</div><div class="ft"><span>${sub}</span>${chip}</div></div>`;

function donat(items, pusat) {
  const T = items.reduce((s, x) => s + x[1], 0);
  if (!T) return '<div class="empty">Belum ada data</div>';
  const r = 56, C = 2 * Math.PI * r, sw = 17, multi = items.length > 1; let off = 0, c = '', lg = '';
  items.forEach(([n, v], i) => {
    const w = PAL[i % PAL.length], seg = v / T * C, len = Math.max(multi ? seg - sw - 6 : seg, .5);
    c += `<circle cx="75" cy="75" r="${r}" fill="none" stroke="${w}" stroke-width="${sw}" stroke-linecap="${multi ? 'round' : 'butt'}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-(off + (multi ? sw / 2 + 3 : 0))}" transform="rotate(-90 75 75)"><title>${esc(n)}: ${rp(v)}</title></circle>`;
    off += seg;
    if (i < 6) lg += `<div class="lg"><i style="background:${w}"></i><span>${esc(n)}</span><b>${Math.round(v / T * 100)}%</b></div>`;
  });
  return `<div class="donut"><svg class="d" viewBox="0 0 150 150" role="img" aria-label="Komposisi">${c}<text x="75" y="68" text-anchor="middle" font-size="10" font-weight="600" fill="#a9a9c4">${pusat}</text><text x="75" y="89" text-anchor="middle" font-size="19" font-weight="700" fill="#fff" letter-spacing="-.5">${kc(T)}</text></svg><div class="legend">${lg}</div></div>`;
}
const hbar = (items, w) => items.length ? items.map(([n, v]) => `<div class="hb"><div><span>${esc(n)}</span><span class="num">${rp(v)}</span></div><div class="t"><i style="width:${v / items[0][1] * 100}%;background:${w}"></i></div></div>`).join('') : '<div class="empty">Belum ada data</div>';

let serie = 'masuk', donutP = 'bulan', tab = 'masuk';
function arus() {
  const b = [], d = new Date();
  for (let i = 4; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); b.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')); }
  const v = b.map(m => sum(trxB(m), serie)), mx = Math.max(1, ...v);
  const cols = b.map((m, i) => { const h = v[i] ? Math.max(16, v[i] / mx * 100) : 7, on = i === 4; return `<div class="bcol ${on ? 'on' : ''}"><div class="area"><div class="b" style="height:${h}%">${on ? `<div class="tip"><i class="ti">${serie === 'masuk' ? '↗' : '↘'}</i>${rp(v[i])}${chipP(v[i], v[3], serie === 'masuk')}</div><i class="ring"></i>` : ''}${v[i] ? (serie === 'masuk' ? '+' : '−') + kc(v[i]) : ''}</div></div><small>${bln(m)}</small></div>`; }).join('');
  return `<div class="card-h"><h2>Arus kas</h2><div class="hd-r"><button class="sel" data-a="serie">${serie === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} ▾</button><button class="arrow" data-go="laporan" aria-label="Buka laporan">${PANAH}</button></div></div><div class="bars">${cols}</div>`;
}
function donutKartu() {
  const a = donutP === 'bulan' ? trxB(bulanIni()) : db.trx;
  return `<div class="card-h"><h2>Pembagian pengeluaran</h2><button class="sel" data-a="donutp">${donutP === 'bulan' ? 'Bulan ini' : 'Semua'} ▾</button></div>${donat(byKat(a, 'keluar'), 'Total keluar')}`;
}
function panelKanan() {
  const L = evList(), top = L.slice(0, 3).reverse(), n = top.length, u = trxEv(null);
  const saldo = a => sum(a, 'masuk') - sum(a, 'keluar');
  let stack = '<div class="stack kosongwrap"><button class="sc kosong" data-a="evt-baru">+ Buat event pertama</button></div>', glass = '';
  if (n) {
    const cards = top.map((e, i) => {
      const front = i === n - 1, inset = (n - 1 - i) * 14;
      return `<a class="sc ${front ? 'front' : ''}" href="#/event/${e.id}" style="top:${i * 34}px;left:${inset}px;right:${inset}px;background:${grad(e)};z-index:${i + 1}"><span class="n1">${esc(e.nama)}</span><span class="n2">${front ? tgl(e.tgl) : kc(saldo(trxEv(e.id)))}</span></a>`;
    }).join('');
    const f = top[n - 1], fa = trxEv(f.id);
    stack = `<div class="stack" style="height:${(n - 1) * 34 + 132}px">${cards}</div>`;
    glass = `<a class="fglass" href="#/event/${f.id}"><div class="fnum num">${rp(saldo(fa))}</div><div class="fmeta"><span>${esc(f.cat || 'Event terbaru')}</span><span>${fa.length} transaksi</span></div></a>`;
  }
  const rows = L.slice(0, 5).map(e => { const a = trxEv(e.id); return `<a class="srow" href="#/event/${e.id}"><span class="evi" style="background:${grad(e)}">${esc((e.nama[0] || '?').toUpperCase())}</span><div class="t"><b>${esc(e.nama)}</b><small>${tgl(e.tgl)}</small></div><span class="n num">${rp(saldo(a))}</span>${DOTS}</a>`; });
  if (u.length) rows.push(`<a class="srow" href="#/event/umum"><span class="evi" style="background:${grad(null)}">K</span><div class="t"><b>Kas umum</b><small>${u.length} transaksi</small></div><span class="n num">${rp(saldo(u))}</span>${DOTS}</a>`);
  const av = L.slice(0, 6).map(e => `<a class="evi" href="#/event/${e.id}" style="background:${grad(e)}" aria-label="${esc(e.nama)}">${esc((e.nama[0] || '?').toUpperCase())}</a>`).join('');
  return `<div class="card-h"><h2>Event saya<sup>${db.events.length}</sup></h2><button class="addp" data-a="evt-baru">Tambah <span>${PLUS}</span></button></div>${stack}
  <div class="glass ${n ? '' : 'flat'}">${glass}<div class="card-h sh"><h2>Daftar event<sup>${L.length + (u.length ? 1 : 0)}</sup></h2><button class="link" data-go="event">Kelola ›</button></div>${av ? `<div class="avs">${av}</div>` : ''}${rows.length ? `<div class="slist">${rows.join('')}</div>` : '<div class="empty"><b>Belum ada event</b>Kelompokkan pemasukan dan pengeluaran per event.</div>'}</div>`;
}

/* Halaman */
function vBeranda() {
  const all = db.trx, cur = bulanIni(), pv = prevM(cur), A = trxB(cur), P = trxB(pv);
  const cm = sum(A, 'masuk'), ck = sum(A, 'keluar'), sel = cm - ck;
  const kini = urut(all).slice(0, 5);
  return `<div class="dash"><div class="col">
    <div class="head2"><h1>Dasbor Kas</h1><p class="sub">${esc(S.tagline)}${S.user ? ' · Halo, ' + esc(S.user) : ''}</p></div>
    <div class="r1">${hero('Total saldo kas', all, `${sel >= 0 ? '+' : '−'}${rp(Math.abs(sel))} selisih bulan ini`, `<button class="pill dark" data-a="trx-baru">Catat</button><button class="pill white" data-a="evt-baru">Event baru<span class="pi">${PLUS}</span></button>`)}
      <div class="stats">${stat('Pemasukan', cm, '+', 'Pemasukan bulan ini', chipP(cm, sum(P, 'masuk'), true), 'in')}${stat('Pengeluaran', ck, '−', 'Pengeluaran bulan ini', chipP(ck, sum(P, 'keluar'), false), 'out')}</div></div>
    <div class="r2"><div class="card rev">${arus()}</div><div class="card spl" id="kDonut">${donutKartu()}</div></div>
    <div class="card"><div class="card-h"><h2>Transaksi terbaru<sup>${all.length}</sup></h2><button class="link" data-go="transaksi">Lihat semua ›</button></div>${kini.length ? kini.map(t => trow(t, false)).join('') : '<div class="empty"><b>Belum ada transaksi</b>Tekan tombol + untuk mencatat pemasukan atau pengeluaran pertama.</div>'}</div>
  </div><aside class="card side">${panelKanan()}</aside></div>`;
}

function vEvent() {
  const L = evList();
  return `<div class="head2 head-row"><div><h1>Event</h1><p class="sub">Klik event untuk melihat pemasukan, pengeluaran, grafik, dan ringkasannya</p></div><button class="btn lime" data-a="evt-baru">+ Event baru</button></div>
  <div class="evgrid">${L.map(e => { const a = trxEv(e.id), m = sum(a, 'masuk'), k = sum(a, 'keluar'); return `<a class="evc" href="#/event/${e.id}" style="background:${grad(e)}"><div><div class="tg">${tgl(e.tgl)}</div><h3>${esc(e.nama)}</h3></div><div><div class="sv num">${rp(m - k)}</div><div class="mm"><span>+ ${kc(m)}</span><span>− ${kc(k)}</span></div>${e.anggaran ? `<div class="pg"><i style="width:${Math.min(100, k / e.anggaran * 100)}%"></i></div>` : ''}</div></a>`; }).join('')}
  <a class="evc" href="#/event/umum" style="background:${grad(null)}"><div><div class="tg">Di luar event</div><h3>Kas umum</h3></div><div><div class="sv num">${rp(sum(trxEv(null), 'masuk') - sum(trxEv(null), 'keluar'))}</div><div class="mm"><span>${trxEv(null).length} transaksi</span></div></div></a>
  <button class="evc add" data-a="evt-baru">+ Tambah event</button></div>`;
}

function vDetail(id) {
  const virt = id === 'umum', e = virt ? { id: null, nama: 'Kas umum', cat: 'Transaksi yang tidak terikat event' } : db.events.find(x => String(x.id) === id);
  if (!e) return '<div class="card empty"><b>Event tidak ditemukan</b><a class="btn lime sm" href="#/event">Kembali ke daftar event</a></div>';
  const a = trxEv(e.id), m = sum(a, 'masuk'), k = sum(a, 'keluar'), bm = byKat(a, 'masuk'), bk = byKat(a, 'keluar'), list = urut(a.filter(t => t.jenis === tab));
  const ring = !a.length ? 'Belum ada transaksi di sini. Catat iuran, donasi, atau pengeluaran pertama.' : `Terkumpul ${rp(m)}${bm.length ? `, terbesar dari ${esc(bm[0][0])} (${Math.round(bm[0][1] / m * 100)}%)` : ''}. Pengeluaran ${rp(k)}${bk.length ? `, terbesar untuk ${esc(bk[0][0])}` : ''}. ${m - k >= 0 ? 'Sisa saldo' : 'Kekurangan'} ${rp(Math.abs(m - k))}.`;
  const btn = `<button class="pill dark" data-a="trx-baru" data-ev="${virt ? '' : e.id}">Catat</button>${virt ? '' : `<button class="pill white" data-a="evt-ubah" data-id="${e.id}">Ubah</button><button class="circ2" data-a="evt-hapus" data-id="${e.id}" aria-label="Hapus event">${DEL}</button>`}`;
  return `<a class="back" href="#/event">‹ Semua event</a><div class="head2"><h1>${esc(e.nama)}</h1><p class="sub">${virt ? esc(e.cat) : tgl(e.tgl) + (e.cat ? ' · ' + esc(e.cat) : '')}</p></div>
  <div class="col"><div class="r1">${hero('Saldo event', a, `${a.length} transaksi tercatat`, btn)}<div class="stats">${stat('Pemasukan', m, '+', 'Total', `<span class="chip lime">${a.filter(t => t.jenis === 'masuk').length} catatan</span>`)}${stat('Pengeluaran', k, '−', 'Total', `<span class="chip red">${a.filter(t => t.jenis === 'keluar').length} catatan</span>`)}</div></div>
  ${e.anggaran ? `<div class="card"><div class="card-h"><h2>Penggunaan anggaran</h2><span class="chip ${k > e.anggaran ? 'red' : 'lime'}">${Math.round(k / e.anggaran * 100)}%</span></div><div class="prog ${k > e.anggaran ? 'over' : ''}"><i style="width:${Math.min(100, k / e.anggaran * 100)}%"></i></div><p class="sub num">${rp(k)} terpakai dari ${rp(e.anggaran)}</p></div>` : ''}
  <div class="r2"><div class="card"><div class="card-h"><h2>Pemasukan per kategori</h2></div>${donat(bm, 'Total masuk')}</div><div class="card"><div class="card-h"><h2>Pengeluaran per kategori</h2></div>${hbar(bk, '#f2765f')}</div></div>
  <div class="sumtxt">${ring}</div>
  <div class="card"><div class="card-h"><h2>Rincian transaksi</h2><div class="tabs"><button class="${tab === 'masuk' ? 'on' : ''}" data-a="tab" data-t="masuk">Pemasukan</button><button class="${tab === 'keluar' ? 'on' : ''}" data-a="tab" data-t="keluar">Pengeluaran</button></div></div>
  ${list.length ? list.map(t => trow(t, true, false)).join('') : `<div class="empty"><b>Belum ada ${tab === 'masuk' ? 'pemasukan' : 'pengeluaran'}</b><button class="btn lime sm" data-a="trx-baru" data-ev="${virt ? '' : e.id}" data-j="${tab}">Catat sekarang</button></div>`}</div></div>`;
}

const F = { q: '', j: '', e: '', b: '' };
const filt = () => { const q = F.q.toLowerCase(); return urut(db.trx).filter(t => (!F.j || t.jenis === F.j) && (!F.e || (F.e === 'umum' ? t.ev == null : String(t.ev) === F.e)) && (!F.b || t.tgl.startsWith(F.b)) && (!q || (t.ket + ' ' + t.kat + ' ' + namaEv(t.ev)).toLowerCase().includes(q))); };
const vTrx = () => `<div class="head2"><h1>Transaksi</h1><p class="sub">Semua catatan dari seluruh event dan kas umum</p></div><div class="card"><div class="filters"><input type="search" id="q" placeholder="Cari keterangan, kategori, event" value="${esc(F.q)}"><select id="fj"><option value="">Semua jenis</option><option value="masuk">Pemasukan</option><option value="keluar">Pengeluaran</option></select><select id="fe"><option value="">Semua event</option><option value="umum">Kas umum</option>${evList().map(e => `<option value="${e.id}">${esc(e.nama)}</option>`).join('')}</select><input type="month" id="fb" value="${F.b}"></div><div id="lst"></div></div>`;
const isiLst = () => { const a = filt(); $('#lst').innerHTML = a.length ? a.map(t => trow(t, true)).join('') : `<div class="empty"><b>${db.trx.length ? 'Tidak ada hasil' : 'Belum ada transaksi'}</b>${db.trx.length ? 'Ubah kata kunci atau filter.' : 'Tekan tombol + untuk memulai.'}</div>`; };

let lapB = bulanIni();
const vLaporan = () => `<div class="head2"><h1>Laporan</h1><p class="sub">Rekap bulanan, ekspor data, cadangan, dan tampilan</p></div><div class="r2"><div class="card"><div class="card-h"><h2>Rekap bulanan</h2><input type="month" id="lb" value="${lapB}"></div><div id="rekap"></div></div>
  <div class="card"><div class="card-h"><h2>Data &amp; tampilan</h2></div><p class="sub" style="margin-bottom:16px">Data tersimpan di peramban perangkat ini. Unduh cadangan secara berkala dan simpan di tempat aman.</p><div class="actions"><button class="btn soft sm" data-a="pengaturan">Ubah nama &amp; latar</button><button class="btn soft sm" data-a="csv">Unduh CSV</button><button class="btn soft sm" data-a="cetak">Cetak laporan bulan ini</button><button class="btn soft sm" data-a="cetak-all">Cetak semua periode</button><button class="btn soft sm" data-a="backup">Unduh cadangan</button><button class="btn soft sm" data-a="restore">Pulihkan cadangan</button><button class="btn red sm" data-a="reset">Hapus semua data</button></div></div></div>`;
const isiRekap = () => { const a = trxB(lapB), m = sum(a, 'masuk'), k = sum(a, 'keluar'); $('#rekap').innerHTML = a.length ? `<div class="two" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:18px"><div><span class="sub">Masuk</span><b class="num" style="display:block;color:var(--lime)">${rp(m)}</b></div><div><span class="sub">Keluar</span><b class="num" style="display:block;color:var(--coral)">${rp(k)}</b></div><div><span class="sub">Selisih</span><b class="num" style="display:block">${rp(m - k)}</b></div></div><h3>Pemasukan</h3>${hbar(byKat(a, 'masuk'), '#c9f35c')}<h3>Pengeluaran</h3>${hbar(byKat(a, 'keluar'), '#f2765f')}` : `<div class="empty"><b>Tidak ada data</b>Belum ada transaksi di ${blnP(lapB)}.</div>`; };

/* Gerak: indikator menu, riak klik, hitung angka */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
let indSiap = false;
function geserInd(animasi) {
  const nav = $('#nav'), ind = nav && nav.querySelector('.ind'), on = nav && nav.querySelector('a.on');
  if (!ind) return;
  if (!on) { ind.style.opacity = 0; return; }
  if (!animasi || !indSiap) ind.style.transition = 'none'; else ind.style.transition = '';
  ind.style.opacity = 1; ind.style.width = on.offsetWidth + 'px'; ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  if (!indSiap) { void ind.offsetWidth; indSiap = true; ind.style.transition = ''; }
}
addEventListener('resize', () => geserInd(false));
let sy0 = scrollY;
addEventListener('scroll', () => { const y = scrollY, f = $('#tambah'); if (!f) return; if (y - sy0 > 8 && y > 120) f.classList.add('sembunyi'); else if (sy0 - y > 8 || y < 120) f.classList.remove('sembunyi'); sy0 = y; }, { passive: true });
addEventListener('load', () => geserInd(false));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => geserInd(false));
document.addEventListener('pointerdown', e => {
  if (REDUCE) return;
  const b = e.target.closest('.pill,.btn,.sel,.arrow,.addp,.circ,.ava,.fab,.pills a,.tabs button,.link,.srow,.evc,.sc,.seg span');
  if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, x = document.createElement('span');
  x.className = 'rpl'; x.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(x); x.addEventListener('animationend', () => x.remove());
}, { passive: true });
function hitung(root) {
  if (REDUCE) return;
  const t0 = performance.now(), D = 650, items = [];
  root.querySelectorAll('.big, .stat .sv, .fnum').forEach(el => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { const m = n.nodeValue.match(/\d[\d.]*/); if (m) { items.push({ n, awal: n.nodeValue, m: m[0], v: +m[0].replace(/\./g, '') }); break; } }
  });
  if (!items.length) return;
  const f = now => {
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 4);
    items.forEach(i => { i.n.nodeValue = k >= 1 ? i.awal : i.awal.replace(i.m, Math.round(i.v * e).toLocaleString('id-ID')); });
    if (k < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

/* Laporan cetak */
const nf = n => Math.round(n).toLocaleString('id-ID');
const tg2 = s => s.split('-').reverse().join('/');
function donatCetak(items) {
  const T = items.reduce((s, x) => s + x[1], 0);
  if (!T) return '<div class="pr-empty">Belum ada data</div>';
  const r = 50, C = 2 * Math.PI * r; let off = 0, c = '', lg = '';
  items.forEach(([n, v], i) => {
    const w = PAL[i % PAL.length], seg = v / T * C;
    c += `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${w}" stroke-width="22" stroke-dasharray="${Math.max(seg - 1.6, .5)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
    off += seg;
    lg += `<tr><td><i style="background:${w}"></i>${esc(n)}</td><td class="r">${rp(v)}</td><td class="r"><b>${Math.round(v / T * 100)}%</b></td></tr>`;
  });
  return `<div class="pr-donut"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="61" fill="none" stroke="#eef0f7" stroke-width="1"/>${c}<text x="70" y="66" text-anchor="middle" font-size="8" fill="#7a7d99" font-weight="600">Total keluar</text><text x="70" y="82" text-anchor="middle" font-size="15" font-weight="800" fill="#151629">${kc(T)}</text></svg><table class="pr-lg">${lg}</table></div>`;
}
function trenCetak(akhir) {
  const ms = [akhir]; for (let i = 0; i < 5; i++) ms.unshift(prevM(ms[0]));
  const vm = ms.map(m => sum(trxB(m), 'masuk')), vk = ms.map(m => sum(trxB(m), 'keluar')), mx = Math.max(1, ...vm, ...vk);
  const W = 560, H = 190, top = 22, bot = 26, ch = H - top - bot, gw = W / 6;
  let g = '', bars = '';
  [0, .5, 1].forEach(f => { const y = top + ch * (1 - f); g += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="#e3e6f1" stroke-dasharray="3 4"/>`; });
  ms.forEach((m, i) => {
    const x0 = i * gw + gw / 2 - 29, hm = vm[i] / mx * ch, hk = vk[i] / mx * ch, cur = i === 5;
    bars += `<rect x="${x0}" y="${top + ch - hm}" width="26" height="${Math.max(hm, 1.5)}" rx="6" fill="url(#gM)"/><rect x="${x0 + 32}" y="${top + ch - hk}" width="26" height="${Math.max(hk, 1.5)}" rx="6" fill="url(#gK)"/>`;
    if (vm[i]) bars += `<text x="${x0 + 13}" y="${top + ch - hm - 5}" text-anchor="middle" font-size="8" font-weight="700" fill="#0f8f6b">${kc(vm[i])}</text>`;
    if (vk[i]) bars += `<text x="${x0 + 45}" y="${top + ch - hk - 5}" text-anchor="middle" font-size="8" font-weight="700" fill="#d2543e">${kc(vk[i])}</text>`;
    bars += `<text x="${i * gw + gw / 2}" y="${H - 8}" text-anchor="middle" font-size="9.5" font-weight="${cur ? 800 : 600}" fill="${cur ? '#151629' : '#7a7d99'}">${bln(m)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="pr-trend"><defs><linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ddfb0"/><stop offset="1" stop-color="#14a37c"/></linearGradient><linearGradient id="gK" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a7d"/><stop offset="1" stop-color="#e65a45"/></linearGradient></defs>${g}${bars}</svg>`;
}
function hbarCetak(items, kelas) {
  if (!items.length) return '<div class="pr-empty">Belum ada data</div>';
  return items.map(([n, v]) => `<div class="pr-hb"><div class="l"><span>${esc(n)}</span><b>${rp(v)}</b></div><div class="t"><i class="${kelas}" style="width:${Math.max(3, v / items[0][1] * 100)}%"></i></div></div>`).join('');
}
function susunLaporan(ym) {
  const asc = urut(db.trx).reverse(), rows = ym ? asc.filter(t => t.tgl.startsWith(ym)) : asc;
  const sebelum = ym ? asc.filter(t => t.tgl < ym + '-01') : [];
  const awal = sum(sebelum, 'masuk') - sum(sebelum, 'keluar'), m = sum(rows, 'masuk'), k = sum(rows, 'keluar'), akhir = awal + m - k;
  const periode = ym ? blnP(ym) : rows.length ? tgl(rows[0].tgl) + ' – ' + tgl(rows[rows.length - 1].tgl) : 'Seluruh periode';
  const judul = ym ? 'Laporan Kas Bulanan' : 'Laporan Kas Seluruh Periode';
  const bm = byKat(rows, 'masuk'), bk = byKat(rows, 'keluar');
  const now = new Date(), cetakTgl = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  const noDok = 'KAS/' + (ym ? ym.replace('-', '/') : 'ALL/' + now.getFullYear()) + '/' + String(rows.length).padStart(3, '0');
  const pm = ym ? pct(m, sum(trxB(prevM(ym)), 'masuk')) : null, pk = ym ? pct(k, sum(trxB(prevM(ym)), 'keluar')) : null;
  const dlt = (x, naikBaik) => x === null ? '' : `<em class="${(x >= 0) === naikBaik ? 'up' : 'dn'}">${x >= 0 ? '▲' : '▼'} ${Math.abs(x)}% dari bulan lalu</em>`;
  const narasi = !rows.length ? 'Belum ada transaksi yang tercatat pada periode ini.' :
    `Pada ${periode}, kas mencatat pemasukan sebesar <b>${rp(m)}</b>${bm.length ? ` (terbesar dari ${esc(bm[0][0])}, ${Math.round(bm[0][1] / m * 100)}%)` : ''} dan pengeluaran sebesar <b>${rp(k)}</b>${bk.length ? ` (terbesar untuk ${esc(bk[0][0])}, ${Math.round(bk[0][1] / k * 100)}%)` : ''}. Saldo akhir periode adalah <b>${rp(akhir)}</b>${m - k >= 0 ? ', surplus' : ', defisit'} ${rp(Math.abs(m - k))} dibanding awal periode.`;
  const grp = {}; rows.forEach(t => { const id = t.ev ?? 'u'; (grp[id] = grp[id] || []).push(t); });
  const evRows = Object.entries(grp).map(([id, a]) => ({ n: id === 'u' ? 'Kas umum' : namaEv(+id), c: a.length, m: sum(a, 'masuk'), k: sum(a, 'keluar') })).sort((x, y) => y.m - x.m)
    .map(e => `<tr><td>${esc(e.n)}</td><td class="c">${e.c}</td><td class="r g">${nf(e.m)}</td><td class="r o">${nf(e.k)}</td><td class="r"><b>${e.m - e.k < 0 ? '−' : ''}${nf(Math.abs(e.m - e.k))}</b></td></tr>`).join('');
  let run = awal;
  const trs = rows.map((t, i) => { run += t.jenis === 'masuk' ? t.nominal : -t.nominal; return `<tr><td class="c">${i + 1}</td><td>${tg2(t.tgl)}</td><td>${esc(namaEv(t.ev))}</td><td>${esc(t.kat)}</td><td>${esc(t.ket || '–')}</td><td class="r g">${t.jenis === 'masuk' ? nf(t.nominal) : ''}</td><td class="r o">${t.jenis === 'keluar' ? nf(t.nominal) : ''}</td><td class="r">${run < 0 ? '−' : ''}${nf(Math.abs(run))}</td></tr>`; }).join('');
  const logo = S.logo || 'assets/logo.png';
  return `<div class="pr-foot"><span>${esc(S.nama || 'Kas')} · ${judul} · ${esc(periode)}</span><span>${noDok}</span></div>
  <header class="pr-head"><div class="pr-brand"><span class="pr-logo"><img src="${logo}" alt=""></span><div><b>${esc(S.nama || 'Kas')}</b><small>${esc(S.tagline || '')}</small></div></div>
    <div class="pr-title"><small>${judul.toUpperCase()}</small><h1>${esc(periode)}</h1></div>
    <dl class="pr-meta"><div><dt>No. dokumen</dt><dd>${noDok}</dd></div><div><dt>Dicetak</dt><dd>${cetakTgl}, ${jam}</dd></div><div><dt>Transaksi</dt><dd>${rows.length} catatan</dd></div></dl></header>
  <section class="pr-kpi">
    <div class="k k0"><span>Saldo awal</span><b>${rp(awal)}</b><em>${ym ? 'Per 1 ' + blnP(ym) : 'Awal pencatatan'}</em></div>
    <div class="k k1"><span>Total pemasukan</span><b>${rp(m)}</b>${dlt(pm, true)}</div>
    <div class="k k2"><span>Total pengeluaran</span><b>${rp(k)}</b>${dlt(pk, false)}</div>
    <div class="k k3"><span>Saldo akhir</span><b>${rp(akhir)}</b><em>${m - k >= 0 ? '▲ Surplus ' : '▼ Defisit '}${rp(Math.abs(m - k))}</em></div></section>
  <p class="pr-note">${narasi}</p>
  <section class="pr-grid"><div class="pr-box"><h2>Tren 6 bulan <span><i class="lg1"></i>Masuk <i class="lg2"></i>Keluar</span></h2>${trenCetak(ym || bulanIni())}</div>
    <div class="pr-box"><h2>Komposisi pengeluaran</h2>${donatCetak(bk)}</div></section>
  <section class="pr-grid"><div class="pr-box"><h2>Sumber pemasukan</h2>${hbarCetak(bm, 'gi')}</div><div class="pr-box"><h2>Pengeluaran per kategori</h2>${hbarCetak(bk, 'go')}</div></section>
  ${evRows ? `<section class="pr-box wide"><h2>Rekap per event</h2><table class="pr-tb"><thead><tr><th>Event</th><th class="c">Transaksi</th><th class="r">Pemasukan (Rp)</th><th class="r">Pengeluaran (Rp)</th><th class="r">Saldo (Rp)</th></tr></thead><tbody>${evRows}</tbody></table></section>` : ''}
  <section class="pr-box wide"><h2>Rincian transaksi</h2><table class="pr-tb det"><thead><tr><th class="c">No</th><th>Tanggal</th><th>Event</th><th>Kategori</th><th>Keterangan</th><th class="r">Masuk (Rp)</th><th class="r">Keluar (Rp)</th><th class="r">Saldo (Rp)</th></tr></thead><tbody>
    ${ym ? `<tr class="aw"><td></td><td colspan="4">Saldo awal periode</td><td></td><td></td><td class="r">${awal < 0 ? '−' : ''}${nf(Math.abs(awal))}</td></tr>` : ''}${trs || '<tr><td colspan="8" class="c pr-empty">Tidak ada transaksi</td></tr>'}</tbody>
    <tfoot><tr><td colspan="5">Total periode</td><td class="r">${nf(m)}</td><td class="r">${nf(k)}</td><td class="r">${akhir < 0 ? '−' : ''}${nf(Math.abs(akhir))}</td></tr></tfoot></table></section>
  <section class="pr-sign"><div><p>Mengetahui,</p><b>Ketua</b><span></span><small>Nama &amp; tanda tangan</small></div><div><p>Disusun oleh,</p><b>Bendahara</b><span></span><small>Nama &amp; tanda tangan</small></div></section>`;
}
function cetak(ym) {
  $('#cetak').innerHTML = susunLaporan(ym);
  const lama = document.title; document.title = 'Laporan Kas ' + (ym ? blnP(ym) : 'Seluruh Periode') + ' - ' + (S.nama || 'Kas');
  const im = [...$('#cetak').querySelectorAll('img')];
  Promise.all(im.map(i => i.decode ? i.decode().catch(() => {}) : 0)).then(() => setTimeout(() => { print(); document.title = lama; }, 60));
}

/* Router */
function render(quiet) {
  const [, r = 'beranda', p] = location.hash.replace('#', '').split('/');
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === r));
  const root = $('#root'); root.innerHTML = r === 'event' ? (p ? vDetail(p) : vEvent()) : r === 'transaksi' ? vTrx() : r === 'laporan' ? vLaporan() : vBeranda();
  root.classList.toggle('quiet', quiet === true);
  root.style.animation = 'none'; void root.offsetWidth; root.style.animation = '';
  geserInd(true); if (quiet !== true) hitung(root);
  if (r === 'transaksi') { $('#fj').value = F.j; $('#fe').value = F.e; isiLst(); }
  if (r === 'laporan') isiRekap();
}
addEventListener('hashchange', () => { render(); scrollTo(0, 0); });

/* Form transaksi & event */
const dT = $('#dTrx'), fT = $('#fTrx'), dE = $('#dEvt'), fE = $('#fEvt'), dS = $('#dSet'), fS = $('#fSet');
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

/* Pengaturan nama & latar */
function muat(file, max, png, cb) {
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL(png ? 'image/png' : 'image/jpeg', .82)); }; im.onerror = () => toast('Gambar tidak dapat dibaca'); im.src = r.result; };
  r.readAsDataURL(file);
}
function isiPengaturan() {
  fS.nama.value = S.nama; fS.tagline.value = S.tagline; fS.user.value = S.user; fS.gelap.value = S.gelap; $('#gelapVal').textContent = S.gelap;
  fS.querySelectorAll('[name=bg]').forEach(r => r.checked = r.value === S.bg);
  $('#logoPrev').src = S.logo || 'assets/logo.png';
  $('#thFoto').style.backgroundImage = S.foto ? 'url("' + S.foto + '")' : '';
  $('#fotoBox').hidden = S.bg !== 'foto';
}
const bukaSet = () => { isiPengaturan(); dS.showModal(); };
$('#gear').onclick = bukaSet; $('#ava').onclick = bukaSet;
fS.addEventListener('input', e => {
  const n = e.target.name; if (!n) return;
  if (n === 'bg') { S.bg = e.target.value; $('#fotoBox').hidden = S.bg !== 'foto'; if (S.bg === 'foto' && !S.foto) $('#fFoto').click(); }
  else if (n === 'gelap') { S.gelap = +e.target.value; $('#gelapVal').textContent = S.gelap; }
  else S[n] = e.target.value;
  simpanS(); terapkan(); if (n !== 'bg' && n !== 'gelap') render();
});
fS.onsubmit = e => { e.preventDefault(); dS.close(); };
$('#gantiLogo').onclick = () => $('#fLogo').click();
$('#resetLogo').onclick = () => { S.logo = null; simpanS(); terapkan(); $('#logoPrev').src = 'assets/logo.png'; };
$('#pilihFoto').onclick = () => $('#fFoto').click();
$('#fLogo').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) muat(f, 256, true, d => { S.logo = d; simpanS(); terapkan(); $('#logoPrev').src = d; }); };
$('#fFoto').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) muat(f, 1800, false, d => { S.foto = d; S.bg = 'foto'; simpanS(); terapkan(); isiPengaturan(); }); };
$('#resetSet').onclick = () => { S = { ...DEF }; simpanS(); terapkan(); isiPengaturan(); render(); toast('Tampilan dikembalikan'); };
$('#cari').onclick = () => { location.hash = '#/transaksi'; setTimeout(() => { const q = $('#q'); if (q) q.focus(); }, 60); };

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
  else if (a === 'tab') { tab = b.dataset.t; render(true); }
  else if (a === 'serie') { serie = serie === 'masuk' ? 'keluar' : 'masuk'; render(true); }
  else if (a === 'donutp') { donutP = donutP === 'bulan' ? 'semua' : 'bulan'; render(true); }
  else if (a === 'pengaturan') bukaSet();
  else if (a === 'cetak') cetak(lapB);
  else if (a === 'cetak-all') cetak(null);
  else if (a === 'backup') unduh('cadangan-kas-' + hariIni() + '.json', JSON.stringify({ v: 3, ...db, set: S }), 'application/json');
  else if (a === 'restore') $('#berkas').click();
  else if (a === 'csv') {
    if (!db.trx.length) return toast('Belum ada data');
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    unduh('kas-' + hariIni() + '.csv', '\ufeff' + ['Tanggal,Event,Jenis,Kategori,Keterangan,Nominal', ...urut(db.trx).reverse().map(t => [t.tgl, q(namaEv(t.ev)), t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran', q(t.kat), q(t.ket), t.nominal].join(','))].join('\n'), 'text/csv;charset=utf-8');
  } else if (a === 'reset' && confirm('Hapus SEMUA event dan transaksi? Unduh cadangan dulu jika perlu.') && confirm('Yakin? Tindakan ini tidak bisa dibatalkan.')) { db = { events: [], trx: [] }; simpan(); render(); toast('Semua data dihapus'); }
});
$('#root').addEventListener('input', e => {
  const i = e.target.id;
  if (i === 'q') F.q = e.target.value; else if (i === 'fj') F.j = e.target.value; else if (i === 'fe') F.e = e.target.value; else if (i === 'fb') F.b = e.target.value;
  if (['q', 'fj', 'fe', 'fb'].includes(i)) isiLst();
  if (i === 'lb' && e.target.value) { lapB = e.target.value; isiRekap(); }
});
$('#berkas').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text()), tr = Array.isArray(j) ? j.map(t => ({ ...t, ev: null })) : j.trx, ev = Array.isArray(j) ? [] : j.events || [];
    if (!Array.isArray(tr) || !tr.every(t => t && ['masuk', 'keluar'].includes(t.jenis) && /^\d{4}-\d{2}-\d{2}$/.test(t.tgl) && Number.isFinite(t.nominal))) throw 0;
    if (!confirm(`Pulihkan ${ev.length} event dan ${tr.length} transaksi? Data saat ini diganti.`)) return;
    db = { events: ev.map(x => ({ id: x.id, nama: String(x.nama), tgl: x.tgl, anggaran: +x.anggaran || 0, cat: String(x.cat || '') })), trx: tr.map((t, i) => ({ id: t.id || Date.now() + i, jenis: t.jenis, tgl: t.tgl, kat: String(t.kat || 'Lainnya'), nominal: t.nominal, ket: String(t.ket || ''), ev: t.ev ?? null })) };
    if (j.set && typeof j.set === 'object') { S = { ...DEF, ...j.set }; simpanS(); terapkan(); }
    simpan(); render(); toast('Cadangan dipulihkan');
  } catch { toast('Berkas cadangan tidak valid'); }
};
terapkan();
render();
})();
