import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fakes for Electron and electron-updater, driven by the tests.
const mocks = vi.hoisted(() => {
  const listeners = new Map<string, (arg: unknown) => void>()
  return {
    app: { isPackaged: true, getPath: () => 'logs' },
    // States sent to the windows.
    sent: [] as unknown[],
    autoUpdater: {
      autoDownload: true,
      on: (event: string, listener: (arg: unknown) => void) => listeners.set(event, listener),
      emit: (event: string, arg: unknown) => listeners.get(event)?.(arg),
      checkForUpdates: vi.fn(() => Promise.resolve(null)),
      downloadUpdate: vi.fn(() => Promise.resolve([] as string[])),
      quitAndInstall: vi.fn()
    }
  }
})

vi.mock('electron', () => ({
  app: mocks.app,
  BrowserWindow: {
    getAllWindows: () => [
      { webContents: { send: (_channel: string, state: unknown) => mocks.sent.push(state) } }
    ]
  }
}))
vi.mock('electron-updater', () => ({ autoUpdater: mocks.autoUpdater }))

// A fresh copy of the updater module, since it keeps its state between calls.
async function loadUpdater() {
  vi.resetModules()
  return import('./updater')
}

describe('updater', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.app.isPackaged = true
    mocks.sent.length = 0
    mocks.autoUpdater.autoDownload = true
  })

  it('does nothing when the app is not installed', async () => {
    mocks.app.isPackaged = false
    const updater = await loadUpdater()

    updater.startAutoUpdate()

    expect(mocks.autoUpdater.checkForUpdates).not.toHaveBeenCalled()
    expect(updater.getUpdateState()).toEqual({ status: 'idle' })
  })

  it('tells the UI about a newer version without downloading it', async () => {
    const updater = await loadUpdater()
    updater.startAutoUpdate()

    mocks.autoUpdater.emit('update-available', { version: '0.2.0' })

    expect(mocks.autoUpdater.autoDownload).toBe(false)
    expect(mocks.autoUpdater.downloadUpdate).not.toHaveBeenCalled()
    expect(mocks.sent.at(-1)).toEqual({ status: 'available', version: '0.2.0' })
  })

  it('downloads on request, reports whole percents, then is ready', async () => {
    const updater = await loadUpdater()
    updater.startAutoUpdate()
    mocks.autoUpdater.emit('update-available', { version: '0.2.0' })

    updater.downloadUpdate()
    mocks.autoUpdater.emit('download-progress', { percent: 42.2 })
    mocks.autoUpdater.emit('download-progress', { percent: 42.9 })
    mocks.autoUpdater.emit('update-downloaded', { version: '0.2.0' })

    expect(mocks.autoUpdater.downloadUpdate).toHaveBeenCalledOnce()
    expect(mocks.sent.slice(1)).toEqual([
      { status: 'downloading', version: '0.2.0', percent: 0 },
      { status: 'downloading', version: '0.2.0', percent: 42 },
      { status: 'ready', version: '0.2.0' }
    ])
  })

  it('offers the update again when the download fails', async () => {
    mocks.autoUpdater.downloadUpdate.mockRejectedValueOnce(new Error('network'))
    const updater = await loadUpdater()
    updater.startAutoUpdate()
    mocks.autoUpdater.emit('update-available', { version: '0.2.0' })

    updater.downloadUpdate()

    await vi.waitFor(() =>
      expect(updater.getUpdateState()).toEqual({
        status: 'available',
        version: '0.2.0',
        failed: true
      })
    )
  })

  it('installs and restarts only once the update is downloaded', async () => {
    const updater = await loadUpdater()
    updater.startAutoUpdate()
    mocks.autoUpdater.emit('update-available', { version: '0.2.0' })

    updater.installUpdate()
    expect(mocks.autoUpdater.quitAndInstall).not.toHaveBeenCalled()

    updater.downloadUpdate()
    mocks.autoUpdater.emit('update-downloaded', { version: '0.2.0' })
    updater.installUpdate()
    expect(mocks.autoUpdater.quitAndInstall).toHaveBeenCalledWith(true, true)
  })
})
