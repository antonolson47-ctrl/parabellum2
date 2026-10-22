// Game flow: title, shifts, level lifecycle, spawn director, Kennedy call-in, bosses, pickups, barks, results, Vendy's shop, endings.
import * as THREE from 'three';
import { gunIcon, upgradeCfg } from './guns.js';
import { assetURL } from './assets.js';
import { E, render, trackFrame, setQuality, QUALITY, resize } from './engine.js';
import { initAntiZoom, resetPageZoom, pageScale, ZOOM } from './antizoom.js';
import { G } from './state.js';
import { I, initInput, bindButton, pollKeyboard, resetInput, clearTouches, fireHeldByTouch, activeTouches } from './input.js';
import { H, FINGER, buildHUD, showHUD, say, toast, rule, float, hitMarker, bump, hudTick, project, setText, setStyle, clearHudCache } from './hud.js';
import { World, T, clearMats } from './world.js';
import { LEVELS } from './levels.js';
import { Player } from './player.js';
import { Kennedy } from './kennedy.js';
import { Z, createPool, clearZombies, freeZombie, aliveCount, updateZombies } from './zombies.js';
import { makeBoss, Minion } from './bosses.js';
import { P, spawnPickup, clearPickups, updatePickups } from './pickups.js';
import { initFX, updateFX, clearFX, particle } from './fx.js';
import { A, initAudio, playMusic, stopMusic, sfx, setVolumes, suspendAudio } from './audio.js';
import { S, save, resetSave, up, SHOP } from './save.js';
import { BARKS, KENNEDY, RULES } from './text.js';
import { WEAPONS, ORDER } from './weapons.js';
import { makeCharacter, makeZombie, LIB, CAST } from './chars.js';
import { playCine, cineActive, cineTick, actor, cineInfo } from './story.js';
import { bag, rand, randi, pick, clamp, lerp, angDiff } from './util.js';
import { decal } from './fx.js';
import { updateProps, propBlast } from './grill.js';
import { allTargets } from './zombies.js';

