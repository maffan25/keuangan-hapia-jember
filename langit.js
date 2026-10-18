(() => {
'use strict';
const cv = document.getElementById('langit'), ef = document.getElementById('efek');
if (!cv || !ef) return;
const diam = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- Lapisan foto (WebGL): rumput tertiup angin, bintang berkelip, awan bergeser ---------- */
const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex; uniform vec2 uRes; uniform vec2 uImg; uniform float uT; uniform float uD;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.55+noise(p*2.1)*.3+noise(p*4.3)*.15;}
void main(){
  vec2 frag=gl_FragCoord.xy; float t=uT;
  float s=uRes.y/uImg.y;
  float u=(frag.x-uRes.x*.5)/(uImg.x*s)+.5;
  float v=frag.y/uRes.y;

  float m=1.-smoothstep(0.,.42,v); m*=m;
  float w=sin(u*14.-t*1.1+sin(v*9.+t*.4)*1.5)*.6+sin(u*37.-t*2.3+v*20.)*.25+.35;
  float dx=m*(.011*w+.0016*sin(u*170.+t*3.+v*45.));
  float dy=m*.0016*sin(u*60.-t*1.7);
  vec2 uv=vec2(u+dx,clamp(v+dy,0.,1.));
  uv.x=1.-abs(1.-mod(uv.x,2.));
  vec3 c=texture2D(uTex,uv).rgb;

  float l=dot(c,vec3(.299,.587,.114));
  float sky=smoothstep(.45,.55,v);
  float star=smoothstep(.28,.6,l)*sky;
  float h=hash(floor(frag/(3.*uD)));
  float tw=.4+.85*(.5+.5*sin(t*(.7+2.4*h)+h*60.));
  c*=mix(1.,tw,star);

  float cm=smoothstep(.22,.30,v)*(1.-smoothstep(.62,.8,v))*(1.-smoothstep(.12,.3,l));
  float n=fbm(vec2(u*2.6+t*.012,v*3.2-t*.006));
  c*=1.+(n-.5)*.9*cm;
  c+=vec3(.01,.02,.03)*cm*n;

  float g=.5+.5*sin(u*6.-t*.9+v*4.);
  c*=1.+m*.22*(g-.35);

  vec2 q=frag/uRes-.5; c*=1.-.45*dot(q,q);
  gl_FragColor=vec4(c,1.);
}`;

let gl = null, prog, loc = {}, tex = null, img = null, W = 0, H = 0, dpr = 1;
try { gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }

function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
function initGL() {
  const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
  if (!v || !f) { gl = null; return; }
  prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; return; }
  gl.useProgram(prog);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  ['uTex', 'uRes', 'uImg', 'uT', 'uD'].forEach(n => loc[n] = gl.getUniformLocation(prog, n));
}
function pasangTekstur() {
  tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
function gambar(t) {
  if (!gl || !tex) return;
  gl.viewport(0, 0, cv.width, cv.height);
  gl.uniform1i(loc.uTex, 0); gl.uniform2f(loc.uRes, cv.width, cv.height);
  gl.uniform2f(loc.uImg, img.naturalWidth, img.naturalHeight); gl.uniform1f(loc.uT, t); gl.uniform1f(loc.uD, dpr);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/* ---------- Lapisan efek (2D): bintang jatuh dan kunang-kunang ---------- */
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
  if (diam) gambar(0);
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

/* ---------- Jalankan ---------- */
if (gl) initGL();
ukur();
if (gl) {
  img = new Image();
  img.onload = () => { try { pasangTekstur(); gambar(0); } catch (e) { gl = null; } };
  img.src = 'assets/langit.jpg';
}
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
