// Main process: creates the window and manages the app lifecycle.
import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

function createWindow(): void {
  const window = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    title: 'ConsolX',
    backgroundColor: '#15171C',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // The UI never gets direct access to Node.js or the system.
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  // Show the window once its content is ready, to avoid a blank flash.
  window.once('ready-to-show', () => window.show())

  // Never open new windows from the UI.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // In dev, electron-vite serves the UI with hot reload; otherwise load the built files.
  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devServerUrl) {
    void window.loadURL(devServerUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

void app.whenReady().then(() => {
  createWindow()

  // macOS: re-create a window when the dock icon is clicked and none is open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS where apps stay active.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
