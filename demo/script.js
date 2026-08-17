const pet = document.querySelector('#pet');
const bubble = document.querySelector('#bubble');
const menu = document.querySelector('#contextMenu');
const stateButtons = document.querySelectorAll('[data-state]');
const petImage = document.querySelector('#petImage');

const STATES = {
  'front-main': { label: '正式主形象', asset: '../assets/generated/formal-pet-main.png', text: '正式桌宠主体已就位。', sound: 'soft' },
  'side-main': { label: '正式主形象', asset: '../assets/generated/formal-pet-main.png', text: '先用正式主体保持一致，侧面姿态后续再补。', sound: 'soft' },
  'back-main': { label: '正式主形象', asset: '../assets/generated/formal-pet-main.png', text: '先用正式主体保持一致，背面姿态后续再补。', sound: 'soft' },
  'front-45-left': { label: '拖拽姿态', asset: '../assets/generated/formal-pet-main.png', text: '轻轻拖动我就好。', sound: 'soft' },
  'front-45-right': { label: '拖拽姿态', asset: '../assets/generated/formal-pet-main.png', text: '我会跟着你的手移动。', sound: 'soft' },
  'top-view': { label: '正式主形象', asset: '../assets/generated/formal-pet-main.png', text: '正式主体素材，透明背景。', sound: 'soft' },
  'expr-happy': { label: '开心状态', asset: '../assets/generated/formal-pet-main.png', text: '开心一下！', sound: 'success' },
  'expr-thinking': { label: '思考状态', asset: '../assets/generated/formal-pet-main.png', text: '我想想……', sound: 'soft' },
  'expr-cheer': { label: '欢呼状态', asset: '../assets/generated/formal-pet-main.png', text: '完成一小步！', sound: 'success' }
};

const talkLines = [
  '我在这儿，慢慢来。',
  '先做最小可用版，后面再精修。',
  '别怕复杂，我帮你拆。',
  '保存一下进度，稳。',
  '今天也在认真工作呢。',
  '如果卡住了，就从下一小步开始。'
];

let dragging = false;
let dragOffset = { x: 0, y: 0 };
let scale = Number(localStorage.getItem('gewuye.scale') || 1);
let currentState = localStorage.getItem('gewuye.state') || 'front-main';
let audioCtx = null;
const isDesktopApp = Boolean(window.gewuPet?.setMouseThrough);

if (isDesktopApp) {
  // Desktop transparent-window mode boots from independent formal sprite assets with real alpha.
  // Do not use legacy-disabled/crop chains as the displayed pet body.
  document.documentElement.classList.add('desktop-app');
  document.body.classList.add('desktop-app');
  if (!STATES[currentState]) currentState = 'front-main';
  localStorage.setItem('gewuye.state', currentState);
}

function setMouseThrough(enabled) {
  if (!isDesktopApp) return;
  window.gewuPet.setMouseThrough(enabled).catch(() => {});
}

function clampPetToDesktop() {
  const rect = pet.getBoundingClientRect();
  const margin = 0;
  const left = Math.min(Math.max(rect.left, margin), Math.max(margin, window.innerWidth - rect.width));
  const top = Math.min(Math.max(rect.top, margin), Math.max(margin, window.innerHeight - rect.height));
  pet.style.left = `${left}px`;
  pet.style.top = `${top}px`;
  pet.style.right = 'auto';
  pet.style.bottom = 'auto';
}

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function tone(freq, duration = 0.08, type = 'sine', gain = 0.045) {
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.value = gain;
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start();
  vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

function playSound(kind) {
  try {
    if (kind === 'success') { tone(620, 0.06); setTimeout(() => tone(880, 0.09), 70); return; }
    if (kind === 'fail') { tone(180, 0.12, 'sawtooth', 0.035); return; }
    if (kind === 'snore') { tone(110, 0.18, 'triangle', 0.025); setTimeout(() => tone(92, 0.22, 'triangle', 0.018), 220); return; }
    tone(520, 0.05, 'sine', 0.028);
  } catch (_) { /* user gesture or browser policy may delay audio */ }
}

function say(text, timeout = 2800) {
  bubble.textContent = text;
  bubble.classList.add('show');
  clearTimeout(say.timer);
  say.timer = setTimeout(() => bubble.classList.remove('show'), timeout);
}

function showClickBubble(text, timeout = 2800) {
  clearTimeout(say.timer);
  bubble.textContent = text;
  bubble.classList.add('show');
  requestAnimationFrame(() => bubble.classList.add('show'));
  say.timer = setTimeout(() => bubble.classList.remove('show'), timeout);
}

function setState(state, speak = true) {
  const next = STATES[state] ? state : 'front-main';
  pet.className = `pet formal-state-${next}`;
  pet.dataset.assetSource = 'formal-generated';
  pet.removeAttribute('data-legacy-disabled');
  pet.style.setProperty('--pet-scale', scale);
  if (petImage) {
    petImage.src = STATES[next].asset;
    petImage.alt = `格物页正式桌宠独立素材：${STATES[next].label}`;
  }
  currentState = next;
  localStorage.setItem('gewuye.state', next);
  if (speak) {
    say(STATES[next].text);
    playSound(STATES[next].sound);
  }
}

function setScale(next) {
  scale = Math.min(1.45, Math.max(0.72, next));
  pet.style.setProperty('--pet-scale', scale);
  localStorage.setItem('gewuye.scale', String(scale));
}

function restorePosition() {
  const saved = JSON.parse(localStorage.getItem('gewuye.position') || 'null');
  if (saved) {
    pet.style.left = saved.left;
    pet.style.top = saved.top;
    pet.style.right = 'auto';
    pet.style.bottom = 'auto';
  }
  setScale(scale);
  setState(currentState, false);
}

function savePosition() {
  localStorage.setItem('gewuye.position', JSON.stringify({ left: pet.style.left, top: pet.style.top }));
}

function dockToEdge() {
  const rect = pet.getBoundingClientRect();
  const margin = 18;
  let left = rect.left;
  let top = rect.top;
  if (rect.left < 44) left = margin;
  if (window.innerWidth - rect.right < 44) left = window.innerWidth - rect.width - margin;
  if (rect.top < 44) top = margin;
  if (window.innerHeight - rect.bottom < 44) top = window.innerHeight - rect.height - margin;
  pet.style.left = `${Math.max(margin, left)}px`;
  pet.style.top = `${Math.max(margin, top)}px`;
  savePosition();
}

function lookAtMouse(e) {
  const rect = pet.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 240));
  const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 220));
  pet.style.setProperty('--look-x', `${dx * 7}px`);
  pet.style.setProperty('--look-y', `${dy * 4}px`);
}

