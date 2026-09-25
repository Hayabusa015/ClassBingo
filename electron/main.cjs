// Electron main process. Kept as CommonJS (.cjs) regardless of the
// project's "type": "module" in package.json, since electron-updater and
// the classic Electron APIs are most reliably consumed as CJS here.
const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');

// Only true for a genuinely installed/packaged app (the NSIS installer
// output). Running `electron .` from source — with or without a Vite dev
// server — is never "packaged", so the updater never runs against a raw
// checkout (there is nothing meaningful to update, and it isn't signed).
const isPackaged = app.isPackaged;

// Set only by the `electron:dev` npm script, pointing at the Vite dev
// server. When unset, the window loads the production build in dist/.
const devServerUrl = process.env.ELECTRON_RENDERER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0c0d11',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.setMenuBarVisibility(false);

  if (devServerUrl) {
    win.loadURL(devServerUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Any target="_blank" link opens in the real OS browser, not a bare
  // second Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

/** Checks GitHub Releases for a newer published version and offers to install it. */
function setupAutoUpdate(win) {
  if (!isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (err) => {
    // Never interrupt a class over a failed update check (offline, no
    // releases published yet, GitHub hiccup, etc.) — just log it.
    console.error('[updater] error:', err && (err.stack || err.message) ? err.stack || err.message : err);
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox(win, {
        type: 'info',
        title: 'ClassBingo update ready',
        message: `A new version (${info.version}) has been downloaded.`,
        detail:
          'Restart ClassBingo now to finish updating, or keep going — it will finish installing next time the app is closed.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
  });

  // One check per launch, as requested — not a recurring background poll.
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[updater] check failed:', err);
  });
}

app.whenReady().then(() => {
  const win = createWindow();
  setupAutoUpdate(win);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
