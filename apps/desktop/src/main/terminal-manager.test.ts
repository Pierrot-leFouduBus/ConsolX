import { spawn, type IPty } from 'node-pty'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TerminalManager } from './terminal-manager'

// Replace node-pty with a fake, so tests never start a real shell.
vi.mock('node-pty', () => ({ spawn: vi.fn() }))

// A fake pseudo-terminal that tests can drive.
function fakePty() {
  let emitData: (data: string) => void = () => {}
  let emitExit: (event: { exitCode: number }) => void = () => {}
  const pty = {
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
    onData: (listener: (data: string) => void) => (emitData = listener),
    onExit: (listener: (event: { exitCode: number }) => void) => (emitExit = listener)
  }
  return {
    pty,
    emitData: (data: string) => emitData(data),
    emitExit: (exitCode: number) => emitExit({ exitCode })
  }
}

function listener() {
  return { onData: vi.fn(), onExit: vi.fn() }
}

describe('TerminalManager', () => {
  let fake: ReturnType<typeof fakePty>

  beforeEach(() => {
    fake = fakePty()
    vi.mocked(spawn).mockReset()
    vi.mocked(spawn).mockImplementation(() => fake.pty as unknown as IPty)
  })

  it('starts a shell with the requested size and gives each terminal its own id', () => {
    const manager = new TerminalManager()
    const first = manager.create(80, 24, listener())
    const second = manager.create(120, 40, listener())

    expect(first).not.toBe(second)
    expect(spawn).toHaveBeenLastCalledWith(
      expect.any(String),
      [],
      expect.objectContaining({ cols: 120, rows: 40 })
    )
  })

  it('forwards the shell output and exit to the listener', () => {
    const manager = new TerminalManager()
    const events = listener()
    manager.create(80, 24, events)

    fake.emitData('hello')
    fake.emitExit(0)

    expect(events.onData).toHaveBeenCalledWith('hello')
    expect(events.onExit).toHaveBeenCalledWith(0)
  })

  it('sends input and size changes to the right shell', () => {
    const manager = new TerminalManager()
    const id = manager.create(80, 24, listener())

    manager.write(id, 'dir\r')
    manager.resize(id, 100, 30)

    expect(fake.pty.write).toHaveBeenCalledWith('dir\r')
    expect(fake.pty.resize).toHaveBeenCalledWith(100, 30)
  })

  it('stops the shell and ignores the terminal afterwards', () => {
    const manager = new TerminalManager()
    const id = manager.create(80, 24, listener())

    manager.kill(id)
    manager.write(id, 'ignored')

    expect(fake.pty.kill).toHaveBeenCalledOnce()
    expect(fake.pty.write).not.toHaveBeenCalled()
  })

  it('forgets a terminal whose shell has exited', () => {
    const manager = new TerminalManager()
    const id = manager.create(80, 24, listener())

    fake.emitExit(1)
    manager.write(id, 'ignored')

    expect(fake.pty.write).not.toHaveBeenCalled()
  })
})
