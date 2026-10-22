const { chromium } = require('playwright'); const serve = require('./serve.cjs');
(async () => {
  const s = await serve(); const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await br.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = n => p.screenshot({ path: `../screenshots/${n}.png` });
  const look = (x, z, tx, tz, pitch = 0.05) => p.evaluate(([x, z, tx, tz, pitch]) => { const pl = window.__PB.G.player; pl.pos.set(x, 0, z); pl.yaw = Math.atan2(-(tx - x), -(tz - z)); pl.pitch = pitch; }, [x, z, tx, tz, pitch]);
  await p.goto(`http://127.0.0.1:${s.address().port}/dist/index.html`);
  await p.waitForFunction(() => window.__PB && window.__PB.G.mode === 'title', null, { timeout: 240000 });
  await p.evaluate(() => { const P = window.__PB; P.S.data.seenIntro = true; P.startLevel(3); });
  await p.waitForFunction(() => window.__PB.G.mode === 'play', null, { timeout: 180000 }); const t0 = Date.now();
  await p.evaluate(() => window.__PB.noDirector && window.__PB.noDirector(true));
  await look(-4, 24, 6, -14, 0.08); await sleep(1500); await shot('freddo_day_overview');
  await look(8, 3, 23, 0, 0.12); await sleep(1200); await shot('freddo_buffalo');
  await look(-20, 13, -26, 20.5, 0.05); await sleep(1500); await shot('freddo_sign_tumbleweeds');
  await look(8, 3, 23, 0, 0.12); await p.waitForFunction(() => { const G = window.__PB.G; return true; }); 
  const wait = Math.max(0, 7800 - (Date.now() - t0)); await sleep(wait); await shot('freddo_buffalo_eyes_glow');
  await sleep(1600); await shot('freddo_buffalo_spawn');
  await sleep(1500); await shot('freddo_buffalo_spawn2');
  await p.evaluate(() => { window.__PB.noDirector && window.__PB.noDirector(false); window.__PB.autopilot(true); window.__PB.G.autoSkipCine = 300; });
  for (let i = 0; i < 300; i++) { await sleep(2000); const st = await p.evaluate(() => window.__PB.state()); if (st.mode === 'play' && st.level === 4) break;
    if (st.phase === 'fight' && i > 60) await p.evaluate(() => window.__PB.toBoss()); if (st.phase === 'boss' && i > 90) await p.evaluate(() => window.__PB.hurtBoss(1));
    await p.evaluate(() => { const G = window.__PB.G; const e = G.level && G.level.anc.exit; if (G.level && G.level.phase === 'exit' && e) window.__PB.tp(e.x, e.z); window.__PB.skipCine(); const b = [...document.querySelectorAll('#screens button')].find(b => /NEXT SCENE|CONTINUE/.test(b.textContent)); if (b) b.click(); }); }
  console.log('FINAL', JSON.stringify(await p.evaluate(() => [window.__PB.G.mode, window.__PB.G.levelIdx, window.__PB.G.level.def.name])));
  console.log('ERRS', JSON.stringify(errs)); await br.close(); s.close(); process.exit(0);
})();
