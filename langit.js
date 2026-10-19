(() => {
'use strict';
const cv = document.getElementById('langit'), ef = document.getElementById('efek');
if (!cv || !ef) return;
const diam = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* Bentuk bukit dan jalan setapak (harus sama dengan versi GLSL di bawah) */
const hF = x => { const b = x - .22; return .31 + .045 * Math.sin(x * 4.1 + .6) + .022 * Math.sin(x * 9.3 + 1.9) + .15 * ss(.42, 1.04, x) - .03 * (1 - ss(0, .3, x)) + .05 * Math.exp(-b * b / .0256); };
const xp = y => .36 + .9 * y + .02 * Math.sin(y * 30);
const pw = y => .07 * Math.max(0, 1 - y / .2);

const COMMON = `
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.55+noise(p*2.1)*.3+noise(p*4.3)*.15;}
float hF(float x){float b=x-.22;
  return .31+.045*sin(x*4.1+.6)+.022*sin(x*9.3+1.9)+.15*smoothstep(.42,1.04,x)-.03*(1.-smoothstep(0.,.3,x))+.05*exp(-b*b/.0256);}
float hN(float x){return .15+.04*sin(x*5.3+2.4)+.018*sin(x*12.7+.7)+.05*smoothstep(.55,1.,x);}
float xp(float y){return .36+.9*y+.02*sin(y*30.);}
float pwid(float y){return .07*max(0.,1.-y/.2);}
float macro(float x,float y,float a){
  float n=fbm(vec2(x*a*2.4,y*5.5));
  float d=y-hN(x);
  float hol=d>0.?exp(-d*16.)*.5:0.;
  float lit=(.55+.8*n)*(1.-hol);
  return lit*mix(1.,.6,smoothstep(.15,.5,y));
}`;

/* Langit, bintang, awan, bukit, tanah dan jalan setapak */
const VS1 = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS1 = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uT; uniform float uD;
${COMMON}
float starLayer(vec2 p,float cell,float dens,float rad,float t,float tws){
  vec2 g=floor(p/cell),f=fract(p/cell);
  float h=hash(g);
  if(h>dens) return 0.;
  vec2 pos=vec2(hash(g+7.1),hash(g+13.7))*.7+.15;
  float d=length(f-pos)*cell;
  float b=hash(g+3.3);
  float tw=.55+.45*sin(t*(1.+3.*hash(g+9.9))*tws+h*100.);
  float k=max(0.,1.-d/rad);
  return k*k*(.4+.6*b)*tw;
}
void main(){
  vec2 frag=gl_FragCoord.xy; vec2 p=frag/uD; float t=uT;
  float u=frag.x/uRes.x, v=frag.y/uRes.y, a=uRes.x/uRes.y;

  vec3 sky=mix(vec3(.003,.008,.022),vec3(.020,.062,.085),pow(1.-v,3.5));
  float cm=smoothstep(.26,.38,v)*(1.-smoothstep(.55,.78,v));
  float cl=smoothstep(.38,.8,fbm(vec2(u*a*1.7+t*.012,v*3.6-t*.004)+vec2(3.1,1.7)))*cm;
  sky=mix(sky,vec3(.020,.040,.075),cl*.85);
  float k=.2+.8*smoothstep(.35,1.,v)*(.45+.55*u);
  float s=starLayer(p,5.,.28*k,.9,t,1.)*.6+starLayer(p+17.,13.,.22*k,1.1,t,1.)+starLayer(p+41.,36.,.4*k,1.9,t,.7)*1.4;
  vec3 sc=mix(vec3(.75,.85,1.),vec3(1.,.95,.8),hash(floor(p/13.)));
  sky+=sc*s*(1.-cl*.92);

  float hf=hF(u);
  float lit=macro(u,v,a);
  vec3 gr=mix(vec3(.012,.07,.025),vec3(.07,.24,.06),clamp(lit-.2,0.,1.))*lit;
  gr+=vec3(.02,.09,.07)*exp(-(hf-v)*55.)*step(v,hf);
  float dx=abs(u-xp(v)), pww=pwid(v);
  float pa=(1.-smoothstep(pww*.75,pww*1.05+.0001,dx))*step(v,.2);
  vec3 dirt=mix(vec3(.10,.07,.045),vec3(.34,.26,.16),noise(p*.45)*.6+noise(p*1.7)*.4)*(.55+.5*lit);
  gr=mix(gr,dirt,pa);

  float m=smoothstep(hf-.0015,hf+.0015,v);
  vec3 c=mix(gr,sky,m);
  vec2 q=frag/uRes-.5; c*=1.-.4*dot(q,q);
  c+=(hash(frag)-.5)/255.;
  gl_FragColor=vec4(c,1.);
}`;

/* Ribuan helai rumput (instancing): tiap helai melengkung mengikuti angin */
const VS2 = `
attribute vec2 aV; attribute vec4 iA; attribute vec3 iB;
uniform vec2 uCss; uniform float uT; uniform float uA;
varying float vT; varying float vS; varying float vHue; varying float vL; varying float vW;
${COMMON}
float wind(vec2 p,float t){return sin(p.x*.0042-t*.8+p.y*.003)*.55+sin(p.x*.012-t*1.9+p.y*.01)*.22+.4;}
void main(){
  float t=aV.x, side=aV.y; vec2 b=iA.xy; float h=iA.z, w=iA.w;
  float wd=wind(b,uT)+sin(uT*2.6+iB.x)*.08;
  float bend=wd+iB.y;
  float cv=t*t;
  vec2 pos=b+vec2(bend*h*.6*cv+side*w*.5*(1.-pow(t,1.4)),h*t*(1.-.2*abs(bend)*cv));
  gl_Position=vec4(pos.x/uCss.x*2.-1.,pos.y/uCss.y*2.-1.,0.,1.);
  vT=t; vS=side; vHue=iB.z; vW=wd;
  vL=macro(b.x/uCss.x,b.y/uCss.y,uA);
}`;
const FS2 = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying float vT; varying float vS; varying float vHue; varying float vL; varying float vW;
void main(){
  vec3 base=vec3(.008,.06,.02);
  vec3 tip=mix(vec3(.30,.62,.09),vec3(.52,.84,.20),vHue);
  vec3 c=mix(base,tip,pow(vT,.85));
  c*=vL*(.88+.28*vW);
  c*=.8+.2*(1.-abs(vS));
  gl_FragColor=vec4(c,1.);
}`;

let gl = null, inst = null, P1, P2, U1 = {}, U2 = {}, bQuad, bTpl, bIdx, bInst, nBilah = 0, W = 0, H = 0, dpr = 1;
try { gl = cv.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
if (gl) inst = gl.getExtension('ANGLE_instanced_arrays');
if (!gl || !inst) { gl = null; cv.classList.add('tanpa-gl'); }

function prog(vs, fs, attrs) {
  const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; } return o; };
  const a = mk(gl.VERTEX_SHADER, vs), b = mk(gl.FRAGMENT_SHADER, fs);
  if (!a || !b) return null;
  const p = gl.createProgram(); gl.attachShader(p, a); gl.attachShader(p, b);
  for (const [n, i] of attrs) gl.bindAttribLocation(p, i, n);
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}
const unif = (p, names) => Object.fromEntries(names.map(n => [n, gl.getUniformLocation(p, n)]));

function initGL() {
  P1 = prog(VS1, FS1, [['p', 0]]);
  P2 = prog(VS2, FS2, [['aV', 1], ['iA', 2], ['iB', 3]]);
  if (!P1 || !P2) { gl = null; cv.classList.add('tanpa-gl'); return; }
  U1 = unif(P1, ['uRes', 'uT', 'uD']); U2 = unif(P2, ['uCss', 'uT', 'uA']);
  bQuad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bQuad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  bTpl = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bTpl);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1, .25, -1, .25, 1, .5, -1, .5, 1, .75, -1, .75, 1, 1, 0]), gl.STATIC_DRAW);
  bIdx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6, 5, 7, 6, 6, 7, 8]), gl.STATIC_DRAW);
  bInst = gl.createBuffer();
}

