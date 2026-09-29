// One terminal: xterm.js draws it here, the shell runs in the main process.
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'

export function TerminalView() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const api = window.consolx.terminal

    const terminal = new Terminal({
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: 14,
      cursorBlink: true,
      theme: { background: '#15171c', foreground: '#f3f0e8', cursor: '#5fd3a6' }
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)
    fitAddon.fit()
    terminal.focus()

    // Id of the shell's terminal in the main process, known once it has started.
    let id: number | undefined
    let closed = false

    const stopData = api.onData((terminalId, data) => {
      if (terminalId === id) terminal.write(data)
    })
    const stopExit = api.onExit((terminalId, exitCode) => {
      if (terminalId === id) terminal.write(`\r\n[Process exited with code ${exitCode}]\r\n`)
    })

    void api.create(terminal.cols, terminal.rows).then((newId) => {
      // The view may have been closed while the shell was starting.
      if (closed) return api.kill(newId)
      id = newId
      api.resize(id, terminal.cols, terminal.rows)
    })

    const input = terminal.onData((data) => {
      if (id !== undefined) api.write(id, data)
    })
    const resize = terminal.onResize(({ cols, rows }) => {
      if (id !== undefined) api.resize(id, cols, rows)
    })

    // Fit the terminal to its container whenever the container changes size.
    const observer = new ResizeObserver(() => fitAddon.fit())
    observer.observe(container)

    return () => {
      closed = true
      observer.disconnect()
      input.dispose()
      resize.dispose()
      stopData()
      stopExit()
      if (id !== undefined) api.kill(id)
      terminal.dispose()
    }
  }, [])

  return <div className="terminal" ref={containerRef} />
}
