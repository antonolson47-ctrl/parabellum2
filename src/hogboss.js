// BIG RED, THE RAZORCRACK: zombified plush hog mascot (Scene 1 boss). Built on top of a ZombieBoss skeleton.
import * as THREE from 'three';
import { G } from './state.js';
import { E } from './engine.js';
import { particle, blood, mist, decal } from './fx.js';
import { sfx } from './audio.js';
import { canvasTex, rand, angDiff } from './util.js';
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
let FUR;
function furTex() { return FUR || (FUR = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#c8101e'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = rand(0, 1); x.strokeStyle = v < 0.5 ? 'rgba(120,0,10,.55)' : 'rgba(255,70,80,.4)'; x.lineWidth = rand(0.6, 1.6); const px = rand(0, w), py = rand(0, h), a = rand(1.2, 1.9); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 7, py + Math.sin(a) * 7); x.stroke(); }
  // torn patches: grey rotten skin + blood
  for (let i = 0; i < 9; i++) { const px = rand(0, w), py = rand(0, h), r = rand(8, 20); const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, '#5a6a4a'); g.addColorStop(0.6, '#3a1010'); g.addColorStop(1, 'rgba(60,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
})); }
const furMat = () => new THREE.MeshStandardMaterial({ map: furTex(), roughness: 1, color: 0xffffff });
function along(bone, child, r0, r1, mat, frac = 1, over = 0) { // cylinder from bone to its child, in bone space
  if (!bone || !child) return null; const d = child.position.clone(); const L = d.length() * frac; const g = new THREE.CylinderGeometry(r1, r0, L + over, 12, 3); const pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) { const k = 1 + 0.12 * Math.sin(i * 12.9898) ; pa.setX(i, pa.getX(i) * k); pa.setZ(i, pa.getZ(i) * k); } g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.position.copy(d).normalize().multiplyScalar(L / 2); bone.add(m); m.castShadow = true; return m;
}
function findChild(b, names) { for (const n of names) if (b[n]) return b[n]; return null; }
export function hogify(boss) {
  const z = boss.z, b = z.bones; const fur = furMat();
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.85 }), black = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.6 });
  const head = new THREE.Group(); b.Head.add(head); head.position.set(0, 0.06, 0.02); boss.hogHead = head;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), fur); skull.scale.set(1.05, 1.0, 1.0); head.add(skull);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 20), fur); snout.rotation.x = Math.PI / 2; snout.position.set(0, -0.05, 0.2); head.add(snout);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0xb00c18, roughness: 0.8 })); disc.rotation.x = Math.PI / 2; disc.position.set(0, -0.05, 0.285); head.add(disc);
  for (const sx of [-1, 1]) {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), black); n.scale.z = 0.4; n.position.set(sx * 0.038, -0.05, 0.296); head.add(n);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), fur); ear.position.set(sx * 0.15, 0.17, -0.02); ear.rotation.set(-0.2, 0, -sx * 0.7); head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4, emissive: 0x300000 })); eye.scale.z = 0.5; eye.position.set(sx * 0.075, 0.05, 0.165); head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff2a10, toneMapped: false })); pupil.position.set(sx * 0.07, 0.04, 0.195); head.add(pupil);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.03), black); brow.position.set(sx * 0.07, 0.11, 0.18); brow.rotation.z = sx * 0.45; head.add(brow);
    const tusk = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 14, Math.PI * 0.7), new THREE.MeshStandardMaterial({ color: 0xf4efe0, roughness: 0.35 })); tusk.position.set(sx * 0.1, -0.1, 0.17); tusk.rotation.set(0, sx * 0.5, sx > 0 ? 0.3 : Math.PI - 0.3); head.add(tusk);
  }
  const glow = new THREE.PointLight(0xff2a10, 3, 4, 2); glow.position.set(0, 0.05, 0.3); head.add(glow);
  for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.03, rand(0.1, 0.17), 5), fur); c.position.set(rand(-0.03, 0.03), 0.18 + rand(0, 0.02), 0.12 - i * 0.035); c.rotation.x = -0.3 - i * 0.08; head.add(c); }
  // gore: torn cheek showing jaw + blood on chin
  const gore = new THREE.MeshStandardMaterial({ color: 0x5a0408, roughness: 0.3, emissive: 0x200000 }); const wound = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), gore); wound.scale.set(1, 0.7, 0.4); wound.position.set(0.15, -0.06, 0.1); head.add(wound);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0xe8e0c8 })); jaw.position.set(0.16, -0.06, 0.12); jaw.rotation.y = 0.6; head.add(jaw);
  // furry arms + gloves + furry lower legs
  const C = (n) => findChild(b, n);
  for (const s of ['l', 'r']) {
    along(b['upperarm_' + s], b['lowerarm_' + s], 0.055, 0.05, fur, 1, 0.04); along(b['lowerarm_' + s], b['hand_' + s], 0.05, 0.045, fur, 1, 0.02);
    if (b['hand_' + s]) { const gl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), fur); gl.scale.set(1, 0.8, 1.3); b['hand_' + s].add(gl); }
    along(b['calf_' + s], b['foot_' + s], 0.065, 0.06, fur, 1, 0.06);
  }
  // blood on the jersey
  for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.CircleGeometry(rand(0.03, 0.07), 10), gore); sp.position.set(rand(-0.1, 0.1), rand(-0.05, 0.12), 0.14); if (b.spine_03) b.spine_03.add(sp); }
  boss.aT = 3.5; boss.summonT = 8; boss.state = null; boss.ring = null;
}
// big attacks layered on top of the zombie AI (which already does the tusk-rush charge + swipes)
export function hogUpdate(boss, dt) {
  const z = boss.z, pl = G.player; if (!z) return;
  if (z.dead) { if (!boss.deathFx) { boss.deathFx = true; deathBurst(boss); } return; }
  const dx = pl.pos.x - z.pos.x, dz = pl.pos.z - z.pos.z, d = Math.hypot(dx, dz);
  if (boss.ring) { const r = boss.ring; r.t += dt; const R = r.t * 14; r.m.scale.setScalar(Math.max(0.01, R)); r.m.material.opacity = Math.max(0, 0.85 - r.t * 0.9);
    if (!r.hit && Math.abs(d - R) < 1.0 && R < 11) { r.hit = true; pl.hurt(18, z); G.shake && G.shake(0.6); }
    if (r.t > 0.9) { G.world.scene.remove(r.m); boss.ring = null; } }
  const st = boss.state;
  if (st) { st.t += dt; z.ch.mixer.update(dt); z.yaw += angDiff(z.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4); z.root.rotation.y = z.yaw;
    if (st.kind === 'pound') { const k = st.t / 0.9; z.pos.y = k < 1 ? Math.sin(Math.min(1, k) * Math.PI) * 2.2 : 0; if (k >= 1 && !st.landed) { st.landed = true; z.pos.y = 0; slam(boss); } if (st.t > 1.5) end(boss); }
    else if (st.kind === 'taunt') { pointAt(z, st.t < 0 ? 1 : Math.min(1, st.t * 4)); if (st.t > 2.0) end(boss); }
    else if (st.kind === 'summon') { z.pos.y = Math.abs(Math.sin(st.t * 10)) * 0.25; if (st.t > 1.3) { z.pos.y = 0; end(boss); } }
    return; }
  if (z.charge > 0 && d < 2.2 * (z.scale / 2) + 1 && !boss.gored) { boss.gored = 0.8; pl.hurt(14, z); sfx('splat', pl.pos, 0.6); }
  if (boss.gored) { boss.gored -= dt; if (boss.gored <= 0) boss.gored = 0; }
  boss.aT -= dt; boss.summonT -= dt; if (boss.aT > 0 || z.charge > 0 || z.atkPhase > 0) return;
  boss.aT = rand(3.8, 5.5) * (0.7 + 0.3 * z.hp / z.maxHp);
  if (boss.summonT <= 0) { boss.summonT = rand(13, 17); start(boss, 'summon'); sfx('roar', z.pos, 1); for (let i = 0; i < 3; i++) { const a = rand(0, 6.28); G.spawnRiser && G.spawnRiser(z.pos.x + Math.cos(a) * 4, z.pos.z + Math.sin(a) * 4); } G.onBossPhase && G.onBossPhase(pick(['He called in the offensive line. Dead ones.', 'Oh great, he brought the starters.', 'TEAM HUDDLE! Shoot the huddle!'])); return; }
  if (d < 9) { start(boss, 'pound'); sfx('roar', z.pos, 0.8); return; }
  start(boss, 'taunt'); sfx('roar', z.pos, 0.5); G.onBossTaunt && G.onBossTaunt();
}
const pick = a => a[Math.floor(Math.random() * a.length)];
function start(boss, kind) { boss.state = { kind, t: 0 }; boss.z.hold = true; boss.z.ch.play(kind === 'taunt' ? 'Idle_Loop' : 'Walk_Loop', 0.15); }
function end(boss) { boss.state = null; boss.z.hold = false; boss.z.pos.y = 0; boss.z.playLoop(); }
function pointAt(z, k) { const b = z.bones; const ua = b.upperarm_r, la = b.lowerarm_r; if (ua) { ua.rotation.x -= 1.3 * k; ua.rotation.z += 0.2 * k; } if (la) la.rotation.x -= 0.2 * k; if (b.Head) b.Head.rotation.x += 0.15 * Math.sin(E.time * 10) * k; }
function slam(boss) { const z = boss.z; sfx('explode', z.pos, 0.9); G.shake && G.shake(0.8);
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color: 0xff3a20, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.set(z.pos.x, 0.08, z.pos.z); G.world.scene.add(m); boss.ring = { m, t: 0, hit: false };
  for (let i = 0; i < 40; i++) { const a = rand(0, 6.28); particle(tmp.set(z.pos.x + Math.cos(a) * 1.5, 0.1, z.pos.z + Math.sin(a) * 1.5), tmp2.set(Math.cos(a) * rand(4, 8), rand(1, 4), Math.sin(a) * rand(4, 8)), new THREE.Color(0.25, 0.4, 0.15), rand(0.05, 0.1), 0.8); }
  decal(new THREE.Vector3(z.pos.x, 0, z.pos.z), new THREE.Vector3(0, 1, 0), 3);
}
function deathBurst(boss) { const z = boss.z; sfx('explode', z.pos, 1);
  for (let i = 0; i < 80; i++) particle(tmp.set(z.pos.x + rand(-1, 1), rand(1, 6), z.pos.z + rand(-1, 1)), tmp2.set(rand(-6, 6), rand(1, 8), rand(-6, 6)), Math.random() < 0.6 ? new THREE.Color(0.85, 0.05, 0.1) : new THREE.Color(0.4, 0, 0), rand(0.06, 0.14), 1.4);
  mist(tmp.set(z.pos.x, 5, z.pos.z), 30); blood(tmp.set(z.pos.x, 5, z.pos.z), new THREE.Vector3(0, 1, 0), 40, 6);
  // the hog head pops off and bounces away
  const h = boss.hogHead; if (h) { h.updateMatrixWorld(true); h.getWorldPosition(tmp); h.removeFromParent(); G.world.scene.add(h); h.position.copy(tmp); h.scale.setScalar(z.scale * 1.0); const v = new THREE.Vector3(rand(-3, 3), 9, rand(-3, 3)); const spin = rand(4, 8);
    G.world.updaters.push(dt => { if (h.position.y <= 0.6 * z.scale * 0.2 && v.y < 0) { v.y = -v.y * 0.4; v.x *= 0.7; v.z *= 0.7; if (Math.abs(v.y) < 0.6) v.set(0, 0, 0); } else v.y -= 18 * dt; h.position.addScaledVector(v, dt); if (v.lengthSq() > 0) h.rotation.x += spin * dt; }); }
}
// ───────── GRUMPY THE BADGER (Scene 2, Arkadelphia): striped-face badger in a blue letter sweater
let STRIPE;
function stripeTex() { return STRIPE || (STRIPE = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#f4f2ec'; x.fillRect(0, 0, w, h); x.fillStyle = '#111';
  // equirect-ish: dark stripe down the middle-front + two side bands, torn grey-green patches
  x.fillRect(w * 0.22, 0, w * 0.06, h * 0.55); x.fillRect(w * 0.72, 0, w * 0.06, h * 0.55); x.beginPath(); x.moveTo(w * 0.47, 0); x.lineTo(w * 0.53, 0); x.lineTo(w * 0.515, h * 0.42); x.lineTo(w * 0.485, h * 0.42); x.fill();
  x.fillRect(w * 0.34, h * 0.35, w * 0.08, h * 0.25); x.fillRect(w * 0.58, h * 0.35, w * 0.08, h * 0.25);
  for (let i = 0; i < 7; i++) { const px = rand(0, w), py = rand(0, h), r = rand(6, 14); const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, '#5a6a4a'); g.addColorStop(0.6, '#4a1010'); g.addColorStop(1, 'rgba(60,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
})); }
function letterTex() { return canvasTex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#d0141e'; x.font = "bold 110px 'Black Ops One', Impact, sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('A', 64, 70); }); }
export function badgerify(boss) {
  const z = boss.z, b = z.bones;
  const whiteFur = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 1 }), black = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.6 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc8141e, roughness: 0.9 }), blue = new THREE.MeshStandardMaterial({ color: 0x2a3ad8, roughness: 0.95 });
  const gore = new THREE.MeshStandardMaterial({ color: 0x5a0408, roughness: 0.3, emissive: 0x200000 });
  const head = new THREE.Group(); b.Head.add(head); head.position.set(0, 0.05, 0.02); boss.hogHead = head;
  const t = stripeTex(); t.offset.x = 0.25; const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); skull.scale.set(1.08, 0.95, 1.05); head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), whiteFur); muzzle.scale.set(1, 0.8, 1.2); muzzle.position.set(0, -0.07, 0.16); head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), black); nose.scale.set(1.3, 0.9, 1); nose.position.set(0, -0.04, 0.29); head.add(nose);
  const frown = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 14, Math.PI), black); frown.position.set(0, -0.13, 0.26); head.add(frown);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), black); ear.scale.set(1, 1, 0.4); ear.position.set(sx * 0.16, 0.14, -0.02); head.add(ear);
    const ein = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), whiteFur); ein.scale.set(1, 1, 0.4); ein.position.set(sx * 0.16, 0.14, 0.0); head.add(ein);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd020, toneMapped: false })); eye.position.set(sx * 0.07, 0.03, 0.19); head.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.024, 0.03), black); brow.position.set(sx * 0.07, 0.085, 0.19); brow.rotation.z = sx * 0.5; head.add(brow);
    for (let i = 0; i < 4; i++) { const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 4), whiteFur); tuft.position.set(sx * 0.2, -0.02 - i * 0.04, 0.02); tuft.rotation.z = -sx * 1.3; head.add(tuft); }
  }
  const glow = new THREE.PointLight(0xffc020, 2.5, 4, 2); glow.position.set(0, 0.04, 0.3); head.add(glow);
  const wound = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), gore); wound.scale.set(1, 0.7, 0.4); wound.position.set(-0.15, -0.02, 0.1); head.add(wound);
  // striped turtleneck collar + red waistband + letter A
  if (b.neck_01) { for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.085 - i * 0.004, 0.022, 8, 20), i % 2 ? red : blue); c.rotation.x = Math.PI / 2; c.position.set(0, 0.0 + i * 0.03, 0); b.neck_01.add(c); } }
  if (b.pelvis) { const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.08, 24, 1, true), red); wb.material.side = THREE.DoubleSide; wb.scale.z = 0.8; wb.position.set(0, 0.07, 0); b.pelvis.add(wb); }
  if (b.spine_03) { const a = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshStandardMaterial({ map: letterTex(), transparent: true, roughness: 0.9 })); a.position.set(0, -0.02, 0.16); b.spine_03.add(a);
    for (let i = 0; i < 4; i++) { const sp = new THREE.Mesh(new THREE.CircleGeometry(rand(0.025, 0.05), 10), gore); sp.position.set(rand(-0.12, 0.12), rand(-0.1, 0.1), 0.162); b.spine_03.add(sp); } }
  for (const s of ['l', 'r']) {
    along(b['calf_' + s], b['foot_' + s], 0.07, 0.065, whiteFur, 1, 0.06);
    if (b['hand_' + s]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), whiteFur); f.scale.set(1, 0.85, 1.2); b['hand_' + s].add(f); }
    if (b['foot_' + s]) for (let i = 0; i < 3; i++) { const cl = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.06, 5), new THREE.MeshStandardMaterial({ color: 0x222222 })); cl.rotation.x = Math.PI / 2; cl.position.set(-0.03 + i * 0.03, 0.0, 0.14); b['foot_' + s].add(cl); }
  }
  boss.aT = 4; boss.summonT = 9; boss.state = null; boss.ring = null;
}
export function badgerUpdate(boss, dt) {
  const z = boss.z, pl = G.player; if (z.dead) { if (!boss.deathFx) { boss.deathFx = true; deathBurst(boss); } return; }
  const dx = pl.pos.x - z.pos.x, dz = pl.pos.z - z.pos.z, d = Math.hypot(dx, dz); const st = boss.state;
  if (st) { st.t += dt; z.ch.mixer.update(dt);
    if (st.kind === 'burrow') { // dig down, tunnel under Shayla, erupt
      if (st.t < 0.7) { z.pos.y = -st.t / 0.7 * 7; dirt(z.pos, 3); }
      else if (st.t < 2.2) { z.root.visible = false; const k = Math.min(1, dt * 2.2); z.pos.x += (pl.pos.x - z.pos.x) * k; z.pos.z += (pl.pos.z - z.pos.z) * k; dirt(tmp.set(z.pos.x, 0, z.pos.z), 2); if (!st.warn) { st.warn = true; G.onBossPhase && G.onBossPhase(pick(["The ground's moving. MOVE, babe!", "He's under us! Run!", 'Where did the badger go? Oh no. OH NO.'])); } }
      else { if (!st.up) { st.up = true; z.root.visible = true; st.ux = z.pos.x; st.uz = z.pos.z; sfx('explode', z.pos, 0.9); for (let i = 0; i < 40; i++) particle(tmp.set(z.pos.x, 0.2, z.pos.z), tmp2.set(rand(-5, 5), rand(3, 9), rand(-5, 5)), new THREE.Color(0.35, 0.25, 0.15), rand(0.05, 0.12), 1); if (Math.hypot(pl.pos.x - z.pos.x, pl.pos.z - z.pos.z) < 2.8) pl.hurt(22, z); }
        z.pos.y = Math.min(0, z.pos.y + dt * 22); if (st.t > 2.9) end(boss); }
      return; }
    if (st.kind === 'roll') { // curls up in his sweater and bowls at you
      if (st.t < 0.4) { z.root.rotation.x = -st.t * 4; return; }
      if (!st.dir) { st.dir = { x: dx / (d || 1), z: dz / (d || 1) }; sfx('roar', z.pos, 0.7); }
      z.pos.x += st.dir.x * 13 * dt; z.pos.z += st.dir.z * 13 * dt; G.world.collide(z.pos, 0.8, 0.1, 2); z.root.rotation.x -= dt * 14; z.pos.y = 0.6;
      if (!st.hit && Math.hypot(pl.pos.x - z.pos.x, pl.pos.z - z.pos.z) < 2.4) { st.hit = true; pl.hurt(16, z); }
      if (st.t > 1.7) { z.root.rotation.x = 0; z.pos.y = 0; end(boss); } return; }
    if (st.kind === 'summon' || st.kind === 'taunt') { z.yaw += angDiff(z.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4); z.root.rotation.y = z.yaw; z.pos.y = Math.abs(Math.sin(st.t * 8)) * 0.2; if (st.t > (st.kind === 'taunt' ? 1.5 : 1.3)) end(boss); return; }
  }
  // swagger strut: shoulders roll while walking
  if (z.bones.spine_03) z.bones.spine_03.rotation.y += Math.sin(E.time * 4) * 0.18;
  boss.aT -= dt; boss.summonT -= dt; if (boss.aT > 0 || z.atkPhase > 0) return;
  boss.aT = rand(3.6, 5.2) * (0.7 + 0.3 * z.hp / z.maxHp);
  if (boss.summonT <= 0) { boss.summonT = rand(13, 17); start(boss, 'summon'); sfx('roar', z.pos, 1); for (let i = 0; i < 3; i++) { const a = rand(0, 6.28); G.spawnRiser && G.spawnRiser(z.pos.x + Math.cos(a) * 3.5, z.pos.z + Math.sin(a) * 3.5); } G.onBossPhase && G.onBossPhase(pick(["He's calling the lunch crowd. Dead lunch crowd.", 'Table for zombies? Not on Main Street.', 'Somebody tell the diners the kitchen is CLOSED.'])); return; }
  if (d > 7 && Math.random() < 0.55) { start(boss, 'roll'); return; }
  start(boss, 'burrow'); sfx('roar', z.pos, 0.6);
}
function dirt(p, n) { for (let i = 0; i < n; i++) particle(tmp2.set(p.x + rand(-1, 1), 0.1, p.z + rand(-1, 1)), new THREE.Vector3(rand(-2, 2), rand(1, 4), rand(-2, 2)), new THREE.Color(0.35, 0.25, 0.15), rand(0.04, 0.09), 0.7); }
// ───────── SPIKE, THE PURPLE MENACE (Scene 3, Fayetteville square): zombie bulldog mascot
export function bulldogify(boss) {
  const z = boss.z, b = z.bones;
  const purple = new THREE.MeshStandardMaterial({ map: purpleFur(), roughness: 1 }), dark = new THREE.MeshStandardMaterial({ color: 0x24104a, roughness: 0.9 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.35 }), black = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.5 }), grey = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.7, roughness: 0.35 });
  const gore = new THREE.MeshStandardMaterial({ color: 0x5a0408, roughness: 0.3, emissive: 0x200000 });
  const head = new THREE.Group(); b.Head.add(head); head.position.set(0, 0.04, 0.03); boss.hogHead = head;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), purple); skull.scale.set(1.15, 0.95, 1.05); head.add(skull);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.08), dark); brow.position.set(0, 0.08, 0.16); brow.rotation.x = 0.3; head.add(brow);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), purple); muzzle.scale.set(1.25, 0.8, 0.9); muzzle.position.set(0, -0.06, 0.17); head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), black); nose.scale.set(1.4, 0.8, 0.9); nose.position.set(0, 0.0, 0.29); head.add(nose);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.02), new THREE.MeshStandardMaterial({ color: 0x300010 })); mouth.position.set(0, -0.08, 0.27); head.add(mouth);
  for (let i = 0; i < 9; i++) { const x = -0.09 + i * 0.0225; const up = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 4), white); up.rotation.x = Math.PI; up.position.set(x, -0.06, 0.282); head.add(up); const dn = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 4), white); dn.position.set(x + 0.011, -0.1, 0.282); head.add(dn); }
  for (const sx of [-1, 1]) {
    const jowl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), purple); jowl.scale.set(0.9, 1.1, 0.9); jowl.position.set(sx * 0.14, -0.12, 0.15); head.add(jowl);
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 6), white); fang.position.set(sx * 0.1, -0.03, 0.27); head.add(fang);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), white); eye.scale.z = 0.5; eye.position.set(sx * 0.08, 0.04, 0.19); head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), new THREE.MeshBasicMaterial({ color: 0xc040ff, toneMapped: false })); pupil.position.set(sx * 0.075, 0.035, 0.208); head.add(pupil);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), dark); ear.scale.set(1, 0.6, 0.3); ear.position.set(sx * 0.19, 0.12, -0.02); ear.rotation.z = -sx * 0.9; head.add(ear);
  }
  const glow = new THREE.PointLight(0xc040ff, 2.5, 4, 2); glow.position.set(0, 0.03, 0.32); head.add(glow);
  const wound = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), gore); wound.scale.set(1, 0.7, 0.4); wound.position.set(-0.16, 0.06, 0.1); head.add(wound);
  // spiked collar
  if (b.neck_01) { const col = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 24), black); col.rotation.x = Math.PI / 2; b.neck_01.add(col); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), grey); sp.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13); sp.rotation.z = -Math.PI / 2; sp.rotation.y = -a; const piv = new THREE.Group(); piv.add(sp); b.neck_01.add(piv); } boss.collar = b.neck_01; }
  for (const s of ['l', 'r']) { along(b['upperarm_' + s], b['lowerarm_' + s], 0.07, 0.065, purple, 1, 0.04); along(b['lowerarm_' + s], b['hand_' + s], 0.065, 0.055, purple, 1, 0.02); along(b['calf_' + s], b['foot_' + s], 0.07, 0.065, purple, 1, 0.06);
    if (b['hand_' + s]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), purple); f.scale.set(1, 0.85, 1.2); b['hand_' + s].add(f); } }
  if (b.spine_03) for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.CircleGeometry(rand(0.025, 0.05), 10), gore); sp.position.set(rand(-0.12, 0.12), rand(-0.1, 0.1), 0.162); b.spine_03.add(sp); }
  boss.aT = 4; boss.summonT = 9; boss.state = null;
}
let PF; function purpleFur() { return PF || (PF = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#4a1c8a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2200; i++) { x.strokeStyle = Math.random() < 0.5 ? 'rgba(30,8,60,.5)' : 'rgba(140,90,220,.35)'; x.lineWidth = rand(0.6, 1.6); const px = rand(0, w), py = rand(0, h), a = rand(1.2, 1.9); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 7, py + Math.sin(a) * 7); x.stroke(); }
  for (let i = 0; i < 8; i++) { const px = rand(0, w), py = rand(0, h), r = rand(8, 18); const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, '#5a6a4a'); g.addColorStop(0.6, '#3a1010'); g.addColorStop(1, 'rgba(60,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } })); }
export function bulldogUpdate(boss, dt) {
  const z = boss.z, pl = G.player; if (z.dead) { if (!boss.deathFx) { boss.deathFx = true; deathBurst(boss); } return; }
  const dx = pl.pos.x - z.pos.x, dz = pl.pos.z - z.pos.z, d = Math.hypot(dx, dz); const st = boss.state;
  if (st) { st.t += dt; z.ch.mixer.update(dt);
    if (st.kind === 'lunge') { if (st.t < 0.45) { z.yaw += angDiff(z.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8); z.root.rotation.y = z.yaw; z.root.rotation.x = st.t * 0.6; return; }
      if (!st.dir) { st.dir = { x: Math.sin(z.yaw), z: Math.cos(z.yaw) }; sfx('roar', z.pos, 0.8); }
      if (st.t < 0.95) { z.pos.x += st.dir.x * 16 * dt; z.pos.z += st.dir.z * 16 * dt; G.world.collide(z.pos, 0.8, 0.1, 2); if (!st.hit && d < 3) { st.hit = true; pl.hurt(20, z); sfx('splat', pl.pos, 0.8); } }
      if (st.t > 1.3) { z.root.rotation.x = 0; end(boss); } return; }
    if (st.kind === 'spin') { z.yaw += dt * 14; z.root.rotation.y = z.yaw; if (Math.random() < 0.5) particle(tmp.set(z.pos.x + rand(-2, 2), rand(3, 6), z.pos.z + rand(-2, 2)), tmp2.set(rand(-4, 4), rand(0, 3), rand(-4, 4)), new THREE.Color(0.8, 0.8, 0.85), 0.05, 0.4);
      st.tick = (st.tick || 0) - dt; if (d < 4.2 && st.tick <= 0) { st.tick = 0.5; pl.hurt(11, z); } if (st.t > 1.8) end(boss); return; }
    if (st.kind === 'howl') { z.yaw += angDiff(z.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4); z.root.rotation.y = z.yaw; if (z.bones.Head) z.bones.Head.rotation.x -= 0.5;
      for (let i = 0; i < 3; i++) particle(tmp.set(z.pos.x + Math.sin(z.yaw) * 1.5, z.scale * 1.55, z.pos.z + Math.cos(z.yaw) * 1.5), tmp2.set(Math.sin(z.yaw) * rand(3, 8) + rand(-1, 1), rand(-1, 2), Math.cos(z.yaw) * rand(3, 8) + rand(-1, 1)), new THREE.Color(0.75, 0.95, 0.6), rand(0.04, 0.09), 0.9);
      if (!st.hit && st.t > 0.6) { st.hit = true; if (d < 15) { pl.slow = 2.2; pl.hurt(6, z); G.onBossPhase && G.onBossPhase(pick(['Ew. EW. Dog slobber in my HAIR.', "I can't move, I'm covered in drool!", 'That howl went straight to my ovaries. Not in a good way.'])); } }
      if (st.t > 1.5) end(boss); return; }
    if (st.kind === 'summon' || st.kind === 'taunt') { z.yaw += angDiff(z.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 4); z.root.rotation.y = z.yaw; z.pos.y = Math.abs(Math.sin(st.t * 8)) * 0.2; if (st.t > (st.kind === 'taunt' ? 1.5 : 1.3)) end(boss); return; }
  }
  boss.aT -= dt; boss.summonT -= dt; if (boss.aT > 0 || z.atkPhase > 0) return;
  boss.aT = rand(3.4, 5) * (0.7 + 0.3 * z.hp / z.maxHp);
  if (boss.summonT <= 0) { boss.summonT = rand(13, 17); start(boss, 'summon'); sfx('roar', z.pos, 1); for (let i = 0; i < 3; i++) { const a = rand(0, 6.28); G.spawnRiser && G.spawnRiser(z.pos.x + Math.cos(a) * 3.5, z.pos.z + Math.sin(a) * 3.5); } G.onBossPhase && G.onBossPhase(pick(['He whistled up the whole dog park. Dead dog park.', 'More zombies? On the SQUARE? On a Saturday?!', 'Kayleigh, stay behind the fountain!'])); return; }
  if (d < 5) { start(boss, 'spin'); sfx('roar', z.pos, 0.6); return; }
  if (Math.random() < 0.5) { start(boss, 'lunge'); return; }
  start(boss, 'howl'); sfx('roar', z.pos, 1);
}
