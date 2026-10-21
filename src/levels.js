// The 9 shifts. Each build(W) lays out geometry/props and returns gameplay anchors.
import * as THREE from 'three';
import { T, std, texMat, signTex } from './world.js';
import { PM, building, car, truck, tree, pine, lamp, bench, table, shelf, bed, curtain, vending, stall, pumpkins, hay, chairRow, stringLights, bike, grill, cooler, windowTex } from './props.js';
import { rand } from './util.js';
import { grillInterior } from './grill.js';
import { skyDome, mountains, redRock, juniper, grandstand, lightTower, turfTex, storefront, globeLamp, shieldSign, poleBarn, mineTimber, lantern, rails, oreCart, ambient } from './scenery.js';
const { col, metal, emis } = PM;
const yawFacing = (fx, fz) => Math.atan2(-fx, -fz);
function perimeter(W, h, mat, o = {}) { const b = W.bounds; W.wall(b.minX, b.minZ, b.maxX, b.minZ, h, mat, o); W.wall(b.minX, b.maxZ, b.maxX, b.maxZ, h, mat, o); W.wall(b.minX, b.minZ, b.minX, b.maxZ, h, mat, o); W.wall(b.maxX, b.minZ, b.maxX, b.maxZ, h, mat, o); }
// wall along x (z fixed) with door gaps [[centerX, width],...]
function wallX(W, z, x0, x1, h, mat, gaps = [], t = 0.25) { let cur = x0; for (const [c, w] of gaps.sort((a, b) => a[0] - b[0])) { if (c - w / 2 > cur) W.box((cur + c - w / 2) / 2, 0, z, c - w / 2 - cur, h, t, mat, { tile: 2 }); W.box(c, 2.3, z, w, h - 2.3, t, mat, { collide: false }); cur = c + w / 2; } if (x1 > cur) W.box((cur + x1) / 2, 0, z, x1 - cur, h, t, mat, { tile: 2 }); }
function wallZ(W, x, z0, z1, h, mat, gaps = [], t = 0.25) { let cur = z0; for (const [c, w] of gaps.sort((a, b) => a[0] - b[0])) { if (c - w / 2 > cur) W.box(x, 0, (cur + c - w / 2) / 2, t, h, c - w / 2 - cur, mat, { tile: 2 }); W.box(x, 2.3, c, t, h - 2.3, w, mat, { collide: false }); cur = c + w / 2; } if (z1 > cur) W.box(x, 0, (cur + z1) / 2, t, h, z1 - cur, mat, { tile: 2 }); }
function ceiling(W, h, mat) { const b = W.bounds; W.box((b.minX + b.maxX) / 2, h, (b.minZ + b.maxZ) / 2, b.maxX - b.minX, 0.1, b.maxZ - b.minZ, mat, { collide: false, cast: false }); }
function fluoro(W, x, z, h, flicker) { W.box(x, h - 0.06, z, 1.4, 0.05, 0.35, emis('#f4fbff', 2.2), { collide: false, cast: false }); }
function decalSplat(W, x, z, s = 1.5) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), texMat('bloodDecal', T.blood(), { transparent: true, depthWrite: false, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 })); m.rotation.x = -Math.PI / 2; m.rotation.z = rand(0, 6); m.position.set(x, 0.011, z); W.group.add(m); }
function skyline(W, z, n = 26, spread = 160, y0 = -18) { for (let i = 0; i < n; i++) { const w = rand(8, 18), h = rand(14, 46), x = -spread / 2 + i * spread / n + rand(-2, 2); const t = windowTex('#1a1d24', 0.55, 3, 5, '#20242c'); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 10), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.5, roughness: 0.9 })); m.position.set(x, y0 + h / 2, z - rand(0, 30)); W.group.add(m); } }

