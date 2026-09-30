// Main screen: a terminal and a status bar, plus the update prompt and toast when needed.
// PROTOTYPE branch: custom title bar and transparency settings panel.
import { useEffect, useState } from 'react'
import type { AppInfo, UpdateState } from '../../shared/consolx-api'
import type { WindowInfo, WindowSettings } from '../../shared/prototype'
import { ProtoPanel } from './ProtoPanel'
import { TerminalView } from './TerminalView'
import { TitleBar } from './TitleBar'
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

  // PROTOTYPE: applied settings, settings being edited, and window state.
  const [settings, setSettings] = useState<WindowSettings>()
  const [draft, setDraft] = useState<WindowSettings>()
  const [windowInfo, setWindowInfo] = useState<WindowInfo>()
  const [panelOpen, setPanelOpen] = useState(true)

  useEffect(() => {
    void window.consolx.getAppInfo().then((info) => {
      setAppInfo(info)
      // The window title tells ConsolX and ConsolX Dev apart.
      document.title = info.name
    })
  }, [])

  useEffect(() => {
    const proto = window.consolx.proto
    const stop = proto.onInfo(setWindowInfo)
    void proto.getInfo().then(setWindowInfo)
    void proto.getSettings().then((loaded) => {
      setSettings(loaded)
      setDraft(loaded)
    })
    return stop
  }, [])

  // The app background opacity is a CSS variable, read by styles.css.
  useEffect(() => {
    if (settings) {
      document.documentElement.style.setProperty('--cx-ui-alpha', String(settings.uiAlpha))
    }
  }, [settings])

  const changeLive = (next: WindowSettings) => {
    setSettings(next)
    window.consolx.proto.update(next)
  }

  return (
    <div className="app">
      <TitleBar
        title={appInfo?.name ?? 'ConsolX'}
        maximized={windowInfo?.maximized ?? false}
        onTogglePanel={() => setPanelOpen(!panelOpen)}
      />
      <div className="workspace">
        <TerminalView backgroundAlpha={settings?.terminalAlpha ?? 1} />
        {panelOpen && settings && draft && (
          <ProtoPanel
            settings={settings}
            info={windowInfo}
            draft={draft}
            onDraftChange={setDraft}
            onLiveChange={changeLive}
          />
        )}
      </div>
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
