const { chromium } = require('playwright'); const serve = require('./serve.cjs');
(async () => {
  const s = await serve(); const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await br.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${s.address().port}/dev/game.html`);
  await p.waitForFunction(() => window.__PB && window.__PB.G.mode === 'title', null, { timeout: 240000 });
  const sleep = ms => new Promise(r => setTimeout(r, ms)); const shot = n => p.screenshot({ path: `screenshots/${n}.png` });
  // intro
  await p.evaluate(() => { window.__PB.S.data.seenIntro = false; window.__PB.startLevel(0); });
  await p.waitForFunction(() => window.__PB.G.mode === 'cine', null, { timeout: 180000 });
  let k = 0; for (let i = 0; i < 7; i++) { await sleep(2500); const t = await p.evaluate(() => (document.getElementById('cineline') || {}).innerText || ''); if (/SOMETHING|four things/.test(t)) await shot(`intro_mission_${++k}`); await p.mouse.click(640, 360); }
  await p.evaluate(() => window.__PB.skipCine()); await p.waitForFunction(() => window.__PB.G.mode === 'play', null, { timeout: 60000 }); await sleep(1500); await shot('intro_hud_checklist');
  // garden
  await p.evaluate(() => { const P = window.__PB; P.S.data.items = { brooch: true, girdle: true, necklace: true }; P.S.data.unlocked = 6; P.startLevel(5); });
  await p.waitForFunction(() => window.__PB.G.mode === 'play' && window.__PB.G.levelIdx === 5, null, { timeout: 180000 }); await sleep(4500); await shot('garden_flower_markers');
  await p.evaluate(() => window.__PB.autopilot(true)); let t0 = Date.now(), shot2 = false;
  while (true) { await sleep(2000); const st = await p.evaluate(() => window.__PB.state());
    if (!shot2 && st.flowers >= 2) { await shot('garden_flowers_progress'); shot2 = true; }
    if (st.phase === 'boss' && Date.now() - t0 > 600000) await p.evaluate(() => window.__PB.hurtBoss(1));
    if (st.mode !== 'play') { console.log('left play', JSON.stringify(st), (Date.now() - t0) / 1000); break; }
    if (Date.now() - t0 > 15 * 60000) { console.log('TIMEOUT', JSON.stringify(st)); break; }
    if ((Date.now() - t0) % 30000 < 2100) console.log(JSON.stringify(st));
  }
  await p.evaluate(() => { window.__PB.G.autoSkipCine = 300; });
  await p.waitForFunction(() => window.__PB.G.mode === 'cine' || document.getElementById('rnext'), null, { timeout: 30000 }).catch(() => { });
  for (let i = 0; i < 40; i++) { await sleep(1000); const m = await p.evaluate(() => window.__PB.G.mode); if (m === 'play' && (await p.evaluate(() => window.__PB.G.levelIdx)) === 6) break; await p.evaluate(() => { window.__PB.skipCine(); for (const id of ['rnext', 'shopnext', 'snext']) { const e = document.getElementById(id); if (e) e.click(); } const b = [...document.querySelectorAll('#screens button')].find(b => /NEXT SCENE|CONTINUE/.test(b.textContent)); if (b) b.click(); }); }
  await sleep(3000); const st = await p.evaluate(() => window.__PB.state()); console.log('FINAL', JSON.stringify(st)); await shot('mine_chapter_start');
  console.log('ERRS', JSON.stringify(errs)); await br.close(); s.close(); process.exit(0);
})();
