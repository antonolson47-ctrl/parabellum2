// PARABELLUM 2 scenery: sky domes (gradient + sun + clouds/stars), far mountain ranges (Pikes Peak), red-rock fins,
// stadium bowl with crowd/seat textures + light towers, storefront facades with awnings, pole barn, mine tunnels,
// columbines, gold bars, ambient particles (dust motes / fireflies / embers).
import * as THREE from 'three';
import { std, texMat, T, M } from './world.js';
import { PM, windowTex } from './props.js';
import { canvasTex, rand, mulberry } from './util.js';
const { col, metal, emis } = PM;

// ---------- sky dome ----------
export function skyDome(W, o) {
  const { top = '#3a7ad8', mid = '#9cc8f0', bot = '#e8f0f4', sun = null, sunCol = '#fff6d8', clouds = 0.5, stars = 0, seed = 3 } = o;
  const r = mulberry(seed);
  const t = canvasTex(1024, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h * 0.5); g.addColorStop(0, top); g.addColorStop(0.7, mid); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, w, h * 0.5);
    x.fillStyle = bot; x.fillRect(0, h * 0.5, w, h * 0.5);
    if (stars) for (let i = 0; i < 900 * stars; i++) { const y = r() * h * 0.45; x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7 * (1 - y / (h * 0.45))})`; const s = r() < 0.05 ? 2 : 1; x.fillRect(r() * w, y, s, s); }
    if (sun) { const sx = sun[0] * w, sy = sun[1] * h * 0.5; const sg = x.createRadialGradient(sx, sy, 2, sx, sy, 140); sg.addColorStop(0, sunCol); sg.addColorStop(0.08, sunCol); sg.addColorStop(0.2, 'rgba(255,240,200,.45)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = sg; x.fillRect(sx - 150, sy - 150, 300, 300); }
    for (let c = 0; c < 40 * clouds; c++) { const cx = r() * w, cy = h * (0.12 + r() * 0.3), cw = 40 + r() * 140; for (let k = 0; k < 12; k++) { const px = cx + (r() - 0.5) * cw * 1.6, py = cy + (r() - 0.5) * cw * 0.18, pr = cw * (0.15 + r() * 0.25); const cg = x.createRadialGradient(px, py, 1, px, py, pr); const a = (stars ? 0.12 : 0.55) * (0.5 + r() * 0.5); cg.addColorStop(0, `rgba(255,255,255,${a})`); cg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = cg; x.fillRect(px - pr, py - pr, pr * 2, pr * 2); } }
  });
  t.mapping = THREE.EquirectangularReflectionMapping;
  const m = new THREE.Mesh(new THREE.SphereGeometry(150, 48, 24), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10; m.userData.sky = true; W.group.add(m); W.updaters.push(() => { if (W.camRef) m.position.set(W.camRef.position.x, 0, W.camRef.position.z); });
  return m;
}
// ---------- far mountains: jagged ridgeline ring segment with snow caps; blended toward the haze color ----------
export function mountains(W, o) {
  const { a0 = -0.6, a1 = 0.6, radius = 125, peak = 38, base = 10, rough = 0.5, snow = 0.62, rock = '#5a6478', snowCol = '#f4f6fa', haze = '#b8c8dc', hz = 0.35, seed = 5, peakAt = null, y0 = -4 } = o;
  const r = mulberry(seed); const N = 160; const pos = [], colr = [], idx = [];
  const hs = []; let v = 0; const oct = [[0.5, 4], [0.25, 9], [0.12, 21], [0.06, 47]];
  const ph = oct.map(() => r() * 100);
  for (let i = 0; i <= N; i++) { const u = i / N; let h = 0; oct.forEach(([amp, f], k) => { h += amp * Math.sin(u * f + ph[k]) * (k ? rough * 1.6 : 1); }); h = base + (peak - base) * (0.5 + h * 0.6); if (peakAt !== null) { const d = (u - peakAt) / 0.12; h += peak * 0.7 * Math.exp(-d * d); } hs.push(Math.max(3, h)); }
  const cR = new THREE.Color(rock), cS = new THREE.Color(snowCol), cH = new THREE.Color(haze); const mx = Math.max(...hs);
  for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N; const x = Math.sin(a) * radius, z = -Math.cos(a) * radius; const h = hs[i];
    for (let j = 0; j < 6; j++) { const f = j / 5; const y = y0 + h * f; const rr = radius + (1 - f) * 8; pos.push(Math.sin(a) * rr, y, -Math.cos(a) * rr);
      const c = cR.clone().offsetHSL(0, 0, (r() - 0.5) * 0.06 - (1 - f) * 0.05); if (y > mx * snow && f > 0.55) c.lerp(cS, Math.min(1, (y - mx * snow) / (mx * 0.12) + 0.3) * (0.7 + r() * 0.3)); c.lerp(cH, hz + (1 - f) * 0.25); colr.push(c.r, c.g, c.b); } }
  for (let i = 0; i < N; i++) for (let j = 0; j < 5; j++) { const a = i * 6 + j, b = a + 6; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide })); m.renderOrder = -9; W.group.add(m);
  W.updaters.push(() => { if (W.camRef) m.position.set(W.camRef.position.x, 0, W.camRef.position.z); });
  return m;
}
// ---------- red-rock fin (Garden of the Gods): displaced, stretched icosahedron with strata ----------
const rockTexCache = {};
function rockTex(c) { return rockTexCache[c] || (rockTexCache[c] = canvasTex(256, 256, (x, w, h) => { x.fillStyle = c; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const y = rand(0, h); x.fillStyle = `rgba(${rand() < 0.5 ? '255,210,170' : '90,30,15'},${rand(0.05, 0.18)})`; x.fillRect(0, y, w, rand(2, 10)); } for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(0,0,0,${rand(0, 0.12)})`; x.fillRect(rand(0, w), rand(0, h), 2, 2); } }, { repeat: [2, 2] })); }
export function redRock(W, x, z, sx, sy, sz, ry = 0, seed = 1, colr = '#b8542e') {
  const r = mulberry(seed); const g = new THREE.IcosahedronGeometry(1, 4); const p = g.attributes.position;
  const ph = [r() * 9, r() * 9, r() * 9];
  for (let i = 0; i < p.count; i++) { let px = p.getX(i), py = p.getY(i), pz = p.getZ(i); const n = 1 + 0.18 * Math.sin(px * 3.1 + ph[0]) * Math.sin(py * 4.3 + ph[1]) + 0.1 * Math.sin(pz * 7 + py * 5 + ph[2]) + 0.06 * Math.sin(py * 18); px *= n; pz *= n; py = py < -0.6 ? -0.6 + (py + 0.6) * 0.2 : py; if (py > 0.55) { py = 0.55 + (py - 0.55) * 0.5 + 0.12 * Math.sin(px * 9 + ph[0]); } p.setXYZ(i, px, py, pz); }
  g.computeVertexNormals(); g.scale(sx, sy, sz); g.rotateY(ry); g.translate(x, sy * 0.6 - 0.3, z);
  const mat = M('rrock' + colr, () => new THREE.MeshStandardMaterial({ map: rockTex(colr), roughness: 0.95, flatShading: true }));
  W.geo(g, mat); const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)); const hw = (sx * c + sz * s) * 0.85, hd = (sx * s + sz * c) * 0.85; W.collider(x - hw, x + hw, z - hd, z + hd, 0, sy * 1.2);
}
export function juniper(W, x, z, s = 1) { const m = std('juniper', { color: 0x3f5a32, roughness: 0.95, flatShading: true }); for (let i = 0; i < 3; i++) { const g = new THREE.IcosahedronGeometry((0.7 - i * 0.12) * s, 0); g.scale(1, 0.8, 1); g.translate(x + rand(-.3, .3) * s, (0.5 + i * 0.45) * s, z + rand(-.3, .3) * s); W.geo(g, m); } W.collider(x - 0.4 * s, x + 0.4 * s, z - 0.4 * s, z + 0.4 * s, 0, 1.2 * s); }
// ---------- stadium ----------
export function crowdTex(seed = 2, seatsOnly = false) {
  return M('crowd' + seed + seatsOnly, () => canvasTex(512, 256, (x, w, h) => { const r = mulberry(seed); x.fillStyle = '#5a0f16'; x.fillRect(0, 0, w, h);
    for (let row = 0; row < 16; row++) { const y = row * 16; x.fillStyle = '#9d2235'; x.fillRect(0, y + 8, w, 7); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, y + 14, w, 2);
      if (!seatsOnly) for (let k = 0; k < 64; k++) { if (r() < 0.45) continue; const px = k * 8 + r() * 2; const z = r() < 0.3; x.fillStyle = z ? `hsl(${80 + r() * 30},20%,${30 + r() * 15}%)` : `hsl(${r() < 0.6 ? 355 : r() * 360},${50 + r() * 30}%,${25 + r() * 40}%)`; x.fillRect(px, y + 2, 6, 10); x.fillStyle = z ? '#7a8a5a' : `hsl(25,${30 + r() * 30}%,${35 + r() * 35}%)`; x.fillRect(px + 1, y - 1, 4, 4); } }
  }, { repeat: [1, 1] }));
}
export function turfTex() { return M('turf', () => canvasTex(512, 1024, (x, w, h) => { for (let i = 0; i < 20; i++) { x.fillStyle = i % 2 ? '#2f7a32' : '#357f36'; x.fillRect(0, i * h / 20, w, h / 20); } for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${rand() < .5 ? '0,0,0' : '255,255,255'},${rand(0, 0.06)})`; x.fillRect(rand(0, w), rand(0, h), 1, 3); }
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 4; for (let i = 1; i < 20; i++) { const y = i * h / 20; x.beginPath(); x.moveTo(20, y); x.lineTo(w - 20, y); x.stroke(); } x.strokeRect(20, 4, w - 40, h - 8);
  x.fillStyle = '#9d2235'; x.fillRect(20, 4, w - 40, h / 20 - 4); x.fillRect(20, h - h / 20, w - 40, h / 20 - 4); x.fillStyle = '#fff'; x.font = "bold 40px 'Black Ops One'"; x.textAlign = 'center'; x.fillText('RAZORCRACKS', w / 2, h / 20 - 12); x.save(); x.translate(w / 2, h - 14); x.rotate(Math.PI); x.fillText('RAZORCRACKS', 0, h / 20 - 26 - 30); x.restore();
  x.font = "bold 26px 'Black Ops One'"; for (let i = 2; i < 19; i++) { const n = (i <= 10 ? i - 1 : 19 - i) * 10; if (n <= 0) continue; x.fillText(String(n > 50 ? 100 - n : n), 60, i * h / 20 + 9); x.fillText(String(n > 50 ? 100 - n : n), w - 60, i * h / 20 + 9); }
  x.fillStyle = 'rgba(157,34,53,.85)'; x.beginPath(); x.ellipse(w / 2, h / 2, 70, 44, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = "bold 30px 'Black Ops One'"; x.fillText('HOG', w / 2, h / 2 + 10);
})); }
// a sloped grandstand (one side). x/z centre of the front edge, length along local x, rows rise backwards (local -z)
export function grandstand(W, cx, cz, len, ry, o = {}) {
  const rows = o.rows || 10, step = o.step || 0.9, rise = o.rise || 0.55, seed = o.seed || 1; const tex = crowdTex(seed, o.empty); tex.repeat.set(len / 8, 1);
  const mat = M('stand' + seed + len + !!o.empty, () => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); const conc = texMat('standConc', T.concrete('#bdb8ae'));
  const g = new THREE.Group(); const depth = rows * step, height = rows * rise + (o.base || 1.4);
  const slope = new THREE.Mesh(new THREE.PlaneGeometry(len, Math.hypot(depth, rows * rise)), mat); slope.rotation.x = -Math.atan2(rows * rise, depth); slope.position.set(0, (o.base || 1.4) + rows * rise / 2, -depth / 2); g.add(slope);
  const front = new THREE.Mesh(new THREE.BoxGeometry(len, o.base || 1.4, 0.3), conc); front.position.set(0, (o.base || 1.4) / 2, 0); g.add(front);
  const back = new THREE.Mesh(new THREE.BoxGeometry(len, 3, 0.6), conc); back.position.set(0, height + 1.2, -depth - 0.3); g.add(back);
  if (o.suites) { const st = windowTex('#d8d4cc', 0.6, 14, 1, '#24303a'); st.repeat.set(len / 20, 1); const s = new THREE.Mesh(new THREE.BoxGeometry(len, 4, 3), new THREE.MeshStandardMaterial({ map: st, roughness: 0.4, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.35 })); s.position.set(0, height + 4.5, -depth - 1); g.add(s); }
  g.position.set(cx, 0, cz); g.rotation.y = ry; W.add(g);
  return g;
}
export function lightTower(W, x, z, h = 30, faceX = 0, faceZ = 0, power = 1) {
  W.cyl(x, 0, z, 0.35, 0.6, h, metal('#9aa0a8'), { collide: true, seg: 8 });
  const g = new THREE.Group(); const panel = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 0.4), metal('#555b62')); g.add(panel);
  const bulbs = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, toneMapped: false })); bulbs.position.z = 0.21; g.add(bulbs);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xfff4d8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); glow.scale.set(12, 8, 1); glow.position.z = 0.6; g.add(glow);
  g.position.set(x, h + 1.5, z); g.lookAt(faceX, 0, faceZ); W.group.add(g);
  const s = new THREE.SpotLight(0xfff2dc, 900 * power, 120, 0.55, 0.6, 1.2); s.position.set(x, h, z); s.target.position.set(faceX, 0, faceZ); W.group.add(s); W.group.add(s.target); W.lights.push(s);
}
let _glow; export function glowTex() { return _glow || (_glow = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,240,210,.55)'); g.addColorStop(1, 'rgba(255,230,200,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); })); }
// ---------- downtown storefront with awning, sign band, display windows ----------
export function storefront(W, x, z, w, h, ry, o = {}) {
  const base = o.color || '#8a4a32'; const brick = texMat('brick' + base, T.brick(base)); brick.map.repeat.set(1, 1);
  const d = o.depth || 8; const fx = Math.sin(ry), fz = Math.cos(ry); // facade faces +local z
  W.box(x - fx * d / 2, 0, z - fz * d / 2, w, h, d, brick, { ry, tile: 3 });
  const up = windowTex(base, o.lit || 0.15, Math.max(2, Math.round(w / 2.5)), 1, o.frame || '#e8e0d0'); const um = M('upw' + base + w + (o.lit || 0.15), () => new THREE.MeshStandardMaterial({ map: up, roughness: 0.6 }));
  const off = 0.02; const px = x + fx * off, pz = z + fz * off;
  const upper = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h - 5.2), um); upper.position.set(px, 4.6 + (h - 5.2) / 2, pz); upper.rotation.y = ry; W.group.add(upper);
  const glass = std('shopglass', { color: 0x1a2028, roughness: 0.05, metalness: 0.9, emissive: 0x332a18, emissiveIntensity: 0.4 }); W.box(px + fx * 0.02, 0.5, pz + fz * 0.02, w * 0.8, 2.4, 0.06, glass, { ry, collide: false });
  W.box(px, 0, pz, w, 0.5, 0.15, col(o.trim || '#e8e0d0'), { ry, collide: false });
  W.box(px, 2.9, pz, w, 0.12, 0.2, col(o.trim || '#e8e0d0'), { ry, collide: false });
  if (o.awning !== false) { const ac = o.awning || '#1f4fa0'; const am = std('awn' + ac, { color: ac, roughness: 0.75, side: THREE.DoubleSide }); const aw = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.08, 1.8), am); aw.position.set(px + fx * 0.9, 3.1, pz + fz * 0.9); aw.rotation.set(0, ry, 0); aw.rotateX(0.38); W.group.add(aw); aw.castShadow = true; const val = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.35, 0.05), am); val.position.set(px + fx * 1.75, 2.62, pz + fz * 1.75); val.rotation.y = ry; W.group.add(val); }
  if (o.sign) W.sign(Array.isArray(o.sign) ? o.sign : [o.sign], px + fx * 0.05, 3.75, pz + fz * 0.05, Math.min(w * 0.85, 7), 0.8, { ry, bg: o.signBg || '#1a1a1a', fg: o.signFg || '#f2e6c8', neon: o.neon, box: 0.08 });
  W.box(x - fx * d / 2, h, z - fz * d / 2, w + 0.2, 0.5, d + 0.2, col(o.cornice || '#5a3a2a'), { ry, collide: false });
}
// green cast-iron lamp post with a globe (Arkadelphia / Fayetteville style)
export function globeLamp(W, x, z, light = false, banner = null) {
  W.cyl(x, 0, z, 0.08, 0.14, 4.2, std('greenIron', { color: 0x1f4a32, roughness: 0.45, metalness: 0.6 }), { collide: true, seg: 8 });
  const gl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), std('globe', { color: 0xfffaf0, emissive: 0xfff0d0, emissiveIntensity: 1.2, roughness: 0.2 })); gl.position.set(x, 4.5, z); W.group.add(gl);
  if (banner) { W.sign(banner.text, x + 0.45, 3.0, z, 0.7, 1.4, { ry: banner.ry || 0, bg: banner.bg || '#ffd84a', colors: banner.colors || ['#1f4a32', '#1f4a32'], hres: 1 }); W.sign(banner.text, x + 0.45, 3.0, z - 0.01, 0.7, 1.4, { ry: (banner.ry || 0) + Math.PI, bg: banner.bg || '#ffd84a', colors: banner.colors || ['#1f4a32', '#1f4a32'], hres: 1 }); }
  if (light) W.pointLight(x, 4.3, z, 0xffe8c0, 6, 12);
}
// ---------- red highway-shield sign (67 Grill) ----------
export function shieldTex(num = '67', name = 'GRILL') {
  return M('shield' + num + name, () => canvasTex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); const sh = () => { x.beginPath(); x.moveTo(30, 40); x.quadraticCurveTo(128, 0, 226, 40); x.lineTo(226, 120); x.quadraticCurveTo(226, 210, 128, 250); x.quadraticCurveTo(30, 210, 30, 120); x.closePath(); };
    x.fillStyle = '#fff'; sh(); x.fill(); x.save(); x.translate(128, 132); x.scale(0.9, 0.9); x.translate(-128, -132); x.fillStyle = '#c8102e'; sh(); x.fill(); x.restore();
    x.fillStyle = '#1a3f8a'; x.fillRect(46, 46, 164, 34); x.fillStyle = '#fff'; x.font = "bold 26px 'Black Ops One'"; x.textAlign = 'center'; x.fillText('ARKANSAS', 128, 72);
    x.font = "bold 92px 'Black Ops One'"; x.fillText(num, 128, 170); x.font = "bold 30px 'Black Ops One'"; x.fillText(name, 128, 214); }));
}
export function shieldSign(W, x, y, z, s = 2, ry = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: shieldTex(), transparent: true, roughness: 0.5, emissive: 0xffffff, emissiveMap: shieldTex(), emissiveIntensity: 0.25, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; W.group.add(m); return m; }
// corrugated metal pole barn (open front) like the 67 Grill
export function corrugatedTex(c = '#c8ccd0') { return M('corr' + c, () => canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 32; i++) { const g = x.createLinearGradient(i * 8, 0, i * 8 + 8, 0); g.addColorStop(0, c); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, c); x.fillStyle = g; x.fillRect(i * 8, 0, 8, h); } for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(120,80,40,${rand(0, 0.08)})`; x.fillRect(rand(0, w), rand(0, h), rand(1, 4), rand(4, 20)); } }, { repeat: [1, 1] })); }
export function poleBarn(W, x, z, w, d, h, ry = 0) {
  const cm = texMat('corrM', corrugatedTex()); const fx = Math.sin(ry), fz = Math.cos(ry), rx = Math.cos(ry), rz = -Math.sin(ry);
  // back + sides (front open)
  W.box(x - fx * d / 2, 0, z - fz * d / 2, w, h, 0.15, cm, { ry, tile: 3 });
  for (const s of [-1, 1]) W.box(x + rx * s * w / 2, 0, z + rz * s * w / 2, 0.15, h, d, cm, { ry, tile: 3 });
  // gable roof
  for (const s of [-1, 1]) { const roof = new THREE.Mesh(new THREE.BoxGeometry(w / 2 / Math.cos(0.32) + 0.3, 0.08, d + 0.6), cm); roof.position.set(x + rx * s * w / 4, h + w / 4 * Math.tan(0.32), z + rz * s * w / 4); roof.rotation.set(0, ry, 0); roof.rotateZ(-s * 0.32); roof.castShadow = true; W.group.add(roof); }
  const gab = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, w / 2 * Math.tan(0.32))]); const gg = new THREE.ShapeGeometry(gab); const gm = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ map: corrugatedTex(), side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 })); gm.position.set(x + fx * d / 2, h, z + fz * d / 2); gm.rotation.y = ry; W.group.add(gm);
  // posts + red rail
  for (let i = 0; i <= 4; i++) { const t = -w / 2 + i * w / 4; W.cyl(x + rx * t + fx * d / 2, 0, z + rz * t + fz * d / 2, 0.12, 0.12, h, texMat('postw', T.wood('#6a4a2a')), { collide: true, seg: 6 }); }
  W.box(x + fx * d / 2, 0.9, z + fz * d / 2, w * 0.35, 0.1, 0.1, col('#9a1a1a'), { ry, collide: false }); 
  return { front: { x: x + fx * d / 2, z: z + fz * d / 2 } };
}
// ---------- mine ----------
export function mineTimber(W, x, z, ry, w = 4, h = 3.4) { const wm = texMat('timber', T.wood('#5a3a1e')); const rx = Math.cos(ry), rz = -Math.sin(ry); for (const s of [-1, 1]) W.box(x + rx * s * (w / 2 - 0.15), 0, z + rz * s * (w / 2 - 0.15), 0.3, h, 0.3, wm, { ry }); W.box(x, h, z, w, 0.35, 0.35, wm, { ry, collide: false }); }
export function lantern(W, x, y, z, flicker = true) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.25, 8), std('lantern', { color: 0xffc860, emissive: 0xffa030, emissiveIntensity: 2.5 })); m.position.set(x, y, z); W.group.add(m); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb050, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(1.6, 1.6, 1); s.position.copy(m.position); W.group.add(s); return W.pointLight(x, y - 0.1, z, 0xffa850, 9, 12, { flicker: false }); }
export function rails(W, x0, z0, x1, z1) { const L = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0); const tm = texMat('tie', T.wood('#4a3020')); const n = Math.floor(L / 0.7); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; W.box(x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t, 0.22, 0.08, 1.4, tm, { ry, collide: false, cast: false }); } for (const s of [-0.5, 0.5]) { const nx = Math.sin(-ry) * 0, ox = -Math.sin(ry + Math.PI / 2) * 0; W.box((x0 + x1) / 2 + Math.sin(ry) * s * 0 - Math.sin(-ry + Math.PI / 2) * 0, 0.08, (z0 + z1) / 2, L, 0.07, 0.07, metal('#6a6a70'), { ry, collide: false }); } }
export function oreCart(W, x, z, ry = 0, gold = true) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.5), metal('#4a3a30')); b.position.y = 0.6; g.add(b); for (const sx of [-0.45, 0.45]) for (const sz of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10), metal('#222')); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.22, sz); g.add(w); } if (gold) for (let i = 0; i < 6; i++) { const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), goldMat()); n.position.set(rand(-.3, .3), 0.98, rand(-.5, .5)); g.add(n); } g.position.set(x, 0, z); g.rotation.y = ry; W.add(g, { collide: true }); return g; }
let _gold; export function goldMat() { return _gold || (_gold = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 1, roughness: 0.22, emissive: 0x3a2400, emissiveIntensity: 0.6 })); }
// ---------- ambient particles: dust motes / fireflies / embers / snow ----------
export function ambient(W, o) {
  const { n = 260, color = '#fff6e0', size = 0.05, area = 30, h = 6, drift = [0.1, 0.05, 0.05], kind = 'dust' } = o;
  const g = new THREE.BufferGeometry(); const p = new Float32Array(n * 3), ph = new Float32Array(n); for (let i = 0; i < n; i++) { p[i * 3] = rand(-area, area); p[i * 3 + 1] = rand(0.2, h); p[i * 3 + 2] = rand(-area, area); ph[i] = rand(0, 6.28); } g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ color, size, map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: kind === 'fly' ? 0.9 : 0.55, sizeAttenuation: true });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; W.group.add(pts);
  W.updaters.push((dt, t) => { const c = W.camRef; for (let i = 0; i < n; i++) { let x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2]; x += (drift[0] + Math.sin(t * 0.7 + ph[i]) * 0.15) * dt; y += (drift[1] * Math.sin(t + ph[i]) + (kind === 'ember' ? 0.6 : 0)) * dt; z += (drift[2] + Math.cos(t * 0.6 + ph[i]) * 0.15) * dt; if (c) { if (x - c.position.x > area) x -= area * 2; if (x - c.position.x < -area) x += area * 2; if (z - c.position.z > area) z -= area * 2; if (z - c.position.z < -area) z += area * 2; } if (y > h) y = 0.2; p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; } g.attributes.position.needsUpdate = true; if (kind === 'fly') m.opacity = 0.6 + Math.sin(t * 3) * 0.3; });
  return pts;
}
// ---------- pickups visuals for new types ----------
export function columbine(scale = 1) { // Colorado blue columbine: 5 blue-violet sepals, white petals, yellow centre
  const g = new THREE.Group(); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.5, 5), std('stem', { color: 0x3a7a2a })); stem.position.y = 0.25; g.add(stem);
  const sep = std('colSep', { color: 0x5a7ae8, roughness: 0.5, emissive: 0x1a2a80, emissiveIntensity: 0.5, side: THREE.DoubleSide }), pet = std('colPet', { color: 0xf8f8ff, roughness: 0.5, side: THREE.DoubleSide }), cen = std('colCen', { color: 0xffd23a, emissive: 0x806000, emissiveIntensity: 0.6 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const s = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.17, 4), sep); s.position.set(Math.cos(a) * 0.08, 0.52, Math.sin(a) * 0.08); s.rotation.set(0, -a, 0); s.rotateZ(-1.2); g.add(s); const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), pet); p.scale.set(1, 0.6, 1.6); p.position.set(Math.cos(a + 0.6) * 0.04, 0.54, Math.sin(a + 0.6) * 0.04); g.add(p); }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), cen); c.position.y = 0.55; g.add(c); g.scale.setScalar(scale * 1.6); return g;
}
export function goldBar() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.16), goldMat()); b.position.y = 0.12; g.add(b); const b2 = b.clone(); b2.position.set(0.05, 0.22, 0.02); b2.rotation.y = 0.4; g.add(b2); return g; }
export function relic(kind) { // story items: brooch, girdle, necklace
  const g = new THREE.Group();
  if (kind === 'brooch') { const r = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 20), goldMat()); r.position.y = 0.4; g.add(r); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), std('ruby', { color: 0xc8102e, emissive: 0x500010, roughness: 0.1, metalness: 0.3 })); gem.position.y = 0.4; g.add(gem); }
  else if (kind === 'girdle') { const gd = girdle(); gd.position.y = 0.12; g.add(gd); }
  else { const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 32), metal('#e8e8f0')); r.position.y = 0.42; g.add(r); const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), new THREE.MeshStandardMaterial({ color: 0xeaf6ff, roughness: 0.02, metalness: 0.2, emissive: 0x6080a0, emissiveIntensity: 0.6 })); d.position.y = 0.26; g.add(d); }
  return g;
}

