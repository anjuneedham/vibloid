// usage: node render.js <outDir> [fps] [scale] [sceneIdx|all]   (needs playwright + ffmpeg)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), cp = require('child_process');
const out = process.argv[2], fps = +(process.argv[3] || 24), scale = +(process.argv[4] || 0.6667), only = process.argv[5] || 'all';
(async () => {
  const br = await chromium.launch(); const W = Math.round(1920 * scale), H = Math.round(1080 * scale);
  const p = await br.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  await p.goto('file://' + path.join(__dirname, 'stage.html'));
  const scenes = await p.evaluate(() => STUDIO.scenes.map((s) => ({ id: s.id, dur: s.dur })));
  fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < scenes.length; i++) {
    if (only !== 'all' && +only !== i) continue;
    const dir = path.join(out, 'frames-' + scenes[i].id); fs.mkdirSync(dir, { recursive: true });
    const n = Math.round(scenes[i].dur * fps);
    for (let f = 0; f < n; f++) {
      await p.evaluate(([a, t]) => draw(a, t), [i, f / fps]);
      await p.screenshot({ path: path.join(dir, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 88 });
    }
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(fps), '-i', path.join(dir, '%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', path.join(out, scenes[i].id + '.mp4')]);
    console.log(scenes[i].id, n, 'frames');
  }
  await br.close();
})();
