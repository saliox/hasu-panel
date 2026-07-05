// Pont sécurisé renderer ↔ main (contextIsolation) — n'expose que des fonctions ciblées.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('panel', {
  status: () => ipcRenderer.invoke('panel:status'),
  action: (name, action) => ipcRenderer.invoke('panel:action', { name, action }),
  setBot: (name, key, value) => ipcRenderer.invoke('panel:setBot', { name, key, value }),
  setGameMode: (patch) => ipcRenderer.invoke('panel:setGameMode', patch),
  importPick: () => ipcRenderer.invoke('panel:importPick'),
  importPickDir: () => ipcRenderer.invoke('panel:importPickDir'),
  importBot: (name, script) => ipcRenderer.invoke('panel:importBot', { name, script }),
  removeBot: (name) => ipcRenderer.invoke('panel:removeBot', { name }),
  addGame: (exe) => ipcRenderer.invoke('panel:addGame', exe),
  removeGame: (exe) => ipcRenderer.invoke('panel:removeGame', exe),
  runningApps: () => ipcRenderer.invoke('panel:runningApps'),
  pickExe: () => ipcRenderer.invoke('panel:pickExe'),
  scanGames: () => ipcRenderer.invoke('panel:scanGames'),
  ignoreGame: (exe) => ipcRenderer.invoke('panel:ignoreGame', exe),
  setSetting: (key, value) => ipcRenderer.invoke('panel:setSetting', { key, value }),
  checkUpdate: () => ipcRenderer.invoke('panel:checkUpdate'),
  applyUpdate: () => ipcRenderer.invoke('panel:applyUpdate')
});
