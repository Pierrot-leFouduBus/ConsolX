// One terminal: xterm.js draws it here, the shell runs in the main process.
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'
import { ConptyScrollFix } from '../../shared/windows-pty'
import { xterms } from './terminals'
import { terminalTheme } from './terminalTheme'
import { useSettings } from './useSettings'

interface TerminalViewProps {
  // Id of the panel showing the terminal.
  panelId: string
  // Shell to start; null for the default one.
  profileId: string | null
  // Whether the terminal is the one the user works in: it then gets the keyboard.
  active: boolean
  // Each change gives the keyboard back to the active terminal.
  focusRequests: number
  // Called when the shell ends by itself, with its exit code.
  onExit(exitCode: number): void
}

export function TerminalView({
  panelId,
  profileId,
  active,
  focusRequests,
  onExit
}: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal>(null)
  const fitAddonRef = useRef<FitAddon>(null)
  // Latest onExit, read when the shell ends, so that it does not restart the terminal.
  const onExitRef = useRef(onExit)
  const { fontFamily, fontSize } = useSettings().terminal
  // Latest font, read when the terminal is created.
  const fontRef = useRef({ fontFamily, fontSize })

  useEffect(() => {
    onExitRef.current = onExit
  }, [onExit])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const api = window.consolx.terminal

    const terminal = new Terminal({
      ...fontRef.current,
      cursorBlink: true,
      theme: terminalTheme(),
      // Lets the theme give the terminal a translucent background.
      allowTransparency: true,
      // On Windows, ConPTY or winpty also draw the shell's screen: xterm.js adapts to them.
      windowsPty: api.windowsPty
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)
    fitAddon.fit()
    terminalRef.current = terminal
    fitAddonRef.current = fitAddon
    xterms.set(panelId, terminal)

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
      fitAddonRef.current = null
      xterms.delete(panelId)
      terminal.dispose()
    }
  }, [panelId, profileId])

  // Apply a new font from the settings, then fit the terminal to it.
  useEffect(() => {
    fontRef.current = { fontFamily, fontSize }
    const terminal = terminalRef.current
    if (!terminal) return
    if (terminal.options.fontFamily === fontFamily && terminal.options.fontSize === fontSize) return
    terminal.options.fontFamily = fontFamily
    terminal.options.fontSize = fontSize
    fitAddonRef.current?.fit()
  }, [fontFamily, fontSize])

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
