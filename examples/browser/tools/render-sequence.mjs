// render-sequence.mjs — 无头渲染:场景在固定 t 出帧(确定性),PNG 序列 + 可选 ffmpeg 合成
//
// 用法:
//   node tools/render-sequence.mjs <sceneName> [--out out/<scene>] [--start 0] [--end 5] [--fps 30]
//       [--frames 0.7,4.07]   只渲指定时刻(对比原片用)
//       [--mp4]               渲完调 ffmpeg 合成(需在 PATH)
// 依赖:puppeteer-core + 本机 Chrome(CHROME 环境变量或默认路径);three 由本仓库 node_modules 提供。
import puppeteer from 'puppeteer-core';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const sceneName = process.argv[2];
if (!sceneName || !/^[a-z0-9-]+$/.test(sceneName)) {
  console.error('usage: node render-sequence.mjs <sceneName> [opts]');
  process.exit(1);
}
function arg(name, dflt) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : dflt;
}
const outDir = resolve(ROOT, arg('--out', `out/${sceneName}`));
const fps = parseFloat(arg('--fps', '30'));
const framesArg = arg('--frames', null);
const wantMp4 = process.argv.includes('--mp4');
if (!outDir.startsWith(ROOT + sep)) throw new Error('--out must be inside the example folder');
mkdirSync(outDir, { recursive: true });

const threeUrl = '/node_modules/three/build/three.module.js';
const sceneUrl = '/src/scenes/' + sceneName + '.js';
// 画幅:--size WxH,默认从场景 META.aspect 读取(渲染端注入)
let VW = 1280, VH = 720;
if (process.argv.includes('--size')) {
  const [w, h] = process.argv[process.argv.indexOf('--size') + 1].split('x').map(Number);
  VW = w; VH = h;
}
const html = [
  '<!doctype html><html><head><meta charset="utf-8">',
  '<script type="importmap">{"imports":{"three":"' + threeUrl + '"}}</scr' + 'ipt>',
  '<style>html,body{margin:0;padding:0;background:#000}</style>',
  '</head><body><script type="module">',
  "import * as THREE from 'three';",
  "const mod = await import('" + sceneUrl + "');",
  'const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });',
  'renderer.setSize(' + VW + ', ' + VH + '); renderer.setPixelRatio(1);',
  'document.body.appendChild(renderer.domElement);',
  'const ctx = { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(46, ' + VW + '/' + VH + ', 0.1, 400), renderer, width: ' + VW + ', height: ' + VH + ' };',
  'window.__scene = mod.buildScene(ctx);',
  'window.ready = true;',
  'window.renderAt = (t) => { window.__scene.renderAt(t); return true; };',
  '</scr' + 'ipt></body></html>',
].join('\n');
const htmlPath = resolve(outDir, '_scene.html');
writeFileSync(htmlPath, html);

// ES modules 需要 http://(file:// 会被 CORS 拦),起一个临时静态服务
const { createServer } = await import('node:http');
const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let fp = resolve(ROOT, '.' + urlPath);
  if (!fp.startsWith(ROOT + sep)) { res.writeHead(403); res.end(); return; }
  try {
    const data = readFileSync(fp);
    const type = fp.endsWith('.html') ? 'text/html' : fp.endsWith('.js') || fp.endsWith('.mjs') ? 'text/javascript' : 'application/octet-stream';
    res.writeHead(200, { 'content-type': type });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage();
page.on('pageerror', e => console.error('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/` + relative(ROOT, htmlPath).split('\\').join('/'), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready.then(() => true));
await page.waitForFunction('window.ready === true', { timeout: 30000 });
// 预热:首帧 WebGL 编译/字体可能导致首拍差异,先丢弃一帧
await page.evaluate(() => window.renderAt(0.0333));
await page.evaluate(() => new Promise(r => setTimeout(r, 120)));

let times = [];
if (framesArg) times = framesArg.split(',').map(Number);
else {
  const start = parseFloat(arg('--start', '0'));
  const end = parseFloat(arg('--end', '5'));
  for (let t = start; t < end - 1e-9; t += 1 / fps) times.push(+t.toFixed(4));
}
// 确定性自检:同一 t 渲两次,像素应一致
const det = [];
for (const t of [times[0], times[Math.floor(times.length / 2)]]) {
  await page.evaluate(t_ => window.renderAt(t_), t);
  const shot1 = await page.screenshot({ type: 'png' });
  await page.evaluate(t_ => window.renderAt(t_), t);
  const shot2 = await page.screenshot({ type: 'png' });
  det.push(Buffer.from(shot1).equals(Buffer.from(shot2)));
}
console.log('[determinism] identical:', det.every(Boolean), '(', det.join(','), ')');

let n = 0;
for (const t of times) {
  let buf = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.evaluate(t_ => window.renderAt(t_), t);
      buf = await page.screenshot({ type: 'png' });
      break;
    } catch (e) {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 500)); continue; }
      console.error('frame failed t=' + t, e.message);
    }
  }
  if (!buf) { console.error('GIVING UP at t=' + t); process.exit(1); }
  writeFileSync(resolve(outDir, `f-${String(n).padStart(5, '0')}.png`), buf);
  n++;
}
await browser.close();
server.close();
console.log(`rendered ${n} frames -> ${outDir}`);
if (wantMp4) {
  const mp4 = resolve(outDir, `${sceneName}.mp4`);
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(fps), '-i',
    resolve(outDir, 'f-%05d.png'), '-frames:v', String(n), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', mp4],
    { stdio: 'inherit' });
  if (r.status === 0) console.log('mp4 ->', mp4);
  else process.exitCode = 1;
}
