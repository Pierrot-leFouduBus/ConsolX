// Main process: creates the window and manages the app lifecycle.
import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc'
import { getRendererSource } from './renderer-source'
import { TerminalManager } from './terminal-manager'
import { startAutoUpdate } from './updater'

const terminals = new TerminalManager()
registerIpcHandlers(terminals)

function createWindow(): void {
  const window = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    title: app.getName(),
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

  // There is a single window for now: when its page reloads or closes, stop all shells.
  window.webContents.on('did-start-navigation', (details) => {
    if (details.isMainFrame && !details.isSameDocument) terminals.killAll()
  })
  window.on('closed', () => terminals.killAll())

  const source = getRendererSource(app.isPackaged, process.env['ELECTRON_RENDERER_URL'], __dirname)
  if (source.type === 'url') {
    void window.loadURL(source.url)
  } else {
    void window.loadFile(source.path)
  }
}

void app.whenReady().then(() => {
  createWindow()
  startAutoUpdate()

  // macOS: re-create a window when the dock icon is clicked and none is open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS where apps stay active.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Never leave shells running after the app quits.
app.on('will-quit', () => terminals.killAll())