const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
const bk = {}; for (const k in BARKS) bk[k] = bag(BARKS[k]);
let barkCd = 0, lowHpT = 0;
function bark(cat, pri = 1, chance = 1) { if (Math.random() > chance || !bk[cat]) return; if (barkCd > 0 && pri < 2) return; if (say('SHAYLA', bk[cat](), 3.4, pri)) barkCd = 3.2 + Math.random() * 2.5; }
function showRule(n) { if (S.data.rulesSeen.includes(n)) return; S.data.rulesSeen.push(n); const r = RULES.find(r => r[0] === n); if (r) rule(n, r[1]); save(); }
const CSS2 = `
.title .foot{margin-top:12px;font-family:'Barlow Condensed';font-weight:600;font-size:15px;color:#ddd;text-shadow:0 2px 3px #000;display:flex;gap:14px;align-items:center;justify-content:center}
.title .foot svg{width:16px;height:16px;vertical-align:-3px}
.title .credit{position:absolute;bottom:calc(8px + env(safe-area-inset-bottom));font-size:11px;opacity:.55;font-family:'Barlow Condensed'}
.lvlgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;width:min(900px,92vw);max-height:66vh;overflow:auto}
.lvl{background:rgba(10,14,18,.85);border:2px solid #3a4a55;border-radius:10px;padding:8px 10px;text-align:left;cursor:pointer}
.lvl .s{font-family:'Black Ops One';font-size:12px;color:#ffd84a}.lvl .n{font-family:'Black Ops One';font-size:15px;line-height:1.05}.lvl .m{font-size:13px;opacity:.75}
.lvl.lock{opacity:.4;pointer-events:none}.lvl.done{border-color:#57d68d}
.dead h1{font-family:'Butcherman','Black Ops One';font-weight:400;font-size:min(12vw,96px);margin:0;color:#ff3b3b;text-shadow:0 0 20px #f00,0 4px 0 #400}
.dead p{font-size:20px;font-weight:600;max-width:80vw}
.shopfoot{display:flex;gap:10px;justify-content:flex-end;margin-top:8px}
.fing{display:flex;align-items:center;gap:4px;font-family:'Black Ops One';font-size:20px}.fing svg{width:22px;height:22px}
.loadsc{position:absolute;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Black Ops One';pointer-events:auto}
.loadsc .sh{color:#ffd84a;font-size:clamp(14px,2.4vw,20px)}.loadsc .nm{font-size:clamp(22px,5vw,46px);text-align:center;padding:0 10px}.loadsc .tip{margin-top:14px;font-family:'Barlow Condensed';font-weight:600;color:#bbb;max-width:80vw;text-align:center}
.loadsc .lb{width:240px;height:8px;border:1px solid #844;border-radius:4px;margin-top:12px;overflow:hidden}.loadsc .lb div{height:100%;background:#c22;width:0;transition:width .2s}
`;
// ───────────────────────────── init
let titleScene = null;
export function initGame() {
  const st = document.createElement('style'); st.textContent = CSS2; document.head.appendChild(st);
  initInput(H.root); initFX(E.scene);
  G.player = new Player(); G.kennedy = new Kennedy(); G.kennedy.root.visible = false;
  // buttons
  bindButton(document.getElementById('bfire'), () => { I.fire = true; }, () => { if (!fireHeldByTouch()) I.fire = false; }); // a FIRE-held thumb may also be dragging to turn
  bindButton(H.bturn, () => { I.pressed.turn180 = true; });
  bindButton(document.getElementById('breload'), () => { I.pressed.reload = true; });
  bindButton(document.getElementById('bswap'), () => { I.pressed.swap = true; });
  bindButton(document.getElementById('bmelee'), () => { I.pressed.melee = true; });
  bindButton(H.autofire, () => { S.data.settings.autofire = !S.data.settings.autofire; save(); });
  bindButton(document.getElementById('pausebtn'), () => pause(true));
  bindButton(H.resetv, () => resetView(true));
  initAntiZoom({ onAllUp: clearTouches, onReset: () => resetView(true), autoOk: () => true });
  // hooks
  G.onKill = onKill; G.onGib = () => { S.data.stats.gibs++; bark('gib', 1, 0.45); };
  G.onSnatch = z => { bark('snatch', 2); toast('BURGER THIEF!', `-${z.carry} 🍔 · kill him to get them back`, 2.6, true); };
  G.onReload = () => bark('reload', 1, 0.3);
  G.onHurt = (dmg, src) => { hitFrom(src); if (G.player.hp < G.player.maxHp * 0.3 && lowHpT <= 0) { lowHpT = 12; bark('lowhp', 2); } else bark('hurt', 1, 0.18); showRule(2); };
  G.onPlayerDeath = onDeath; G.onSalts = () => { toast('SMELLING SALTS', 'Back on your feet, bride', 2.5); say('SHAYLA', "Oh, I'm not dying before my fucking wedding.", 3, 3); };
  G.onShoot = () => { }; G.onHitMarker = head => { hitMarker(head); };
  G.onBedpan = () => { bark('bedpan', 1, 0.5); showRule(9); };
  G.onPickup = onPickup; G.onKennedyDown = () => { toast('KENNEDY IS DOWN', 'Stand next to him to pick him up', 2.6, true); };
  G.onTeam = teamEvent; G.onGrab = z => { toast('KENNEDY GOT ONE!', 'HEADSHOT IT for a tandem finisher', 2.2); };
  G.onRocket = rocketBlast; G.spawnWave = n => { for (let i = 0; i < n; i++) { const z = freeZombie(); if (!z) break; const p = spawnPoint(tmp); if (p) z.spawn(p.clone(), Math.random() < 0.3 ? 'runner' : 'walker'); } };
  G.onBlast = p => { G.player.shake = 0.35; if (p) propBlast(G.world, p, 4, 9); };
  G.needsAmmo = () => ORDER.some(k => k !== 'pistol' && G.player.available().includes(k) && G.player.ammo[k].res < G.player.wstats(k).reserve);
  G.callKennedy = () => { if (G.level && G.level.callReady()) teamUp(); }; G.spawnMinion = spawnMinion; G.onMinionKill = m => { addFingers(1, m.pos); };
  G.onBossDead = () => bossDefeated(); G.spawnRiser = (x, z) => { const zz = freeZombie(); if (zz && G.world.isOpen(x, z)) zz.spawn(new THREE.Vector3(x, 0, z), Math.random() < 0.4 ? 'runner' : 'walker', { rise: true }); };
  G.sayLine = (a, ta, b2, tb) => { say(a, ta, 3.6, 3); if (b2 === 'KENNEDY') setTimeout(() => G.kennedy.active && G.kennedy.say(tb, 3.6, 3), 3800); };
  G.onBossTaunt = () => { const t = pick(['He keeps POINTING at me. Rude.', 'Point at me one more time, hog.', 'Is he... calling his shot? Oh, it is ON.']); say('SHAYLA', t, 2.6, 2); }; G.onBossPhase = t => { say('SHAYLA', t, 3, 3); sfx('roar', null, 0.6); };
  G.onTenureDenied = () => { toast('TENURE DENIED', 'His orbs are gone. He can bleed now.', 2.6); say('SHAYLA', 'Tenure DENIED, motherfucker.', 3, 3); };
  // first gesture -> audio
  const unlock = () => { try { if (!A.ctx) { initAudio(); setVolumes(S.data.settings.music, S.data.settings.sfx); if (G.mode === 'title' || G.mode === 'menu') playMusic('title'); } else if (A.ctx.state !== 'running') { const r = A.ctx.resume(); r && r.catch && r.catch(() => { }); } } catch (e) { console.warn('audio unlock', e); } };
  addEventListener('touchend', unlock, true);
  addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.mode === 'play') pause(true); suspendAudio(true); } else suspendAudio(false); });
  addEventListener('resize', () => { if (H.phint) H.phint.style.display = 'none'; });
  window.__PB = testHooks();
  buildTitleScene(); titleScreen();
  let last = performance.now();
  const loop = now => { requestAnimationFrame(loop); let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; if (G.fast) dt = 1 / 30; slowmoTick(dt); frame(dt); };
  requestAnimationFrame(loop);
}
// ───────────────────────────── title backdrop (3D: Shayla, Kennedy, shambling horde)
function buildTitleScene() {
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#0a0710'); sc.fog = new THREE.Fog('#120a14', 6, 22);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: T.asphalt(), roughness: 0.9 })); g.material.map.repeat.set(12, 12); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; sc.add(g);
  sc.add(new THREE.HemisphereLight('#6a7a9a', '#100808', 0.5));
  const key = new THREE.DirectionalLight('#ffd8b0', 2.2); key.position.set(3, 5, 6); key.castShadow = E.q.shadows; key.shadow.mapSize.set(1024, 1024); const c = key.shadow.camera; c.left = c.bottom = -6; c.right = c.top = 6; key.shadow.bias = -0.0004; sc.add(key);
  const red = new THREE.PointLight('#ff5fa8', 30, 14, 1.5); red.position.set(-3, 2.5, -3); sc.add(red); const teal = new THREE.PointLight('#ffd84a', 18, 12, 1.5); teal.position.set(4, 2, -1); sc.add(teal);
  const sh = actor('shayla'); sc.add(sh.root); sh.root.position.set(-0.45, 0, 0.6); sh.root.rotation.y = 0.25; sh.play('Pistol_Idle_Loop', 0);
  const kn = actor('kennedy'); sc.add(kn.root); kn.root.position.set(0.75, 0, 0.1); kn.root.rotation.y = -0.3; kn.play('Pistol_Aim_Neutral', 0);
  const zs = []; const outfits = ['hogfan', 'miner', 'church', 'troll', 'hogfan', 'cowboy', 'tourist'];
  for (let i = 0; i < 7; i++) { const z = makeZombie(outfits[i], 50 + i * 3, i % 2 === 1); z.root.position.set(-4 + i * 1.3 + rand(-.3, .3), 0, -4 - rand(0, 3)); z.root.rotation.y = rand(-0.3, 0.3); z.play('Walk_Loop', 0, { speed: 0.7 }); z.cur.time = rand(0, 2); sc.add(z.root); zs.push(z); }
  const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 80);
  titleScene = { sc, cam, sh, kn, zs, t: 0, red };
}
function renderTitle(dt) {
  const T = titleScene; if (!T) return; T.t += dt;
  if (T.sh.root.parent !== T.sc) { T.sc.add(T.sh.root); T.sh.root.position.set(-0.45, 0, 0.6); T.sh.root.rotation.set(0, 0.25, 0); T.sh.play('Pistol_Idle_Loop', 0); }
  if (T.kn.root.parent !== T.sc) { T.sc.add(T.kn.root); T.kn.root.position.set(0.75, 0, 0.1); T.kn.root.rotation.set(0, -0.3, 0); T.kn.play('Pistol_Aim_Neutral', 0); }
  T.sh.mixer.update(dt); T.kn.mixer.update(dt); for (const z of T.zs) { z.mixer.update(dt); z.root.position.z += dt * 0.25; if (z.root.position.z > -1.5) z.root.position.z = -7.5; }
  T.red.intensity = 26 + Math.sin(T.t * 7) * 4 + (Math.random() < 0.02 ? -20 : 0);
  const a = Math.sin(T.t * 0.15) * 0.35; const portrait = innerWidth < innerHeight;
  T.cam.position.set(Math.sin(a) * 4.2, 1.25, 3.6 + Math.cos(a) * 0.6 + (portrait ? 2.2 : 0)); T.cam.lookAt(0.1, portrait ? 1.6 : 1.45, 0); T.cam.aspect = innerWidth / innerHeight; T.cam.fov = portrait ? 55 : 40; T.cam.updateProjectionMatrix();
  E.renderer.toneMappingExposure = 1.0; E.renderer.render(T.sc, T.cam);
}
// ───────────────────────────── screens
function screen(html, cls = '') { H.screens.innerHTML = html ? `<div class="screen ${cls}">${html}</div>` : ''; return H.screens.firstChild; }
const $s = id => H.screens.querySelector('#' + id);
// menu taps: sound can never block the action; errors surface on the on-screen overlay instead of failing silently
const safe = (f, tag) => { try { const r = f(); if (r && r.catch) r.catch(e => reportErr(tag, e)); } catch (e) { reportErr(tag, e); } };
const reportErr = (tag, e) => { console.error(tag, e); (window.__PB_ERRORS || []).push(tag + ': ' + (e && (e.stack || e.message) || e)); window.__PBshowErr && window.__PBshowErr(tag + ': ' + (e && e.message || e)); };
const tapSfx = () => { try { sfx('click'); } catch (e) { } };
const onClick = (id, f) => { const e = $s(id); if (e) e.addEventListener('click', e2 => { e2.stopPropagation(); tapSfx(); safe(f, 'button ' + id); }); };
const ITEMS = [['brooch', 'Something old'], ['girdle', 'Something borrowed'], ['necklace', 'Something new'], ['blue', 'Something blue']];
const itemCount = () => ITEMS.filter(([k]) => S.data.items && S.data.items[k]).length;
function haulLine() { return `<span>${FINGER}${S.data.fingers}</span><span>💍 ${itemCount()}/4</span><span>🪙 ${S.data.gold || 0} gold</span>`; }
export function titleScreen() {
  G.mode = 'title'; showHUD(false); I.enabled = false; if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock(); if (A.ctx) playMusic('title');
  const last = LEVELS.length - 1; const next = Math.min(S.data.unlocked, last); const started = S.data.completed.length > 0; const beaten = S.data.completed.includes(last);
  screen(`<div class="coverbg" style="background-image:url('${assetURL('cover.jpg')}')"></div><div class="coverart" style="background-image:url('${assetURL('cover.jpg')}')" role="img" aria-label="PARABELLUM 2: Something Old, Something Undead"></div><h1 class="sr">PARABELLUM 2</h1><h2 class="sr">Something Old, Something Undead</h2><div class="tbottom">
  <div class="age">18+ · GRAPHIC GORE &amp; NONSTOP SWEARING<small>Blood, dismemberment, exploding heads and a bride-to-be who swears like a sailor. Grown-ups only.</small></div>
  <div class="menu"><button class="b" id="tplay">${beaten ? 'REPLAY' : started ? 'CONTINUE · SCENE ' + (next + 1) : 'SAY I DO'}</button><button class="b alt" id="tshifts">CHAPTERS</button><button class="b alt" id="tshop">VENDY'S</button><button class="b alt" id="tset">SETTINGS</button></div>
  <div class="foot">${haulLine()}</div><div class="credit">A prequel to PARABELLUM · an original parody for Shayla &amp; Kennedy · all music &amp; sound procedurally generated</div></div>`, 'title cover');
  onClick('tplay', () => startLevel(beaten ? 0 : next)); onClick('tshifts', shiftsScreen); onClick('tshop', () => shopScreen(titleScreen)); onClick('tset', () => settingsScreen(titleScreen));
}
function shiftsScreen() {
  G.mode = 'menu'; const all = /[?&](debug|chapters=all)/.test(location.search) || G.allChapters; const lk = i => !all && i > S.data.unlocked;
  const cards = LEVELS.map((L, i) => `<div class="lvl ${lk(i) ? 'lock' : ''} ${S.data.completed.includes(i) ? 'done' : ''}" data-i="${i}"><div class="s">${L.shift}</div><div class="n">${L.name}</div><div class="m">${lk(i) ? '🔒 Locked' : S.data.completed.includes(i) ? '✔ Cleared · replay for more fingers' : L.obj}</div></div>`).join('');
  screen(`<div class="panel" style="background:rgba(8,10,12,.8)"><h3>CHAPTERS</h3><div class="lvlgrid">${cards}</div><div class="shopfoot"><button class="b alt small" id="sback">BACK</button></div></div>`, 'title');
  H.screens.querySelectorAll('.lvl').forEach(el => el.addEventListener('click', () => { if (el.classList.contains('lock')) return; tapSfx(); safe(() => startLevel(+el.dataset.i), 'chapter'); }));
  onClick('sback', titleScreen);
}
function settingsScreen(back) {
  const st = S.data.settings; const prev = G.mode; G.mode = G.mode === 'play' ? 'paused' : 'menu';
  const sel = (id, opts, v) => `<select id="${id}">${opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  screen(`<div class="panel"><h3>SETTINGS</h3>
  <div class="row"><label>Graphics quality</label>${sel('squal', [['low', 'Low (fastest)'], ['medium', 'Medium'], ['high', 'High (bloom)']], st.quality)}</div>
  <div class="row"><label>Aim assist</label>${sel('saim', [['off', 'Off'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], st.aim)}</div>
  <div class="row"><label>Auto-fire when on target</label>${sel('sauto', [['true', 'On'], ['false', 'Off']], st.autofire)}</div>
  <div class="row"><label>Look sensitivity</label><input id="ssens" type="range" min="0.4" max="2.2" step="0.05" value="${st.sens}"></div>
  <div class="row"><label>Invert look Y</label>${sel('sinv', [['false', 'No'], ['true', 'Yes']], st.invertY)}</div>
  <div class="row"><label>Music volume</label><input id="smus" type="range" min="0" max="1" step="0.05" value="${st.music}"></div>
  <div class="row"><label>SFX volume</label><input id="ssfx" type="range" min="0" max="1" step="0.05" value="${st.sfx}"></div>
  <div class="row"><label>Subtitles</label>${sel('ssub', [['true', 'On'], ['false', 'Off']], st.subs)}</div>
  <div class="shopfoot"><button class="b alt small" id="sreset">RESET PROGRESS</button><button class="b small" id="sdone">DONE</button></div></div>`, 'title');
  const v = id => $s(id).value;
  onClick('sdone', () => { st.quality = v('squal'); st.aim = v('saim'); st.autofire = v('sauto') === 'true'; st.sens = +v('ssens'); st.invertY = v('sinv') === 'true'; st.music = +v('smus'); st.sfx = +v('ssfx'); st.subs = v('ssub') === 'true'; applySettings(); save(); G.mode = prev; back(); });
  onClick('sreset', () => { if (confirm('Reset all progress, fingers and food?')) { resetSave(); G.mode = prev; titleScreen(); } });
}
function applySettings() { const st = S.data.settings; if (E.qname !== st.quality) { setQuality(st.quality); if (G.env) G.env.sun.shadow.mapSize.set(E.q.shadowSize, E.q.shadowSize); } I.sens = st.sens; I.invertY = st.invertY; setVolumes(st.music, st.sfx); H.sub.style.visibility = st.subs ? '' : 'hidden'; }
const VENDY = ["Welcome to Vendy's! I take fingers. Don't ask what I do with them.", "Fingers in, firepower out. That's the circle of life, sweetie.", "Ooh, those are fresh. Still warm. Love that for you.", "No refunds. No questions. No fingers left behind.", "Kennedy already bought three of these. Don't tell him I told you."];
// shop thumbnails are rendered from the actual 3D gun models (the upgrade card shows that upgrade fitted)
function shopIcon(it) {
  const kind = it.weapon || (it.id.match(/^(pistol|rifle|shotgun|defib)_/) || [])[1]; if (!kind) return '';
  let cfg; if (it.weapon) cfg = upgradeCfg(kind, up); else { const lv = Math.min(it.cost.length, up(it.id) + 1); cfg = upgradeCfg(kind, k => (k === it.id ? lv : 0)); }
  try { return `<img class="ico" src="${gunIcon(E.renderer, kind, cfg)}" alt="">`; } catch (e) { console.warn('icon', e); return ''; }
}
function shopScreen(back, nextLabel) {
  G.mode = 'shop'; showHUD(false); if (A.ctx) playMusic('shop');
  const draw = () => {
    const items = SHOP.filter(it => (it.req === undefined || S.data.unlocked >= it.req) && (!it.need || S.data.owned[it.need]));
    const cards = items.map(it => {
      const lvl = it.weapon ? (S.data.owned[it.weapon] ? 1 : 0) : up(it.id); const max = it.cost.length; const owned = lvl >= max; const cost = owned ? 0 : it.cost[lvl];
      return `<div class="item ${owned ? 'owned' : ''}">${shopIcon(it)}<div class="n">${it.name}</div><div class="d">${it.desc}</div><div class="lv">${it.cat}${max > 1 ? ` · Lv ${lvl}/${max}` : ''}</div><button class="buybtn" data-id="${it.id}" ${owned || S.data.fingers < cost ? 'disabled' : ''}>${owned ? 'OWNED' : `${FINGER} ${cost}`}</button></div>`;
    }).join('');
    screen(`<div class="shop"><div class="hd"><h3>VENDY'S VENDING EMPORIUM</h3><div class="vendy">“${pick(VENDY)}”</div><div class="fing">${FINGER}<span>${S.data.fingers}</span></div></div><div class="grid">${cards}</div><div class="shopfoot"><button class="b small" id="shopgo">${nextLabel || 'BACK'}</button></div></div>`);
    H.screens.querySelectorAll('.buybtn').forEach(b => b.addEventListener('click', () => safe(() => buy(b.dataset.id), 'buy')));
    onClick('shopgo', back);
  };
  const buy = id => {
    const it = SHOP.find(s => s.id === id); const lvl = it.weapon ? (S.data.owned[it.weapon] ? 1 : 0) : up(id); if (lvl >= it.cost.length) return; const cost = it.cost[lvl]; if (S.data.fingers < cost) return;
    S.data.fingers -= cost; if (it.weapon) S.data.owned[it.weapon] = true; else S.data.up[id] = lvl + 1; save(); sfx('buy'); draw();
  };
  draw();
}
// ───────────────────────────── level lifecycle
let npc = null, minions = [], dirT = 0, multi = { n: 0, t: 0 };
function cleanupLevel() {
  clearZombies(); clearPickups(); clearFX(); Z.hittables.length = 0;
  for (const m of minions) m.mesh.removeFromParent(); minions = [];
  if (G.level && G.level.boss) { const b = G.level.boss; if (b.mesh) b.mesh.removeFromParent(); if (b.bike) b.bike.removeFromParent(); if (b.orbs) b.orbs.forEach(o => o.mesh.removeFromParent()); }
  if (G.world) { G.world.dispose(); G.world = null; }
  if (G.env) { for (const o of G.env.objs) E.scene.remove(o); G.env = null; }
  if (H.boss) H.boss.style.display = 'none';
  if (npc) { npc.root.removeFromParent(); npc = null; } G.teamT = 0; G.slowT = 0; G.timeScale = 1;
  G.kennedy.leave(); clearHudCache();
}
function applyEnv(env, bounds) {
  const objs = [];
  E.scene.background = env.indoor ? new THREE.Color(env.sky[0]) : T.sky(env.sky[0], env.sky[1]);
  E.scene.fog = new THREE.Fog(env.fog[0], env.fog[1], env.fog[2]);
  const hemi = new THREE.HemisphereLight(env.hemi[0], env.hemi[1], env.hemi[2]); E.scene.add(hemi); objs.push(hemi);
  const [sc, si, sx, sy, sz] = env.sun; const sun = new THREE.DirectionalLight(sc, si); sun.castShadow = E.q.shadows; sun.shadow.mapSize.set(E.q.shadowSize, E.q.shadowSize);
  const cam = sun.shadow.camera; cam.left = cam.bottom = -20; cam.right = cam.top = 20; cam.near = 1; cam.far = 90; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  E.scene.add(sun); E.scene.add(sun.target); objs.push(sun, sun.target);
  const dir = new THREE.Vector3(sx, sy, sz).normalize();
  E.renderer.toneMappingExposure = env.exposure || 1;
  G.env = { objs, sun, hemi, dir, exposure: env.exposure || 1 };
}
function loadingScreen(L, i) { screen(`<div class="loadsc"><div class="sh">${L.shift}</div><div class="nm">${L.name}</div><div class="lb"><div id="lbv"></div></div><div class="tip">${pick(TIPS)}</div></div>`); }
const TIPS = ['Tip: Kennedy covers you while you reload. Reload near him and he goes full bodyguard.', 'Tip: when Kennedy grabs a zombie, HEADSHOT it for a slow-mo TANDEM FINISHER.', 'Tip: hit the same zombie as Kennedy for a 💞 COUPLE COMBO.', 'Tip: fill the pink partner meter, then tap TEAM UP for slow-mo triple damage.', 'Tip: if Kennedy goes down, stand next to him to pick him up. He returns the favor.', 'Tip: headshots pay extra fingers. Fingers buy guns at Vendy\'s.', 'Tip: the lucky girdle is +10% confidence. Confidence is armor.'];
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
export async function startLevel(i) {
  const L = LEVELS[i]; G.mode = 'loading'; I.enabled = false; resetInput(); showHUD(false); loadingScreen(L, i); await nextFrame(); await nextFrame();
  const bar = p => { const e = $s('lbv'); if (e) e.style.width = (p * 100) + '%'; };
  cleanupLevel(); bar(0.1); await nextFrame();
  G.levelIdx = i; const W = new World(E.scene); W.camRef = E.camera; G.world = W; const anc = L.build(W); W.finalize(); bar(0.35); await nextFrame();
  applyEnv(L.env, W.bounds);
  G.level = { def: L, anc, kills: 0, quota: L.quota || 0, survive: L.survive || 0, timeLeft: L.survive || 0, phase: 'fight', boss: null, kennedyCalled: false, dark: !!L.env.dark, t: 0,
    flowers: 0, flowersNeed: L.flowers || 0, combos: 0, tandems: 0,
    callReady() { return G.team >= 100 && !(G.teamT > 0) && this.phase !== 'done'; }, slowZone() { return false; } };
  G.run = { burgers: 0, cokes: 0, fingers: 0, kills: 0, heads: 0, gibs: 0, gold: 0 }; G.team = 0; G.teamT = 0; G.girdle = !!(S.data.items && S.data.items.girdle);
  G.player.reset(anc.start, anc.start.yaw); G.time = 0;
  createPool(L.outfits, E.q.maxZ); bar(0.7); await nextFrame();
  for (const p of anc.pickups || []) spawnPickup(p[0], p[1], p[2], p[3]);
  if (anc.npc) { npc = makeCharacter(anc.npc.key); npc.root.position.set(anc.npc.x, 0, anc.npc.z); npc.play('Idle_Loop', 0); E.scene.add(npc.root); }
  // warm up shaders so the first fight doesn't hitch
  for (const z of Z.list) { z.root.visible = true; z.root.position.set(anc.start.x, -50, anc.start.z); }
  G.player.eye(E.camera.position); E.camera.rotation.set(0, anc.start.yaw, 0, 'YXZ'); E.camera.updateMatrixWorld();
  try { E.renderer.compile(E.scene, E.camera); } catch (e) { }
  render(); for (const z of Z.list) { z.root.visible = false; }
  bar(1); await nextFrame();
  // story beats
  if (i === 0 && !S.data.seenIntro) { await runCine('intro'); S.data.seenIntro = true; save(); }
  G.kennedy.arrive({ x: anc.kennedy.x, z: anc.kennedy.z }, anc.start.yaw); G.level.kennedyCalled = true; if (up('k_grab')) G.kennedy.grabBoost = true;
  screen(''); showHUD(true); applySettings(); G.mode = 'play'; I.enabled = true; dirT = 1.5; THR.hit.l = THR.hit.r = THR.hit.t = THR.hit.b = 0; showLookHint();
  if (A.ctx) playMusic(L.music);
  setTimeout(() => { if (G.mode === 'play') { say('SHAYLA', bk.levelStart(), 3.6, 2); barkCd = 4; } }, 600);
  if (i === 0) { setTimeout(() => showRule(1), 4000); setTimeout(() => showRule(2), 18000); } if (i === 1) setTimeout(() => showRule(3), 6000); if (i === 2) setTimeout(() => showRule(4), 6000);
  if (L.mineGuns) setTimeout(() => { if (G.mode !== 'play') return; toast('NEW GUNS!', "Grandpa's minigun + the Honeymoon rocket launcher · tap SWAP", 3.6); H.bswap.classList.add('glow'); }, 1800);
  toast(L.shift, L.flowersNeed ? `${L.obj}` : `${L.obj} · ${L.quota} kills`, 3);
  if (E.portrait) { H.phint.style.display = 'block'; setTimeout(() => H.phint.style.display = 'none', 3500); }
}
async function runCine(name) {
  const prev = G.mode; G.mode = 'cine'; I.enabled = false; resetInput(); showHUD(false); if (document.pointerLockElement) document.exitPointerLock();
  screen(''); const pr = playCine(name); if (G.autoSkipCine) setTimeout(() => window.__PB.skipCine(), G.autoSkipCine); await pr; G.mode = prev;
}
// ───────────────────────────── spawn director
function spawnPoint(out) {
  const zones = G.level.anc.spawnZones; const pl = G.player; const fx = -Math.sin(pl.yaw), fz = -Math.cos(pl.yaw);
  for (let k = 0; k < 16; k++) {
    const z = pick(zones); const x = rand(z[0], z[2]), y = rand(z[1], z[3]); if (!G.world.isOpen(x, y)) continue; const dx = x - pl.pos.x, dz = y - pl.pos.z, d = Math.hypot(dx, dz); if (d < 9) continue;
    const dot = (dx * fx + dz * fz) / d; const inView = dot > 0.45 && d < 24; if (inView && k < 12) continue;
    if (dot < -0.35 && d < 14 && k < 12) continue; // fairness: no fresh spawns right behind your back (they still flank and chase from behind)
    return out.set(x, 0, y);
  }
  return null;
}
function pickType(mix) { let r = Math.random(), acc = 0; for (const k in mix) { acc += mix[k]; if (r < acc) return k; } return 'walker'; }
function director(dt) {
  const L = G.level; if (L.phase === 'done' || L.phase === 'exit') return; dirT -= dt; if (dirT > 0) return;
  const lv = G.levelIdx; const alive = aliveCount() - (L.boss && L.boss.z && !L.boss.z.dead ? 1 : 0);
  const cap = Math.min(E.q.maxZ - 1, Math.round(6 + lv * 1.3 + (L.survive ? 6 : 0))) * (L.phase === 'boss' ? 0.5 : 1);
  const remaining = L.survive ? 999 : L.quota - L.kills - alive;
  dirT = Math.max(0.35, 1.25 - lv * 0.08) * (L.phase === 'boss' ? 2.2 : 1) * (L.survive ? 0.6 : 1);
  if (alive >= cap || (remaining <= 0 && L.phase === 'fight')) return;
  const z = freeZombie(); if (!z) return; const p = spawnPoint(tmp); if (!p) return;
  const beh = pickType(L.def.mix); z.spawn(p.clone(), beh, { rise: !L.def.env.indoor && Math.random() < 0.3 });
}
function spawnMinion(kind, pos, hp) {
  let m = minions.find(m => !m.alive && m.kind === kind); if (!m) { if (minions.filter(m => m.kind === kind).length > 20) return; m = new Minion(kind); minions.push(m); Z.hittables.push(m); }
  m.spawn(new THREE.Vector3(pos.x, 0, pos.z), hp);
}
// ───────────────────────────── combat events
function addFingers(n, pos) {
  n = Math.max(1, Math.round(n)); G.run.fingers += n; S.data.fingers += n; bump('chipf');
  if (pos) { const s = project(tmp2.copy(pos).setY((pos.y || 0) + 1.9), E.camera); if (!s.behind) float(s.x, s.y, `+${n} ${FINGER.replace('<svg', '<svg width="18" height="18"')}`, 18); }
}
const FING = { walker: 2, runner: 2, brute: 6, spitter: 3, shusher: 3, snatcher: 4, boss: 0 };
function onKill(z, region, src, shotgunClose) {
  const L = G.level; if (!L) return;
  if (z.reserved || z.beh === 'boss') { if (L.boss && L.boss.z === z) bossDefeated(); return; }
  L.kills++; G.run.kills++; S.data.stats.kills++; if (region === 'head') { G.run.heads++; S.data.stats.headshots++; }
  let f = (FING[z.beh] || 2) + (region === 'head' ? 2 : 0) + (shotgunClose ? 1 : 0); f *= 1 + G.levelIdx * 0.1; addFingers(f, z.pos);
  const byPlayer = src !== 'kennedy';
  if (z.wasGrabbed && byPlayer) { L.tandems++; addFingers(15, z.pos); toast('TANDEM FINISHER!', '+15 fingers · teamwork makes the dream work', 2); slowmo(0.9, 0.2); G.kennedy.say(pick(KENNEDY.tandem), 2.5, 3); teamEvent('tandem'); }
  else if (G.time - (z.kHitT ?? -99) < 2.5 && G.time - (z.pHitT ?? -99) < 2.5) { L.combos++; addFingers(4); float(innerWidth / 2, innerHeight * 0.36, '💞 COUPLE COMBO +4', 22); sfx('combo'); teamEvent('combo'); if (Math.random() < 0.25) G.kennedy.say(pick(KENNEDY.combo), 2, 1); }
  else teamEvent(byPlayer ? 'kill' : 'kkill');
  if (byPlayer && region === 'head' && !z.wasGrabbed && (Math.random() < 0.1 || z.beh === 'brute')) slowmo(0.55, 0.25);
  if (z.carry > 0) { addFingers(z.carry * 2, z.pos); z.carry = 0; }
  const dropA = 0.07 + (up('k_ammo') && G.kennedy.active ? 0.08 : 0); if (Math.random() < dropA && G.needsAmmo()) spawnPickup('ammo', z.pos.x, z.pos.z); else if (Math.random() < 0.035) spawnPickup('med', z.pos.x, z.pos.z);
  multi.n = multi.t > 0 ? multi.n + 1 : 1; multi.t = 1.4;
  if (multi.n === 3) { bark('multi', 2); toast('TRIPLE THREAT', '+5 bonus fingers', 1.6); addFingers(5); slowmo(0.6, 0.3); }
  else if (region === 'head') { bark('headshot', 1, 0.33); showRule(7); }
  else bark('kill', 1, 0.28);
  if (L.kills === 1 && G.levelIdx === 0) setTimeout(() => showRule(3), 1500);
  if (z.beh === 'spitter') showRule(4);
  if (L.phase === 'fight' && L.kills >= L.quota && L.flowers >= L.flowersNeed) spawnBoss();
}
function spawnBoss() {
  const L = G.level; if (!L.def.boss || L.phase !== 'fight') return; const def = { ...L.def.boss }; L.phase = 'boss'; if ((L.def.id === 'mine' || L.def.id === 'stadium' || L.def.id === 'arkadelphia' || L.def.id === 'square' || L.def.id === 'springs') && A.ctx) playMusic('boss');
  const at = L.anc.bossAt; const b = makeBoss(def, at); L.boss = b; if (!b.z) Z.hittables.push(b);
  H.boss.style.display = 'block'; setText('bossn', def.name); sfx('roar', null, 1); A.intensity = 1;
  if (def.hog) { toast('BOSS INCOMING', def.name, 3.4, true); slowmo(1.2, 0.35); b.aT = 5; b.state = { kind: 'taunt', t: -2.5 }; b.z.hold = true; b.z.ch.play('Idle_Loop', 0.2);
    setTimeout(() => say('SHAYLA', "Oh, HELL no. The mascot's eaten the whole marching band. And he's... three stories tall.", 4, 3), 600);
    setTimeout(() => G.kennedy.active && G.kennedy.say("Babe, he's pointing at you. I think that's flirting. Shoot him in the snout.", 4, 3), 4800);
    setTimeout(() => say('SHAYLA', "Nobody points at the bride. Pig. SOOIE.", 3, 3), 9000); return; }
  if (def.sheriff) { toast('BOSS INCOMING', def.name, 3.4, true); slowmo(1.2, 0.35); b.aT = 4.5; b.state = { kind: 'taunt', t: -3 }; b.z.hold = true; b.z.ch.play('Idle_Loop', 0.2); sfx('spurs', b.z.pos, 1);
    setTimeout(() => say('SHAYLA', "A nine-foot dead sheriff with a handlebar mustache. Colorado Springs, you are SO extra.", 4, 3), 600);
    setTimeout(() => G.kennedy.active && G.kennedy.say("He says this town ain't big enough for the both of us. Babe, it's a whole city. He's just bad at geography.", 4.2, 3), 4800);
    setTimeout(() => say('SHAYLA', "Draw, McGraw. I've got a necklace to buy.", 3, 3), 9200); return; }
  if (def.bulldog) { toast('BOSS INCOMING', def.name, 3.4, true); slowmo(1.2, 0.35); b.aT = 4.5; b.state = { kind: 'taunt', t: -3 }; b.z.hold = true; b.z.ch.play('Idle_Loop', 0.2);
    setTimeout(() => say('SHAYLA', "Is that a purple bulldog? With a SPIKED collar? On the square? Kayleigh, is this your ex?", 4, 3), 600);
    setTimeout(() => G.kennedy.active && G.kennedy.say("Somebody didn't get walked today. Babe, aim for the jowls. There's a LOT of jowl.", 4, 3), 4800);
    setTimeout(() => say('SHAYLA', "Kayleigh says if I save the girdle she'll let me keep it. Sit. STAY. Die.", 3.4, 3), 9000); return; }
  if (def.badger) { toast('BOSS INCOMING', def.name, 3.4, true); slowmo(1.2, 0.35); b.aT = 4.5; b.state = { kind: 'taunt', t: -3 }; b.z.hold = true; b.z.ch.play('Walk_Loop', 0.2);
    setTimeout(() => say('SHAYLA', "Why is there a nine-foot badger in a turtleneck between me and my MOTHER?", 4, 3), 600);
    setTimeout(() => G.kennedy.active && G.kennedy.say("Lost his way to a homecoming game. Real grumpy about it. Like you before coffee.", 4, 3), 4800);
    setTimeout(() => say('SHAYLA', "Say that again after I shoot this sweater off him, babe.", 3, 3), 9000); return; }
  toast('BOSS INCOMING', def.name, 3, true); setTimeout(() => bark('boss', 3), 900); setTimeout(() => G.kennedy.active && G.kennedy.say(pick(KENNEDY.boss), 3, 2), 3500);
}
function bossDefeated() {
  const L = G.level; if (L.phase !== 'boss') return; L.phase = 'exit'; H.boss.style.display = 'none';
  addFingers(60 + G.levelIdx * 20, L.boss.pos); setTimeout(() => bark('bossDown', 3), 400); toast('BOSS DOWN', `+${60 + G.levelIdx * 20} fingers · get to the ${L.anc.exit ? L.anc.exit.label : 'exit'}`, 3.2);
  for (const m of minions) if (m.alive) m.pop(false); A.intensity = 0.4; slowmo(1.6, 0.18);
  if (L.def.item && L.anc.exit) { spawnPickup('relic_' + L.def.item, L.anc.exit.x, L.anc.exit.z, 1); L.needRelic = true; }
}
function onPickup(p, who) {
  const L = G.level, dad = 1;
  if (p.type === 'flower') { L.flowers++; bump('chipb'); sfx('burger'); toast(`💙 COLUMBINE ${L.flowers}/${L.flowersNeed}`, who === 'kennedy' ? 'Kennedy picked it (he sniffed it first)' : 'Something blue', 1.5); bark('pickupBurger', 1, 0.5);
    if (L.flowers >= L.flowersNeed) { toast(`ALL ${L.flowersNeed} COLUMBINES!`, L.kills >= L.quota ? 'Here comes the boss' : `Now finish the trolls · ${L.kills}/${L.quota}`, 2.6); if (L.kills >= L.quota) spawnBoss(); } return; }
  if (p.type === 'gold') { G.run.gold++; bump('chipc'); sfx('coke'); addFingers(3, p.pos); if (who === 'kennedy') G.kennedy.say(pick(['Gold! Honeymoon fund!', 'Ooh, shiny. Mine now.', 'That is a down payment, baby.']), 2, 1); else bark('pickupCoke', 1, 0.45); return; }
  if (p.type.startsWith('relic_')) { L.needRelic = false; sfx('sting'); toast({ brooch: "MOM'S BROOCH", girdle: 'THE LUCKY GIRDLE', necklace: 'THE DIAMOND NECKLACE' }[p.type.slice(6)] || 'GOT IT', 'Got it · get to the exit', 2); return; }
  if (p.type === 'burger') { const n = Math.round(p.value * dad); G.run.burgers += n; bump('chipb'); sfx('burger'); toast(`+${n} 🍔 STEAKBURGERS`, who === 'kennedy' ? 'Kennedy grabbed them (he ate one)' : 'For the reunion', 1.6); if (who === 'kennedy') G.kennedy.say(pick(KENNEDY.burger), 2.5, 1); else bark('pickupBurger', 1, 0.6); showRule(6); }
  else if (p.type === 'coke') { const n = Math.round(p.value * dad); G.run.cokes += n; bump('chipc'); sfx('coke'); toast(`+${n} 🥤 COKES`, 'Fizz-Ola, ice cold', 1.6); bark('pickupCoke', 1, 0.5); }
  else if (p.type === 'med') { G.player.heal(40); sfx('health'); toast('+40 HP', 'Self-care is a med kit', 1.4); }
  else if (p.type === 'ammo') { for (const k of ORDER) if (k !== 'pistol') { const w = G.player.wstats(k); G.player.ammo[k].res = Math.min(w.reserve, G.player.ammo[k].res + Math.ceil(w.reserve * 0.45)); } sfx('ammo'); toast('AMMO', 'Locked and loaded', 1.3); }
  else if (p.type === 'fingers') { addFingers(p.value || 15, p.pos); sfx('finger'); toast('A BOWL OF FINGERS', 'Gross. Lucrative.', 1.6); }
}

