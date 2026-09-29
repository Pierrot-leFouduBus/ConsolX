// Automatic updates. At startup, look for a newer version, download it in the
// background, and install it when the app quits. Where updates come from is set
// by the "publish" section of electron-builder.yml.
import { app } from 'electron'
import { autoUpdater, type Logger } from 'electron-updater'
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { format } from 'node:util'

export function startAutoUpdate(): void {
  // Only an installed app can update itself.
  if (!app.isPackaged) return

  autoUpdater.logger = fileLogger(join(app.getPath('logs'), 'updater.log'))
  // ConsolX ships full installers only; never accept a web installer.
  autoUpdater.disableWebInstaller = true
  // Errors are already written to the log by electron-updater.
  autoUpdater.checkForUpdates().catch(() => {})
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