// Kayleigh's lucky push-up girdle: blush satin high-waist shapewear, hourglass lathe, panel seams, scalloped lace trim, little bow.
function girdleTex() { return canvasTex(256, 256, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, w, 0); for (let i = 0; i <= 8; i++) gr.addColorStop(i / 8, i % 2 ? '#f2b8b8' : '#fbd2cc'); x.fillStyle = gr; x.fillRect(0, 0, w, h); // satin sheen bands
  x.strokeStyle = 'rgba(150,70,80,.55)'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { const px = (i + 0.5) * w / 8; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px - 6, h * 0.4, px + 6, h * 0.6, px, h); x.stroke(); } x.setLineDash([]);
  x.fillStyle = 'rgba(255,255,255,.35)'; for (let y of [10, h - 22]) for (let i = 0; i < 32; i++) { x.beginPath(); x.arc(i * 8 + 4, y + 6, 4, 0, 7); x.fill(); } // lace band pattern
  x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1; for (let i = 0; i < 40; i++) { const px = Math.random() * w, py = Math.random() < 0.5 ? Math.random() * 30 : h - Math.random() * 30; x.beginPath(); x.arc(px, py, 3, 0, 7); x.stroke(); }
}); }
export function girdle(scale = 1) {
  const g = new THREE.Group();
  const prof = [[0.15, 0.0], [0.163, 0.04], [0.15, 0.1], [0.11, 0.18], [0.092, 0.215], [0.105, 0.26], [0.122, 0.3], [0.125, 0.32]].map(p => new THREE.Vector2(p[0], p[1]));
  const geo = new THREE.LatheGeometry(prof, 40); geo.scale(1, 1, 0.72);
  const satin = new THREE.MeshPhysicalMaterial({ map: girdleTex(), roughness: 0.32, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.25, sheen: 1, sheenColor: new THREE.Color(0xffe0e8), side: THREE.DoubleSide, emissive: 0x401818, emissiveIntensity: 0.25 });
  const body = new THREE.Mesh(geo, satin); g.add(body);
  // leg openings: two gentle bumps at the bottom so it reads as briefs, not a tube
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), satin); leg.scale.set(1, 0.55, 0.85); leg.position.set(sx * 0.062, 0.012, 0); g.add(leg); }
  const lace = new THREE.MeshStandardMaterial({ color: 0xf4dde2, roughness: 0.8 });
  for (const [y, r] of [[0.322, 0.125], [0.006, 0.15]]) for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; const sc = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), lace); sc.scale.set(1.2, y > 0.1 ? 1.2 : -1.2, 0.5); sc.position.set(Math.cos(a) * r, y, Math.sin(a) * r * 0.72); sc.rotation.y = -a + Math.PI / 2; g.add(sc); }
  const bowM = new THREE.MeshStandardMaterial({ color: 0xe0607a, roughness: 0.35, emissive: 0x401020 });
  const bow = new THREE.Group(); for (const sx of [-1, 1]) { const loop = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.045, 10), bowM); loop.rotation.z = sx * Math.PI / 2; loop.position.x = sx * 0.024; loop.scale.z = 0.4; bow.add(loop); const tail = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.035, 0.003), bowM); tail.position.set(sx * 0.008, -0.022, 0); tail.rotation.z = sx * 0.3; bow.add(tail); }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), bowM); bow.add(knot); bow.position.set(0, 0.3, 0.096); g.add(bow);
  // garter straps with little clips + front lace panel
  const strap = new THREE.MeshStandardMaterial({ color: 0xe88aa0, roughness: 0.4 }), clip = new THREE.MeshStandardMaterial({ color: 0xd8d8e0, metalness: 0.9, roughness: 0.25 });
  for (const a of [0.55, 1.15, Math.PI - 1.15, Math.PI - 0.55]) { const x = Math.cos(a) * 0.15, zz = Math.sin(a) * 0.15 * 0.72; const st = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.12, 0.004), strap); st.position.set(x, -0.06, zz); st.rotation.y = -a + Math.PI / 2; g.add(st); const c = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.018, 0.01), clip); c.position.set(x, -0.125, zz); c.rotation.y = -a + Math.PI / 2; g.add(c); }
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.22), new THREE.MeshStandardMaterial({ map: laceTex(), transparent: true, roughness: 0.8, depthWrite: false })); panel.position.set(0, 0.16, 0.1 * 0.72 + 0.006); g.add(panel);
  if (scale !== 1.04) { // little satin hanger on top so it reads as a garment
    const hk = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.005, 6, 16, Math.PI * 1.3), clip); hk.position.set(0, 0.43, 0); hk.rotation.z = -0.3; g.add(hk);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0xf0c0d0, roughness: 0.5 })); bar.rotation.z = Math.PI / 2; bar.position.y = 0.39; g.add(bar);
    for (const sx of [-1, 1]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.075, 0.004), strap); sp.position.set(sx * 0.07, 0.355, 0); sp.rotation.z = sx * 0.25; g.add(sp); } }
  g.scale.setScalar(scale); return g;
}
function laceTex() { return canvasTex(64, 192, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(255,240,245,.9)'; x.lineWidth = 2; for (let y = 6; y < h; y += 12) for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(10 + i * 22, y, 6, 0, 7); x.stroke(); } x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(0, 0, w, h); }); }
export function dressForm(scale = 1) { // tailor's dummy wearing the girdle (cutscene prop)
  const g = new THREE.Group(); const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.6 }), linen = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 8), wood); pole.position.y = 0.375; g.add(pole); for (let i = 0; i < 3; i++) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.25), wood); leg.rotation.y = i * 2.09; leg.position.set(Math.sin(i * 2.09) * 0.11, 0.01, Math.cos(i * 2.09) * 0.11); g.add(leg); }
  const torso = new THREE.Mesh(new THREE.LatheGeometry([[0.0, 0], [0.13, 0.0], [0.12, 0.1], [0.095, 0.2], [0.12, 0.33], [0.14, 0.42], [0.1, 0.5], [0.04, 0.53], [0, 0.53]].map(p => new THREE.Vector2(p[0], p[1])), 28), linen); torso.scale.z = 0.72; torso.position.y = 0.72; g.add(torso);
  const gd = girdle(1.04); gd.position.y = 0.7; g.add(gd); g.scale.setScalar(scale); return g;
}