function buatBilah() {
  const n = Math.min(22000, Math.max(9000, (W * H / 50) | 0)), hb = Math.max(34, H * .052), out = [];
  while (out.length < n) {
    const x = rnd(-.02, 1.02), ym = hF(x), y = rnd(0, ym), s = 1 - .78 * Math.pow(y / ym, .8);
    if (Math.random() > Math.pow(.22 / s, 1.2)) continue;
    if (y < .2 && Math.abs(x - xp(y)) < pw(y) * (.7 + .3 * Math.random())) continue;
    const h = hb * s * rnd(.65, 1.25), w = Math.max(1.2, h * .075 * rnd(.8, 1.3));
    out.push([y, x * W, y * H, h, w, rnd(0, 6.28), rnd(-.35, .35), Math.random()]);
  }
  out.sort((a, b) => b[0] - a[0]);
  const f = new Float32Array(n * 7);
  out.forEach((b, i) => f.set(b.slice(1), i * 7));
  gl.bindBuffer(gl.ARRAY_BUFFER, bInst); gl.bufferData(gl.ARRAY_BUFFER, f, gl.STATIC_DRAW);
  nBilah = n;
}

function gambar(t) {
  if (!gl || !nBilah) return;
  gl.viewport(0, 0, cv.width, cv.height);
  [1, 2, 3].forEach(i => gl.disableVertexAttribArray(i));
  gl.useProgram(P1);
  gl.bindBuffer(gl.ARRAY_BUFFER, bQuad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(U1.uRes, cv.width, cv.height); gl.uniform1f(U1.uT, t); gl.uniform1f(U1.uD, dpr);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.disableVertexAttribArray(0);

  gl.useProgram(P2);
  gl.bindBuffer(gl.ARRAY_BUFFER, bTpl); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0); inst.vertexAttribDivisorANGLE(1, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bInst);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 28, 0); inst.vertexAttribDivisorANGLE(2, 1);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 28, 16); inst.vertexAttribDivisorANGLE(3, 1);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
  gl.uniform2f(U2.uCss, W, H); gl.uniform1f(U2.uT, t); gl.uniform1f(U2.uA, W / H);
  inst.drawElementsInstancedANGLE(gl.TRIANGLES, 21, gl.UNSIGNED_SHORT, 0, nBilah);
}

