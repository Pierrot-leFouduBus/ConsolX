// PROTOTYPE: creates the test window in the chosen transparency mode, and lets the UI
// switch modes, tune opacities and drive the custom title bar.
import { app, BrowserWindow, ipcMain, type BrowserWindowConstructorOptions } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import { IpcChannel } from '../shared/ipc-channels'
import { WINDOW_MODES, type WindowInfo, type WindowSettings } from '../shared/prototype'
import {
  Accent,
  addFrameStyles,
  extendFrameIntoClientArea,
  getFrameStyles,
  setAccent
} from './composition'
import { getRendererSource } from './renderer-source'
import type { TerminalManager } from './terminal-manager'

// ConsolX background color, used as the tint over the blur.
const TINT = { r: 21, g: 23, b: 28 }

let settings: WindowSettings = {
  mode: 'acrylic',
  resizable: true,
  thickFrame: true,
  forceFrameStyles: true,
  tintAlpha: 0.5,
  uiAlpha: 0.2,
  terminalAlpha: 0.3,
  lightBlurWhileMoving: true
}
let current: BrowserWindow | null = null
let accentApplied: boolean | null = null
// True while the window is being replaced, so that the app does not quit.
let replacing = false

export function isReplacingWindow(): boolean {
  return replacing
}

export function createWindow(terminals: TerminalManager): void {
  const window = new BrowserWindow({ ...windowOptions(settings), width: 900, height: 600 })
  current = window
  accentApplied = null

  window.once('ready-to-show', () => window.show())
  // The Windows 10 effect and the frame styles are applied once the window is on screen.
  window.once('show', () => {
    applyAccent(window)
    if (process.platform === 'win32' && settings.forceFrameStyles) {
      addFrameStyles(window)
      // Last attempt for Acrylic and plain transparency with the forced styles.
      if (settings.mode === 'acrylic' || settings.mode === 'transparent') {
        trace(`extend frame: ${extendFrameIntoClientArea(window)}`)
      }
      // The frame change drops the effect: apply it again once Windows has handled it.
      setTimeout(() => {
        if (!window.isDestroyed()) applyAccent(window)
      }, 100)
    }
  })
  window.on('maximize', () => sendInfo(window))
  window.on('unmaximize', () => sendInfo(window))
  lightenBlurWhileMoving(window)

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('did-start-navigation', (details) => {
    if (details.isMainFrame && !details.isSameDocument) terminals.killAll()
  })
  window.on('closed', () => {
    terminals.killAll()
    if (current === window) current = null
  })

  const source = getRendererSource(app.isPackaged, process.env['ELECTRON_RENDERER_URL'], __dirname)
  if (source.type === 'url') void window.loadURL(source.url)
  else void window.loadFile(source.path)
}

export function registerPrototypeIpc(terminals: TerminalManager): void {
  ipcMain.handle(IpcChannel.protoGetSettings, () => settings)
  ipcMain.handle(IpcChannel.protoGetInfo, (event) =>
    info(BrowserWindow.fromWebContents(event.sender))
  )

  ipcMain.on(IpcChannel.protoRecreate, (_event, next: unknown) => {
    settings = sanitize(next)
    replaceWindow(terminals)
  })
  ipcMain.on(IpcChannel.protoUpdate, (_event, next: unknown) => {
    settings = sanitize(next)
    if (current) applyAccent(current)
  })

  ipcMain.on(IpcChannel.windowMinimize, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.on(IpcChannel.windowToggleMaximize, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window?.isMaximized()) window.unmaximize()
    else window?.maximize()
  })
  ipcMain.on(IpcChannel.windowClose, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
}

function windowOptions(s: WindowSettings): BrowserWindowConstructorOptions {
  const windows10Effect = s.mode === 'transparent' || s.mode === 'blur' || s.mode === 'acrylic'
  const windows11Material =
    s.mode === 'mica' ? 'mica' : s.mode === 'acrylic11' ? 'acrylic' : undefined
  return {
    show: false,
    title: app.getName(),
    frame: false,
    transparent: windows10Effect,
    backgroundColor: s.mode === 'opaque' ? '#15171C' : '#00000000',
    backgroundMaterial: windows11Material,
    resizable: s.resizable,
    thickFrame: s.thickFrame,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  }
}

