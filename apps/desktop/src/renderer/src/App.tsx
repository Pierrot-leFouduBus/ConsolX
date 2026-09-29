// Main screen: a terminal, with a status bar showing the app version.
import { useEffect, useState } from 'react'
import { TerminalView } from './TerminalView'

export function App() {
  const [version, setVersion] = useState('')

  useEffect(() => {
    void window.consolx.getVersion().then(setVersion)
  }, [])

  return (
    <div className="app">
      <TerminalView />
      <footer className="status-bar">ConsolX {version}</footer>
    </div>
  )
}
