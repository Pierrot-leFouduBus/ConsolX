// Main screen: a terminal and a status bar, plus the update prompt and toast when needed.
import { useEffect, useState } from 'react'
import type { AppInfo, ShellProfiles, UpdateState } from '../../shared/consolx-api'
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
  // Shells found on this computer, and the one the terminal runs.
  const [shells, setShells] = useState<ShellProfiles>()
  const [profileId, setProfileId] = useState<string | null>(null)

  useEffect(() => {
    void window.consolx.getAppInfo().then((info) => {
      setAppInfo(info)
      // The window title tells ConsolX and ConsolX Dev apart.
      document.title = info.name
    })
    void window.consolx.terminal.getProfiles().then((found) => {
      setShells(found)
      setProfileId(found.defaultId)
    })
  }, [])

  return (
    <div className="app">
      {/* Start the terminal once the shells are known, so it starts only once. */}
      {shells &&
        (profileId ? (
          <TerminalView profileId={profileId} />
        ) : (
          <p className="no-shell">No shell was found on this computer.</p>
        ))}
      <footer className="status-bar">
        <span>{appInfo && `${appInfo.name} ${appInfo.version}`}</span>
        <span>{updateStatus(update)}</span>
        {/* Temporary: tabs will offer the shells in step 3.3. */}
        {shells && shells.profiles.length > 0 && (
          <select
            className="profile-select"
            aria-label="Shell"
            value={profileId ?? ''}
            onChange={(event) => setProfileId(event.target.value)}
          >
            {shells.profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        )}
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