function onDeath() {
  G.mode = 'dead'; I.enabled = false; resetInput(); if (document.pointerLockElement) document.exitPointerLock(); A.intensity = 0.2; sfx('heart');
  G.slowT = 0; G.teamT = 0; G.timeScale = 1;
  const lines = ['Not dying before the wedding. Run it back.', 'Kennedy, tell Mom I wanted the chocolate fountain.', 'Somebody call the venue. And a priest.', "Note to self: zombies don't RSVP."];
  setTimeout(() => {
    showHUD(false); screen(`<h1>FLATLINED</h1><p>“${pick(lines)}”</p><p style="font-size:16px;opacity:.8">You keep the ${G.run.fingers} fingers you earned. Your fiancé is very disappointed.</p><div class="menu"><button class="b" id="dretry">RETRY SCENE</button><button class="b alt" id="dshop">VENDY'S</button><button class="b alt" id="dquit">TITLE</button></div>`, 'dead');
    save(); onClick('dretry', () => startLevel(G.levelIdx)); onClick('dshop', () => shopScreen(() => startLevel(G.levelIdx), 'RETRY SCENE')); onClick('dquit', () => { cleanupLevel(); titleScreen(); });
  }, 1400);
}
function levelComplete() {
  const L = G.level; if (L.phase === 'done') return; L.phase = 'done'; G.mode = 'results'; I.enabled = false; resetInput(); if (document.pointerLockElement) document.exitPointerLock();
  S.data.items = S.data.items || {}; const IT = { arkadelphia: 'brooch', square: 'girdle', springs: 'necklace', garden: 'blue' }[L.def.id]; if (IT) S.data.items[IT] = true;
  S.data.gold = (S.data.gold || 0) + G.run.gold; if (!S.data.completed.includes(G.levelIdx)) S.data.completed.push(G.levelIdx); S.data.unlocked = Math.max(S.data.unlocked, Math.min(LEVELS.length - 1, G.levelIdx + 1)); save();
  const CINE = { stadium: 'lead', arkadelphia: 'mom', square: 'kayleigh', freddos: 'roadtrip', springs: 'necklace', garden: 'flowers', mine: 'ending' };
  const after = async () => {
    const c = CINE[L.def.id]; const last = G.levelIdx === LEVELS.length - 1;
    if (last) { cleanupLevel(); if (A.ctx) playMusic('ending2'); }
    if (c) await runCine(c);
    if (last) { S.data.endingSeen = 'wedding'; save(); titleScreen(); return; }
    const next = G.levelIdx + 1; shopScreen(() => startLevel(next), 'NEXT SCENE ▸');
  };
  setTimeout(() => {
    if (G.level !== L) return; showHUD(false);
    screen(`<div class="panel results"><h3>${L.def.shift} — CLEARED</h3>
      Kills: <b>${G.run.kills}</b> · Headshots: <b>${G.run.heads}</b> · Fingers earned: <b>${G.run.fingers}</b><br>
      💞 Couple combos: <b>${L.combos}</b> · Tandem finishers: <b>${L.tandems}</b>${G.run.gold ? ` · 🪙 Gold bars: <b>${G.run.gold}</b>` : ''}<br>
      <span style="font-size:15px">${ITEMS.map(([k, n]) => `<b style="color:${S.data.items[k] ? '#7dffa8' : '#888'}">${S.data.items[k] ? '✔' : '○'} ${n}</b>`).join(' · ')}</span>
      <div class="shopfoot"><button class="b" id="rnext">CONTINUE ▸</button></div></div>`);
    onClick('rnext', after); if (G.autopilot) setTimeout(() => { if ($s('rnext')) after(); }, 400);
  }, 900);
}
function pause(on) {
  if (on && G.mode !== 'play') return; if (!on && G.mode !== 'paused') return;
  if (on) {
    G.mode = 'paused'; I.enabled = false; resetInput(); if (document.pointerLockElement) document.exitPointerLock(); suspendAudio(false);
    const draw = () => { screen(`<div class="panel"><h3>PAUSED</h3><div class="menu" style="flex-direction:column"><button class="b" id="presume">RESUME</button><button class="b alt" id="pset">SETTINGS</button><button class="b alt" id="prestart">RESTART SCENE</button><button class="b alt" id="pquit">QUIT TO TITLE</button></div></div>`); onClick('presume', () => pause(false)); onClick('pset', () => settingsScreen(() => { G.mode = 'paused'; draw(); })); onClick('prestart', () => startLevel(G.levelIdx)); onClick('pquit', () => { cleanupLevel(); titleScreen(); }); };
    draw();
  } else { screen(''); G.mode = 'play'; I.enabled = true; }
}
// RESET VIEW: undo page zoom, restore the default FOV, re-level the camera, clear any stuck touches
export function resetView(fromTap) {
  clearTouches(); I.lookDX = I.lookDY = 0; I.fire = false;
  resetPageZoom(); resize(); // resize() recomputes the default (aspect-based) FOV
  if (G.player) { G.player.pitch = 0; G.player.kick = 0; G.player.shake = 0; }
  if (fromTap && G.mode === 'play') toast('VIEW RESET', 'Zoom cleared · camera leveled', 1.2);
}
// ───────────────────────────── per-frame
function frame(dt) {
  if (cineActive()) { cineTick(dt); hudTick(dt); trackFrame(dt); return; }
  if (G.mode === 'title' || G.mode === 'menu' || (G.mode === 'shop' && !G.world)) { renderTitle(dt); trackFrame(dt); return; }
  if (G.mode === 'play' && G.timeScale !== 0) { const n = G.substeps || 1; for (let k = 0; k < n && G.mode === 'play'; k++) update(dt * (G.timeScale || 1)); }
  else if (G.mode === 'dead' || G.mode === 'results') { updateZombies(dt * 0.3); updateFX(dt * 0.3); }
  if (G.world && G.mode !== 'loading') { if (G.env) followSun(); render(); }
  else if (G.mode === 'shop') renderTitle(dt);
  hudTick(dt); trackFrame(dt);
}
function followSun() { const s = G.env.sun, p = G.player.pos; s.position.set(p.x + G.env.dir.x * 40, G.env.dir.y * 40, p.z + G.env.dir.z * 40); s.target.position.set(p.x, 0, p.z); }
function update(dt) {
  G.time += dt; const L = G.level; L.t += dt; barkCd -= dt; lowHpT -= dt; multi.t -= dt;
  pollKeyboard(dt); if (G.autopilot) autopilot(dt);
  const p = G.player.update(dt); if (p.pause) { pause(true); return; }
  { const pp = G.player.pos; for (const z of Z.list) { if (!z.alive || z.dead || z.rise > 0.3 || z.hold) continue; const dx = pp.x - z.pos.x, dz = pp.z - z.pos.z, d2 = dx * dx + dz * dz, rr = 0.36 + 0.3 * z.scale; if (d2 < rr * rr && d2 > 1e-6) { const d = Math.sqrt(d2), k = (rr - d) / d; pp.x += dx * k; pp.z += dz * k; } } G.world.collide(pp, 0.35, 0.1, 1.7); }
  G.kennedy.update(dt); updateZombies(dt); if (L.boss && L.boss.update) L.boss.update(dt); for (const m of minions) m.update(dt);
  updatePickups(dt); updateFX(dt, G.world); for (const u of G.world.updaters) u(dt, G.time);
  if (G.world.props) { const ac = propActors; ac.length = 0; ac.push({ x: G.player.pos.x, z: G.player.pos.z, r: 0.35, k: 2.2 }); if (G.kennedy.active) ac.push({ x: G.kennedy.pos.x, z: G.kennedy.pos.z, r: 0.35, k: 2.2 }); for (const z of Z.list) if (z.alive && !z.dead) ac.push({ x: z.pos.x, z: z.pos.z, r: 0.45 * (z.scale || 1), k: z.beh === 'brute' || z.beh === 'boss' ? 6 : 3.6 }); updateProps(G.world, dt, ac); }
  if (!G.noDirector) director(dt);
  // survival level
  if (L.survive && L.phase === 'fight') { L.timeLeft -= dt; if (L.timeLeft <= 0) { L.timeLeft = 0; L.phase = 'exit'; toast('YOU SURVIVED', 'The reunion is ON', 2.5); for (const z of Z.list) if (z.alive && !z.dead) z.damage(9999, 'head', null, null, 'end'); setTimeout(levelComplete, 1500); } }
  // exit
  if (L.phase === 'exit' && L.anc.exit && !L.needRelic) { const e = L.anc.exit; if (Math.hypot(G.player.pos.x - e.x, G.player.pos.z - e.z) < 2.6) levelComplete(); }
  if (npc) { npc.mixer.update(dt); npc.root.rotation.y = Math.atan2(G.player.pos.x - npc.root.position.x, G.player.pos.z - npc.root.position.z); }
  A.intensity = L.phase === 'boss' ? 1 : clamp(0.25 + aliveCount() / 14, 0.25, 0.9);
  updateHUD(dt);
}
function updateHUD(dt) {
  const pl = G.player, L = G.level; const f = pl.hp / pl.maxHp;
  setStyle('hpbar', 'width', (f * 100).toFixed(1) + '%'); H.monitor.classList.toggle('low', f < 0.3); H.lowhp.style.opacity = f < 0.3 ? 1 : 0; H.lowhp.style.display = f < 0.3 ? 'block' : 'none';
  setText('bpm', String(Math.round(78 + (1 - f) * 70 + A.intensity * 30)));
  H.bloodv.style.opacity = Math.max(0, pl.hurtT * 1.6, f < 0.3 ? 0.35 : 0);
  const k = G.kennedy; setStyle('kbar', 'display', k.active ? 'flex' : 'none'); if (k.active) setStyle('khp', 'width', (k.down ? 0 : k.hp / k.maxHp * 100).toFixed(0) + '%');
  if (L.survive) { const tl = Math.ceil(L.timeLeft); setText('objt', L.def.obj.toUpperCase()); setText('objs', L.phase === 'fight' ? `Survive ${Math.floor(tl / 60)}:${String(tl % 60).padStart(2, '0')}` : 'Survived!'); setStyle('progv', 'width', ((1 - L.timeLeft / L.survive) * 100).toFixed(1) + '%'); }
  else { setText('objt', L.def.obj.toUpperCase()); setText('objs', L.phase === 'fight' ? (L.flowersNeed ? `💙 ${L.flowers}/${L.flowersNeed} columbines · ${Math.min(L.kills, L.quota)}/${L.quota} trolls` : `${L.kills} / ${L.quota} zombies`) : L.phase === 'boss' ? 'Kill the boss!' : `Get to the ${L.anc.exit ? L.anc.exit.label : 'exit'}`); setStyle('progv', 'width', (Math.min(1, L.kills / L.quota) * 100).toFixed(1) + '%'); }
  setStyle('halflbl', 'display', L.kennedyCalled ? 'none' : 'block');
  if (L.phase === 'boss' && L.boss) { setStyle('bossv', 'width', (Math.max(0, L.boss.hp / L.boss.maxHp) * 100).toFixed(1) + '%'); }
  setText('fingers', String(S.data.fingers)); setText('burgers', `${itemCount()}/4`); setText('cokes', String((S.data.gold || 0) + G.run.gold)); if (H.teamv) setStyle('teamv', 'width', (G.teamT > 0 ? 100 * G.teamT / 4.5 : Math.min(100, G.team || 0)).toFixed(0) + '%');
  const w = pl.weapon, ws = pl.wstats(w), a = pl.ammo[w]; setText('mag', String(a.mag)); setText('res', a.res === Infinity ? ' / ∞' : ` / ${a.res}`); setText('wname', ws.name); H.ammo.classList.toggle('reloading', pl.reloading > 0);
  H.autofire.classList.toggle('on', !!S.data.settings.autofire); setText('autofire', S.data.settings.autofire ? 'AUTO-FIRE ●' : 'AUTO-FIRE ○');
  const call = L.callReady(); H.bmelee.classList.toggle('call', call); setStyle('bedpanico', 'display', call ? 'none' : ''); setStyle('callico', 'display', call ? '' : 'none'); setText('meleelbl', call ? 'TEAM UP!' : G.teamT > 0 ? '💞 GO!' : 'Bedpan');
  H.xh.classList.toggle('hit', !!pl.lockTarget);
  if (pl.lockTarget && pl.lockTarget.t) { const s = project(pl.lockTarget.t.aimPoint(tmp), E.camera); if (!s.behind) { H.lock.style.display = 'block'; H.lock.style.transform = `translate(${s.x - 26}px,${s.y - 26}px)`; } else H.lock.style.display = 'none'; } else H.lock.style.display = 'none';
  if (L.phase === 'exit' && L.anc.exit && !L.needRelic) { const e = L.anc.exit; const s = project(tmp.set(e.x, 1.6, e.z), E.camera); let x = s.x, y = s.y; if (s.behind) { x = innerWidth - x; y = innerHeight - 40; } x = clamp(x, 40, innerWidth - 40); y = clamp(y, 60, innerHeight - 60); H.marker.style.display = 'block'; H.marker.style.left = x + 'px'; H.marker.style.top = y + 'px'; setText('marker', `${e.label} · ${Math.round(Math.hypot(G.player.pos.x - e.x, G.player.pos.z - e.z))}m`); }
  else if (L.phase === 'fight' && L.flowers < L.flowersNeed) { let best = null, bd = 1e9; for (const p of P.list) if (p.alive && p.type === 'flower') { const d = Math.hypot(p.pos.x - G.player.pos.x, p.pos.z - G.player.pos.z); if (d < bd) { bd = d; best = p; } }
    if (best) { const s = project(tmp.set(best.pos.x, 1.2, best.pos.z), E.camera); let x = s.x, y = s.y; if (s.behind) { x = innerWidth - x; y = innerHeight - 40; } x = clamp(x, 40, innerWidth - 40); y = clamp(y, 60, innerHeight - 60); H.marker.style.display = 'block'; H.marker.style.left = x + 'px'; H.marker.style.top = y + 'px'; H.marker.classList.add('blue'); setText('marker', `💙 COLUMBINE · ${Math.round(bd)}m`); } else H.marker.style.display = 'none'; }
  else H.marker.style.display = 'none';
  if (L.phase === 'exit') H.marker.classList.remove('blue');
  if (H.checklist) setText('checklist', ITEMS.map(([k, n]) => `${S.data.items && S.data.items[k] ? '✔' : '○'} ${n.replace('Something ', '').toUpperCase()}`).join('  '));
  if (pl.loaned && pl.weapon === 'rifle') H.bswap.classList.remove('glow');
  updateThreats(dt);
}
// ───────────────────────────── off-screen threat arrows + directional hit flash + look hint
const THR = { shown: [], hit: { l: 0, r: 0, t: 0, b: 0 }, hintT: 0, hintOn: false };
const thrV = new THREE.Vector3();
function relBearing(x, z) { const pl = G.player; const a = Math.atan2(-(x - pl.pos.x), -(z - pl.pos.z)); return -angDiff(pl.yaw, a); } // 0 = ahead, + = to the right
function hitFrom(src) {
  if (!src || !src.pos) { THR.hit.b = Math.max(THR.hit.b, 0.5); return; }
  const a = relBearing(src.pos.x, src.pos.z), sx = Math.sin(a), cz = Math.cos(a); G.player.lastHurtFrom = a;
  THR.hit.r = Math.max(THR.hit.r, sx > 0.2 ? Math.min(1, sx + 0.2) : 0); THR.hit.l = Math.max(THR.hit.l, sx < -0.2 ? Math.min(1, -sx + 0.2) : 0);
  THR.hit.b = Math.max(THR.hit.b, cz < -0.2 ? Math.min(1, -cz + 0.2) : 0); THR.hit.t = Math.max(THR.hit.t, cz > 0.5 ? 0.5 : 0);
}
function updateThreats(dt) {
  const pl = G.player, cam = E.camera, W = innerWidth, Hh = innerHeight; const list = []; cam.updateMatrixWorld(); // camera was just re-aimed this frame
  const cands = Z.list.filter(z => z.alive && !z.dead && !(z.rise > 0.5));
  for (const z of cands) {
    const d = Math.hypot(z.pos.x - pl.pos.x, z.pos.z - pl.pos.z); if (d > 15) continue;
    thrV.set(z.pos.x, 1.2 * (z.scale || 1), z.pos.z).project(cam); const on = thrV.z < 1 && Math.abs(thrV.x) < 0.94 && Math.abs(thrV.y) < 0.94; if (on) continue;
    list.push({ z, d, a: relBearing(z.pos.x, z.pos.z) });
  }
  list.sort((a, b) => a.d - b.d); THR.shown = list.slice(0, 8).map(t => ({ a: +t.a.toFixed(3), d: +t.d.toFixed(2) }));
  const els = H.threats.children; const cx = W / 2, cy = Hh / 2, rx = W / 2 - 40, ry = Hh / 2 - 44; const danger = { l: 0, r: 0, t: 0, b: 0 };
  for (let i = 0; i < els.length; i++) {
    const e = els[i], t = list[i]; if (!t) { if (e.style.display !== 'none') e.style.display = 'none'; continue; }
    const sx = Math.sin(t.a), sy = -Math.cos(t.a); // behind -> bottom of the screen
    const k = 1 / Math.max(Math.abs(sx) / rx, Math.abs(sy) / ry); const x = cx + sx * k, y = cy + sy * k; // on the screen-edge rectangle (arrows never block touches: pointer-events none)
    const close = t.d < 3.2; const sc = close ? 1.25 : 1 - Math.min(0.35, t.d / 40);
    e.style.display = 'block'; e.style.opacity = (close ? 1 : Math.max(0.45, 1.1 - t.d / 15)).toFixed(2);
    e.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(Math.atan2(sy, sx) * 180 / Math.PI).toFixed(1)}deg) scale(${sc.toFixed(2)})`;
    e.classList.toggle('close', close);
    const w = Math.max(0, 1 - t.d / 7); if (w > 0) { if (sx > 0.35) danger.r = Math.max(danger.r, w * sx); if (sx < -0.35) danger.l = Math.max(danger.l, -w * sx); if (-sy < -0.35) danger.b = Math.max(danger.b, w * sy); }
  }
  const hd = H.hitdir.children; const h = THR.hit; const dec = Math.pow(0.02, dt);
  for (const [i, k] of [[0, 'l'], [1, 'r'], [2, 't'], [3, 'b']]) { h[k] *= dec; if (h[k] < 0.02) h[k] = 0; hd[i].style.opacity = Math.max(h[k], danger[k] * 0.4).toFixed(2); } // hit flash + faint glow on the side something close is coming from
  // look hint: until the player has actually turned a good amount this session
  if (THR.hintOn && THR.hintDelay > 0) { THR.hintDelay -= dt; if (THR.hintDelay <= 0 && Math.abs(pl.lookYaw) < 1.2) H.lookhint.style.display = 'flex'; }
  if (THR.hintOn) { THR.hintT -= dt; if (THR.hintT <= 0 || Math.abs(pl.lookYaw) > 1.2) { THR.hintOn = false; H.lookhint.style.opacity = '0'; setTimeout(() => { if (!THR.hintOn) H.lookhint.style.display = 'none'; }, 450); if (Math.abs(pl.lookYaw) > 1.2) S.data.lookedAround = (S.data.lookedAround || 0) + 1; } }
}
function showLookHint() { const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; if (!touch || (S.data.lookedAround || 0) >= 3) return; THR.hintOn = true; THR.hintT = 10.5; THR.hintDelay = 3.8; H.lookhint.style.display = 'none'; H.lookhint.style.opacity = '1'; } // waits for the shift toast / rotate tip to clear
// ───────────────────────────── autopilot (automated playtesting) + test hooks
function autopilot(dt) {
  const pl = G.player, L = G.level; I.move.x = I.move.y = 0; I.sprint = false;
  if (pl.hp < pl.maxHp * 0.5) pl.hp = pl.maxHp; // test bot is immortal-ish; we test flow, not skill
  if (L.callReady()) I.pressed.call = true;
  let goal = null; if (G.kennedy.down) goal = G.kennedy.pos; else if (L.phase === 'exit' && L.anc.exit && !L.needRelic) goal = L.anc.exit;
  else { let best = 1e9; for (const p of P.list) if (p.alive && (p.type === 'flower' || p.type === 'gold' || p.type.startsWith('relic_') || p.type === 'fingers')) { const d = Math.hypot(p.pos.x - pl.pos.x, p.pos.z - pl.pos.z); if (d < best) { best = d; goal = p.pos; } } }
  const t = pl.findTarget(Math.PI); // nearest visible target
  if (t) { pl.yaw += angDiff(pl.yaw, t.yaw) * Math.min(1, dt * 10); pl.pitch += (t.pitch - pl.pitch) * Math.min(1, dt * 10); I.fire = t.ang < 0.12; }
  else { I.fire = false; if (!goal) { // wander toward the nearest zombie/boss via flow field
    let best = null, bd = 1e9; for (const z of [...Z.list.filter(z => z.alive && !z.dead), ...Z.hittables.filter(h => h.alive)]) { const d = z.pos.distanceTo(pl.pos); if (d < bd) { bd = d; best = z; } } if (best) goal = best.pos; } }
  if (goal) { const dx = goal.x - pl.pos.x, dz = goal.z - pl.pos.z; const d = Math.hypot(dx, dz); if (d > 1.0) { let mx = dx / d, mz = dz / d; G.world.flowFrom(goal.x, goal.z); const fd = { x: 0, z: 0 }; if (!G.world.los(tmp.set(pl.pos.x, 0.3, pl.pos.z), tmp2.set(goal.x, 0.3, goal.z)) && G.world.flowDir(pl.pos.x, pl.pos.z, fd)) { mx = fd.x; mz = fd.z; } G.world.flowFrom(pl.pos.x, pl.pos.z);
    if (!t) { pl.yaw += angDiff(pl.yaw, Math.atan2(-mx, -mz)) * Math.min(1, dt * 6); pl.pitch *= 0.9; }
    const fx = -Math.sin(pl.yaw), fz = -Math.cos(pl.yaw), rx = Math.cos(pl.yaw), rz = -Math.sin(pl.yaw); I.move.y = mx * fx + mz * fz; I.move.x = mx * rx + mz * rz; } }
  const w = pl.weapon; if (pl.ammo[w].mag === 0 && pl.ammo[w].res === 0) I.pressed.swap = true;
}
function testHooks() {
  return {
    G, S, LEVELS, startLevel, titleScreen, Z, E, P, LIB, CAST, makeCharacter, THREE,
    state: () => ({ mode: G.mode, level: G.levelIdx, phase: G.level && G.level.phase, kills: G.level && G.level.kills, quota: G.level && G.level.quota, hp: G.player && Math.round(G.player.hp), fps: Math.round(E.fps), dyn: E.dynScale, alive: aliveCount(), items: S.data.items, gold: S.data.gold, team: Math.round(G.team || 0), teamT: G.teamT, ts: G.timeScale, flowers: G.level && G.level.flowers, combos: G.level && G.level.combos, tandems: G.level && G.level.tandems, weapon: G.player && G.player.weapon, run: G.run, kennedy: G.kennedy && G.kennedy.active, boss: G.level && G.level.boss ? Math.round(G.level.boss.hp) : null, timeLeft: G.level && G.level.timeLeft }),
    autopilot(on = true) { G.autopilot = on; G.autoSkipCine = on ? 300 : 0; }, autoSkip(ms) { G.autoSkipCine = ms; },
    skipCine() { const e = document.getElementById('cineskip'); if (e) e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); },
    pickup(type, x, z) { return !!spawnPickup(type, x, z, 1); },
    click(id) { const e = document.getElementById(id); if (e) e.click(); return !!e; },
    killAll() { for (const z of Z.list) if (z.alive && !z.dead && !z.reserved) z.damage(99999, 'head', null, null, 'test'); },
    toBoss() { const L = G.level; if (L && L.phase === 'fight') { L.kills = L.quota - 1; L.flowers = L.flowersNeed; } },
    hurtBoss(f = 0.5) { const b = G.level && G.level.boss; if (!b) return; if (b.z) { b.z.invuln = false; if (b.orbs) b.orbs.forEach(o => o.damage(9999)); b.z.damage(b.z.maxHp * f, 'chest', null, null, 'test'); } else b.damage(b.maxHp * f, 'chest', null, null); },
    spawn(beh = 'walker', x, z, opt = {}) { const zz = freeZombie(); if (zz) zz.spawn(new THREE.Vector3(x, 0, z), beh, opt); return !!zz; }, noDirector(on = true) { G.noDirector = on; },
    tp(x, z) { G.player.pos.set(x, 0, z); }, look(yaw, pitch = 0) { G.player.yaw = yaw; G.player.pitch = pitch; },
    threats: () => THR.shown, hitDir: () => ({ ...THR.hit }), touches: () => activeTouches(), I,
    cine: name => runCine(name), cineInfo, resetView, ZOOM, pageScale, defaultFov() { const f = E.camera.fov; resize(); const d = E.camera.fov; E.camera.fov = f; E.camera.updateProjectionMatrix(); return d; }, forceZoom(fov = 25) { E.camera.fov = fov; E.camera.updateProjectionMatrix(); return E.camera.fov; }, camFov: () => E.camera.fov, pause, levelComplete, teamUp, slowmo, fillTeam() { G.team = 100; }, allChapters(on = true) { G.allChapters = on; }, chapters() { G.allChapters = true; shiftsScreen(); }, shop() { shopScreen(titleScreen); }, fast(on) { G.fast = on; }, substeps(n) { G.substeps = n; }, timeScale(n) { G.timeScale = n; }, step(dt = 1 / 60, n = 1) { for (let i = 0; i < n; i++) update(dt); }, shoot() { const pl = G.player, k = pl.weapon; pl.fire(pl.wstats(k), k); pl.cool = pl.wstats(k).rate; },
  };
}

// ───────────────────────────── PARABELLUM 2 teamwork systems
const TEAMGAIN = { kill: 1.6, kkill: 1, combo: 9, tandem: 26, revive: 18, pickup: 22 };
function teamEvent(kind) {
  if (!G.level) return;
  if (kind === 'pickup') toast('BACK ON HIS FEET', 'You picked Kennedy up', 1.8);
  if (kind === 'revive') toast('KENNEDY GOT YOU UP', '"Not dying before the honeymoon!"', 2);
  if (G.teamT > 0) return; const was = G.team || 0; G.team = Math.min(100, was + (TEAMGAIN[kind] || 0) * (up('k_dad') ? 1.4 : 1));
  if (was < 100 && G.team >= 100) { toast('💞 TEAM UP READY', I.touchMode ? 'Tap the pink TEAM UP button' : 'Press E for a slow-mo double kill', 3); sfx('combo'); }
}
function teamUp() {
  if (!(G.team >= 100) || G.teamT > 0 || G.mode !== 'play') return; G.team = 0; G.teamT = 4.5; G.slowT = 0; G.timeScale = 0.4; sfx('teamup'); sfx('slowmo');
  toast('💞 TEAM UP!', 'Slow-mo · triple damage · couple goals', 2.4); if (G.kennedy.active) G.kennedy.say(pick(KENNEDY.teamup), 2.5, 3);
  setTimeout(() => say('SHAYLA', pick(['Couples who slay together stay together!', "Let's DANCE, motherfuckers!", 'First dance, bitches!']), 2.5, 3), 500);
}
// slow-mo kill cam (real-time seconds). Team-up owns the clock while active.
function slowmo(dur, scale) { if (G.noSlowmo || G.teamT > 0 || G.mode !== 'play') return; if (!(G.slowT > 0) && dur > 0.5) sfx('slowmo'); G.slowT = Math.max(G.slowT || 0, dur); G.timeScale = Math.min(G.timeScale || 1, scale); G.slowFov = G.slowFov || E.camera.fov; E.camera.fov = G.slowFov * 0.9; E.camera.updateProjectionMatrix(); }
function slowmoTick(dt) {
  if (G.teamT > 0 && G.mode === 'play') { G.teamT -= dt; if (G.teamT <= 0) { G.teamT = 0; G.timeScale = 1; } }
  if (G.slowT > 0) { G.slowT -= dt; if (G.slowT <= 0 || G.mode !== 'play') { G.slowT = 0; if (!(G.teamT > 0)) G.timeScale = 1; if (G.slowFov) { E.camera.fov = G.slowFov; E.camera.updateProjectionMatrix(); G.slowFov = 0; } } }
  if (G.mode === 'play' && G.kennedy && G.kennedy.down && G.kennedyRevive > 0) setText('objs', `Picking Kennedy up… ${Math.round(Math.min(1, G.kennedyRevive) * 100)}%`);
}
const propActors = [];
function rocketBlast(from, at, w) {
  propBlast(G.world, at, (w.blast || 5) * 1.3, 11);
  sfx('explode', at, 1.3); sfx('crunch'); G.player.shake = 0.45; const r = w.blast || 5; let kills = 0; const g0 = at.clone(); g0.y = 0;
  for (let i = 0; i < 70; i++) particle(at, tmp2.set(rand(-7, 7), rand(1, 8), rand(-7, 7)), new THREE.Color(1, rand(0.35, 0.85), 0.1), rand(0.1, 0.24), rand(0.4, 1.0), 5);
  for (let i = 0; i < 30; i++) particle(at, tmp2.set(rand(-2.5, 2.5), rand(1, 4), rand(-2.5, 2.5)), new THREE.Color(0.22, 0.2, 0.18), rand(0.25, 0.45), rand(1, 1.8), -0.6);
  for (const t of allTargets()) { const d = Math.hypot(t.pos.x - at.x, t.pos.z - at.z); if (d > r) continue; const k = 1 - d / r * 0.65; const dir = new THREE.Vector3(t.pos.x - at.x, 0.6, t.pos.z - at.z).normalize(); const p = t.bodyPoint(new THREE.Vector3()); if (t.damage(w.dmg * k, d < r * 0.3 ? 'head' : 'chest', p, dir, 'rocket')) kills++; }
  try { decal(g0.setY(0.02), new THREE.Vector3(0, 1, 0), 2.6); } catch (e) { }
  if (Math.hypot(G.player.pos.x - at.x, G.player.pos.z - at.z) < 2.2) G.player.hurt(10, null);
  if (kills >= 2) { slowmo(0.8, 0.22); toast(`BOOM × ${kills}`, 'Honeymoon delivered', 1.4); }
}
