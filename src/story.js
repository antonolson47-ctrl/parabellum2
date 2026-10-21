// Cutscenes: tiny 3D sets, real character close-ups, subtitles, tap-to-advance. Also the endings.
import * as THREE from 'three';
import { E } from './engine.js';
import { World, T, std, texMat } from './world.js';
import { PM, truck, table, cooler, stringLights, building, car, lamp, pine, tree } from './props.js';
import { makeCharacter } from './chars.js';
import { skyDome, mountains, redRock, juniper, grandstand, lightTower, turfTex, storefront, globeLamp, shieldSign, poleBarn, mineTimber, lantern, oreCart, goldBar, relic, columbine } from './scenery.js';
import { H } from './hud.js';
import { grillInterior } from './grill.js';
import { sfx, playMusic } from './audio.js';
import { canvasTex, rand, clamp } from './util.js';
const { col, metal, emis } = PM;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const COLORS = { SHAYLA: '#7dffa8', KENNEDY: '#8fd0ff', KELLY: '#ff8a8a', KAYLEIGH: '#c8a0ff', KAMBREE: '#ffb0e0', MOM: '#ffb070', PA: '#ffd84a', ANNOUNCER: '#ffd84a', ALL: '#ffd84a', 'SALES CLERK': '#bfe8ff' };
const actors = {};
export function actor(key) {
  if (!actors[key]) actors[key] = makeCharacter(key); return actors[key];
}
// ───────── sets
function skyTex(top, bot) { return canvasTex(8, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(0.6, bot); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, w, h); }); }
const SETS = {
  stadium(W, sc) {
    sc.background = new THREE.Color('#04060e'); sc.fog = new THREE.Fog('#0c1220', 30, 140); skyDome(W, { top: '#02030a', mid: '#0a1228', bot: '#1a2238', stars: 1, clouds: 0.3, seed: 11 });
    const g = new THREE.Mesh(new THREE.PlaneGeometry(56, 104), texMat('turfM', turfTex())); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; W.group.add(g);
    grandstand(W, -30, 0, 110, Math.PI / 2, { rows: 22, rise: 0.7, step: 1.0, seed: 3, suites: true }); grandstand(W, 30, 0, 110, -Math.PI / 2, { rows: 22, rise: 0.7, step: 1.0, seed: 5 }); grandstand(W, 0, -56, 64, 0, { rows: 16, rise: 0.75, seed: 7 });
    W.sign(['RAZORCRACK STADIUM', 'HOGS 0 · ZOMBIES 999'], 0, 22, -74, 34, 9, { bg: '#0a0a0c', colors: ['#ff3a3a', '#ffd84a'], neon: 1.6, box: 0.6 });
    for (const [x, z] of [[-36, -40], [36, -40], [-36, 40], [36, 40]]) lightTower(W, x, z, 32, x * 0.2, z * 0.3, 1);
    return { hemi: ['#9ab0e0', '#20140c', 0.8], key: ['#e8eeff', 1.8, 4, 8, 6], exposure: 1.1 };
  },
  phone(W, sc) { // Mom's kitchen in Arkadelphia
    sc.background = new THREE.Color('#2a1e14');
    W.floor(-6, 6, -6, 6, texMat('kitFloor', T.tile('#e8dcc8', '#c8b8a0')), 1.0); W.box(0, 0, -1.6, 8, 3, 0.2, texMat('kwall2', T.paint('#f2e0b8')), { tile: 2 });
    W.sign(['BLESS THIS MESS', '(and this family)'], 0.9, 1.9, -1.48, 1.4, 0.5, { bg: '#fff', colors: ['#9d2235', '#555'] });
    W.box(-1.2, 0, -1.2, 1.6, 0.9, 0.6, texMat('cab', T.wood('#9a7a5a'))); W.box(-1.2, 0.9, -1.2, 1.7, 0.05, 0.65, std('counterTop', { color: 0xe8e4dc }));
    const l = new THREE.PointLight(0xffe0b0, 7, 8, 1.4); l.position.set(0.5, 2.2, 1); W.group.add(l);
    return { hemi: ['#fff0dc', '#3a2a20', 0.9], key: ['#ffe8c8', 1.3, 2, 3, 3], exposure: 1.0 };
  },
  grill(W, sc) { // 67 Grill interior (Anton's photos)
    sc.background = new THREE.Color('#2a2622'); sc.fog = new THREE.Fog('#2a2622', 18, 40);
    grillInterior(W, 0, 8, { tables: [[-6, 5], [4.5, 7], [-4, 11], [2.5, 13.5], [-7, -1.5]], fans: [[-2, 4], [3, 9], [-4, 13]] });
    return { hemi: ['#fff0dc', '#3a3028', 0.9], key: ['#ffe8c8', 0.8, 2, 6, 6], exposure: 1.0 };
  },
  square(W, sc) {
    sc.background = new THREE.Color('#9ccaf0'); sc.fog = new THREE.Fog('#d0e0ea', 30, 120); skyDome(W, { top: '#3a7ad0', mid: '#9ccaf0', bot: '#e4eef4', sun: [0.62, 0.3], clouds: 0.7, seed: 4 });
    W.floor(-30, 30, -30, 30, texMat('plaza', T.stone('#b8a890')), 3); building(W, 0, -9, 12, 10, 8, { color: '#9a4a32', frame: '#f2efe6', cols: 4, rows: 2, lit: 0.2, trim: '#f2efe6' }); W.box(0, 8.4, -9, 4, 2.5, 4, col('#f2efe6'));
    W.sign(['OLD POST OFFICE', 'est. 1911'], 0, 6.2, -3.97, 6, 1.0, { bg: '#f2efe6', fg: '#5a2a1a' }); tree(W, -6, -2, 1.3, { color: 0x3a7a2a }); tree(W, 7, -1, 1.2, { color: 0x4a8a2a });
    storefront(W, -14, 4, 11, 10, Math.PI / 2, { color: '#8a3a2a', sign: 'BLUE BIRD BOOKS', awning: '#2a6a4a' }); globeLamp(W, 3, 2);
    return { hemi: ['#e8f4ff', '#5a5040', 1.0], key: ['#fff4e0', 2.4, 6, 8, 6], exposure: 0.95 };
  },
  parking(W, sc) {
    sc.background = new THREE.Color('#c85a5a'); sc.fog = new THREE.Fog('#a06a5a', 25, 90); skyDome(W, { top: '#1a1440', mid: '#c85a5a', bot: '#ffb070', sun: [0.75, 0.88], sunCol: '#ffe0a0', clouds: 0.8, seed: 6 });
    W.floor(-30, 30, -30, 30, texMat('asph', T.asphalt()), 4);
    building(W, 0, -14, 16, 8, 5, { color: '#f2efe6', frame: '#16a59e', cols: 6, rows: 1, lit: 0.8, glow: true, trim: '#16a59e' });
    W.sign(["FREDDO'S", 'FROZEN CUSTARD & STEAKBURGERS'], 0, 6.2, -9.7, 7, 1.6, { bg: '#16a59e', colors: ['#ffd43b', '#fff'], neon: 1.2, box: 0.2 });
    truck(W, 3.2, 0.5, 0.4, '#3a3a3a'); lamp(W, -5, -2, 4.5, true, 0xffd8a0);
    return { hemi: ['#ffc8a0', '#2a2030', 0.8], key: ['#ff9a5a', 2.0, -10, 6, -4], exposure: 1.05 };
  },
  jewelry(W, sc) { // SPARKLE & SONS interior
    sc.background = new THREE.Color('#101018');
    W.floor(-8, 8, -8, 8, texMat('jfloor', T.tile('#e8e4ec', '#c8c4d0')), 1.0); W.box(0, 0, -2.6, 10, 3.4, 0.2, texMat('jwall', T.paint('#2a2a3a')), { tile: 2 });
    W.sign(['SPARKLE & SONS', 'FINE JEWELRY · EST. 1922'], 0, 2.6, -2.48, 3.6, 0.8, { bg: '#101018', colors: ['#bfe8ff', '#ffd84a'], neon: 1.2 });
    const glass = std('jcase', { color: 0xdfe8f0, roughness: 0.05, metalness: 0.6, emissive: 0x405060, emissiveIntensity: 0.4 }); W.box(0, 0, -1.0, 3.6, 1.0, 0.8, glass);
    const nk = relic('necklace'); nk.position.set(0.2, 0.62, -1.0); nk.scale.setScalar(1.3); W.group.add(nk);
    for (const x of [-2.5, 2.5]) { const l = new THREE.PointLight(0xdfefff, 6, 6, 1.4); l.position.set(x, 2.8, 0); W.group.add(l); }
    return { hemi: ['#dfe8ff', '#202028', 0.9], key: ['#ffffff', 1.6, 2, 4, 4], exposure: 1.0 };
  },
  garden(W, sc) {
    sc.background = new THREE.Color('#90c6f0'); sc.fog = new THREE.Fog('#d8d0c8', 50, 160); skyDome(W, { top: '#2a66d0', mid: '#90c6f0', bot: '#e0ecf4', sun: [0.85, 0.28], clouds: 0.55, seed: 10 });
    mountains(W, { a0: -1.2, a1: 1.2, radius: 130, peak: 52, base: 20, snow: 0.55, rock: '#465476', haze: '#b4c8de', hz: 0.3, peakAt: 0.5, seed: 21 });
    W.floor(-40, 40, -40, 40, texMat('dirtG', T.dirt()), 4); redRock(W, -8, -18, 12, 12, 3.5, 0.2, 3); redRock(W, 12, -24, 9, 15, 3, -0.15, 7); for (let i = 0; i < 14; i++) juniper(W, rand(-14, 14), rand(-8, 10), rand(0.8, 1.4));
    // mine shaft entrance in the rock
    W.box(0, 0, -10.5, 2.6, 3, 0.3, std('mineMouth', { color: 0x050403 })); mineTimber(W, 0, -10.3, 0, 3.2, 3.1);
    W.sign(['DANGER · MINE SHAFT', 'keep out (seriously)'], 2.4, 1.2, -10.2, 1.8, 0.7, { bg: '#f2e6c8', colors: ['#c8102e', '#333'], box: 0.05 });
    return { hemi: ['#fff4e6', '#6a4a30', 1.0], key: ['#fff0d8', 2.6, 6, 10, 6], exposure: 0.92 };
  },
  minemouth(W, sc) { // ending: emerging into the sun with the gold
    sc.background = new THREE.Color('#9ccaf0'); sc.fog = new THREE.Fog('#f0e0c8', 40, 160); skyDome(W, { top: '#2a66d0', mid: '#a0d0f4', bot: '#fff0d8', sun: [0.5, 0.62], sunCol: '#fffbe8', clouds: 0.4, seed: 30 });
    mountains(W, { a0: -1.3, a1: 1.3, radius: 130, peak: 52, base: 20, snow: 0.55, rock: '#465476', haze: '#c8d4e4', hz: 0.35, peakAt: 0.5, seed: 21 });
    W.floor(-40, 40, -40, 40, texMat('dirtG', T.dirt()), 4); redRock(W, -6, 6, 10, 9, 3, 0.1, 31); W.box(-2, 0, 3.3, 2.6, 3, 0.3, std('mineMouth', { color: 0x050403 })); mineTimber(W, -2, 3.5, 0, 3.2, 3.1);
    oreCart(W, 1.6, 1.4, 0.4); for (let i = 0; i < 9; i++) { const gb = goldBar(); gb.position.set(-0.6 + (i % 3) * 0.42, 0, 1.6 + Math.floor(i / 3) * 0.24); gb.scale.setScalar(1.3); W.group.add(gb); }
    for (let i = 0; i < 12; i++) { const f = columbine(1.2); f.position.set(rand(-4, 4), 0, rand(-1, 3)); W.group.add(f); }
    for (let i = 0; i < 10; i++) juniper(W, rand(-16, 16), rand(-12, -2), rand(0.8, 1.4));
    return { hemi: ['#fff8ea', '#7a5a3a', 1.1], key: ['#fff4dc', 3.0, 2, 10, -8], exposure: 0.95 };
  },
};
// ───────── scripts. Each shot: { set, cast: {key:[x,z,yaw,anim]}, cam, lines:[[who,text]], card, fx }
export const CINES = {
  intro: [
    { set: 'stadium', card: ['RAZORCRACK STADIUM', 'Fayetteville, AR · Saturday night · 10 months before the wedding'], cast: { shayla: [-0.4, 38, 0.2, 'Idle_Loop'], kennedy: [0.6, 38.2, -0.3, 'Idle_Talking_Loop'] }, cam: { pos: [-1.6, 1.6, 41.5], pos2: [-1.2, 1.55, 40.6], look: [0.1, 1.3, 38] }, lines: [['ANNOUNCER', "...and that's the end of the third quarter! Hogs trail by forty! Please remain in your seats and do not bite the other fans!"], ['KENNEDY', "Babe. Best night ever. Hogs are losing, nachos are cold, and you're gonna marry me."]] },
    { cam: { close: 'shayla', dist: 0.75, side: 0.18 }, talk: 'shayla', lines: [['SHAYLA', "August, Colorado, mountains, the whole Pinterest board. I just need my four things. Something old, something new, something borrowed, something blue."]] },
    { cam: { close: 'kennedy', dist: 0.78, side: -0.15 }, talk: 'kennedy', lines: [['KENNEDY', "Okay, explain the four things again. Slowly. Like I'm a Hogs fan in the fourth quarter."]] },
    { cam: { close: 'shayla', dist: 0.75, side: 0.18 }, talk: 'shayla', lines: [['SHAYLA', "SOMETHING OLD: Mom's brooch. She'll be at the 67 Grill in Arkadelphia."], ['SHAYLA', "SOMETHING BORROWED: Kayleigh's lucky push-up girdle. Fayetteville square. Don't ask, don't touch."]], card: ['THE MISSION', '4 wedding things · kill everything in between'] },
    { cam: { close: 'shayla', dist: 0.7, side: -0.12 }, talk: 'shayla', lines: [['SHAYLA', "SOMETHING NEW: the necklace from the jewelry store in Colorado Springs. You're paying."], ['SHAYLA', "SOMETHING BLUE: blue columbines from Garden of the Gods. Colorado state flower. Very Pinterest."]], card: ['THE MISSION', 'OLD · BORROWED · NEW · BLUE'] },
    { cam: { close: 'kennedy', dist: 0.78, side: -0.15 }, talk: 'kennedy', lines: [['KENNEDY', "Brooch, girdle, necklace, flowers. Got it. Four things, one road trip, a thousand zombies."], ['KENNEDY', "I'll get you all four. And something gold. Big gold. I've been watching documentaries."], ['SHAYLA', '...Why is that guy eating the mascot?']] },
    { cam: { pos: [2.4, 1.4, 42], pos2: [2.0, 1.5, 41.2], look: [0, 1.4, 30] }, lines: [['ANNOUNCER', "Folks, uh, the hog is... the hog is eating the band. Please DO call the Hogs. Call them from very far away."], ['KENNEDY', 'Babe. I left the good guns in the truck.']] },
    { cam: { close: 'shayla', dist: 0.62, side: -0.12 }, talk: 'shayla', anim: { shayla: 'Pistol_Idle_Loop' }, lines: [['SHAYLA', "I didn't. Purse Glock. Every bride needs one. Let's go, babe. Nobody eats anybody before my fucking wedding."]], card: ['PARABELLUM 2', 'Something Old, Something Undead'] },
  ],
  lead: [
    { set: 'stadium', card: ['THE TUNNEL', 'After the fourth quarter (zombies won)'], cast: { shayla: [9, 34, Math.PI, 'Idle_Talking_Loop'], kennedy: [10.6, 34.2, Math.PI - 0.2, 'Pistol_Idle_Loop'] }, cam: { pos: [8.2, 1.6, 30.8], pos2: [8.8, 1.55, 31.6], look: [9.8, 1.3, 34] }, lines: [['MOM', "(phone) Shayla Marie! Are you watching the news?! The dead are up in Arkadelphia! Downtown's a mess!"], ['SHAYLA', 'Mom! Are you okay? Where are you?']] },
    { set: 'phone', cast: { mom: [0, 0, 0, 'Idle_Talking_Loop'] }, cam: { close: 'mom', dist: 0.8, side: -0.18 }, talk: 'mom', lines: [['MOM', "I'm fine, baby, I'm at the 67 Grill. They've got catfish and a shotgun. But listen. Grandma's brooch. Your something old."], ['MOM', "It's in my purse and I am NOT driving through Main Street with those things. You come get it. Bring that handsome man."]] },
    { set: 'stadium', cast: { shayla: [9, 34, Math.PI, 'Pistol_Idle_Loop'], kennedy: [10.6, 34.2, Math.PI - 0.2, 'Pistol_Idle_Loop'] }, cam: { close: 'kennedy', dist: 0.72, side: 0.15 }, talk: 'kennedy', lines: [['KENNEDY', 'Your mom called me handsome. I heard it. Arkadelphia, baby. Something old. Let\'s roll.']], card: ['SOMETHING OLD', "Grandma's brooch · Downtown Arkadelphia → 67 Grill"] },
  ],
  mom: [
    { set: 'grill', card: ['67 GRILL', 'Arkadelphia, AR · lunch rush (literal)'], cast: { mom: [0.4, -1.8, 0.2, 'Idle_Talking_Loop'], shayla: [-0.6, 0.6, Math.PI - 0.3, 'Idle_Loop'], kennedy: [1.6, 0.9, Math.PI + 0.4, 'Pistol_Idle_Loop'] }, cam: { pos: [-1.8, 1.7, 4.6], pos2: [-1.4, 1.6, 3.6], look: [-0.6, 1.7, -3] }, lines: [['MOM', "There's my girl! Oh honey, you've got brains in your hair. Come here."], ['SHAYLA', 'Hi Mama. Long day. Like, forty zombies long.']] },
    { cam: { close: 'mom', dist: 0.8, side: -0.15 }, talk: 'mom', lines: [['MOM', "This was your great-grandma's. She wore it when she married your great-grandpa, and she stabbed a man with it in 1952. It's good luck."]], fx: 'relic' },
    { cam: { close: 'shayla', dist: 0.72, side: 0.18 }, talk: 'shayla', lines: [['SHAYLA', "Mama... it's perfect. Something old. I'm gonna cry and I've got zombie on my face."]] },
    { cam: { close: 'kennedy', dist: 0.72, side: -0.15 }, talk: 'kennedy', lines: [['KENNEDY', 'Ma\'am, I promise to protect your daughter with my life and several firearms.'], ['MOM', "I know you will, sugar. Now take this catfish to go. Kayleigh called. Something about a lucky... undergarment. In Fayetteville."]] },
    { cam: { pos: [-1.4, 1.5, 3.2], pos2: [-0.9, 1.7, 4.0], look: [0.4, 1.2, -0.6] }, talk: 'shayla', lines: [['SHAYLA', "Oh God. She means the girdle. I'm not wearing the girdle. ...I'm wearing the girdle."]], card: ['SOMETHING OLD ✔', "Great-grandma's stabbing brooch"] },
  ],
  kayleigh: [
    { set: 'square', card: ['THE FAYETTEVILLE SQUARE', 'Something borrowed'], cast: { kayleigh: [0.6, 1.0, -0.5, 'Idle_Talking_Loop'], shayla: [-0.8, 2.4, Math.PI - 0.6, 'Idle_Loop'], kennedy: [-2.0, 3.0, Math.PI - 0.9, 'Pistol_Idle_Loop'] }, cam: { pos: [-3.0, 1.6, 5.6], pos2: [-2.4, 1.55, 4.8], look: [0.0, 1.3, 1.2] }, lines: [['KAYLEIGH', "Girl! You made it! I was gonna come to you but there were like six dead hipsters outside the coffee shop and I'm in my good jacket."]] },
    { cam: { close: 'kayleigh', dist: 0.75, side: -0.14 }, talk: 'kayleigh', lines: [['KAYLEIGH', "Okay. Something borrowed. This is my lucky push-up girdle. It got me through prom, two weddings and one deposition. It lifts. It tucks. It BELIEVES in you."]], fx: 'relic' },
    { cam: { close: 'shayla', dist: 0.72, side: 0.16 }, talk: 'shayla', lines: [['SHAYLA', "Kayleigh, I am not wearing your— ...oh. Oh, wow. I feel like I could fistfight God."]] },
    { cam: { close: 'kennedy', dist: 0.72, side: -0.12 }, talk: 'kennedy', lines: [['KENNEDY', "Babe. Your posture. You look like a Marvel poster. I'm getting emotional."], ['KAYLEIGH', 'Bring it back washed. Like, WASHED washed.']] },
    { cam: { pos: [-2.6, 1.6, 5.0], pos2: [-2.0, 1.9, 6.2], look: [0, 1.2, 1.2] }, talk: 'shayla', lines: [['SHAYLA', "Colorado, here we come. Something new and something blue. Kennedy, you're driving."]], card: ['SOMETHING BORROWED ✔', 'Lucky push-up girdle · +10% CONFIDENCE ARMOR'] },
  ],
  roadtrip: [
    { set: 'parking', card: ["FREDDO'S · I-30 EXIT 98", 'A throwback dinner on the way to Colorado'], cast: { shayla: [0, 2, Math.PI * 0.1, 'Idle_Talking_Loop'], kennedy: [1.4, 2.3, -0.4, 'Idle_Loop'] }, cam: { pos: [-2.4, 1.5, 5.4], pos2: [-1.8, 1.5, 4.6], look: [0.6, 1.4, 1.8] }, lines: [['KENNEDY', "Babe, this Freddo's looks EXACTLY like the one we... nope. Never happened. Different timeline. Steakburger?"], ['SHAYLA', "Two. And a concrete. And then we drive twelve hours and you don't stop for ANY gun shows."]] },
    { cam: { close: 'kennedy', dist: 0.72, side: -0.15 }, talk: 'kennedy', lines: [['KENNEDY', "...There's one in Amarillo though."]], card: ['ROAD TRIP', 'Arkansas → Colorado Springs · 12 hours · 3 gun shows (skipped)'] },
  ],
  necklace: [
    { set: 'jewelry', card: ['SPARKLE & SONS FINE JEWELRY', 'Downtown Colorado Springs · something new'], cast: { kennedy: [0.9, 0.3, Math.PI + 0.3, 'Idle_Talking_Loop'], shayla: [-0.9, 0.6, Math.PI - 0.3, 'Idle_Loop'] }, cam: { pos: [0.1, 1.5, 3.8], pos2: [0.0, 1.45, 3.0], look: [0, 1.1, -0.6] }, lines: [['KENNEDY', "Okay. I've been saving. Every overtime shift. Every 'Kennedy, do you NEED another rifle'. This is why. Something new."]], fx: 'relic' },
    { cam: { close: 'shayla', dist: 0.72, side: 0.15 }, talk: 'shayla', lines: [['SHAYLA', 'Kennedy... that is a diamond. That is a REAL diamond. Who did you shoot?'], ['KENNEDY', "Nobody! I left the money on the counter! The clerk was a zombie, but I still left a tip."]] },
    { cam: { close: 'kennedy', dist: 0.7, side: -0.14 }, talk: 'kennedy', lines: [['KENNEDY', "Last thing. Something blue. Garden of the Gods has blue columbines this time of year. Also, I read there's trolls. Like, zombie trolls. That's probably fine."]], card: ['SOMETHING NEW ✔', 'A diamond necklace (paid for, mostly)'] },
  ],
  flowers: [
    { set: 'garden', card: ['GARDEN OF THE GODS', 'Five blue columbines · one very dead troll king'], cast: { shayla: [-0.7, -6.5, Math.PI - 0.2, 'Idle_Loop'], kennedy: [0.9, -6.2, Math.PI + 0.3, 'Pistol_Idle_Loop'] }, cam: { pos: [0.3, 1.6, -3.0], pos2: [0.2, 1.5, -4.0], look: [0, 1.4, -10] }, lines: [['SHAYLA', 'Columbines. Something blue. All four, babe. We did it.'], ['KENNEDY', 'Babe. BABE. That troll king came out of THAT. Is that a... gold mine?']] },
    { cam: { close: 'kennedy', dist: 0.72, side: -0.14 }, talk: 'kennedy', lines: [['KENNEDY', "Remember? I said something gold. I PROMISED something gold. And look what was in the troll's crate. Rocket launcher. Minigun. It's like Christmas had a baby with a war."]] },
    { cam: { close: 'shayla', dist: 0.7, side: 0.16 }, talk: 'shayla', anim: { shayla: 'Pistol_Idle_Loop' }, lines: [['SHAYLA', "A honeymoon fund in a haunted mine. Fine. Give me the minigun. If I die in there I'm haunting your mom."]], card: ['THE LOST GRUBSTAKE MINE', 'New guns · gold bars · something very old and very angry'] },
  ],
  ending: [
    { set: 'minemouth', card: ['DAYLIGHT', 'Garden of the Gods · the next morning'], cast: { shayla: [-0.7, 1.0, 0.25, 'Idle_Loop'], kennedy: [0.7, 1.1, -0.2, 'Idle_Loop'] }, cam: { pos: [0.4, 1.4, 5.4], pos2: [0.3, 1.5, 4.2], look: [0, 1.0, 1.0] }, lines: [['SHAYLA', "Old Man Grubstake is dead. Again. We're covered in gold dust and zombie and I have never felt prettier."]], fx: 'sparkle' },
    { cam: { close: 'kennedy', dist: 0.72, side: -0.14 }, talk: 'kennedy', lines: [['KENNEDY', "Babe, that's enough gold for the venue, the honeymoon, and a tasteful number of new rifles."], ['SHAYLA', 'Define tasteful.'], ['KENNEDY', "...Eleven."]] },
    { cam: { close: 'shayla', dist: 0.7, side: 0.16 }, talk: 'shayla', lines: [['SHAYLA', "Something old. Something borrowed. Something new. Something blue. And a fiancé who never once left my side. I love you, you idiot."], ['KENNEDY', "I love you too. Let's go get married."]] },
    { cam: { pos: [0.4, 1.8, 4.6], pos2: [0.2, 2.6, 7.0], look: [0, 1.4, 0] }, fx: 'fireworks', dance: true, lines: [['ALL', 'AUGUST 2027 · COLORADO · SHAYLA ♥ KENNEDY'], ['SHAYLA', 'See you at the wedding, motherfuckers. Dress code: armed.']], card: ['THE END', 'Ready for the wedding. And the honeymoon. ♥'] },
  ],
};
// ───────── runner
const C = { active: false };
const fw = { pts: null, n: 700 };
export function cineActive() { return C.active; }
export function cineInfo() { return C.active ? { name: C.name, shot: C.i, line: C.li, who: C.lineWho, txt: C.lineTxt, lineT: C.lineT } : null; }
export function playCine(name) {
  return new Promise(res => {
    const script = CINES[name]; C.active = true; C.script = script; C.i = -1; C.res = res; C.scene = new THREE.Scene(); C.cam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.03, 200); C.setName = null; C.W = null; C.name = name;
    const el = document.createElement('div'); el.className = 'cine'; el.innerHTML = `<div class="bars"></div><div class="card" id="cinecard"></div><div class="line" id="cineline"><div class="who"></div><div class="txt"></div></div><div class="b small alt skip" id="cineskip">SKIP ▸▸</div><div class="tap">tap ▸</div>`;
    H.screens.appendChild(el); C.el = el;
    // tap advances one line; ignore taps in the first 0.6 s of a line so a double-tap can't skip two lines
    el.addEventListener('pointerdown', e => { if (e.target.id === 'cineskip') { finish(); return; } if (performance.now() - (C.lineAt || 0) < 600) return; advance(); });
    C.onKey = e => { if (e.code === 'Space' || e.code === 'Enter') advance(); if (e.code === 'Escape') finish(); }; addEventListener('keydown', C.onKey);
    nextShot();
  });
}
function buildSet(name) {
  if (C.W) { C.W.dispose(); C.scene.remove(C.W.group); }
  C.scene = new THREE.Scene(); const W = new World(C.scene); W.bounds = { minX: -30, maxX: 30, minZ: -30, maxZ: 30 };
  const env = SETS[name](W, C.scene); W.finalize(); C.W = W; C.setName = name;
  const hemi = new THREE.HemisphereLight(env.hemi[0], env.hemi[1], env.hemi[2]); C.scene.add(hemi);
  const key = new THREE.DirectionalLight(env.key[0], env.key[1]); key.position.set(env.key[2], env.key[3], env.key[4]); key.castShadow = E.q.shadows; key.shadow.mapSize.set(1024, 1024); const sc = key.shadow.camera; sc.left = sc.bottom = -6; sc.right = sc.top = 6; sc.near = 0.5; sc.far = 30; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; C.scene.add(key);
  const rim = new THREE.DirectionalLight('#bfd8ff', 0.7); rim.position.set(-3, 3, -4); C.scene.add(rim);
  C.exposure = env.exposure; C.flick = W.flicker; C.shotCast = {};
  if (W.gcase) C.scene.add(W.gcase);
}
function place(cast) {
  for (const k in C.shotCast) { const a = actor(k); a.root.removeFromParent(); }
  C.shotCast = {};
  for (const k in cast) {
    const [x, z, yaw, anim] = cast[k]; const a = actor(k); C.scene.add(a.root); a.root.position.set(x, 0, z); a.root.rotation.set(0, yaw, 0); a.root.visible = true; C.shotCast[k] = { anim };
    if (a.doll) { if (k === 'doll') a.root.position.y = 1.1; } else { for (const n in a.bone) a.bone[n].scale.set(1, 1, 1); a.mixer.stopAllAction(); a.cur = null; a.play(anim || 'Idle_Loop', 0); if (a.cur) a.cur.time = rand(0, 2); }
  }
}
function nextShot() {
  C.i++; if (C.i >= C.script.length) { finish(); return; }
  const s = C.script[C.i]; C.shot = s; C.t = 0; C.li = -1;
  if (s.set && s.set !== C.setName) { buildSet(s.set); }
  if (s.cast) place(s.cast);
  if (s.anim) for (const k in s.anim) actor(k).play(s.anim[k], 0.3);
  if (s.dance) for (const k in C.shotCast) { const a = actor(k); if (!a.doll) { a.play('Dance_Loop', 0.4, { speed: rand(0.9, 1.1) }); } }
  const card = C.el.querySelector('#cinecard'); if (s.card) { card.innerHTML = `${s.card[0]}<small>${s.card[1]}</small>`; card.style.opacity = 1; } else card.style.opacity = 0;
  if (s.fx === 'relic' || s.fx === 'sparkle') sfx('sting', null, 0.8); if (s.fx === 'skid') { sfx('engine', null, 1); setTimeout(() => sfx('crash', null, 0.5), 300); } if (s.fx === 'fireworks') startFireworks();
  if (s.talk) { const a = actor(s.talk); if (!a.doll && !s.dance && !(s.anim && s.anim[s.talk])) a.play('Idle_Talking_Loop', 0.3); }
  setupCam(s); advance();
}
function headPos(k, out) { const a = actor(k); if (a.doll) return out.copy(a.root.position).add(V(0, 0.72 * a.root.scale.x, 0)); a.root.updateMatrixWorld(true); return a.bone.Head.getWorldPosition(out).add(V(0, 0.05 * a.root.scale.x, 0)); }
function setupCam(s) {
  const c = s.cam || {}; C.camDef = c;
  if (c.close) { const a = actor(c.close); const yaw = a.root.rotation.y; const f = V(Math.sin(yaw), 0, Math.cos(yaw)), r = V(Math.cos(yaw), 0, -Math.sin(yaw)); const hp = headPos(c.close, V()); const d = c.dist || 0.7;
    C.p0 = hp.clone().addScaledVector(f, d).addScaledVector(r, c.side || 0).add(V(0, c.h || 0.01, 0)); C.p1 = hp.clone().addScaledVector(f, d * 0.88).addScaledVector(r, (c.side || 0) * 0.9).add(V(0, c.h || 0.01, 0)); C.look = hp.clone().add(V(0, -0.035, 0)); C.fov = 30; C.track = c.close; }
  else { C.p0 = V(...c.pos); C.p1 = V(...(c.pos2 || c.pos)); C.look = V(...c.look); C.fov = 42; C.track = null; }
}
function advance() {
  const s = C.shot; if (!s) return; C.li++;
  if (C.li >= s.lines.length) { nextShot(); return; }
  const [who, txt] = s.lines[C.li]; const ln = C.el.querySelector('#cineline'); ln.querySelector('.who').textContent = who; ln.querySelector('.who').style.color = COLORS[who] || '#fff'; ln.querySelector('.txt').textContent = txt;
  // readable on a phone: at least 4.5 s per line (longer lines get more), tap to advance sooner
  C.lineT = Math.max(4.5, 2.2 + txt.length * 0.06); C.autoT = C.lineT; C.lineAt = performance.now(); C.lineWho = who; C.lineTxt = txt;
  if (s.talk === undefined) { const k = who.toLowerCase(); if (C.shotCast[k] && !actor(k).doll && !s.dance) actor(k).play('Idle_Talking_Loop', 0.3); }
}
function finish() {
  if (!C.active) return; C.active = false; removeEventListener('keydown', C.onKey); C.el.remove();
  for (const k in C.shotCast) actor(k).root.removeFromParent();
  if (C.W) { if (C.W.gcase) C.W.gcase.removeFromParent(); C.W.dispose(); C.W = null; } if (fw.pts) { fw.pts.removeFromParent(); fw.pts = null; }
  C.setName = null; const r = C.res; C.res = null; r && r();
}
// peace sign: index + middle up, others curled, arm raised
const qa = new THREE.Quaternion();
function peacePose(a, k) {
  const b = a.bone; const rot = (bone, ax, ang) => { if (!bone) return; qa.setFromAxisAngle(ax, ang * k); bone.quaternion.multiply(qa); };
  rot(b.upperarm_r, V(0, 0, 1), -1.15); rot(b.upperarm_r, V(0, 1, 0), 0.5); rot(b.lowerarm_r, V(0, 0, 1), -1.6);
  for (const f of ['ring', 'pinky']) for (const i of ['01', '02', '03']) rot(b[`${f}_${i}_r`], V(0, 0, 1), 1.25);
  for (const f of ['index', 'middle']) rot(b[`${f}_01_r`], V(0, 1, 0), f === 'index' ? 0.18 : -0.18);
  rot(b.thumb_02_r, V(0, 0, 1), 0.9); rot(b.thumb_03_r, V(0, 0, 1), 0.9);
}
function startFireworks() {
  const n = fw.n; const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3).fill(-999), colr = new Float32Array(n * 3); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  fw.pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.32, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fw.pts.frustumCulled = false; C.scene.add(fw.pts);
  fw.v = new Float32Array(n * 3); fw.life = new Float32Array(n); fw.head = 0; fw.t = 0;
}
function tickFireworks(dt) {
  if (!fw.pts) return; fw.t -= dt; const P = fw.pts.geometry.attributes.position, Cc = fw.pts.geometry.attributes.color;
  if (fw.t <= 0) { fw.t = rand(0.35, 0.8); const cx = rand(-6, 6), cy = rand(6, 10), cz = rand(-9, -5); const c = new THREE.Color().setHSL(Math.random(), 1, 0.6); sfx('explode', null, 0.25);
    for (let k = 0; k < 70; k++) { const i = fw.head; fw.head = (fw.head + 1) % fw.n; const d = V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(3, 5)); P.setXYZ(i, cx, cy, cz); fw.v[i * 3] = d.x; fw.v[i * 3 + 1] = d.y; fw.v[i * 3 + 2] = d.z; fw.life[i] = rand(1.2, 1.8); Cc.setXYZ(i, c.r, c.g, c.b); } }
  for (let i = 0; i < fw.n; i++) { if (fw.life[i] <= 0) continue; fw.life[i] -= dt; fw.v[i * 3 + 1] -= 3 * dt; P.setXYZ(i, P.getX(i) + fw.v[i * 3] * dt, P.getY(i) + fw.v[i * 3 + 1] * dt, P.getZ(i) + fw.v[i * 3 + 2] * dt); if (fw.life[i] <= 0) P.setY(i, -999); const f = Math.max(0, fw.life[i] / 1.5); Cc.setXYZ(i, Cc.getX(i) * (0.985), Cc.getY(i) * 0.985, Cc.getZ(i) * 0.985); }
  P.needsUpdate = true; Cc.needsUpdate = true;
}
export function cineTick(dt) {
  if (!C.active) return; C.t += dt; C.autoT -= dt; if (C.autoT <= 0 && C.autoAdvance !== false) advance(); if (!C.active) return;
  for (const k in C.shotCast) { const a = actor(k); if (a.doll) { a.root.rotation.y += Math.sin(C.t * 2) * 0.002; continue; } a.mixer.update(dt); if (C.shot.peace && k === 'kelly') { peacePose(a, Math.min(1, C.t * 2)); } }
  if (C.flick) C.flick.intensity = C.shot.fx === 'flicker' ? (Math.random() < 0.3 ? 0.4 : 9) : 9;
  tickFireworks(dt);
  const dur = 6; const t = clamp(C.t / dur, 0, 1); const e = t * t * (3 - 2 * t);
  C.cam.position.lerpVectors(C.p0, C.p1, e); if (C.track) { const hp = headPos(C.track, V()).add(V(0, -0.035, 0)); C.look.lerp(hp, Math.min(1, dt * 6)); }
  C.cam.lookAt(C.look); C.cam.fov = C.fov; C.cam.aspect = innerWidth / innerHeight; C.cam.updateProjectionMatrix();
  E.renderer.toneMappingExposure = C.exposure || 1;
  E.renderer.render(C.scene, C.cam);
}
// Render a portrait of Shayla's face for the HUD vitals monitor (uses the same character as the cutscenes)
export function renderPortrait() {
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#123a2a'); const a = actor('shayla'); sc.add(a.root); a.root.position.set(0, 0, 0); a.root.rotation.set(0, 0, 0); a.mixer.stopAllAction(); a.cur = null; a.play('Idle_Loop', 0); a.mixer.update(0.5);
  sc.add(new THREE.HemisphereLight('#ffffff', '#335544', 1.4)); const k = new THREE.DirectionalLight('#fff', 1.6); k.position.set(1, 2, 3); sc.add(k);
  const cam = new THREE.PerspectiveCamera(26, 1, 0.05, 10); const hp = headPos('shayla', V()); cam.position.copy(hp).add(V(0.12, 0.0, 0.62)); cam.lookAt(hp.clone().add(V(0, -0.03, 0)));
  const r = E.renderer; const rt = new THREE.WebGLRenderTarget(128, 128, { colorSpace: THREE.SRGBColorSpace }); r.setRenderTarget(rt); r.render(sc, cam); const px = new Uint8Array(128 * 128 * 4); r.readRenderTargetPixels(rt, 0, 0, 128, 128, px); r.setRenderTarget(null); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); const id = x.createImageData(128, 128); for (let y = 0; y < 128; y++) for (let i = 0; i < 512; i++) { const v = px[(127 - y) * 512 + i]; id.data[y * 512 + i] = (i & 3) === 3 ? 255 : Math.round(255 * Math.pow(v / 255, 1 / 2.2)); } x.putImageData(id, 0, 0);
  a.root.removeFromParent(); return cv.toDataURL();
}
