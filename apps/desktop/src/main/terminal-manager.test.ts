import { spawn, type IPty } from 'node-pty'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TerminalManager, type ShellLaunch } from './terminal-manager'

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

const launch: ShellLaunch = {
  file: 'pwsh.exe',
  args: ['-NoLogo'],
  cwd: 'C:\\Users\\me',
  env: { PATH: 'C:\\Windows' }
}
const size = { cols: 80, rows: 24 }
const PAGE = 1
const OTHER_PAGE = 2

function listener() {
  return { onData: vi.fn(), onExit: vi.fn() }
}

describe('TerminalManager', () => {
  let fakes: ReturnType<typeof fakePty>[]

  beforeEach(() => {
    fakes = []
    vi.mocked(spawn).mockReset()
    vi.mocked(spawn).mockImplementation(() => {
      const fake = fakePty()
      fakes.push(fake)
      return fake.pty as unknown as IPty
    })
  })

  it('starts the requested shell and gives each terminal its own id', () => {
    const manager = new TerminalManager()
    const first = manager.create(launch, size, PAGE, listener())
    const second = manager.create(launch, { cols: 120, rows: 40 }, PAGE, listener())

    expect(first).not.toBe(second)
    expect(spawn).toHaveBeenLastCalledWith('pwsh.exe', ['-NoLogo'], {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: 'C:\\Users\\me',
      env: { PATH: 'C:\\Windows' }
    })
  })

  it('forwards the shell output and exit to the listener', () => {
    const manager = new TerminalManager()
    const events = listener()
    manager.create(launch, size, PAGE, events)

    fakes[0]!.emitData('hello')
    fakes[0]!.emitExit(0)

    expect(events.onData).toHaveBeenCalledWith('hello')
    expect(events.onExit).toHaveBeenCalledWith(0)
  })

  it('sends input and size changes to the right shell', () => {
    const manager = new TerminalManager()
    const id = manager.create(launch, size, PAGE, listener())

    manager.write(id, PAGE, 'dir\r')
    manager.resize(id, PAGE, 100, 30)

    expect(fakes[0]!.pty.write).toHaveBeenCalledWith('dir\r')
    expect(fakes[0]!.pty.resize).toHaveBeenCalledWith(100, 30)
  })

  it('ignores a page acting on a terminal it does not own', () => {
    const manager = new TerminalManager()
    const id = manager.create(launch, size, PAGE, listener())

    manager.write(id, OTHER_PAGE, 'exit\r')
    manager.kill(id, OTHER_PAGE)

    expect(fakes[0]!.pty.write).not.toHaveBeenCalled()
    expect(fakes[0]!.pty.kill).not.toHaveBeenCalled()
  })

  it('stops the shell and ignores the terminal afterwards', () => {
    const manager = new TerminalManager()
    const id = manager.create(launch, size, PAGE, listener())

    manager.kill(id, PAGE)
    manager.write(id, PAGE, 'ignored')

    expect(fakes[0]!.pty.kill).toHaveBeenCalledOnce()
    expect(fakes[0]!.pty.write).not.toHaveBeenCalled()
  })

  it('stops only the terminals of a page that closes', () => {
    const manager = new TerminalManager()
    manager.create(launch, size, PAGE, listener())
    manager.create(launch, size, OTHER_PAGE, listener())

    manager.killOwnedBy(PAGE)

    expect(fakes[0]!.pty.kill).toHaveBeenCalledOnce()
    expect(fakes[1]!.pty.kill).not.toHaveBeenCalled()
  })

  it('forgets a terminal whose shell has exited', () => {
    const manager = new TerminalManager()
    const id = manager.create(launch, size, PAGE, listener())

    fakes[0]!.emitExit(1)
    manager.write(id, PAGE, 'ignored')

    expect(fakes[0]!.pty.write).not.toHaveBeenCalled()
  })
})
