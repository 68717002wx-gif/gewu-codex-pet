const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.INTERACTION_ARTIFACT_DIR
  ? path.resolve(process.env.INTERACTION_ARTIFACT_DIR)
  : path.join(ROOT, 'qa', 'artifacts', 'interaction');
const VIDEO_DIR = path.join(OUT, 'interaction-video-raw');
fs.mkdirSync(VIDEO_DIR, { recursive: true });
const REQUESTED_PORT = Number(process.env.PREVIEW_PORT || '8765');
let activePort = REQUESTED_PORT;
let URL = `http://127.0.0.1:${activePort}/demo/index.html`;
const result = { url: URL, checks: [], artifacts: {}, consoleErrors: [], networkFailures: [] };
const addCheck = (name, passed, details) => result.checks.push({ name, passed: !!passed, details });

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT, safePath === '/' ? 'demo/index.html' : safePath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(process.env.PREVIEW_PORT ? REQUESTED_PORT : 0, '127.0.0.1', () => {
      activePort = server.address().port;
      URL = `http://127.0.0.1:${activePort}/demo/index.html`;
      result.url = URL;
      resolve(server);
    });
  });
}

(async () => {
  const server = await startServer();
  const executablePath = process.env.HYPERFRAMES_BROWSER_PATH || undefined;
  const browser = await chromium.launch({ headless: true, executablePath });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__audioEvents = [];
    class FakeAudioParam {
      constructor(name) { this.name = name; this._value = 0; }
      get value() { return this._value; }
      set value(next) {
        this._value = next;
        window.__audioEvents.push({ type: 'param-value', name: this.name, value: next });
      }
      exponentialRampToValueAtTime(value, time) {
        window.__audioEvents.push({ type: 'param-ramp', name: this.name, value, time });
      }
    }
    class FakeOscillator {
      constructor() { this.frequency = new FakeAudioParam('frequency'); this.type = 'sine'; }
      connect() { window.__audioEvents.push({ type: 'osc-connect' }); }
      start(time) { window.__audioEvents.push({ type: 'osc-start', oscType: this.type, frequency: this.frequency.value, time }); }
      stop(time) { window.__audioEvents.push({ type: 'osc-stop', time }); }
    }
    class FakeGain {
      constructor() { this.gain = new FakeAudioParam('gain'); }
      connect() { window.__audioEvents.push({ type: 'gain-connect' }); }
    }
    class FakeAudioContext {
      constructor() { this.currentTime = 0; this.destination = {}; window.__audioEvents.push({ type: 'context-created' }); }
      createOscillator() { window.__audioEvents.push({ type: 'create-oscillator' }); return new FakeOscillator(); }
      createGain() { window.__audioEvents.push({ type: 'create-gain' }); return new FakeGain(); }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });
  result.debugLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') result.consoleErrors.push(text);
    if (text.includes('[pet-debug]')) result.debugLogs.push(text);
  });
  page.on('requestfailed', req => result.networkFailures.push(req.url()));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('gewuye.position');
    localStorage.setItem('gewuye.scale', '1');
    localStorage.setItem('gewuye.state', 'front-main');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const img = document.querySelector('#petImage');
    return img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
  });

  await page.screenshot({ path: path.join(OUT, 'interaction-00-initial.png'), fullPage: true });
  const initial = await page.evaluate(() => {
    const pet = document.querySelector('#pet');
    const img = document.querySelector('#petImage');
    const bubble = document.querySelector('#bubble');
    const pr = pet.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    return {
      petClass: pet.className,
      asset: img.currentSrc,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      bubbleClass: bubble.className,
      bubbleText: bubble.textContent,
      petRect: { left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom, width: pr.width, height: pr.height },
      bubbleRect: { left: br.left, top: br.top, right: br.right, bottom: br.bottom, width: br.width, height: br.height }
    };
  });
  addCheck('initial image loaded', initial.naturalWidth === 384 && initial.naturalHeight === 424, initial);

  const pet = page.locator('#pet');
  await pet.hover();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'interaction-01-hover.png'), fullPage: true });
  const hover = await page.evaluate(() => {
    const pet = document.querySelector('#pet');
    const bubble = document.querySelector('#bubble');
    const pr = pet.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    return {
      petClass: pet.className,
      bubbleClass: bubble.className,
      bubbleText: bubble.textContent,
      petRect: { left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom, width: pr.width, height: pr.height },
      bubbleRect: { left: br.left, top: br.top, right: br.right, bottom: br.bottom, width: br.width, height: br.height }
    };
  });
  addCheck('hover adds hovering class', hover.petClass.includes('hovering'), hover);
  addCheck('hover expands bubble', hover.bubbleClass.includes('show') && hover.bubbleText.includes('抬头看看'), hover);

  const box = await pet.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'interaction-02-click.png'), fullPage: true });
  const click = await page.evaluate(() => {
    const pet = document.querySelector('#pet');
    const bubble = document.querySelector('#bubble');
    return { petClass: pet.className, bubbleClass: bubble.className, bubbleText: bubble.textContent };
  });
  addCheck('click switches to happy state', click.petClass.includes('formal-state-expr-happy'), click);
  addCheck('click keeps bubble visible with happy text', click.bubbleClass.includes('show') && click.bubbleText.includes('开心'), click);
  const audioAfterClick = await page.evaluate(() => window.__audioEvents || []);
  addCheck('click triggers happy audio', [620, 880].every(freq => audioAfterClick.some(e => e.type === 'osc-start' && e.frequency === freq)), { audioEvents: audioAfterClick });

  const dragStart = await pet.boundingBox();
  const startX = dragStart.x + dragStart.width / 2;
  const startY = dragStart.y + dragStart.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 90, startY + 70, { steps: 8 });
  await page.waitForTimeout(250);
  const duringDrag = await page.evaluate(() => {
    const pet = document.querySelector('#pet');
    const bubble = document.querySelector('#bubble');
    return {
      petClass: pet.className,
      bubbleClass: bubble.className,
      bubbleText: bubble.textContent,
      left: pet.style.left,
      top: pet.style.top,
      storedPosition: localStorage.getItem('gewuye.position')
    };
  });
  addCheck('drag moves pet and shows drag bubble', duringDrag.left && duringDrag.top && duringDrag.bubbleClass.includes('show') && duringDrag.bubbleText.includes('轻一点拖我'), duringDrag);
  await page.mouse.up();
  await page.waitForTimeout(500);
  const afterDrag = await page.evaluate(() => {
    const pet = document.querySelector('#pet');
    const bubble = document.querySelector('#bubble');
    return {
      petClass: pet.className,
      bubbleClass: bubble.className,
      bubbleText: bubble.textContent,
      left: pet.style.left,
      top: pet.style.top,
      storedPosition: localStorage.getItem('gewuye.position')
    };
  });
  addCheck('drag releases, saves position, and returns stable bubble', !afterDrag.petClass.includes('dragging') && afterDrag.bubbleClass.includes('show') && afterDrag.bubbleText.includes('好，我停稳了。') && !!afterDrag.storedPosition, afterDrag);

  await page.waitForTimeout(3200);
  await page.screenshot({ path: path.join(OUT, 'interaction-03-bubble-hidden.png'), fullPage: true });
  const hidden = await page.evaluate(() => {
    const bubble = document.querySelector('#bubble');
    const br = bubble.getBoundingClientRect();
    return { bubbleClass: bubble.className, bubbleText: bubble.textContent, bubbleRect: { left: br.left, top: br.top, right: br.right, bottom: br.bottom, width: br.width, height: br.height } };
  });
  addCheck('bubble auto hides after timeout', !hidden.bubbleClass.includes('show'), hidden);

  await pet.hover();
  await page.waitForTimeout(500);
  const box2 = await pet.boundingBox();
  await page.mouse.click(box2.x + box2.width / 2, box2.y + box2.height / 2);
  await page.waitForTimeout(1300);

  const video = page.video();
  await context.close();
  await browser.close();

  if (video) {
    const videoPath = await video.path();
    const raw = path.join(OUT, 'pet-interaction-check.webm');
    fs.copyFileSync(videoPath, raw);
    result.artifacts.rawVideo = raw;
    const mp4 = path.join(OUT, 'pet-interaction-check.mp4');
    const ffmpegBin = process.env.FFMPEG_PATH || process.env.HYPERFRAMES_FFMPEG_PATH || 'ffmpeg';
    const ffmpeg = spawnSync(ffmpegBin, ['-y', '-i', raw, '-movflags', '+faststart', '-pix_fmt', 'yuv420p', mp4], { encoding: 'utf8' });
    result.ffmpegReturnCode = ffmpeg.status;
    result.ffmpegStderrTail = (ffmpeg.stderr || '').slice(-1200);
    if (ffmpeg.status === 0) result.artifacts.mp4Video = mp4;
  }

  result.overallPass = result.checks.every(c => c.passed) && result.consoleErrors.length === 0 && result.networkFailures.length === 0;
  fs.writeFileSync(path.join(OUT, 'pet-interaction-check-report.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
  server.close();
  if (!result.overallPass) process.exit(1);
})().catch(err => {
  result.fatal = String(err && err.stack || err);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'pet-interaction-check-report.json'), JSON.stringify(result, null, 2), 'utf8');
  console.error(result.fatal);
  process.exit(1);
});
