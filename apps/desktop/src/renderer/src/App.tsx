// Main screen: a terminal, with a status bar showing the app name and version.
import { useEffect, useState } from 'react'
import type { AppInfo } from '../../shared/consolx-api'
import { TerminalView } from './TerminalView'

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo>()

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
      <footer className="status-bar">{appInfo && `${appInfo.name} ${appInfo.version}`}</footer>
    </div>
  )
}
