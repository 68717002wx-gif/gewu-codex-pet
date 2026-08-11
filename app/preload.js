const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gewuPet', {
  getState: () => ipcRenderer.invoke('pet:get-state'),
  setState: (patch) => ipcRenderer.invoke('pet:set-state', patch),
  hideWindow: () => ipcRenderer.invoke('pet:hide-window'),
  showWindow: () => ipcRenderer.invoke('pet:show-window'),
  dock: (edge) => ipcRenderer.invoke('pet:dock', edge),
  setMouseThrough: (enabled) => ipcRenderer.invoke('pet:set-mouse-through', Boolean(enabled)),
  onCliStatus: (callback) => ipcRenderer.on('codex:status', (_event, status) => callback(status))
});
