// One terminal: xterm.js draws it here, the shell runs in the main process.
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'
import { ConptyScrollFix } from '../../shared/windows-pty'

interface TerminalViewProps {
  // Shell to start; null for the default one.
  profileId: string | null
  // Whether the terminal is the one the user works in: it then gets the keyboard.
  active: boolean
  // Each change gives the keyboard back to the active terminal.
  focusRequests: number
  // Called when the shell ends by itself, with its exit code.
  onExit(exitCode: number): void
}

export function TerminalView({ profileId, active, focusRequests, onExit }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal>(null)
  // Latest onExit, read when the shell ends, so that it does not restart the terminal.
  const onExitRef = useRef(onExit)

  useEffect(() => {
    onExitRef.current = onExit
  }, [onExit])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const api = window.consolx.terminal

    const terminal = new Terminal({
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: 14,
      cursorBlink: true,
      theme: { background: '#15171c', foreground: '#f3f0e8', cursor: '#5fd3a6' },
      // On Windows, ConPTY or winpty also draw the shell's screen: xterm.js adapts to them.
      windowsPty: api.windowsPty
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)
    fitAddon.fit()
    terminalRef.current = terminal

    // Id of the shell's terminal in the main process, known once it has started.
    let id: number | undefined
    let closed = false

    const scrollFix = api.windowsPty?.backend === 'conpty' ? new ConptyScrollFix() : undefined
    const stopData = api.onData((terminalId, data) => {
      if (terminalId === id) terminal.write(scrollFix ? scrollFix.rewrite(data) : data)
    })
    const stopExit = api.onExit((terminalId, exitCode) => {
      if (terminalId !== id) return
      terminal.write(`\r\n[Process exited with code ${exitCode}]\r\n`)
      onExitRef.current(exitCode)
    })

    api.create(profileId, terminal.cols, terminal.rows).then(
      (newId) => {
        // The view may have been closed while the shell was starting.
        if (closed) return api.kill(newId)
        id = newId
        api.resize(id, terminal.cols, terminal.rows)
      },
      () => terminal.write('\r\n[The shell could not be started]\r\n')
    )

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
      terminalRef.current = null
      terminal.dispose()
    }
  }, [profileId])

  // Give the keyboard to the terminal when it becomes the active one, or when asked.
  // Declared after the effect above, so that it also runs once the terminal exists.
  useEffect(() => {
    if (!active) return
    // dockview shows a panel that becomes active in the next frame: a hidden terminal
    // cannot take the keyboard before.
    const frame = requestAnimationFrame(() => {
      // Never take the keyboard from a text field, such as the tab rename field.
      if (document.activeElement instanceof HTMLInputElement) return
      terminalRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [active, focusRequests])

  return <div className="terminal-view" ref={containerRef} />
}
