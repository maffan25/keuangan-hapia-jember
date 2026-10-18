(() => {
'use strict';
const KEY = 'hapia-kas-v1';
const KAT = {
  masuk: ['Iuran anggota', 'Donasi', 'Infak acara', 'Saldo awal', 'Lainnya'],
  keluar: ['Operasional', 'Kegiatan', 'Konsumsi', 'Sosial', 'Lainnya']
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hariIni = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const bulanIni = () => hariIni().slice(0, 7);
const tglIndo = s => new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const bulanIndo = ym => new Date(ym + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short' });

let data = [];
let editId = null;
try { data = JSON.parse(localStorage.getItem(KEY)) || []; } catch { data = []; }
const simpan = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { toast('Penyimpanan peramban penuh atau diblokir'); } };

function toast(t) {
  const el = $('#toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('on'), 2400);
}

/* Navigasi */
const judul = { ringkasan: 'Ringkasan', transaksi: 'Transaksi', laporan: 'Laporan' };
function buka(v) {
  $$('.view').forEach(e => e.classList.toggle('on', e.id === v));
  $$('.tab').forEach(e => e.classList.toggle('on', e.dataset.view === v));
  $('#judul').textContent = judul[v];
  scrollTo(0, 0);
}
$$('.tab').forEach(b => b.onclick = () => buka(b.dataset.view));
$$('[data-go]').forEach(b => b.onclick = () => buka(b.dataset.go));
$('#tanggal').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* Hitung */
const total = (arr, j) => arr.filter(t => t.jenis === j).reduce((a, t) => a + t.nominal, 0);
const urut = arr => [...arr].sort((a, b) => b.tgl.localeCompare(a.tgl) || b.id - a.id);

const IKON = {
  masuk: '<svg viewBox="0 0 24 24"><path d="M12 19V5m0 0l-5 5m5-5l5 5"/></svg>',
  keluar: '<svg viewBox="0 0 24 24"><path d="M12 5v14m0 0l-5-5m5 5l5-5"/></svg>'
};
const EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/></svg>';
const HAPUS = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

function baris(t, aksi) {
  const k = t.jenis === 'keluar';
  return `<li class="row ${k ? 'k' : ''}"><div class="ico">${IKON[t.jenis]}</div>
    <div class="t"><b>${esc(t.ket || t.kat)}</b><small>${esc(t.kat)} · ${tglIndo(t.tgl)}</small></div>
    <div class="n">${k ? '−' : '+'} ${rp(t.nominal)}</div>
    ${aksi ? `<div class="x"><button class="icon-btn" data-edit="${t.id}" aria-label="Ubah">${EDIT}</button><button class="icon-btn del" data-del="${t.id}" aria-label="Hapus">${HAPUS}</button></div>` : ''}</li>`;
}
const kosong = (j, p) => `<li class="empty"><b>${j}</b>${p}</li>`;

/* Ringkasan */
function renderRingkasan() {
  const m = total(data, 'masuk'), k = total(data, 'keluar');
  $('#saldo').textContent = rp(m - k);
  $('#saldoNote').textContent = data.length ? `Total masuk ${rp(m)} · keluar ${rp(k)}` : 'Belum ada transaksi';
  const bi = data.filter(t => t.tgl.startsWith(bulanIni()));
  $('#bulanMasuk').textContent = rp(total(bi, 'masuk'));
  $('#bulanKeluar').textContent = rp(total(bi, 'keluar'));
  const t = urut(data).slice(0, 6);
  $('#terbaru').innerHTML = t.length ? t.map(x => baris(x)).join('') :
    kosong('Belum ada catatan', 'Mulai dengan mencatat saldo awal atau iuran pertama.<br><button class="btn primary" onclick="document.getElementById(\'tambah\').click()">Catat transaksi</button>');
  grafik();
}

function grafik() {
  const bln = [], d = new Date(); d.setDate(1);
  for (let i = 5; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); bln.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')); }
  const v = bln.map(b => { const a = data.filter(t => t.tgl.startsWith(b)); return [total(a, 'masuk'), total(a, 'keluar')]; });
  const mx = Math.max(1, ...v.flat());
  const W = 520, H = 220, pb = 26, ph = H - pb - 8, bw = 22, gap = (W - 6 * bw * 2) / 6;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik pemasukan dan pengeluaran 6 bulan terakhir">`;
  for (let i = 0; i <= 3; i++) { const y = 8 + ph - ph * i / 3; s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".1"/>`; }
  v.forEach(([a, b], i) => {
    const x = gap / 2 + i * (gap + bw * 2), ha = ph * a / mx, hb = ph * b / mx;
    s += `<rect class="bar-in" x="${x}" y="${8 + ph - ha}" width="${bw}" height="${ha}" rx="5"><title>Masuk ${rp(a)}</title></rect>`;
    s += `<rect class="bar-out" x="${x + bw + 2}" y="${8 + ph - hb}" width="${bw}" height="${hb}" rx="5"><title>Keluar ${rp(b)}</title></rect>`;
    s += `<text x="${x + bw}" y="${H - 6}" text-anchor="middle">${bulanIndo(bln[i])}</text>`;
  });
  $('#chart').innerHTML = s + '</svg>';
}

/* Transaksi */
function terfilter() {
  const q = $('#cari').value.trim().toLowerCase(), j = $('#fJenis').value, b = $('#fBulan').value;
  return urut(data).filter(t => (!j || t.jenis === j) && (!b || t.tgl.startsWith(b)) && (!q || (t.ket + ' ' + t.kat).toLowerCase().includes(q)));
}
function renderDaftar() {
  const a = terfilter();
  $('#daftar').innerHTML = a.length ? a.map(t => baris(t, true)).join('') :
    kosong(data.length ? 'Tidak ada hasil' : 'Belum ada transaksi', data.length ? 'Ubah kata kunci atau filter bulan.' : 'Pilih Catat transaksi untuk mulai.');
}
['cari', 'fJenis', 'fBulan'].forEach(i => $('#' + i).addEventListener('input', renderDaftar));
$('#semuaBulan').onclick = () => { $('#fBulan').value = ''; renderDaftar(); };
$('#daftar').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.edit) bukaForm(+b.dataset.edit);
  if (b.dataset.del && confirm('Hapus transaksi ini?')) { data = data.filter(t => t.id !== +b.dataset.del); simpan(); semua(); toast('Transaksi dihapus'); }
};

/* Laporan */
function renderLaporan() {
  const b = $('#lBulan').value, a = data.filter(t => t.tgl.startsWith(b));
  const per = j => {
    const m = {}; a.filter(t => t.jenis === j).forEach(t => m[t.kat] = (m[t.kat] || 0) + t.nominal);
    const T = total(a, j) || 1;
    return Object.entries(m).sort((x, y) => y[1] - x[1]).map(([n, v]) =>
      `<div class="kat ${j === 'keluar' ? 'k' : ''}"><div><span>${esc(n)}</span><span>${rp(v)} <small>${Math.round(v / T * 100)}%</small></span></div><div class="bar"><i style="width:${v / T * 100}%"></i></div></div>`).join('');
  };
  const pm = per('masuk'), pk = per('keluar');
  $('#kategori').innerHTML = (pm ? '<p class="kat-h">Pemasukan</p>' + pm : '') + (pk ? '<p class="kat-h">Pengeluaran</p>' + pk : '') ||
    '<div class="empty"><b>Tidak ada data</b>Belum ada transaksi di bulan ini.</div>';
}
$('#lBulan').oninput = renderLaporan;

/* Form */
const dlg = $('#dlg'), form = $('#form');
function isiKat(j, pilih) { form.kat.innerHTML = KAT[j].map(k => `<option${k === pilih ? ' selected' : ''}>${k}</option>`).join(''); }
$$('input[name=jenis]').forEach(r => r.onchange = () => isiKat(r.value));
form.nominal.oninput = () => { const d = form.nominal.value.replace(/\D/g, ''); form.nominal.value = d ? (+d).toLocaleString('id-ID') : ''; };
function bukaForm(id) {
  editId = id || null;
  const t = id ? data.find(x => x.id === id) : null;
  $('#dlgJudul').textContent = t ? 'Ubah transaksi' : 'Catat transaksi';
  form.jenis.value = t ? t.jenis : 'masuk';
  isiKat(form.jenis.value, t && t.kat);
  form.tgl.value = t ? t.tgl : hariIni();
  form.nominal.value = t ? t.nominal.toLocaleString('id-ID') : '';
  form.ket.value = t ? t.ket : '';
  dlg.showModal();
}
$('#tambah').onclick = () => bukaForm();
$('#batal').onclick = () => dlg.close();
form.onsubmit = e => {
  e.preventDefault();
  const nominal = +form.nominal.value.replace(/\D/g, '');
  if (!nominal) { toast('Isi nominal lebih dari 0'); return; }
  const t = { jenis: form.jenis.value, tgl: form.tgl.value, kat: form.kat.value, nominal, ket: form.ket.value.trim() };
  if (editId) Object.assign(data.find(x => x.id === editId), t); else data.push({ id: Date.now(), ...t });
  simpan(); dlg.close(); semua(); toast(editId ? 'Perubahan disimpan' : 'Transaksi disimpan');
};

/* Ekspor & cadangan */
function unduh(nama, isi, tipe) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([isi], { type: tipe })); a.download = nama; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$('#csv').onclick = () => {
  if (!data.length) return toast('Belum ada data untuk diunduh');
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const baris = [['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal'].join(',')]
    .concat(urut(data).reverse().map(t => [t.tgl, t.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran', q(t.kat), q(t.ket), t.nominal].join(',')));
  unduh('kas-hapia-' + hariIni() + '.csv', '\ufeff' + baris.join('\n'), 'text/csv;charset=utf-8');
};
$('#backup').onclick = () => unduh('cadangan-kas-hapia-' + hariIni() + '.json', JSON.stringify(data, null, 1), 'application/json');
$('#restore').onclick = () => $('#berkas').click();
$('#berkas').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    const ok = Array.isArray(j) && j.every(t => t && ['masuk', 'keluar'].includes(t.jenis) && /^\d{4}-\d{2}-\d{2}$/.test(t.tgl) && Number.isFinite(t.nominal));
    if (!ok) throw 0;
    if (!confirm(`Pulihkan ${j.length} transaksi? Data saat ini akan diganti.`)) return;
    data = j.map((t, i) => ({ id: t.id || Date.now() + i, jenis: t.jenis, tgl: t.tgl, kat: String(t.kat || 'Lainnya'), nominal: t.nominal, ket: String(t.ket || '') }));
    simpan(); semua(); toast('Cadangan dipulihkan');
  } catch { toast('Berkas cadangan tidak valid'); }
  e.target.value = '';
};
$('#reset').onclick = () => {
  if (confirm('Hapus SEMUA transaksi? Unduh cadangan dulu jika perlu.') && confirm('Yakin? Tindakan ini tidak bisa dibatalkan.')) { data = []; simpan(); semua(); toast('Semua data dihapus'); }
};

function semua() { renderRingkasan(); renderDaftar(); renderLaporan(); }
$('#fBulan').value = bulanIni();
$('#lBulan').value = bulanIni();
semua();
})();
