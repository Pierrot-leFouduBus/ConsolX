// Main process: creates the window and manages the app lifecycle.
import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import { IpcChannel } from '../shared/ipc-channels'
import { registerIpcHandlers } from './ipc'
import { getRendererSource } from './renderer-source'
import { SettingsStore } from './settings-store'
import { TerminalManager } from './terminal-manager'
import { startAutoUpdate } from './updater'
import { setUpFrame } from './window-frame'

// Development only, on request: open the Chrome DevTools protocol on a local port, so
// that tools can inspect and drive the UI (CONSOLX_REMOTE_DEBUGGING_PORT=9222).
const debuggingPort = process.env['CONSOLX_REMOTE_DEBUGGING_PORT']
if (!app.isPackaged && debuggingPort) {
  app.commandLine.appendSwitch('remote-debugging-port', debuggingPort)
}

// No application menu: the default one has shortcuts that shells need, such as Ctrl+W
// (close the window) and Ctrl+R (reload the page, which stops every shell).
Menu.setApplicationMenu(null)

const terminals = new TerminalManager()

// Read the settings right away, for the first window. If the file cannot be read or
// written, the default settings are used.
const settings = new SettingsStore(app.getPath('userData'))
const settingsLoaded = settings.load().catch((error: unknown) => {
  console.error('Cannot load the settings:', error)
})

registerIpcHandlers(terminals, settings, settingsLoaded)

function createWindow(): void {
  const window = new BrowserWindow({
    width: 900,
    height: 600,
    // Room for a few tabs, the window buttons and some lines of text.
    minWidth: 480,
    minHeight: 240,
    show: false,
    title: app.getName(),
    // The UI draws the title bar. The window is transparent so that themes can be
    // translucent later; for now the page paints an opaque background.
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
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
  setUpFrame(window)

  // Development only: F12 opens the DevTools, since there is no menu anymore.
  if (!app.isPackaged) {
    window.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        event.preventDefault()
        window.webContents.toggleDevTools()
      }
    })
  }

  // Never open new windows from the UI.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // When the page reloads or the window closes, stop the shells of its terminals.
  const pageId = window.webContents.id
  window.webContents.on('did-start-navigation', (details) => {
    if (details.isMainFrame && !details.isSameDocument) terminals.killOwnedBy(pageId)
  })
  window.on('closed', () => terminals.killOwnedBy(pageId))

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

  // Apply each change of the settings file to every window at once.
  void settingsLoaded.then(() =>
    settings.watch((state) => {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(IpcChannel.settingsState, state)
      }
    })
  )

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
app.on('will-quit', () => {
  terminals.killAll()
  settings.close()
})