const gold = '#ffd84a';
export const LEVELS = [
  // 1 ─────────────────────────────── RAZORCRACK STADIUM (night)
  { id: 'stadium', name: 'Razorcrack Stadium', shift: 'SCENE 1 · WOO PIG SOOIE-CIDE', obj: 'Clear the field', music: 'stadium', quota: 30, outfits: ['hogfan', 'hogfan', 'ref', 'hogfan', 'band'], mix: { walker: 0.7, runner: 0.2, brute: 0.1 },
    env: { dark: true, sky: ['#04060e', '#121a30'], fog: ['#0c1220', 40, 150], hemi: ['#9ab0e0', '#20140c', 0.65], sun: ['#e8eeff', 1.1, 8, 20, 6], exposure: 0.85 },
    boss: { kind: 'zombie', name: 'BIG HOSS, THE MASCOT', outfit: 'mascot', hp: 1600, scale: 1.9, charge: true },
    build(W) {
      W.bounds = { minX: -28, maxX: 28, minZ: -52, maxZ: 52 };
      skyDome(W, { top: '#02030a', mid: '#0a1228', bot: '#1a2238', stars: 1, clouds: 0.3, seed: 11 });
      const tf = texMat('turfM', turfTex()); const g = new THREE.Mesh(new THREE.PlaneGeometry(56, 104), tf); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; W.group.add(g);
      W.floor(-40, 40, -64, 64, texMat('track', T.concrete('#6a3a2a')), 4, -0.01);
      // the bowl: east & west sidelines, north & south ends (red seats, packed crowd, suites on the west)
      grandstand(W, -30, 0, 110, Math.PI / 2, { rows: 22, rise: 0.7, step: 1.0, seed: 3, suites: true });
      grandstand(W, 30, 0, 110, -Math.PI / 2, { rows: 22, rise: 0.7, step: 1.0, seed: 5 });
      grandstand(W, 0, -56, 64, 0, { rows: 16, rise: 0.75, seed: 7 }); grandstand(W, 0, 56, 64, Math.PI, { rows: 12, rise: 0.75, seed: 9 });
      perimeter(W, 1.4, texMat('padwall', T.paint('#7a1424')));
      W.sign(['HOME OF THE RAZORCRACKS'], -29.8, 4.6, 0, 22, 1.3, { ry: Math.PI / 2, bg: '#e8e2d8', fg: '#9d2235' });
      W.sign(['RAZORCRACK STADIUM', 'HOGS 0 · ZOMBIES 999 · 4TH QTR'], 0, 22, -74, 34, 9, { bg: '#0a0a0c', colors: ['#ff3a3a', gold], neon: 1.6, box: 0.6 });
      W.box(-14, 13, -74, 1.2, 9, 1.2, metal('#555')); W.box(14, 13, -74, 1.2, 9, 1.2, metal('#555'));
      for (const [x, z] of [[-36, -40], [36, -40], [-36, 40], [36, 40]]) lightTower(W, x, z, 32, x * 0.2, z * 0.3, 0.35);
      // goalposts (yellow)
      for (const z of [-50, 50]) { W.cyl(0, 0, z, 0.15, 0.15, 3, emis(gold, 0.4), { collide: true }); W.box(0, 3, z, 5.6, 0.18, 0.18, emis(gold, 0.4), { collide: false }); for (const x of [-2.8, 2.8]) W.cyl(x, 3, z, 0.08, 0.08, 6, emis(gold, 0.4)); }
      // sideline benches, coolers, tunnel
      for (let z = -20; z <= 20; z += 4) { bench(W, -24, z, Math.PI / 2); } cooler(W, -24.5, 22); cooler(W, -24.5, -22, 0.3);
      W.box(-10, 0, -40, 4, 1, 0.8, std('tackle', { color: 0xd0d0d0 })); W.box(10, 0, 30, 3.6, 1.6, 2, texMat('tun', T.paint('#9d2235')));
      W.sign(['HOGS', 'TUNNEL'], 10, 2.2, 31.05, 3, 0.9, { bg: '#9d2235', fg: '#fff' });
      for (let i = 0; i < 10; i++) decalSplat(W, rand(-22, 22), rand(-45, 45), rand(1, 2.5));
      ambient(W, { n: 220, color: '#ffffff', size: 0.06, area: 30, h: 14, kind: 'dust' });
      return { start: { x: 0, z: 40, yaw: yawFacing(0, -1) }, kennedy: { x: 2.5, z: 42 }, exit: { x: 10, z: 32.5, label: 'TUNNEL' }, bossAt: { x: 0, z: -30 },
        spawnZones: [[-26, -50, 26, -30], [-26, -20, -18, 20], [18, -20, 26, 20], [-26, 46, 26, 51]],
        pickups: [['med', -24, 0], ['med', 24, -30], ['ammo', 0, 0], ['fingers', 24, 48, 15], ['fingers', -24, -48, 15]] };
    } },
  // 2 ─────────────────────────────── DOWNTOWN ARKADELPHIA (day) → 67 GRILL
  { id: 'arkadelphia', name: 'Downtown Arkadelphia', shift: 'SCENE 2 · SOMETHING OLD', obj: 'Fight down Main Street', music: 'arkadelphia', quota: 38, outfits: ['farmer', 'hipster', 'church', 'jogger', 'church'], mix: { walker: 0.6, runner: 0.18, spitter: 0.1, brute: 0.12 },
    env: { sky: ['#4a8ad8', '#cfe4f4'], fog: ['#cfe0ec', 50, 140], hemi: ['#eaf4ff', '#5a5040', 0.9], sun: ['#fff1d8', 2.6, 18, 26, 8], exposure: 0.95 },
    boss: { kind: 'zombie', name: 'THE CHURCH LADY', outfit: 'church', hp: 2000, scale: 1.8, spit: 'custard', spitRate: 2 },
    item: 'brooch',
    build(W) {
      W.bounds = { minX: -12, maxX: 12, minZ: -86.5, maxZ: 40 };
      skyDome(W, { top: '#3a78d0', mid: '#8cc0ec', bot: '#dceaf4', sun: [0.12, 0.35], clouds: 0.6, seed: 2 });
      W.floor(-6, 6, -80, 50, texMat('asph', T.asphalt()), 4); W.floor(-14, -6, -80, 50, texMat('sidewalk', T.concrete('#b8b0a0')), 2); W.floor(6, 14, -80, 50, texMat('sidewalk', T.concrete('#b8b0a0')), 2);
      const stripe = emis('#f2f2e8', 0.15); for (let z = -60; z <= 36; z += 4.5) { W.box(-3.5, 0, z, 2.6, 0.01, 0.12, stripe, { collide: false, cast: false, ry: 0.5 }); W.box(3.5, 0, z, 2.6, 0.01, 0.12, stripe, { collide: false, cast: false, ry: -0.5 }); }
      // Main Street storefronts: tan brick w/ blue awnings, red brick 2-storey, dark awning on the east (from refs)
      const west = [['#c8b08a', 'HENDERSON\'S HARDWARE', '#1f4fa0'], ['#c8b08a', 'MAIN ST. ANTIQUES', '#1f4fa0'], ['#8a3a2a', 'ARK-CAFE', '#1f4fa0'], ['#6a5a4a', 'CADDO FLOWERS', '#2a6a4a'], ['#a8442e', 'REDDIE NATION OUTFITTERS', '#1f4fa0'], ['#c8b08a', 'PAWN & PRAY', '#1f4fa0'], ['#9a3a2a', 'BLUE HEN BOOKS', '#244a8a'], ['#c2a27a', 'DOWNTOWN DONUTS', '#1f4fa0']];
      const east = [['#c8b08a', 'BIG RED BBQ', '#151515'], ['#7a3426', 'ARKADELPHIA ARTS', '#151515'], ['#c8b08a', 'GOODWIN\'S JEWELRY & LOAN', '#5a1a1a'], ['#8a4a32', 'TIGER BARBER', '#151515'], ['#c8b08a', 'ARK. BAPTIST BOOKSTORE', '#151515'], ['#6a3a2a', 'DIXIE DINER', '#8a1a1a'], ['#b89a70', 'THE OUACHITA', '#151515'], ['#9a4a2a', 'OLD THEATER', '#151515']];
      west.forEach(([c, n, a], i) => storefront(W, -12, -60 + i * 12 + 6, 11.6, 8 + (i % 3) * 2.5, Math.PI / 2, { color: c, sign: n, awning: a }));
      east.forEach(([c, n, a], i) => storefront(W, 12, -60 + i * 12 + 6, 11.6, 7 + (i % 2) * 3, -Math.PI / 2, { color: c, sign: n, awning: a }));
      for (let z = -56; z <= 32; z += 11) { globeLamp(W, -6.6, z, false, z % 22 === 0 ? { text: ['SPRING', 'IN ARK'], ry: Math.PI / 2 } : null); globeLamp(W, 6.6, z + 5.5, false); tree(W, -9, z + 3, 0.9, { color: 0x4a8a2a }); }
      for (let x = -4; x <= 4; x += 2) stringLights(W, -6.6, -12 + x * 6, 6.6, -12 + x * 6, 5.2, 14);
      car(W, 4.6, -20, 0.05, '#111'); car(W, -4.6, 10, Math.PI, '#8a1a1a'); car(W, 4.6, 26, 0, '#c0c4c8'); truck(W, -4.4, -40, Math.PI, '#2a4a8a');
      W.sign(['MAIN ST'], -6.9, 2.6, -2, 1.6, 0.4, { ry: Math.PI / 2, bg: '#1f6a3a', fg: '#fff' });
      // 67 GRILL at the south end: walk in through the front door, fight through the dining room to Mom at the booth
      const gi = grillInterior(W, 0, -74, { door: true });
      shieldSign(W, 0, 4.6, -61.75, 2.0, Math.PI); shieldSign(W, 0, 4.6, -61.7, 2.0);
      W.sign(['67 GRILL', 'CATFISH · BURGERS · SWEET TEA'], -6, 4.6, -61.7, 4.4, 1.0, { bg: '#f2efe6', colors: ['#c8102e', '#1a3f8a'] }); W.sign(['Fizz-Ola'], 6.2, 4.6, -61.7, 2, 1.0, { bg: '#c8102e', fg: '#fff', box: 0.05 });
      ambient(W, { n: 120, color: '#fff2c0', size: 0.035, area: 26, h: 6 });
      return { start: { x: 0, z: 34, yaw: yawFacing(0, -1) }, kennedy: { x: 2.4, z: 36 }, exit: { x: 3, z: -83.2, label: 'MOM' }, bossAt: { x: 0, z: -40 }, npc: { key: 'mom', x: 3, z: -84.6 },
        spawnZones: [[-11, -60, -6.5, 30], [6.5, -60, 11, 30], [-5, -54, 5, -30], gi.behindBar, gi.behindBar, [-9, -85, -3, -80]],
        pickups: [['med', -9, -5], ['med', 9, -35], ['ammo', 0, -15], ['fingers', -10, -50, 18], ['fingers', 10, 20, 12]] };
    } },
  // 3 ─────────────────────────────── FAYETTEVILLE SQUARE (day)
  { id: 'square', name: 'The Fayetteville Square', shift: 'SCENE 3 · SOMETHING BORROWED', obj: 'Hold the Square for Kayleigh', music: 'square', quota: 44, outfits: ['hipster', 'farmer', 'hogfan', 'jogger', 'hipster'], mix: { walker: 0.55, runner: 0.18, spitter: 0.12, snatcher: 0.05, brute: 0.1 },
    env: { sky: ['#4a8ad8', '#d8ecf8'], fog: ['#d0e0ea', 45, 130], hemi: ['#e8f4ff', '#5a5040', 1.0], sun: ['#fff4e0', 2.5, 15, 25, 10], exposure: 0.95 },
    boss: { kind: 'zombie', name: 'THE KOMBUCHA BRO', outfit: 'hipster', hp: 2300, scale: 1.85, spit: 'acid', spitRate: 1.8, charge: true },
    item: 'girdle',
    build(W) {
      W.bounds = { minX: -34, maxX: 34, minZ: -34, maxZ: 34 };
      skyDome(W, { top: '#3a7ad0', mid: '#9ccaf0', bot: '#e4eef4', sun: [0.62, 0.3], clouds: 0.7, seed: 4 });
      W.floor(-34, 34, -34, 34, texMat('asph', T.asphalt()), 4); W.floor(-24, 24, -24, 24, texMat('plaza', T.stone('#b8a890')), 3, 0.006);
      for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) { const gq = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), texMat('grassM', T.grass())); gq.material.map.repeat.set(3, 3); gq.rotation.x = -Math.PI / 2; gq.position.set(x, 0.012, z); W.group.add(gq); tree(W, x - 3, z - 2, 1.4, { color: 0x3a7a2a }); tree(W, x + 3, z + 3, 1.2, { color: 0x4a8a2a }); W.box(x, 0, z, 12.4, 0.35, 12.4, std('curb', { color: 0xa8a090 }), { kind: 'low', collide: false }); }
      // Old Post Office: red brick, white trim, cupola + clock
      building(W, 0, 0, 12, 10, 8, { color: '#9a4a32', frame: '#f2efe6', cols: 4, rows: 2, lit: 0.2, trim: '#f2efe6' });
      W.box(0, 8.4, 0, 4, 2.5, 4, col('#f2efe6')); W.cyl(0, 10.9, 0, 0.2, 2.2, 2, col('#3a5a4a'), { seg: 8 });
      W.sign(['XII'], 0, 9.6, 2.03, 1.4, 1.4, { bg: '#ffffff', fg: '#111', box: 0.02 });
      W.sign(['OLD POST OFFICE', 'est. 1911'], 0, 6.2, 5.03, 6, 1.0, { bg: '#f2efe6', fg: '#5a2a1a' });
      // flower beds + fountain
      for (const [x, z] of [[-8, 8], [8, 8], [-8, -8], [8, -8]]) { const b = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), std('bed' + x, { color: x > 0 ? 0xff5a8a : 0xffc83a, roughness: 0.9 })); b.rotation.x = -Math.PI / 2; b.position.set(x, 0.03, z + (z > 0 ? 4 : -4)); W.group.add(b); }
      // storefront ring (like the real square: brick 2-3 storey with awnings)
      const N = ['BLUE BIRD BOOKS', 'HOG HEAVEN BBQ', 'ARSAGA-ISH COFFEE', 'SQUARE CANDY CO.', 'THE GULLEY PARK SHOP', 'OZARK OUTFITTERS', 'DICKSON PROVISIONS', 'BANK OF FAYETTEVILLE'];
      let i = 0; for (let x = -28; x <= 28; x += 11.2) { storefront(W, x, -30, 11, 9 + (i % 3) * 2, 0, { color: ['#8a3a2a', '#c8b08a', '#6a5a4a', '#a8442e'][i % 4], sign: N[i % 8], awning: ['#2a6a4a', '#9d2235', '#1f4fa0', '#d8a020'][i % 4] }); storefront(W, x, 30, 11, 9 + ((i + 1) % 3) * 2, Math.PI, { color: ['#c8b08a', '#8a3a2a', '#a8442e', '#6a5a4a'][i % 4], sign: N[(i + 4) % 8], awning: ['#9d2235', '#1f4fa0', '#2a6a4a', '#5a2a6a'][i % 4] }); i++; }
      for (let z = -22.4; z <= 22.4; z += 11.2) { storefront(W, -30, z, 11, 10, Math.PI / 2, { color: '#7a4a3a', awning: '#2a6a4a' }); storefront(W, 30, z, 11, 10, -Math.PI / 2, { color: '#8a6a4a', awning: '#9d2235' }); }
      for (const [x, z] of [[-24, -24], [24, -24], [-24, 24], [24, 24], [-24, 0], [24, 0], [0, -24], [-6, 24]]) globeLamp(W, x, z);
      stall(W, -18, 2, Math.PI / 2, '#ffffff', '#d8323c', '#e8742a'); stall(W, 18, -2, -Math.PI / 2, '#ffffff', '#2a7ad8', '#8ad83a'); stall(W, 2, 18, 0, '#fff3c0', '#2a8a4a', '#d8323c');
      car(W, -27, -8, 0, '#2a4a8a'); car(W, 27, 12, Math.PI, '#ddd'); truck(W, 10, -27, Math.PI / 2, '#8a1a1a');
      W.sign(['FAYETTEVILLE', 'farmers\' market · sat 7am · no biters'], -12, 2.0, 24.4, 3.6, 1.0, { bg: '#2a6a4a', colors: ['#fff', gold], box: 0.08 });
      ambient(W, { n: 120, color: '#fff2c0', size: 0.035, area: 30, h: 6 });
      return { start: { x: 0, z: 26, yaw: yawFacing(0, -1) }, kennedy: { x: 2.5, z: 27 }, exit: { x: 0, z: 8, label: 'KAYLEIGH' }, bossAt: { x: 0, z: -18 }, npc: { key: 'kayleigh', x: 0, z: 7.2 },
        spawnZones: [[-33, -33, -25, 33], [25, -33, 33, 33], [-24, -33, 24, -26], [-24, 26, 24, 33]],
        pickups: [['med', -14, 0], ['med', 14, 0], ['ammo', 0, -14], ['ammo', -20, 20], ['fingers', 30, -30, 20], ['fingers', -30, 30, 15]] };
    } },
  // 4 ─────────────────────────────── I-30 ROAD STOP: FREDDO'S (sunset)
  { id: 'freddos', name: "Freddo's Steakburgers · I-30 Exit 98", shift: 'SCENE 4 · ROAD TRIP', obj: 'Survive the dinner rush', music: 'freddos', quota: 46, outfits: ['custard', 'custard', 'trucker', 'hipster', 'trucker'], mix: { walker: 0.55, runner: 0.18, spitter: 0.1, snatcher: 0.05, brute: 0.12 },
    env: { sky: ['#2a1f4a', '#ff8a4a'], fog: ['#a06a5a', 40, 120], hemi: ['#ffc8a0', '#2a2030', 0.8], sun: ['#ff9a5a', 2.0, -20, 10, -10], exposure: 1.05 },
    boss: { kind: 'zombie', name: 'THE CONCRETE MIXER II', outfit: 'custard', hp: 2400, scale: 2.1, spit: 'custard', spitRate: 1.6 },
    build(W) {
      W.bounds = { minX: -32, maxX: 32, minZ: -28, maxZ: 28 };
      skyDome(W, { top: '#1a1440', mid: '#c85a5a', bot: '#ffb070', sun: [0.75, 0.88], sunCol: '#ffe0a0', clouds: 0.8, seed: 6 });
      W.floor(-60, 60, -60, 60, texMat('asph', T.asphalt()), 4);
      const stripe = emis('#d8d8c8', 0.15); for (let x = -26; x <= 26; x += 3.2) for (const z of [2, 10]) W.box(x, 0, z, 0.12, 0.01, 4.8, stripe, { collide: false, cast: false });
      const teal = texMat('freddoTeal', T.paint('#18a69f')); const yel = std('freddoYel', { color: 0xffd23b, roughness: 0.5 });
      W.box(0, 0, -19, 18, 5, 9, teal); W.box(0, 5, -19, 18.6, 0.7, 9.6, yel, { collide: false });
      const glass = std('fglass', { color: 0x2a1a10, emissive: 0xffb050, emissiveIntensity: 0.7, roughness: 0.1, metalness: 0.5 }); W.box(0, 0.9, -14.45, 14, 2.6, 0.1, glass, { collide: false });
      W.sign(["FREDDO'S"], 0, 7.4, -14.6, 9, 2.0, { bg: '#18a69f', fg: '#ffd23b', neon: 1.6, box: 0.3, glow: '#fff3a0' });
      W.sign(['FROZEN CUSTARD & STEAKBURGERS', 'the original location of game one · now with interstate zombies'], 0, 4.4, -14.38, 10, 1.0, { bg: '#ffd23b', colors: ['#0f5f5a', '#7a4a00'] });
      W.sign(['DRIVE-THRU', '→'], 13.2, 2.6, -16, 2.6, 1.2, { ry: -Math.PI / 2, bg: '#18a69f', fg: '#fff', box: 0.15 }); W.box(13.2, 0, -16, 0.2, 2, 0.2, metal('#333'));
      for (const [x, z] of [[-6, -10], [-2, -10], [2, -10], [6, -10], [-4, -7], [4, -7]]) { table(W, x, z, 1.2, 1.2, std('ptable', { color: 0xf2f2f2 })); W.cyl(x, 0.75, z, 0.03, 0.03, 1.6, metal('#ccc'), { collide: false }); W.cyl(x, 2.3, z, 0.05, 1.3, 0.4, std('umb' + (x % 4 ? 'y' : 't'), { color: x % 4 ? 0xffd23b : 0x18a69f, roughness: 0.6 }), { collide: false, seg: 8 }); }
      const cc = ['#a33', '#36a', '#ddd', '#222', '#6a8', '#c80', '#555']; let k = 0; for (const z of [6, 14]) for (let x = -24; x <= 24; x += 6.4) if (Math.random() < 0.6) car(W, x + rand(-.3, .3), z, Math.random() < 0.5 ? 0 : Math.PI, cc[k++ % cc.length]);
      truck(W, -22, -6, 0.7, '#3a3a3a'); W.collider(-24, -20, -9, -3, 0, 2.5); // Kennedy's truck
      // interstate: elevated I-30 with a green sign
      W.box(0, 6, 36, 140, 0.8, 10, texMat('hwy', T.concrete('#8a8880')), { collide: false }); for (let x = -50; x <= 50; x += 14) W.box(x, 0, 36, 1.2, 6, 1.2, texMat('hwy', T.concrete('#8a8880')), { collide: false });
      W.sign(['I-30 WEST', 'Texarkana · Dallas · Colorado (eventually)'], -12, 10.5, 31, 9, 2.4, { bg: '#0f6a3a', fg: '#fff', box: 0.2 }); W.box(-12, 6.8, 31.2, 0.2, 2.6, 0.2, metal('#666'), { collide: false });
      for (const [x, z] of [[-14, -2], [14, -2], [-14, 18], [14, 18], [0, 24]]) lamp(W, x, z, 5, true, 0xffd8a0);
      for (let x = -30; x <= 30; x += 6) tree(W, x, 26.5, 0.9); for (let z = -24; z <= 24; z += 8) { tree(W, -30.5, z, 0.9); tree(W, 30.5, z, 0.9); }
      perimeter(W, 1.0, std('hedge', { color: 0x2a4a22, roughness: 1 }));
      W.pointLight(0, 3, -12, 0xffc070, 18, 20);
      ambient(W, { n: 120, color: '#ffd0a0', size: 0.04, area: 30, h: 6 });
      return { start: { x: 0, z: 22, yaw: yawFacing(0, -1) }, kennedy: { x: 2.5, z: 23 }, exit: { x: -20, z: -3, label: "KENNEDY'S TRUCK" }, bossAt: { x: 0, z: -11 },
        spawnZones: [[-30, -26, -12, -15], [12, -26, 30, -15], [-30, 16, -16, 26], [16, 16, 30, 26], [-30, -12, -26, 14], [26, -12, 30, 14]],
        pickups: [['med', 10, 10], ['med', -10, 20], ['ammo', 0, 10], ['ammo', 16, -6], ['fingers', 28, -24, 20], ['fingers', -6, -12.5, 12]] };
    } },
  // 5 ─────────────────────────────── COLORADO SPRINGS DOWNTOWN (day, mountains)
  { id: 'springs', name: 'Downtown Colorado Springs', shift: 'SCENE 5 · SOMETHING NEW', obj: 'Get to the jewelry store', music: 'springs', quota: 50, outfits: ['tourist', 'hiker', 'shopper', 'cowboy', 'shopper'], mix: { walker: 0.5, runner: 0.22, spitter: 0.1, snatcher: 0.06, brute: 0.12 },
    env: { sky: ['#2a6ad8', '#d0e6f8'], fog: ['#c8dcec', 60, 150], hemi: ['#eaf4ff', '#5a5040', 1.0], sun: ['#fff6e6', 2.7, -12, 30, -6], exposure: 0.92 },
    boss: { kind: 'zombie', name: 'THE MALL COP', outfit: 'cop', hp: 2600, scale: 1.9, charge: true },
    item: 'necklace',
    build(W) {
      W.bounds = { minX: -13, maxX: 13, minZ: -56, maxZ: 40 };
      skyDome(W, { top: '#2a68d0', mid: '#8cc4f0', bot: '#dcecf6', sun: [0.3, 0.3], clouds: 0.5, seed: 8 });
      mountains(W, { a0: -1.4, a1: 1.4, radius: 128, peak: 46, base: 18, snow: 0.6, rock: '#4a5878', haze: '#b0c8e0', hz: 0.38, peakAt: 0.42, seed: 14 });
      W.floor(-7, 7, -80, 60, texMat('asph', T.asphalt()), 4); W.floor(-15, -7, -80, 60, texMat('sidewalk2', T.concrete('#c0b8a8')), 2); W.floor(7, 15, -80, 60, texMat('sidewalk2', T.concrete('#c0b8a8')), 2);
      for (let z = -54; z <= 36; z += 5) W.box(0, 0, z, 0.14, 0.01, 2.6, emis('#e8c020', 0.25), { collide: false, cast: false });
      const W1 = [['#8a3a2a', 'PIKES PEAK OUTFITTERS', '#1a4a3a'], ['#c8b08a', 'TEJON ST. TAVERN', '#5a1a1a'], ['#6a4a3a', 'GOLD RUSH BAKERY', '#d8a020'], ['#b8a080', 'ROCKY MTN CHOCOLATE-ISH', '#5a2a1a'], ['#8a4a32', 'OLD TOWN SALOON', '#151515'], ['#a8442e', 'ACACIA BOOKS', '#1f4fa0'], ['#7a3426', 'COLUMBINE CAFE', '#3a5ad0']];
      const E1 = [['#c8b08a', 'ANTLERS HOTEL(ish)', '#1a3a2a'], ['#8a3a2a', 'SKI & SKATE', '#1f4fa0'], ['#9a4a32', 'SPARKLE & SONS FINE JEWELRY', '#1a1a1a'], ['#6a5a4a', 'MOUNTAIN BREW CO.', '#2a6a4a'], ['#c8b08a', 'THE BROADMOOR-ISH', '#5a1a1a'], ['#8a3a2a', 'ELK RIDGE GALLERY', '#151515'], ['#b89a70', 'GARDEN TOURS', '#2a6a4a']];
      W1.forEach(([c, n, a], i) => storefront(W, -13, -52 + i * 13 + 6.5, 12.6, 10 + (i % 3) * 3, Math.PI / 2, { color: c, sign: n, awning: a }));
      E1.forEach(([c, n, a], i) => storefront(W, 13, -52 + i * 13 + 6.5, 12.6, 9 + (i % 2) * 4, -Math.PI / 2, { color: c, sign: n, awning: a, neon: i === 2 ? 1.2 : 0, signBg: i === 2 ? '#101018' : undefined, signFg: i === 2 ? '#bfe8ff' : undefined }));
      // jewelry display cases + diamond sign at SPARKLE & SONS (east, z=-19.5)
      W.sign(['💎 DIAMONDS 💎', 'Engagement · Wedding · Apocalypse'], 6.8, 4.9, -19.5, 3.2, 1.0, { ry: -Math.PI / 2, bg: '#101018', colors: ['#bfe8ff', gold], neon: 1.4, box: 0.1 });
      for (const z of [-22, -17]) W.box(10.5, 0, z, 1.0, 1.0, 2.6, std('jcase', { color: 0xdfe8f0, roughness: 0.05, metalness: 0.6, emissive: 0x405060, emissiveIntensity: 0.4 }), { });
      for (let z = -50; z <= 34; z += 12) { lamp(W, -7.3, z, 4.6, false); lamp(W, 7.3, z + 6, 4.6, false); tree(W, -10.5, z + 3, 1.0, { color: 0x3a6a2a }); }
      car(W, 4.6, -30, 0, '#1a1a1a'); car(W, -4.6, -6, Math.PI, '#4a6a8a'); car(W, 4.6, 16, 0.1, '#c8c4b0'); truck(W, -4.4, 28, Math.PI, '#5a2a1a');
      W.sign(['TEJON ST', 'PIKES PEAK AVE'], -7.6, 2.6, 2, 1.8, 0.6, { ry: Math.PI / 2, bg: '#1f6a3a', fg: '#fff' });
      ambient(W, { n: 120, color: '#ffffff', size: 0.035, area: 26, h: 6 });
      return { start: { x: 0, z: 34, yaw: yawFacing(0, -1) }, kennedy: { x: 2.4, z: 36 }, exit: { x: 8.5, z: -19.5, label: 'SPARKLE & SONS' }, bossAt: { x: 0, z: -36 },
        spawnZones: [[-12, -54, -7.5, 30], [7.5, -54, 12, 30], [-6, -54, 6, -40]],
        pickups: [['med', -9, -10], ['med', 9, 4], ['ammo', 0, -20], ['ammo', 0, 10], ['fingers', -11, -50, 20], ['fingers', 11, 30, 15]] };
    } },
  // 6 ─────────────────────────────── GARDEN OF THE GODS (day, Pikes Peak) — collect blue columbines
  { id: 'garden', name: 'Garden of the Gods', shift: 'SCENE 6 · SOMETHING BLUE', obj: 'Pick 12 blue columbines', music: 'garden', quota: 46, flowers: 12, outfits: ['troll', 'troll', 'hiker', 'tourist', 'troll'], mix: { walker: 0.35, runner: 0.2, brute: 0.35, spitter: 0.1 }, trolls: true,
    env: { sky: ['#2a68d8', '#d8ecf8'], fog: ['#d8d0c8', 60, 160], hemi: ['#fff4e6', '#6a4a30', 1.0], sun: ['#fff0d8', 2.8, 20, 28, -10], exposure: 0.92 },
    boss: { kind: 'zombie', name: 'THE TROLL KING OF KISSING CAMELS', outfit: 'troll', hp: 3400, scale: 2.6, charge: true, spit: 'rock', spitRate: 2.2 },
    build(W) {
      W.bounds = { minX: -40, maxX: 40, minZ: -40, maxZ: 40 };
      skyDome(W, { top: '#2a66d0', mid: '#90c6f0', bot: '#e0ecf4', sun: [0.85, 0.28], clouds: 0.55, seed: 10 });
      mountains(W, { a0: -1.2, a1: 1.2, radius: 130, peak: 52, base: 20, snow: 0.55, rock: '#465476', haze: '#b4c8de', hz: 0.3, peakAt: 0.5, seed: 21 });
      mountains(W, { a0: -1.5, a1: 1.5, radius: 112, peak: 18, base: 9, snow: 2, rock: '#4a5a4a', haze: '#a8b8b0', hz: 0.3, seed: 22, y0: -3 });
      W.floor(-60, 60, -60, 60, texMat('dirtG', T.dirt()), 4);
      const tr = new THREE.Mesh(new THREE.PlaneGeometry(5, 90), texMat('trailG', T.concrete('#c8a88a'))); tr.material.map.repeat.set(2, 30); tr.rotation.set(-Math.PI / 2, 0, 0.15); tr.position.set(0, 0.01, 0); W.group.add(tr);
      // the big fins (Kissing Camels / North Gateway style) + scattered smaller rocks
      redRock(W, -18, -26, 14, 13, 3.5, 0.2, 3); redRock(W, 16, -30, 11, 16, 3, -0.15, 7); redRock(W, -30, 6, 3, 10, 12, 0.1, 9, '#c0603a'); redRock(W, 28, 4, 3.5, 12, 10, -0.1, 12);
      redRock(W, -6, 20, 4, 5, 2.5, 0.8, 15, '#c87048'); redRock(W, 12, 14, 3, 4, 2, 0.3, 17, '#c87048'); redRock(W, -16, -6, 2.5, 3.5, 2, 1.2, 19); redRock(W, 20, -12, 2, 6, 2, 0.6, 23, '#d8a080');
      for (let i = 0; i < 46; i++) { const x = rand(-38, 38), z = rand(-38, 38); if (Math.abs(x - z * 0.15) < 4) continue; juniper(W, x, z, rand(0.8, 1.5)); }
      W.sign(['GARDEN OF THE GODS', 'please stay on trail · do not feed the trolls'], 3.6, 1.4, 30, 3.6, 1.1, { ry: Math.PI, bg: '#5a3a1e', colors: ['#f2e6c8', gold], box: 0.12 }); W.box(3.6, 0, 30, 0.15, 0.9, 0.15, texMat('postw', T.wood('#6a4a2a')));
      ambient(W, { n: 140, color: '#fff6d8', size: 0.04, area: 32, h: 8 });
      return { start: { x: 0, z: 34, yaw: yawFacing(0, -1) }, kennedy: { x: 2.5, z: 35 }, exit: { x: 0, z: -36, label: 'MINE SHAFT' }, bossAt: { x: 0, z: -16 },
        spawnZones: [[-38, -38, -22, 38], [22, -38, 38, 38], [-20, -38, 20, -32]],
        pickups: [['flower', -24, 22], ['flower', 22, 26], ['flower', -12, 10], ['flower', 8, 4], ['flower', -26, -12], ['flower', 30, -18], ['flower', -4, -12], ['flower', 14, -22], ['flower', -32, 30], ['flower', 34, 16], ['flower', -20, -34], ['flower', 4, 24],
          ['med', -10, 0], ['med', 18, 0], ['ammo', 0, -6], ['ammo', -20, 16], ['fingers', 36, -36, 25]] };
    } },
  // 7 ─────────────────────────────── THE GOLD MINE (boss: Old Man Grubstake)
  { id: 'mine', name: "The Lost Grubstake Mine", shift: 'SCENE 7 · GOLD FEVER', obj: 'Fight through the mine', music: 'mine', quota: 50, outfits: ['miner', 'miner', 'troll', 'hiker'], mix: { walker: 0.45, runner: 0.25, brute: 0.2, spitter: 0.1 }, mineGuns: true,
    env: { indoor: true, dark: true, sky: ['#050403', '#0a0806'], fog: ['#0e0a06', 10, 46], hemi: ['#ffd8a0', '#100806', 0.35], sun: ['#ffd0a0', 0.25, 3, 10, 4], exposure: 1.05 },
    boss: { kind: 'zombie', name: 'OLD MAN GRUBSTAKE', outfit: 'miner', hp: 6500, scale: 2.7, charge: true, spit: 'dynamite', spitRate: 2.0, miner: true, rock: true },
    build(W) {
      W.bounds = { minX: -30, maxX: 30, minZ: -60, maxZ: 12 };
      const rock = texMat('mineRock', T.stone('#5a4a3a')); const dirt = texMat('mineDirt', T.dirt());
      W.floor(-30, 30, -60, 12, dirt, 3); ceiling(W, 4.2, texMat('mineCeil', T.stone('#3a3028')));
      perimeter(W, 4.2, rock);
      // tunnel maze: main drift (x -3..3) south, side chambers, the big stope at the end for the boss
      wallZ(W, -3.2, -36, 12, 4.2, rock, [[-8, 3], [-24, 3]], 0.6); wallZ(W, 3.2, -36, 12, 4.2, rock, [[-2, 3], [-18, 3], [-30, 3]], 0.6);
      wallX(W, -36, -30, -3.2, 4.2, rock, [], 0.6); wallX(W, -36, 3.2, 30, 4.2, rock, [], 0.6);
      wallX(W, 4, -30, -3.2, 4.2, rock, [], 0.6); wallX(W, 4, 3.2, 30, 4.2, rock, [], 0.6);
      wallX(W, -14, -30, -12, 4.2, rock, [], 0.6); wallX(W, -26, 12, 30, 4.2, rock, [], 0.6); wallZ(W, 14, -36, -26, 4.2, rock, [], 0.6);
      for (let z = 9; z >= -34; z -= 4) mineTimber(W, 0, z, 0, 6.2, 3.6);
      rails(W, 0, 10, 0, -58);
      for (let z = 6; z >= -32; z -= 8) lantern(W, (z % 16 ? 2.7 : -2.7), 2.6, z);
      for (const [x, z] of [[-16, -6], [-20, -22], [16, -10], [22, -30], [-14, -48], [14, -48], [0, -52]]) lantern(W, x, 3.0, z);
      oreCart(W, 0.2, -12, 0); oreCart(W, -18, -8, 0.6); oreCart(W, 20, -32, 1.4); oreCart(W, 8, -50, 0.3);
      for (let i = 0; i < 26; i++) decalSplat(W, rand(-28, 28), rand(-58, 10), rand(0.8, 1.8));
      // gun crate at the entrance (rocket launcher + minigun)
      W.box(-1.8, 0, 8, 1.6, 0.8, 0.9, texMat('crate', T.wood('#7a5a30'))); W.sign(['KENNEDY\'S', 'DO NOT OPEN (OPEN IT)'], -1.8, 0.45, 8.47, 1.4, 0.5, { bg: '#3a4a20', colors: [gold, '#fff'] });
      W.sign(['THE LOST GRUBSTAKE MINE', 'est. 1891 · no refunds · no survivors'], 0, 3.3, 11.65, 5, 1.0, { ry: Math.PI, bg: '#2a1a0a', colors: [gold, '#e8d8b8'] });
      W.pointLight(0, 3, 8, 0xffd8a0, 10, 14); W.pointLight(0, 3.8, -45, 0xffb860, 18, 22);
      ambient(W, { n: 260, color: '#ffc880', size: 0.03, area: 26, h: 4, kind: 'dust' });
      const gold2 = []; for (const [x, z] of [[-1.5, 2], [1.5, -6], [-16, -2], [-22, -10], [-18, -28], [-24, -18], [16, -4], [24, -16], [20, -28], [26, -6], [-1, -20], [1, -30], [-20, -44], [-8, -54], [8, -54], [20, -46], [-26, -56], [26, -56], [0, -44], [12, -40]]) gold2.push(['gold', x, z, 1]);
      return { start: { x: 0, z: 6, yaw: yawFacing(0, -1) }, kennedy: { x: 1.6, z: 8 }, exit: { x: 0, z: -58, label: 'DAYLIGHT' }, bossAt: { x: 0, z: -48 },
        spawnZones: [[-28, -24, -5, -2], [5, -34, 28, -6], [-28, -34, -5, -28], [-28, -58, 28, -40]],
        pickups: [...gold2, ['med', -24, -6], ['med', 24, -24], ['med', 0, -38], ['ammo', 2, 0], ['ammo', -20, -30], ['ammo', 20, -12], ['ammo', 0, -40], ['fingers', 28, -2, 30]] };
    } },
];
