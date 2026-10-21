// 67 GRILL interior (from Anton's photos): gray walls, ARKANSAS 67 marquee mural + script "Grill" + EST 2015,
// white string lights, pressed-tin ceiling, ceiling fans, cable-spool tables w/ black high-back chairs & stools,
// red tufted booth under white shiplap, painted window frames (navy/red/yellow), galvanized barn lamps, vintage
// portraits, bar w/ liquor shelves + gold chandeliers + neon beer signs + Coca-Cola sign, curved staircase with a
// navy balcony band, TV with football. Chairs & stools are physics props that zombies and blasts send flying.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { std, texMat, T, M } from './world.js';
import { canvasTex, rand } from './util.js';

const HW = 11, HD = 12, H = 5.6;
const gray = () => texMat('grillWall', T.paint('#8f9396'));
function muralTex() {
  return M('muralTex', () => canvasTex(1024, 1024, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    // red ribbon / arrow swooping around the shield
    x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#c8102e'; x.lineWidth = 150;
    x.beginPath(); x.moveTo(640, 140); x.bezierCurveTo(900, 150, 920, 470, 760, 600); x.bezierCurveTo(600, 730, 330, 700, 260, 560); x.bezierCurveTo(200, 430, 240, 230, 380, 170); x.stroke();
    x.fillStyle = '#c8102e'; x.beginPath(); x.moveTo(260, 520); x.lineTo(200, 900); x.lineTo(420, 640); x.closePath(); x.fill();
    x.strokeStyle = '#8a0a1e'; x.lineWidth = 10; x.beginPath(); x.moveTo(640, 140); x.bezierCurveTo(900, 150, 920, 470, 760, 600); x.stroke();
    // marquee bulbs
    const pts = []; const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
    for (let t = 0; t < 1; t += 0.085) pts.push(bez([640, 140], [900, 150], [920, 470], [760, 600], t));
    for (let t = 0; t < 1; t += 0.11) pts.push(bez([760, 600], [600, 730], [330, 700], [260, 560], t));
    for (let t = 0; t < 1; t += 0.12) pts.push(bez([260, 560], [200, 430], [240, 230], [380, 170], t));
    for (let t = 0.15; t < 1; t += 0.22) pts.push([260 + (200 - 260) * t, 560 + (880 - 560) * t]);
    for (const [px, py] of pts) { const g = x.createRadialGradient(px, py, 2, px, py, 28); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.5, '#ffd83a'); g.addColorStop(1, 'rgba(255,200,40,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, 28, 0, 7); x.fill(); }
    // shield
    const sh = (s) => { x.save(); x.translate(560, 380); x.scale(s, s); x.beginPath(); x.moveTo(-190, -200); x.quadraticCurveTo(0, -250, 190, -200); x.lineTo(190, 0); x.quadraticCurveTo(190, 190, 0, 260); x.quadraticCurveTo(-190, 190, -190, 0); x.closePath(); x.restore(); };
    x.fillStyle = '#111'; sh(1.04); x.fill(); x.fillStyle = '#ffffff'; sh(0.98); x.fill(); x.strokeStyle = '#111'; x.lineWidth = 8; sh(0.9); x.stroke();
    x.fillStyle = '#111'; x.textAlign = 'center'; x.font = "bold 58px 'Black Ops One', Impact, sans-serif"; x.fillText('ARKANSAS', 560, 255);
    x.font = "bold 250px 'Black Ops One', Impact, sans-serif"; x.fillText('67', 560, 510);
    // script Grill
    x.save(); x.translate(720, 690); x.rotate(-0.12); x.font = "italic bold 190px 'Brush Script MT', 'Segoe Script', cursive, serif"; x.lineWidth = 26; x.strokeStyle = '#ffffff'; x.strokeText('Grill', 0, 0); x.fillStyle = '#111'; x.fillText('Grill', 0, 0); x.restore();
    x.fillStyle = '#2a2a2a'; x.font = "bold 46px Georgia, serif"; x.fillText('EST 2015', 600, 900);
  }));
}
function tinTex() { return M('tinTex', () => canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d8d6cc'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const cx = i * 128 + 64, cy = j * 128 + 64; x.strokeStyle = 'rgba(90,85,70,.55)'; x.lineWidth = 4; x.strokeRect(cx - 60, cy - 60, 120, 120); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; x.strokeRect(cx - 52, cy - 52, 104, 104); x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.stroke(); x.strokeStyle = 'rgba(90,85,70,.5)'; x.beginPath(); x.arc(cx, cy, 18, 0, 7); x.stroke(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32); x.lineTo(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50); x.stroke(); } } }, { repeat: [1, 1] })); }
function shiplapTex() { return M('shipTex', () => canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 8; i++) x.fillRect(0, i * 16, w, 2); }, { repeat: [1, 1] })); }
function tuftTex() { return M('tuftTex', () => canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#c4161c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const g = x.createRadialGradient(i * 32 + 16, j * 32 + 16, 1, i * 32 + 16, j * 32 + 16, 14); g.addColorStop(0, '#5a0408'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(i * 32, j * 32, 32, 32); } x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(0, 0, w, 6); }, { repeat: [1, 1] })); }
function spoolTex() { return M('spoolTex', () => canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#3a2a1e'; x.fillRect(0, 0, w, h); for (let r = 6; r < 128; r += rand(4, 9)) { x.strokeStyle = `rgba(${rand(80, 120)},${rand(60, 85)},${rand(40, 60)},.6)`; x.lineWidth = rand(1, 3); x.beginPath(); x.arc(128, 128, r, 0, 7); x.stroke(); } for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 20 + i * 42); x.lineTo(w, 20 + i * 42); x.stroke(); } })); }
function tvTex() { return M('tvTex', () => canvasTex(512, 288, (x, w, h) => { x.fillStyle = '#2f8a3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a9a44'; for (let i = 0; i < 10; i += 2) x.fillRect(i * 52, 0, 52, h); x.strokeStyle = '#fff'; x.lineWidth = 3; for (let i = 0; i <= 10; i++) { x.beginPath(); x.moveTo(i * 52, 40); x.lineTo(i * 52 - 30, h); x.stroke(); } const team = (c, n, ox) => { for (let i = 0; i < n; i++) { x.fillStyle = c; x.fillRect(ox + rand(-60, 60), rand(70, 240), 8, 16); } }; team('#c8102e', 11, 200); team('#ffffff', 11, 300); x.fillStyle = 'rgba(0,0,0,.75)'; x.fillRect(0, 0, w, 34); x.fillStyle = '#fff'; x.font = 'bold 22px sans-serif'; x.fillText('HOGS 21  ZOMBIES 999   4TH  0:07', 14, 25); x.fillStyle = '#c8102e'; x.fillRect(w - 70, 4, 60, 26); x.fillStyle = '#fff'; x.fillText('LIVE', w - 62, 25); })); }
function portraitTex(i) { return M('portrait' + i, () => canvasTex(96, 128, (x, w, h) => { x.fillStyle = '#c8a860'; x.fillRect(0, 0, w, h); x.fillStyle = '#7a5a20'; x.fillRect(4, 4, w - 8, h - 8); const g = x.createRadialGradient(48, 60, 6, 48, 60, 60); g.addColorStop(0, '#d8d0c0'); g.addColorStop(1, '#6a6458'); x.fillStyle = g; x.fillRect(10, 10, w - 20, h - 20); x.fillStyle = '#2a2622'; x.beginPath(); x.ellipse(48, 52, 15, 19, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(48, 112, 30, 34, 0, Math.PI, 0); x.fill(); x.fillStyle = '#b8ae9c'; x.beginPath(); x.ellipse(48, 56, 11, 14, 0, 0, 7); x.fill(); if (i % 2) { x.fillStyle = '#2a2622'; x.fillRect(38, 34, 20, 10); } })); }
function bulbMat() { return M('grillBulb', () => new THREE.MeshBasicMaterial({ color: 0xfff6e0, toneMapped: false })); }
const blackM = () => std('chairBlack', { color: 0x111214, roughness: 0.55 });

// ---------- props: chairs / stools (merged single-mesh geometry, physics-driven) ----------
let _chairG, _stoolG;
function chairGeo(stool) {
  const parts = []; const b = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); parts.push(g); };
  const sy = stool ? 0.76 : 0.46, top = stool ? 1.32 : 1.02;
  b(0.44, 0.07, 0.42, 0, sy, 0);
  for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) b(0.04, sy, 0.04, lx, sy / 2, lz);
  if (stool) { b(0.38, 0.03, 0.03, 0, 0.3, 0.18); b(0.38, 0.03, 0.03, 0, 0.3, -0.18); }
  for (const lx of [-0.19, 0.19]) b(0.045, top - sy, 0.04, lx, (top + sy) / 2, 0.2);
  b(0.42, 0.07, 0.035, 0, top - 0.05, 0.2); b(0.42, 0.05, 0.03, 0, top - 0.25, 0.2); b(0.42, 0.04, 0.03, 0, sy + 0.18, 0.2);
  const g = mergeGeometries(parts.map(p => p.toNonIndexed())); parts.forEach(p => p.dispose()); return g;
}
function addChair(W, x, z, ry, stool) {
  const g = stool ? (_stoolG || (_stoolG = chairGeo(true))) : (_chairG || (_chairG = chairGeo(false)));
  const m = new THREE.Mesh(g, blackM()); m.position.set(x, 0, z); m.rotation.y = ry; m.castShadow = false; m.receiveShadow = false; W.group.add(m);
  (W.props || (W.props = [])).push({ m, v: new THREE.Vector3(), av: new THREE.Vector3(), cd: 0, r: 0.3, moving: false, stool });
}
export function updateProps(W, dt, actors) {
  if (!W.props) return; const b = W.propBox;
  for (const p of W.props) {
    const m = p.m; p.cd -= dt;
    if (p.cd <= 0) for (const a of actors) { const dx = m.position.x - a.x, dz = m.position.z - a.z, d = Math.hypot(dx, dz); if (d < p.r + a.r && m.position.y < 1.2) { const s = a.k || 3; p.v.set(dx / (d || 1) * s * rand(0.8, 1.3), s * rand(0.35, 0.7), dz / (d || 1) * s * rand(0.8, 1.3)); p.av.set(rand(-6, 6), rand(-5, 5), rand(-6, 6)); p.moving = true; p.cd = 0.6; break; } }
    if (!p.moving) continue;
    p.v.y -= 14 * dt; m.position.addScaledVector(p.v, dt); m.rotation.x += p.av.x * dt; m.rotation.y += p.av.y * dt; m.rotation.z += p.av.z * dt;
    if (b) { if (m.position.x < b.minX || m.position.x > b.maxX) { p.v.x *= -0.5; m.position.x = Math.max(b.minX, Math.min(b.maxX, m.position.x)); } if (m.position.z < b.minZ || m.position.z > b.maxZ) { p.v.z *= -0.5; m.position.z = Math.max(b.minZ, Math.min(b.maxZ, m.position.z)); } if (m.position.y > b.maxY) { m.position.y = b.maxY; p.v.y *= -0.3; } }
    if (m.position.y <= 0) { m.position.y = 0; if (Math.abs(p.v.y) < 1.2 && Math.hypot(p.v.x, p.v.z) < 0.6) { p.moving = false; p.v.set(0, 0, 0); // settle: tipped on its side or upright
        const tip = Math.abs(Math.sin(m.rotation.x)) + Math.abs(Math.sin(m.rotation.z)) > 0.7; m.rotation.x = tip ? Math.PI / 2 * Math.sign(Math.sin(m.rotation.x) || 1) : 0; m.rotation.z = 0; m.position.y = tip ? 0.2 : 0; }
      else { p.v.y *= -0.32; p.v.x *= 0.6; p.v.z *= 0.6; p.av.multiplyScalar(0.6); } }
  }
}
export function propBlast(W, at, r, power = 10) {
  if (!W || !W.props) return; for (const p of W.props) { const dx = p.m.position.x - at.x, dz = p.m.position.z - at.z, d = Math.hypot(dx, dz); if (d > r) continue; const k = power * (1 - d / r * 0.6); p.v.set(dx / (d || 1) * k, k * rand(0.5, 0.9), dz / (d || 1) * k); p.av.set(rand(-12, 12), rand(-10, 10), rand(-12, 12)); p.moving = true; p.cd = 0.4; }
}

// ---------- the room ----------
export function grillInterior(W, cx, cz, o = {}) {
  const P = (x, z) => [cx + x, cz + z];
  const wallM = gray(); const woodD = texMat('grillWoodD', T.wood('#4a3424')); const woodL = texMat('grillWoodL', T.wood('#a8743e'));
  const navy = std('grillNavy', { color: 0x1f3550, roughness: 0.6 }), redP = std('grillRed', { color: 0xc8202a, roughness: 0.6 }), yel = std('grillYel', { color: 0xe8b828, roughness: 0.6 });
  const galv = std('galv', { color: 0xb8bcc0, metalness: 0.85, roughness: 0.35 }), gold = std('grillGold', { color: 0xd8a830, metalness: 1, roughness: 0.25, emissive: 0x3a2400 });
  const nc = { cast: false };
  // floor (stained concrete) + ceiling (pressed tin)
  W.floor(cx - HW, cx + HW, cz - HD, cz + HD, texMat('grillFloor', T.concrete('#5a4a3e')), 3, 0.004);
  W.box(cx, H, cz, HW * 2, 0.12, HD * 2, texMat('grillTin', tinTex()), { tile: 1.2, collide: false, cast: false });
  // walls (front has a 4.4 m doorway when used in the level)
  W.box(cx, 0, cz - HD, HW * 2, H, 0.3, wallM, { tile: 3, ...nc });
  W.box(cx - HW, 0, cz, 0.3, H, HD * 2, wallM, { tile: 3, ...nc }); W.box(cx + HW, 0, cz, 0.3, H, HD * 2, wallM, { tile: 3, ...nc });
  if (o.door) { const g = 2.2; W.box(cx - (HW + g) / 2, 0, cz + HD, HW - g, H, 0.3, wallM, { tile: 3, ...nc }); W.box(cx + (HW + g) / 2, 0, cz + HD, HW - g, H, 0.3, wallM, { tile: 3, ...nc }); W.box(cx, 3.2, cz + HD, g * 2, H - 3.2, 0.3, wallM, { tile: 3, ...nc }); }
  else W.box(cx, 0, cz + HD, HW * 2, H, 0.3, wallM, { tile: 3, ...nc });
  W.box(cx, 0, cz - HD + 0.16, HW * 2, 0.15, 0.04, std('baseb', { color: 0x2a2a2a }), { collide: false, cast: false });
  // exposed duct along the ceiling
  W.cyl(cx + 4, H - 0.5, cz, 0.28, 0.28, HD * 2 - 1, galv, { rx: Math.PI / 2, seg: 10, cast: false });
  // ── WEST wall: the big ARKANSAS 67 mural, painted window frames, barn lamps, portraits (photo 1)
  const mural = (x, y, z, s, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: muralTex(), transparent: true, roughness: 0.8, emissive: 0xffffff, emissiveMap: muralTex(), emissiveIntensity: 0.18 })); m.position.set(x, y, z); m.rotation.y = ry; W.group.add(m); };
  mural(cx - HW + 0.17, 3.7, cz - 1, 3.6, Math.PI / 2);
  const frameWin = (x, z, ry, mat) => { const ax = Math.cos(ry), az = -Math.sin(ry); const fw = 1.7, fh = 1.5, y = 0.95; const pane = std('pane', { color: 0xe8d8a8, roughness: 0.3, emissive: 0x3a3020 });
    W.box(x, y, z, ry ? 0.04 : fw, fh, ry ? fw : 0.04, pane, { collide: false, cast: false });
    for (const t of [-fw / 2, -fw / 6, fw / 6, fw / 2]) W.box(x + ax * t, y, z + az * t, ry ? 0.08 : 0.07, fh, ry ? 0.07 : 0.08, mat, { collide: false, cast: false });
    for (const hy of [0, fh / 2, fh]) W.box(x, y + hy - 0.035, z, ry ? 0.08 : fw + 0.07, 0.07, ry ? fw + 0.07 : 0.08, mat, { collide: false, cast: false }); };
  const lamp = (x, y, z, ry) => { const ox = Math.sin(ry) * 0.35, oz = Math.cos(ry) * 0.35; W.box(x + ox / 2, y + 0.3, z + oz / 2, ry ? 0.35 : 0.04, 0.04, ry ? 0.04 : 0.35, galv, { collide: false, ry, cast: false }); W.cyl(x + ox, y, z + oz, 0.06, 0.26, 0.22, galv, { open: true, seg: 14, cast: false }); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), bulbMat()); bl.position.set(x + ox, y + 0.03, z + oz); W.group.add(bl); };
  const portrait = (x, y, z, ry, i) => W.sign([''], x, y, z, 0.5, 0.66, { ry }) && (() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66), new THREE.MeshStandardMaterial({ map: portraitTex(i), roughness: 0.6 })); m.position.set(x + Math.sin(ry) * 0.02, y, z + Math.cos(ry) * 0.02); m.rotation.y = ry; W.group.add(m); })();
  const wx = cx - HW + 0.2;
  [[navy, 4.5], [redP, 0.2], [yel, -4.2], [navy, -8.4]].forEach(([mat, dz], i) => { frameWin(wx, cz + dz, Math.PI / 2, mat); lamp(wx - 0.02, 2.8, cz + dz, Math.PI / 2); if (i < 3) portrait(wx, 1.75, cz + dz - 2.1, Math.PI / 2, i); });
  // ── BACK wall: second mural + EST 2015 on the left, red tufted booth under white shiplap, TV with football (photo 2)
  const bz = cz - HD + 0.17;
  mural(cx - 6, 3.0, bz + 0.01, 2.6, 0);
  W.box(cx + 3, 1.0, bz + 0.05, 12, 1.4, 0.06, texMat('shipM', shiplapTex()), { tile: 1, collide: false, cast: false });
  W.box(cx + 3, 0, bz + 0.35, 12, 0.48, 0.6, std('boothBase', { color: 0xece8de }), { kind: 'low' });
  W.box(cx + 3, 0.48, bz + 0.35, 12, 0.12, 0.6, texMat('tuftSeat', tuftTex()), { tile: 0.6, collide: false, cast: false });
  W.box(cx + 3, 0.58, bz + 0.1, 12, 0.5, 0.15, texMat('tuftBack', tuftTex()), { tile: 0.5, collide: false, cast: false });
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.24), new THREE.MeshBasicMaterial({ map: tvTex(), toneMapped: false })); tv.position.set(cx + 4.5, 3.5, bz + 0.07); W.group.add(tv);
  W.box(cx + 4.5, 2.84, bz + 0.03, 2.34, 1.36, 0.05, blackM(), { collide: false, cast: false });
  W.updaters.push((dt, t) => { const tt = tvTex(); tt.offset.x = Math.sin(t * 0.3) * 0.02; });
  // ── EAST side: the bar (photo 3)
  const barX = cx + HW - 3.0;
  W.box(barX, 0, cz - 2, 0.7, 1.1, 13, woodD, { tile: 1 }); W.box(barX, 1.1, cz - 2, 0.9, 0.07, 13.2, texMat('barTop', T.wood('#5a3a26')), { collide: false });
  W.box(barX + 0.36, 0.12, cz - 2, 0.06, 0.06, 13, gold, { collide: false, cast: false });
  for (let k = 0; k < 6; k++) addChair(W, barX - 0.6, cz - 7.5 + k * 2.1, -Math.PI / 2, true);
  const shX = cx + HW - 0.45;
  for (const y of [1.3, 1.85, 2.4]) W.box(shX, y, cz - 2, 0.4, 0.05, 10, woodL, { collide: false, cast: false });
  W.box(shX + 0.12, 1.2, cz - 2, 0.1, 1.5, 10.2, std('barMirror', { color: 0x6a7480, metalness: 0.9, roughness: 0.15 }), { collide: false, cast: false });
  // bottles: one instanced mesh
  const bc = [0x7a3a10, 0x2a6a2a, 0xd8d0b8, 0x3a1a08, 0x8a1a1a, 0x2a4a8a, 0xc8901a];
  const bg = new THREE.CylinderGeometry(0.045, 0.05, 0.3, 7); const bm = new THREE.InstancedMesh(bg, new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 }), 90); const mx = new THREE.Matrix4(); const cc = new THREE.Color(); let n = 0;
  for (const y of [1.3, 1.85, 2.4]) for (let z = -6.8; z < 2.8 && n < 90; z += 0.33) { mx.makeTranslation(shX - 0.05, y + 0.18, cz + z + rand(-0.05, 0.05)); bm.setMatrixAt(n, mx); bm.setColorAt(n, cc.setHex(bc[n % bc.length])); n++; }
  bm.count = n; W.group.add(bm);
  // neon + Coca-Cola signs above the bar, beer signs
  W.sign(['Coca-Cola'], cx + HW - 0.18, 3.6, cz - 6.5, 1.8, 0.8, { ry: -Math.PI / 2, bg: '#d8101e', fg: '#ffffff', box: 0.05 });
  W.sign(['ICE COLD', 'LAGER'], cx + HW - 0.2, 3.4, cz - 2.6, 1.6, 0.8, { ry: -Math.PI / 2, bg: '#0a0a12', colors: ['#ff4a8a', '#ffd84a'], neon: 2.0 });
  W.sign(['LITE-ISH'], cx + HW - 0.2, 3.5, cz + 1.0, 1.3, 0.55, { ry: -Math.PI / 2, bg: '#06060c', fg: '#4ab8ff', neon: 2.0 });
  W.sign(['RAZORCRACK ALE'], cx + HW - 0.2, 4.4, cz - 0.8, 2.2, 0.45, { ry: -Math.PI / 2, bg: '#06060c', fg: '#ff3a3a', neon: 2.0 });
  W.sign(['OPEN'], cx + HW - 0.2, 4.3, cz + 3.8, 0.9, 0.4, { ry: -Math.PI / 2, bg: '#06060c', fg: '#ff2a2a', neon: 2.2 });
  // gold chandeliers over the bar
  for (const z of [-6, -1.5, 3]) { const g = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 20), gold); ring.rotation.x = Math.PI / 2; g.add(ring); const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 16), gold); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.35; g.add(ring2); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), gold); stem.position.y = 0.6; g.add(stem);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; const cnd = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6), std('candle', { color: 0xfff4e0 })); cnd.position.set(Math.cos(a) * 0.4, 0.08, Math.sin(a) * 0.4); g.add(cnd); const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), bulbMat()); f.position.set(Math.cos(a) * 0.4, 0.17, Math.sin(a) * 0.4); g.add(f); }
    g.position.set(barX - 0.2, H - 1.4, cz + z); W.group.add(g); }
  // ── FRONT-LEFT: curved wooden staircase up to a navy balcony band (photo 3)
  const sx = cx - HW + 3.2, sz = cz + HD - 3.2;
  for (let k = 0; k < 12; k++) { const a = Math.PI * 0.5 + k * 0.105; const r = 2.4; W.box(sx + Math.cos(a) * r, k * 0.27, sz + Math.sin(a) * r * -1, 1.2, 0.27, 0.5, woodL, { ry: -a + Math.PI / 2, collide: k < 3, kind: 'low', cast: false }); }
  W.box(cx - HW + 1.5, 0, sz, 3.0, 3.25, 2.2 * 2.6, std('stairWall', { color: 0xeeeae2 }), { cast: false });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.1, 32, 1, true, Math.PI * 0.95, Math.PI * 0.55), navy); band.material.side = THREE.DoubleSide; band.position.set(cx - HW + 0.2, 3.85, cz + HD - 0.2); W.group.add(band);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.25, 4.25, 0.14, 32, 1, true, Math.PI * 0.95, Math.PI * 0.55), woodL); rim.material.side = THREE.DoubleSide; rim.position.set(cx - HW + 0.2, 4.45, cz + HD - 0.2); W.group.add(rim);
  W.sign(["WOMEN'S", 'ROOM'], cx - HW + 0.18, 1.8, cz + 4.9, 0.8, 0.5, { ry: Math.PI / 2, bg: '#f2efe6', fg: '#222' });
  // ── cable-spool tables + black high-back chairs (flying props)
  const tables = o.tables || [[-5, 3.5], [-1, -1], [-5.5, -4.5], [-1.2, -6.8], [3.5, 4], [3.2, -2.5], [-3.5, 8], [4.2, -8.6], [1, 8.4], [-6.8, -8.8]];
  for (const [tx, tz] of tables) {
    const [x, z] = P(tx, tz); const r = 0.95;
    W.cyl(x, 0, z, 0.55, 0.55, 0.08, woodD, { seg: 16, cast: false }); W.cyl(x, 0.08, z, 0.35, 0.35, 0.86, woodD, { seg: 12, collide: true, kind: 'low' });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 24), [texMat('spoolSide', T.wood('#3a2a1e')), texMat('spoolTop', spoolTex()), texMat('spoolTop', spoolTex())]); top.position.set(x, 0.98, z); top.receiveShadow = true; W.group.add(top);
    W.collider(x - r * 0.8, x + r * 0.8, z - r * 0.8, z + r * 0.8, 0, 1.0, 'low');
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.18, 8), std('caddy', { color: 0x1a1a1a })); cup.position.set(x, 1.11, z); W.group.add(cup);
    const pt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8), std('ptowel', { color: 0xf4f0e8 })); pt.position.set(x + 0.3, 1.15, z + 0.1); W.group.add(pt);
    const tall = (tx + tz) % 2 !== 0; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; addChair(W, x + Math.cos(a) * 1.25, z + Math.sin(a) * 1.25, -a - Math.PI / 2 + Math.PI, tall); }
  }
  // ── ceiling fans with light kits
  W.fans = []; for (const [fx, fz] of o.fans || [[-4, 3], [-3, -6], [3, 0]]) { const [x, z] = P(fx, fz); W.cyl(x, H - 0.6, z, 0.02, 0.02, 0.6, blackM(), { cast: false }); const g = new THREE.Group(); g.position.set(x, H - 0.65, z); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.16, 12), std('fanHub', { color: 0x8a7a5a, metalness: 0.6, roughness: 0.4 })); g.add(hub); const bmat = texMat('fanBlade', T.wood('#a8743e'));
    for (let k = 0; k < 5; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.16), bmat); const a = k * Math.PI * 2 / 5; bl.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5); bl.rotation.y = -a; g.add(bl); }
    const glb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), std('fanGlobe', { color: 0xfff2d0, emissive: 0xffe0a0, emissiveIntensity: 1.4 })); glb.position.y = -0.18; g.add(glb); W.group.add(g); W.fans.push(g); }
  W.updaters.push(dt => { for (const f of W.fans) f.rotation.y += dt * 3.2; });
  // ── strands of white string lights criss-crossing the room (one instanced mesh, no real lights)
  const strands = []; for (let k = 0; k < 7; k++) { const z = -HD + 1.5 + k * 3.3; strands.push([[-HW + 0.3, z + rand(-1, 1)], [HW - 0.3, z + rand(-1.5, 1.5)]]); } strands.push([[-HW + 0.3, -HD + 1], [HW - 0.3, HD - 1]], [[-HW + 0.3, HD - 3], [HW - 0.3, -HD + 2]]);
  const pts = []; const lineP = [];
  for (const [[x0, z0], [x1, z1]] of strands) { const L = Math.hypot(x1 - x0, z1 - z0); const N = Math.round(L / 0.42); let prev = null; for (let i = 0; i <= N; i++) { const t = i / N; const y = H - 0.25 - Math.sin(t * Math.PI) * 0.75; const p = new THREE.Vector3(cx + x0 + (x1 - x0) * t, y, cz + z0 + (z1 - z0) * t); pts.push(p); if (prev) lineP.push(prev, p); prev = p; } }
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 4), bulbMat(), pts.length); pts.forEach((p, i) => { mx.makeTranslation(p.x, p.y - 0.03, p.z); im.setMatrixAt(i, mx); }); W.group.add(im);
  const lg = new THREE.BufferGeometry().setFromPoints(lineP); W.group.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x222222 })));
  // lighting: a few warm point lights only (phones)
  W.pointLight(cx - 3, H - 1.2, cz + 2, 0xffe2b8, 16, 16); W.pointLight(cx + 5, H - 1.4, cz - 3, 0xffd890, 14, 14); W.pointLight(cx - 2, H - 1.2, cz - 7, 0xffe8c8, 12, 14);
  W.propBox = { minX: cx - HW + 0.4, maxX: cx + HW - 0.4, minZ: cz - HD + 0.4, maxZ: cz + HD - 0.4, maxY: H - 0.4 };
  return { bar: { x: barX, z: cz - 2 }, behindBar: [cx + HW - 2.2, cz - 7.5, cx + HW - 1.0, cz + 3.5], booth: { x: cx + 3, z: bz + 1.3 } };
}