/* Efek 2D: bintang jatuh dan kunang-kunang */
const g = ef.getContext('2d');
let kunang = [], jatuh = null, jatuhNext = 4, sprite = null;
function buatSprite() {
  const o = document.createElement('canvas'); o.width = o.height = 48; const q = o.getContext('2d');
  const r = q.createRadialGradient(24, 24, 0, 24, 24, 24);
  r.addColorStop(0, 'rgba(255,250,200,1)'); r.addColorStop(.2, 'rgba(230,255,120,.7)'); r.addColorStop(1, 'rgba(180,255,80,0)');
  q.fillStyle = r; q.fillRect(0, 0, 48, 48); return o;
}
function ukur() {
  dpr = Math.min(devicePixelRatio || 1, 1.75); W = innerWidth; H = innerHeight;
  for (const c of [cv, ef]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  kunang = Array.from({ length: W < 600 ? 14 : 26 }, () => ({ x: rnd(0, W), y: rnd(H * .66, H * .97), s: rnd(5, 11), sp: rnd(.15, .5), ph: rnd(0, 6.28), a: rnd(10, 34), pl: rnd(.6, 1.6) }));
  if (!sprite) sprite = buatSprite();
  if (gl) { buatBilah(); if (diam) gambar(0); }
}
function efek(t, dt) {
  g.clearRect(0, 0, W, H);
  if (jatuh) {
    jatuh.a += dt; const p = jatuh.a / jatuh.d;
    if (p >= 1) { jatuh = null; jatuhNext = t + rnd(6, 12); }
    else {
      const x = jatuh.x + jatuh.vx * jatuh.a, y = jatuh.y + jatuh.vy * jatuh.a, m = Math.hypot(jatuh.vx, jatuh.vy);
      const tx = x - jatuh.vx / m * 100, ty = y - jatuh.vy / m * 100, lg = g.createLinearGradient(x, y, tx, ty);
      lg.addColorStop(0, 'rgba(255,255,255,' + (1 - p) + ')'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = lg; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(tx, ty); g.stroke();
    }
  } else if (t > jatuhNext) jatuh = { x: rnd(W * .35, W), y: rnd(0, H * .22), vx: -rnd(420, 560), vy: rnd(170, 260), a: 0, d: rnd(.8, 1.2) };
  g.globalCompositeOperation = 'lighter';
  for (const k of kunang) {
    const x = k.x + Math.sin(t * k.sp + k.ph) * k.a + Math.sin(t * .35 - k.x * .004) * 14, y = k.y + Math.cos(t * k.sp * 1.3 + k.ph) * k.a * .5;
    g.globalAlpha = Math.pow(Math.max(0, Math.sin(t * k.pl + k.ph)), 2) * .9;
    g.drawImage(sprite, x - k.s, y - k.s, k.s * 2, k.s * 2);
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

/* Jalankan */
if (gl) initGL();
ukur();
let last = 0;
function loop(ms) {
  const t = ms / 1000, dt = Math.min(t - last, .1); last = t;
  gambar(t); efek(t, dt); requestAnimationFrame(loop);
}
let lebar = W, tinggi = H, tm;
addEventListener('resize', () => {
  clearTimeout(tm);
  tm = setTimeout(() => { if (innerWidth !== lebar || Math.abs(innerHeight - tinggi) > 150) { lebar = innerWidth; tinggi = innerHeight; ukur(); } }, 150);
});
if (!diam) requestAnimationFrame(loop);
})();
