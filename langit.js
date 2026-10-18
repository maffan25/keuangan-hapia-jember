(() => {
'use strict';
const c = document.getElementById('langit');
if (!c) return;
const g = c.getContext('2d');
const diam = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);
const LAP = [
  { fill: '#04361f', blade: '#0a6b38', hMin: .5, hMax: .85, sp: 11, w: 2.2, base: .70, k: .55 },
  { fill: '#05492a', blade: '#0f8a46', hMin: .6, hMax: 1, sp: 8, w: 2.6, base: .42, k: .8 },
  { fill: '#06582f', blade: '#18b457', hMin: .7, hMax: 1.15, sp: 6, w: 3, base: .14, k: 1.05 }
];
let W = 0, H = 0, dpr = 1, gh = 90, bintang = [], rumput = [], bulan = null, jatuh = null, jatuhNext = 3, last = 0;

function buatBulan() {
  const r = W < 600 ? 20 : 30, s = r * 3, o = document.createElement('canvas');
  o.width = o.height = s * dpr;
  const q = o.getContext('2d'); q.scale(dpr, dpr);
  q.fillStyle = '#ffe55c'; q.beginPath(); q.arc(s / 2, s / 2, r, 0, 6.283); q.fill();
  q.globalCompositeOperation = 'destination-out';
  q.beginPath(); q.arc(s / 2 + r * .45, s / 2 - r * .2, r * .88, 0, 6.283); q.fill();
  return { o, s, r };
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  gh = Math.max(78, Math.min(H * .12, 140));
  const n = Math.max(60, Math.min(W * H / 9000, 230)) | 0;
  bintang = Array.from({ length: n }, () => ({ x: rnd(0, W), y: rnd(0, H * .78), r: rnd(.4, 1.5), ph: rnd(0, 6.28), sp: rnd(.8, 2.6), v: rnd(.35, 1), gold: Math.random() < .14 }));
  rumput = LAP.map((l, li) => {
    const a = [];
    for (let x = -6; x < W + 12; x += l.sp * rnd(.6, 1.3))
      a.push({ x, h: gh * rnd(l.hMin, l.hMax) * .72, ph: rnd(0, 6.28), f: li === 2 && Math.random() < .05 ? (Math.random() < .5 ? '#ffd60a' : '#ef4444') : null });
    return a;
  });
  bulan = buatBulan();
  if (diam) draw(0, 0);
}

const angin = (x, t) => Math.sin(t * .7 - x * .0035) * .5 + Math.sin(t * 1.7 - x * .012) * .2 + .38;

function draw(t, dt) {
  g.clearRect(0, 0, W, H);

  const mr = bulan.r, mx = W - (W < 600 ? 56 : 120), my = W < 600 ? 118 : 122;
  const gl = g.createRadialGradient(mx, my, mr * .5, mx, my, mr * 4);
  gl.addColorStop(0, 'rgba(255,214,10,.22)'); gl.addColorStop(1, 'rgba(255,214,10,0)');
  g.fillStyle = gl; g.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
  g.drawImage(bulan.o, mx - bulan.s / 2, my - bulan.s / 2, bulan.s, bulan.s);

  for (const b of bintang) {
    const x = (((b.x - t * b.r * 1.4) % W) + W) % W;
    g.globalAlpha = b.v * (.35 + .65 * (.5 + .5 * Math.sin(t * b.sp + b.ph)));
    g.fillStyle = b.gold ? '#ffe55c' : '#fff';
    g.beginPath(); g.arc(x, b.y, b.r, 0, 6.283); g.fill();
  }
  g.globalAlpha = 1;

  if (!diam) {
    if (jatuh) {
      jatuh.a += dt;
      const p = jatuh.a / jatuh.d;
      if (p >= 1) { jatuh = null; jatuhNext = t + rnd(5, 10); }
      else {
        const x = jatuh.x + jatuh.vx * jatuh.a, y = jatuh.y + jatuh.vy * jatuh.a, m = Math.hypot(jatuh.vx, jatuh.vy);
        const tx = x - jatuh.vx / m * 90, ty = y - jatuh.vy / m * 90;
        const lg = g.createLinearGradient(x, y, tx, ty);
        lg.addColorStop(0, 'rgba(255,255,255,' + (1 - p) + ')'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        g.strokeStyle = lg; g.lineWidth = 2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.lineTo(tx, ty); g.stroke();
      }
    } else if (t > jatuhNext) jatuh = { x: rnd(W * .3, W * .95), y: rnd(0, H * .25), vx: -rnd(380, 520), vy: rnd(160, 260), a: 0, d: rnd(.8, 1.2) };
  }

  LAP.forEach((l, li) => {
    const by = x => H - gh * l.base + Math.sin(x * .006 + li * 2.1) * 7 + Math.sin(x * .017 + li) * 3;
    g.fillStyle = l.fill; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W + 14; x += 14) g.lineTo(x, by(x));
    g.lineTo(W + 14, H); g.closePath(); g.fill();
    g.strokeStyle = l.blade; g.lineWidth = l.w; g.lineCap = 'round'; g.beginPath();
    const bunga = [];
    for (const b of rumput[li]) {
      const y0 = by(b.x), ang = angin(b.x, t) * b.h * .42 * l.k + Math.sin(t * 2.2 + b.ph) * b.h * .05;
      const tx = b.x + ang, ty = y0 - b.h * (1 - Math.abs(ang) / (b.h * 2.4));
      g.moveTo(b.x, y0 + 2); g.quadraticCurveTo(b.x + ang * .25, y0 - b.h * .55, tx, ty);
      if (b.f) bunga.push([tx, ty, b.f]);
    }
    g.stroke();
    for (const [x, y, col] of bunga) { g.fillStyle = col; g.beginPath(); g.arc(x, y, 2.6, 0, 6.283); g.fill(); }
  });
}

function loop(ms) {
  const t = ms / 1000, dt = Math.min(t - last, .1);
  last = t; draw(t, dt); requestAnimationFrame(loop);
}

resize();
let lebar = W, tinggi = H, tm;
addEventListener('resize', () => {
  clearTimeout(tm);
  tm = setTimeout(() => { if (innerWidth !== lebar || Math.abs(innerHeight - tinggi) > 150) { lebar = innerWidth; tinggi = innerHeight; resize(); } }, 150);
});
if (!diam) requestAnimationFrame(loop);
})();
