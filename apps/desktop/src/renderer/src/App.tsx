// Main screen: the terminals, a status bar and the window buttons, plus the update prompt
// and toasts when needed.
import { useEffect, useState } from 'react'
import type { AppInfo, ShellProfiles, UpdateState } from '../../shared/consolx-api'
import { SettingsNotice } from './SettingsNotice'
import { findShell } from './terminals'
import { UpdatePrompt } from './UpdatePrompt'
import { UpdateToast } from './UpdateToast'
import { SettingsContext, useSettingsState } from './useSettings'
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
  const settingsState = useSettingsState()
  // Problems whose notice the user closed; it comes back when they change.
  const [problemsClosed, setProblemsClosed] = useState<string>()

  useEffect(() => {
    void window.consolx.getAppInfo().then((info) => {
      setAppInfo(info)
      // The window title tells ConsolX and ConsolX Dev apart.
      document.title = info.name
    })
    void window.consolx.terminal.getProfiles().then(setShells)
  }, [])

  const problems = settingsProblems(
    settingsState?.problems ?? [],
    shells,
    settingsState?.settings.defaultProfile
  )

  return (
    <div className="app">
      {/* Open the workspace once the shells and settings are known, so its first terminal
          starts once, with the right shell. */}
      {shells &&
        settingsState &&
        (shells.profiles.length > 0 ? (
          <SettingsContext.Provider value={settingsState.settings}>
            <Workspace shells={shells} />
          </SettingsContext.Provider>
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

      {problems.length > 0 && problemsClosed !== problems.join('\n') && (
        <SettingsNotice
          problems={problems}
          onOpen={() => window.consolx.settings.open()}
          onClose={() => setProblemsClosed(problems.join('\n'))}
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

// Problems of the settings file, plus a default profile that names no installed shell.
function settingsProblems(
  problems: string[],
  shells: ShellProfiles | undefined,
  defaultProfile: string | undefined
): string[] {
  if (!shells || defaultProfile === undefined || findShell(shells, defaultProfile)) return problems
  const names = shells.profiles.map((profile) => `"${profile.name}"`).join(', ')
  return [...problems, `defaultProfile: no shell named "${defaultProfile}". Installed: ${names}`]
}
