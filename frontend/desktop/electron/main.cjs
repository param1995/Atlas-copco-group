const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const isDevelopment = process.argv.includes('--serve');

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDevelopment) {
    void window.loadURL('http://127.0.0.1:4200');
  } else {
    void window.loadFile(path.join(__dirname, '../dist/desktop/browser/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});