// Main screen: the terminals, a status bar and the window buttons, plus the update prompt
// and toast when needed.
import { useEffect, useState } from 'react'
import type { AppInfo, ShellProfiles, UpdateState } from '../../shared/consolx-api'
import { UpdatePrompt } from './UpdatePrompt'
import { UpdateToast } from './UpdateToast'
import { useUpdateState } from './useUpdateState'
import { WindowButtons } from './WindowButtons'
import { Workspace } from './Workspace'

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo>()
  const update = useUpdateState()
  // Version whose prompt or toast the user closed; they come back at the next start.
  const [promptClosedFor, setPromptClosedFor] = useState<string>()
  const [toastClosedFor, setToastClosedFor] = useState<string>()
  const updates = window.consolx.updates
  // Shells found on this computer.
  const [shells, setShells] = useState<ShellProfiles>()

  useEffect(() => {
    void window.consolx.getAppInfo().then((info) => {
      setAppInfo(info)
      // The window title tells ConsolX and ConsolX Dev apart.
      document.title = info.name
    })
    void window.consolx.terminal.getProfiles().then(setShells)
  }, [])

  return (
    <div className="app">
      {/* Open the workspace once the shells are known, so its first terminal starts once. */}
      {shells &&
        (shells.profiles.length > 0 ? (
          <Workspace shells={shells} />
        ) : (
          <p className="no-shell">No shell was found on this computer.</p>
        ))}
      <footer className="status-bar">
        <span>{appInfo && `${appInfo.name} ${appInfo.version}`}</span>
        <span>{updateStatus(update)}</span>
      </footer>

      {appInfo && update.status === 'available' && promptClosedFor !== update.version && (
        <UpdatePrompt
          appName={appInfo.name}
          version={update.version}
          failed={update.failed}
          onUpdate={() => updates.download()}
          onDismiss={() => setPromptClosedFor(update.version)}
        />
      )}

      {appInfo && update.status === 'ready' && toastClosedFor !== update.version && (
        <UpdateToast
          appName={appInfo.name}
          version={update.version}
          onRestart={() => updates.install()}
          onClose={() => setToastClosedFor(update.version)}
        />
      )}

      {/* Last, so that it stays above the tab bar it covers. */}
      <WindowButtons />
    </div>
  )
}

// Short text for the status bar.
function updateStatus(update: UpdateState): string {
  if (update.status === 'downloading') return `Downloading update… ${update.percent}%`
  if (update.status === 'ready') return `Version ${update.version} will install when you quit`
  return ''
}
