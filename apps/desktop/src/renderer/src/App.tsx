// Main screen: a terminal and a status bar, plus the update prompt and toast when needed.
import { useEffect, useState } from 'react'
import type { AppInfo, UpdateState } from '../../shared/consolx-api'
import { TerminalView } from './TerminalView'
import { UpdatePrompt } from './UpdatePrompt'
import { UpdateToast } from './UpdateToast'
import { useUpdateState } from './useUpdateState'

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo>()
  const update = useUpdateState()
  // Version whose prompt or toast the user closed; they come back at the next start.
  const [promptClosedFor, setPromptClosedFor] = useState<string>()
  const [toastClosedFor, setToastClosedFor] = useState<string>()
  const updates = window.consolx.updates

  useEffect(() => {
    void window.consolx.getAppInfo().then((info) => {
      setAppInfo(info)
      // The window title tells ConsolX and ConsolX Dev apart.
      document.title = info.name
    })
  }, [])

  return (
    <div className="app">
      <TerminalView />
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
    </div>
  )
}

// Short text for the status bar.
function updateStatus(update: UpdateState): string {
  if (update.status === 'downloading') return `Downloading update… ${update.percent}%`
  if (update.status === 'ready') return `Version ${update.version} will install when you quit`
  return ''
}