// Closes the window, then opens a new one with the current settings.
function replaceWindow(terminals: TerminalManager): void {
  const old = current
  if (!old) return createWindow(terminals)
  replacing = true
  old.once('closed', () => {
    createWindow(terminals)
    replacing = false
  })
  old.close()
}

function applyAccent(window: BrowserWindow): void {
  if (process.platform !== 'win32') return
  const tint = { ...TINT, a: settings.tintAlpha }
  if (settings.mode === 'blur') {
    accentApplied = setAccent(window, Accent.blurBehind, tint)
  } else if (settings.mode === 'acrylic') {
    accentApplied = setAccent(window, Accent.acrylic, tint)
    // With the forced frame styles, Acrylic only shows after a size change.
    if (settings.forceFrameStyles) nudgeSize(window)
  } else if (settings.mode === 'transparent' && settings.forceFrameStyles) {
    // With the forced frame styles, let Windows draw the transparency (no blur).
    accentApplied = setAccent(window, Accent.transparent, tint)
  }
  sendInfo(window)
}

// Resizes the window by one pixel and back, to make Windows redraw its effect.
function nudgeSize(window: BrowserWindow): void {
  if (window.isMaximized() || window.isMinimized()) return
  const [width, height] = window.getSize()
  window.setSize(width + 1, height)
  window.setSize(width, height)
  trace('nudge')
}

// Workaround: on Windows 10, Acrylic makes moving and resizing the window lag far
// behind the mouse. Use the lighter blur during the move, then Acrylic again.
function lightenBlurWhileMoving(window: BrowserWindow): void {
  let moving = false
  const start = (event: string) => {
    trace(event)
    if (moving || settings.mode !== 'acrylic' || !settings.lightBlurWhileMoving) return
    moving = true
    trace(`blur: ${setAccent(window, Accent.blurBehind, { ...TINT, a: settings.tintAlpha })}`)
  }
  const end = (event: string) => {
    trace(event)
    if (!moving) return
    moving = false
    applyAccent(window)
    trace(`acrylic: ${accentApplied}`)
  }
  window.on('will-move', () => start('will-move'))
  window.on('will-resize', () => start('will-resize'))
  window.on('moved', () => end('moved'))
  window.on('resized', () => end('resized'))
  // Other events that may matter to the effect.
  for (const event of ['focus', 'blur', 'maximize', 'unmaximize', 'restore', 'minimize'] as const) {
    window.on(event as 'focus', () => trace(event))
  }
}

// PROTOTYPE: logs window events to the console, repeated events only once in a row.
let lastTrace = ''
function trace(message: string): void {
  if (message === lastTrace) return
  lastTrace = message
  console.log(`[window] ${new Date().toISOString().slice(11, 23)} ${message}`)
}

function info(window: BrowserWindow | null): WindowInfo {
  return {
    maximized: window?.isMaximized() ?? false,
    accentApplied,
    osRelease: release(),
    frameStyles: window && process.platform === 'win32' ? getFrameStyles(window) : null
  }
}

function sendInfo(window: BrowserWindow): void {
  if (!window.isDestroyed()) window.webContents.send(IpcChannel.protoInfo, info(window))
}

// Settings come from the UI: keep only valid values.
function sanitize(value: unknown): WindowSettings {
  const next = (typeof value === 'object' && value !== null ? value : {}) as Partial<WindowSettings>
  const alpha = (a: unknown, fallback: number) =>
    typeof a === 'number' && a >= 0 && a <= 1 ? a : fallback
  return {
    mode: WINDOW_MODES.includes(next.mode as never)
      ? (next.mode as WindowSettings['mode'])
      : 'opaque',
    resizable: next.resizable !== false,
    thickFrame: next.thickFrame !== false,
    forceFrameStyles: next.forceFrameStyles === true,
    tintAlpha: alpha(next.tintAlpha, settings.tintAlpha),
    uiAlpha: alpha(next.uiAlpha, settings.uiAlpha),
    terminalAlpha: alpha(next.terminalAlpha, settings.terminalAlpha),
    lightBlurWhileMoving: next.lightBlurWhileMoving !== false
  }
}
