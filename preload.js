// Pont sécurisé renderer ↔ main (contextIsolation) — n'expose que des fonctions ciblées.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('panel', {
  status: () => ipcRenderer.invoke('panel:status'),
  action: (name, action) => ipcRenderer.invoke('panel:action', { name, action }),
  stopAll: () => ipcRenderer.invoke('panel:stopAll'),
  logs: (name, which) => ipcRenderer.invoke('panel:logs', { name, which }),
  openFolder: (name, what) => ipcRenderer.invoke('panel:openFolder', { name, what }),
  fixAll: () => ipcRenderer.invoke('panel:fixAll'),
  testAlert: () => ipcRenderer.invoke('panel:testAlert'),
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
  applyUpdate: () => ipcRenderer.invoke('panel:applyUpdate'),
  onUpdate: (cb) => ipcRenderer.on('update-status', (_e, d) => cb(d)),
  // Le main previent quand l'etat a change, au lieu de laisser l'ecran attendre son sondage de 3 s.
  onStatusChanged: (cb) => ipcRenderer.on('status-changed', () => cb()),
  installPm2: () => ipcRenderer.invoke('panel:installPm2')
});
