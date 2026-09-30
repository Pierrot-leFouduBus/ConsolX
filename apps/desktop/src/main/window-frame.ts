// The window has no system frame: the UI draws the title bar and the window buttons.
// This module gives such a window what the system frame would: snapping, shadow and a
// real maximize on Windows, and the maximized state for the UI.
import type { BrowserWindow } from 'electron'
import koffi from 'koffi'
import { IpcChannel } from '../shared/ipc-channels'

export function setUpFrame(window: BrowserWindow): void {
  if (process.platform === 'win32') {
    window.once('show', () => restoreFrameStyles(window))

    // Electron ignores the system maximize command on transparent windows, which a
    // double-click on the title bar and Win+Up send: carry it out once Electron is done
    // with the message.
    window.hookWindowMessage(WM_SYSCOMMAND, (wParam) => {
      if ((wParam.readUInt32LE(0) & 0xfff0) !== SC_MAXIMIZE) return
      setImmediate(() => {
        if (!window.isDestroyed()) showWindow(window, SW_MAXIMIZE)
      })
    })
  }

  // Tell the UI when the window is maximized or restored, to update its button.
  window.on('maximize', () => window.webContents.send(IpcChannel.windowMaximizedChange, true))
  window.on('unmaximize', () => window.webContents.send(IpcChannel.windowMaximizedChange, false))
}

export function toggleMaximize(window: BrowserWindow): void {
  if (process.platform === 'win32') {
    // Electron only sizes a transparent window like the screen, so Windows does not
    // know it is maximized: dragging its title bar would not restore it. With the frame
    // styles back, a real maximize works.
    showWindow(window, window.isMaximized() ? SW_RESTORE : SW_MAXIMIZE)
  } else if (window.isMaximized()) {
    window.unmaximize()
  } else {
    window.maximize()
  }
}

const WM_SYSCOMMAND = 0x0112
// The low 4 bits of the command carry other information.
const SC_MAXIMIZE = 0xf030
const SW_MAXIMIZE = 3
const SW_RESTORE = 9

// Windows styles that Electron removes from transparent windows. Without them, Windows
// neither snaps the window to screen edges nor draws its shadow, and a maximized window
// would cover the taskbar. See docs/prototypes/transparency.md.
const GWL_STYLE = -16
const WS_THICKFRAME = 0x00040000
const WS_CAPTION = 0x00c00000
// SWP_NOSIZE | SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED
const SWP_REFRESH_FRAME = 0x0001 | 0x0002 | 0x0004 | 0x0010 | 0x0020

// Windows API functions, called from JavaScript with koffi. Loaded on first use, since
// user32.dll only exists on Windows.
type User32 = ReturnType<typeof loadUser32>
let user32: User32 | undefined

function loadUser32() {
  const library = koffi.load('user32.dll')
  return {
    getWindowLongPtr: library.func(
      'intptr_t __stdcall GetWindowLongPtrW(intptr_t hwnd, int index)'
    ),
    setWindowLongPtr: library.func(
      'intptr_t __stdcall SetWindowLongPtrW(intptr_t hwnd, int index, intptr_t value)'
    ),
    setWindowPos: library.func(
      'bool __stdcall SetWindowPos(intptr_t hwnd, intptr_t after, int x, int y, int cx, int cy, uint flags)'
    ),
    showWindow: library.func('bool __stdcall ShowWindow(intptr_t hwnd, int command)')
  }
}

// Call once the window is shown: Electron removes the styles when it shows the window.
function restoreFrameStyles(window: BrowserWindow): void {
  user32 ??= loadUser32()
  const hwnd = handleOf(window)
  const style = Number(user32.getWindowLongPtr(hwnd, GWL_STYLE))
  user32.setWindowLongPtr(hwnd, GWL_STYLE, BigInt(style | WS_THICKFRAME | WS_CAPTION))
  // Windows applies new frame styles only after this call.
  user32.setWindowPos(hwnd, 0n, 0, 0, 0, 0, SWP_REFRESH_FRAME)
}

function showWindow(window: BrowserWindow, command: number): void {
  user32 ??= loadUser32()
  user32.showWindow(handleOf(window), command)
}

function handleOf(window: BrowserWindow): bigint {
  return window.getNativeWindowHandle().readBigInt64LE(0)
}
