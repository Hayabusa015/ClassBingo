// Preload script: the only bridge between the sandboxed renderer (the React
// app) and the main process. Exposes a tiny, explicit API instead of the
// raw ipcRenderer/Node APIs — the renderer can trigger a manual update
// check and read the app version, nothing else.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('classbingoDesktop', {
  isDesktop: true,
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
});
