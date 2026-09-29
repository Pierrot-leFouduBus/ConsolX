// Automatic updates. At startup, look for a newer version and tell the UI, which asks
// the user. On request, download it in the background; it then installs on restart,
// or when the app quits. Where updates come from is set by the "publish" section of
// the electron-builder configuration.
import { app, BrowserWindow } from 'electron'
import { autoUpdater, type Logger } from 'electron-updater'
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { format } from 'node:util'
import type { UpdateState } from '../shared/consolx-api'
import { IpcChannel } from '../shared/ipc-channels'

let state: UpdateState = { status: 'idle' }

export function startAutoUpdate(): void {
  // Only an installed app can update itself.
  if (!app.isPackaged) return

  autoUpdater.logger = fileLogger(join(app.getPath('logs'), 'updater.log'))
  // ConsolX ships full installers only; never accept a web installer.
  autoUpdater.disableWebInstaller = true
  // Download only once the user has accepted the update.
  autoUpdater.autoDownload = false

  autoUpdater.on('update-available', (info) => {
    setState({ status: 'available', version: info.version })
  })
  autoUpdater.on('download-progress', (progress) => {
    if (state.status !== 'downloading') return
    // Send whole percents only, to avoid flooding the UI.
    const percent = Math.floor(progress.percent)
    if (percent !== state.percent) setState({ ...state, percent })
  })
  autoUpdater.on('update-downloaded', (event) => {
    setState({ status: 'ready', version: event.version })
  })

  // Errors are already written to the log by electron-updater.
  autoUpdater.checkForUpdates().catch(() => {})
}

export function getUpdateState(): UpdateState {
  return state
}

export function downloadUpdate(): void {
  if (state.status !== 'available') return
  const { version } = state
  setState({ status: 'downloading', version, percent: 0 })
  // If the download fails, offer the update again.
  autoUpdater.downloadUpdate().catch(() => {
    setState({ status: 'available', version, failed: true })
  })
}

export function installUpdate(): void {
  if (state.status !== 'ready') return
  // Install silently, then start the new version.
  autoUpdater.quitAndInstall(true, true)
}

// Keeps the new state and sends it to every window.
function setState(next: UpdateState): void {
  state = next
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IpcChannel.updateState, state)
  }
}

// An installed app has no console, so update messages go to a log file
// (%APPDATA%\ConsolX\logs\updater.log on Windows).
function fileLogger(path: string): Logger {
  const write = (level: string) => (message?: unknown) => {
    try {
      mkdirSync(dirname(path), { recursive: true })
      appendFileSync(path, `${new Date().toISOString()} [${level}] ${format(message)}\n`)
    } catch {
      // Logging must never break the app.
    }
  }
  return { info: write('info'), warn: write('warn'), error: write('error') }
}
