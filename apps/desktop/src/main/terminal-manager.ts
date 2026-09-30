// Starts shells in pseudo-terminals (node-pty) and keeps track of them by id.
// Each terminal belongs to the page (window) that created it.
import { spawn, type IPty } from 'node-pty'
import type { Environment } from './shell-env'

// What to start: the shell program, its arguments, folder and environment.
export interface ShellLaunch {
  file: string
  args: string[]
  cwd: string
  env: Environment
}

// Receives what happens in one terminal.
export interface TerminalListener {
  onData(data: string): void
  onExit(exitCode: number): void
}

interface Terminal {
  pty: IPty
  // Id of the page that owns the terminal.
  owner: number
}

export class TerminalManager {
  private readonly terminals = new Map<number, Terminal>()
  private nextId = 1

  // Starts a shell for a page and returns the id of its terminal.
  create(
    launch: ShellLaunch,
    size: { cols: number; rows: number },
    owner: number,
    listener: TerminalListener
  ): number {
    const id = this.nextId++
    const pty = spawn(launch.file, launch.args, {
      name: 'xterm-256color',
      cols: size.cols,
      rows: size.rows,
      cwd: launch.cwd,
      env: launch.env,
      // On Windows, use the recent ConPTY shipped with node-pty rather than the one of
      // Windows 10, which loses lines of the history (for example with PowerShell).
      useConptyDll: true
    })
    pty.onData((data) => listener.onData(data))
    pty.onExit(({ exitCode }) => {
      this.terminals.delete(id)
      listener.onExit(exitCode)
    })
    this.terminals.set(id, { pty, owner })
    return id
  }

  // Input, resize and kill only reach terminals owned by the page asking for them.
  write(id: number, owner: number, data: string): void {
    this.find(id, owner)?.pty.write(data)
  }

  resize(id: number, owner: number, cols: number, rows: number): void {
    this.find(id, owner)?.pty.resize(cols, rows)
  }

  kill(id: number, owner: number): void {
    if (this.find(id, owner)) this.stop(id)
  }

  // Stops the terminals of a page that reloads or closes.
  killOwnedBy(owner: number): void {
    for (const [id, terminal] of this.terminals) {
      if (terminal.owner === owner) this.stop(id)
    }
  }

  killAll(): void {
    for (const id of [...this.terminals.keys()]) this.stop(id)
  }

  private find(id: number, owner: number): Terminal | undefined {
    const terminal = this.terminals.get(id)
    return terminal?.owner === owner ? terminal : undefined
  }

  private stop(id: number): void {
    const terminal = this.terminals.get(id)
    if (!terminal) return
    this.terminals.delete(id)
    terminal.pty.kill()
  }
}