let pointerStart = null;
let clickFeedbackLocked = false;
let lastClickFeedbackAt = 0;
let suppressClickUntil = 0;
const DRAG_THRESHOLD = 6;

function triggerClickFeedback(source = 'unknown') {
  const now = Date.now();
  if (now - lastClickFeedbackAt < 300) return;
  lastClickFeedbackAt = now;
  clickFeedbackLocked = true;
  setState('expr-happy', false);
  playSound(STATES['expr-happy'].sound);
  setMouseThrough(true);
  setTimeout(() => showClickBubble(STATES['expr-happy'].text, 2800), 40);
  setTimeout(() => {
    clickFeedbackLocked = false;
  }, 320);
}

pet.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  setMouseThrough(false);
  pet.setPointerCapture(e.pointerId);
  const rect = pet.getBoundingClientRect();
  pointerStart = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    screenX: e.screenX,
    screenY: e.screenY,
    left: rect.left,
    top: rect.top,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top
  };
});

pet.addEventListener('pointermove', (e) => {
  lookAtMouse(e);
  if (!pointerStart || pointerStart.id !== e.pointerId) return;
  const moved = Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y);
  if (!dragging && moved < DRAG_THRESHOLD) return;
  if (!dragging) {
    dragging = true;
    pet.classList.add('dragging');
    setState('front-45-left', false);
    say('欸欸欸，轻一点拖我～', 1600);
  }
  if (isDesktopApp) {
    const dx = e.screenX - pointerStart.screenX;
    const dy = e.screenY - pointerStart.screenY;
    pointerStart.screenX = e.screenX;
    pointerStart.screenY = e.screenY;
    windowApi.moveWindow?.(dx, dy);
    return;
  }
  pet.style.left = `${e.clientX - pointerStart.offsetX}px`;
  pet.style.top = `${e.clientY - pointerStart.offsetY}px`;
  pet.style.right = 'auto';
  pet.style.bottom = 'auto';
});

pet.addEventListener('pointerup', (e) => {
  const wasDragging = dragging;
  pointerStart = null;
  if (wasDragging) {
    dragging = false;
    pet.classList.remove('dragging');
    clampPetToDesktop();
    savePosition();
    setState('front-main', false);
    say('好，我停稳了。', 1800);
    suppressClickUntil = Date.now() + 350;
    setMouseThrough(true);
    return;
  }
  triggerClickFeedback('pointerup');
});

pet.addEventListener('mouseenter', () => {
  setMouseThrough(false);
  pet.classList.add('hovering');
  say('你来啦？我抬头看看。', 1600);
});
pet.addEventListener('mouseleave', () => {
  pet.classList.remove('hovering');
  if (clickFeedbackLocked) return;
  if (!dragging && !menu.classList.contains('show')) setMouseThrough(true);
});
pet.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (Date.now() < suppressClickUntil) return;
  if (!dragging) triggerClickFeedback('click');
});

window.addEventListener('mousemove', lookAtMouse);
window.addEventListener('click', () => {
  menu.classList.remove('show');
  if (!dragging) setMouseThrough(true);
});
window.addEventListener('resize', clampPetToDesktop);

pet.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  setMouseThrough(false);
  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;
  menu.classList.add('show');
});

stateButtons.forEach(btn => btn.addEventListener('click', () => setState(btn.dataset.state)));
menu.addEventListener('click', (e) => {
  const action = e.target?.dataset?.menu;
  if (!action) return;
  if (STATES[action]) setState(action);
  if (action === 'small') { setScale(scale - 0.12); say('我变小一点，不挡你。'); }
  if (action === 'large') { setScale(scale + 0.12); say('我放大一点，陪伴感拉满。'); }
  if (action === 'hide') {
    pet.classList.add('hidden');
    say('我先藏一下。');
    setTimeout(() => { pet.classList.remove('hidden'); say('我回来啦。'); }, 3000);
  }
  menu.classList.remove('show');
  if (!dragging) setMouseThrough(true);
});

setInterval(() => {
  if (dragging || document.hidden) return;
  if (currentState === 'expr-thinking') { playSound('soft'); return; }
  say(talkLines[Math.floor(Math.random() * talkLines.length)], 2600);
}, 18000);

restorePosition();
clampPetToDesktop();
setMouseThrough(true);
say(STATES[currentState].text, 2200);
