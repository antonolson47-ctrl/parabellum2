const { chromium } = require('playwright'); const serve = require('./serve.cjs');
(async () => {
  const s = await serve(); const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await br.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const sleep = ms => new Promise(r => setTimeout(r, ms));
  await p.goto(`http://127.0.0.1:${s.address().port}/dist/index.html`);
  await p.waitForFunction(() => window.__PB && window.__PB.G.mode === 'title', null, { timeout: 240000 });
  await p.evaluate(() => { const P = window.__PB; P.S.data.seenIntro = true; P.startLevel(2); });
  await p.waitForFunction(() => window.__PB.G.mode === 'play', null, { timeout: 180000 });
  await p.evaluate(() => { const P = window.__PB, G = P.G; P.noDirector && P.noDirector(true); const pl = G.player; P.pickup('relic_girdle', pl.pos.x, pl.pos.z - 2.2); pl.pos.z += 0; pl.pitch = -0.3; });
  await sleep(4000); await p.screenshot({ path: '../screenshots/girdle_closeup.png' });
  await p.evaluate(() => { window.__PB.cine('kayleigh'); }); await sleep(2500); await p.mouse.click(600, 300); await sleep(2500); await p.screenshot({ path: '../screenshots/girdle_cutscene.png' });
  await br.close(); s.close(); process.exit(0);
})();
