const { app, BrowserWindow, Menu, Tray, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { clampWindowMove } = require('./window-position');

const ROOT = path.resolve(__dirname, '..');
const DEMO_HTML = path.join(ROOT, 'demo', 'index.html');
const STATE_FILE = path.join(app.getPath('userData'), 'gewuye-state.json');

let win = null;
let tray = null;

const DEFAULT_STATE = {
  position: { x: null, y: null, dock: 'right-bottom' },
  scale: 1,
  mood: 'idle',
  visible: true,
  alwaysOnTop: true,
  timedTalk: true,
  codexCliStatus: 'reserved'
};

function readState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return { ...DEFAULT_STATE, ...parsed, position: { ...DEFAULT_STATE.position, ...(parsed.position || {}) } };
  } catch (error) {
    return { ...DEFAULT_STATE, lastError: String(error.message || error) };
  }
}

function writeState(patch) {
  const next = { ...readState(), ...patch };
  if (patch && patch.position) next.position = { ...readState().position, ...patch.position };
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

function getDefaultBounds() {
  const display = screen.getPrimaryDisplay().workArea;
  const width = 360;
  const height = 430;
  return {
    width,
    height,
    x: display.x + display.width - width - 28,
    y: display.y + display.height - height - 28
  };
}

function createWindow() {
  const state = readState();
  const bounds = getDefaultBounds();

  win = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: state.alwaysOnTop,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    title: '格物页桌面宠物',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(state.alwaysOnTop, 'floating');
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(DEMO_HTML);
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      document.documentElement.classList.add('desktop-app');
      document.body.classList.add('desktop-app');
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
    `).catch(() => {});
  });

  win.on('move', () => {
    if (!win) return;
    const [x, y] = win.getPosition();
    writeState({ position: { x, y } });
  });

  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
      writeState({ visible: false });
    }
  });

  buildMenu();
  buildTray();
}

function buildMenu() {
  const template = [
    { label: '格物页：我在这儿，慢慢来。', enabled: false },
    { type: 'separator' },
    { label: '待机', click: () => sendMood('idle') },
    { label: '开心', click: () => sendMood('happy') },
    { label: '专注', click: () => sendMood('focused') },
    { label: '睡觉', click: () => sendMood('sleeping') },
    { label: '摸鱼', click: () => sendMood('loafing') },
    { type: 'separator' },
    { label: '贴到右下角', click: () => dockWindow('right-bottom') },
    { label: '窗口置顶', type: 'checkbox', checked: true, click: item => toggleAlwaysOnTop(item.checked) },
    { label: '隐藏 3 秒', click: () => hideTemporarily() },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); } }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function buildTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('格物页桌面宠物');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示格物页', click: () => showWindow() },
    { label: '隐藏格物页', click: () => hideWindow() },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); } }
  ]));
}

function sendMood(mood) {
  writeState({ mood });
  if (win) win.webContents.send('codex:status', { type: 'mood', mood });
}

function dockWindow(edge = 'right-bottom') {
  if (!win) return;
  const display = screen.getPrimaryDisplay().workArea;
  const [width, height] = win.getSize();
  const x = edge.includes('right') ? display.x + display.width - width - 28 : display.x + 28;
  const y = edge.includes('bottom') ? display.y + display.height - height - 28 : display.y + 28;
  win.setPosition(x, y, true);
  writeState({ position: { x, y, dock: edge } });
}

function toggleAlwaysOnTop(enabled) {
  if (!win) return;
  win.setAlwaysOnTop(enabled, 'floating');
  writeState({ alwaysOnTop: enabled });
}

function hideWindow() {
  if (!win) return;
  win.hide();
  writeState({ visible: false });
}

function showWindow() {
  if (!win) return;
  win.show();
  win.focus();
  writeState({ visible: true });
}

function hideTemporarily() {
  hideWindow();
  setTimeout(showWindow, 3000);
}

ipcMain.handle('pet:get-state', () => readState());
ipcMain.handle('pet:set-state', (_event, patch) => writeState(patch || {}));
ipcMain.handle('pet:hide-window', () => hideWindow());
ipcMain.handle('pet:show-window', () => showWindow());
ipcMain.handle('pet:dock', (_event, edge) => dockWindow(edge));
ipcMain.handle('pet:move-window', (_event, { dx = 0, dy = 0 } = {}) => {
  if (!win) return false;
  const bounds = win.getBounds();
  const workArea = screen.getDisplayMatching(bounds).workArea;
  const next = clampWindowMove(bounds, workArea, dx, dy);
  win.setPosition(next.x, next.y, false);
  return true;
});
ipcMain.handle('pet:set-mouse-through', (_event, enabled) => {
  if (!win) return false;
  win.setIgnoreMouseEvents(Boolean(enabled), { forward: true });
  return true;
});

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
