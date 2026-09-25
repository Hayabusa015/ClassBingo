// Electron main process. Kept as CommonJS (.cjs) regardless of the
// project's "type": "module" in package.json, since electron-updater and
// the classic Electron APIs are most reliably consumed as CJS here.
const { app, BrowserWindow, dialog, shell, ipcMain } = require('electron');
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

// True only while a check the user explicitly asked for (the "Check for
// Updates" button) is in flight — the automatic on-launch check stays
// silent unless it actually finds something, but a manual check should
// always tell the user *something*, even "you're already up to date".
let manualCheckInProgress = false;

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
      preload: path.join(__dirname, 'preload.cjs'),
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
  ipcMain.handle('app:get-version', () => app.getVersion());

  ipcMain.handle('app:check-for-updates', async () => {
    if (!isPackaged) {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'ClassBingo',
        message: "Update checks only run in the installed app, not this dev copy.",
      });
      return { ok: false, reason: 'not-packaged' };
    }
    manualCheckInProgress = true;
    try {
      await autoUpdater.checkForUpdates();
      return { ok: true };
    } catch (err) {
      manualCheckInProgress = false;
      return { ok: false, reason: err instanceof Error ? err.message : String(err) };
    }
  });

  if (!isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (err) => {
    // Never interrupt a class over a failed update check (offline, no
    // releases published yet, GitHub hiccup, etc.) — just log it, unless
    // someone explicitly asked by clicking the button.
    console.error('[updater] error:', err && (err.stack || err.message) ? err.stack || err.message : err);
    if (manualCheckInProgress) {
      manualCheckInProgress = false;
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'ClassBingo',
        message: "Couldn't check for updates.",
        detail: 'Check the internet connection and try again in a moment.',
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    if (manualCheckInProgress) {
      manualCheckInProgress = false;
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'ClassBingo',
        message: "You're up to date!",
        detail: `Running the latest version (${info.version}).`,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    manualCheckInProgress = false;
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
  // This one stays silent on "nothing found" (manualCheckInProgress is
  // false here), unlike a check kicked off from the button.
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
