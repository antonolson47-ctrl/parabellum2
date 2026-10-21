const { chromium } = require('playwright'); const serve = require('./serve.cjs');
(async () => {
  const s = await serve(); const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await br.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  const sleep = ms => new Promise(r => setTimeout(r, ms)); const LV = +(process.env.LV || 0), PFX = process.env.PFX || 'hog_boss'; const shot = n => p.screenshot({ path: `../screenshots/${n.replace('hog_boss', PFX)}.png` });
  await p.goto(`http://127.0.0.1:${s.address().port}/dist/index.html`);
  await p.waitForFunction(() => window.__PB && window.__PB.G.mode === 'title', null, { timeout: 240000 });
  await p.evaluate(LV => { const P = window.__PB; P.S.data.seenIntro = true; P.startLevel(LV); }, LV);
  await p.waitForFunction(() => window.__PB.G.mode === 'play', null, { timeout: 180000 }); await sleep(1000);
  await p.evaluate(() => { const P = window.__PB; P.toBoss(); P.autopilot(true); });
  await p.waitForFunction(() => window.__PB.G.level.phase === 'boss', null, { timeout: 120000 });
  await p.evaluate(() => { const P = window.__PB, G = P.G; P.autopilot(false); G.player.pos.set(0, 0, -12); G.player.yaw = 0; G.player.pitch = 0.32; });
  await sleep(2500); await shot('hog_boss_intro');
  await p.evaluate(() => { const G = window.__PB.G; const b = G.level.anc.bossAt; G.player.pos.set(b.x + 1.5, 0, b.z + 8); G.player.yaw = 0.1; G.player.pitch = 0.5; }); await sleep(600); await shot('hog_boss_closeup');
  await p.evaluate(() => window.__PB.autopilot(true)); let t0 = Date.now(), mid = false, full = 0;
  while (true) { await sleep(2000); const st = await p.evaluate(() => window.__PB.state());
    full = Math.max(full, st.boss || 0); if (!mid && st.boss && st.boss < full * 0.75) { await shot('hog_boss_midfight'); mid = true; }
    if (st.phase !== 'boss') { console.log('phase', st.phase, (Date.now() - t0) / 1000, 'hp', st.hp); break; }
    if (Date.now() - t0 > 240000) { await p.evaluate(() => window.__PB.hurtBoss(1)); }
    if ((Date.now() - t0) % 20000 < 2100) console.log(JSON.stringify({ boss: st.boss, hp: st.hp, alive: st.alive }));
  }
  if (!mid) await shot('hog_boss_midfight');
  await sleep(1200); await shot('hog_boss_death');
  await p.evaluate(() => { window.__PB.G.autoSkipCine = 300; });
  for (let i = 0; i < 60; i++) { await sleep(1000); const m = await p.evaluate(() => [window.__PB.G.mode, window.__PB.G.levelIdx]); if (m[0] === 'play' && m[1] === LV + 1) break; await p.evaluate(() => { const e = window.__PB.G.level && window.__PB.G.level.anc.exit; if (window.__PB.G.level && window.__PB.G.level.phase === 'exit' && e) window.__PB.tp(e.x, e.z); window.__PB.skipCine(); const b = [...document.querySelectorAll('#screens button')].find(b => /NEXT SCENE|CONTINUE/.test(b.textContent)); if (b) b.click(); }); }
  console.log('FINAL', JSON.stringify(await p.evaluate(() => [window.__PB.G.mode, window.__PB.G.levelIdx, window.__PB.G.level.def.name])));
  console.log('ERRS', JSON.stringify(errs)); await br.close(); s.close(); process.exit(0);
})();
