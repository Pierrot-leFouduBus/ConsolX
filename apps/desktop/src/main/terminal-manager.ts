// Starts shells in pseudo-terminals (node-pty) and keeps track of them by id.
import { homedir } from 'node:os'
import { spawn, type IPty } from 'node-pty'

// Receives what happens in one terminal.
export interface TerminalListener {
  onData(data: string): void
  onExit(exitCode: number): void
}

export class TerminalManager {
  private readonly terminals = new Map<number, IPty>()
  private nextId = 1

  // Starts a shell and returns the id of its terminal.
  create(cols: number, rows: number, listener: TerminalListener): number {
    const id = this.nextId++
    const pty = spawn(defaultShell(), [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: homedir(),
      env: process.env
    })
    pty.onData((data) => listener.onData(data))
    pty.onExit(({ exitCode }) => {
      this.terminals.delete(id)
      listener.onExit(exitCode)
    })
    this.terminals.set(id, pty)
    return id
  }

  write(id: number, data: string): void {
    this.terminals.get(id)?.write(data)
  }

  resize(id: number, cols: number, rows: number): void {
    this.terminals.get(id)?.resize(cols, rows)
  }

  kill(id: number): void {
    const pty = this.terminals.get(id)
    if (!pty) return
    this.terminals.delete(id)
    pty.kill()
  }

  killAll(): void {
    for (const id of [...this.terminals.keys()]) this.kill(id)
  }
}

// Shell used until shell profiles arrive in phase 3.
function defaultShell(): string {
  if (process.platform === 'win32') return 'powershell.exe'
  return process.env['SHELL'] ?? '/bin/bash'
}
