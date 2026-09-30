// PROTOTYPE: Windows 10 blur effects behind a transparent window, through
// SetWindowCompositionAttribute, an undocumented user32 function. koffi calls it
// from JavaScript, without a C++ module.
import type { BrowserWindow } from 'electron'
import koffi from 'koffi'

// Effects of the undocumented ACCENT_POLICY structure.
export const Accent = { disabled: 0, transparent: 2, blurBehind: 3, acrylic: 4 } as const

// Color laid over the blur; alpha from 0 to 1.
export interface Tint {
  r: number
  g: number
  b: number
  a: number
}

const WCA_ACCENT_POLICY = 19

const AccentPolicy = koffi.struct('ACCENT_POLICY', {
  AccentState: 'int',
  AccentFlags: 'int',
  GradientColor: 'uint32',
  AnimationId: 'int'
})

// Registered by name: the function signature below refers to it.
koffi.struct('WINDOWCOMPOSITIONATTRIBDATA', {
  Attribute: 'int',
  Data: 'void *',
  SizeOfData: 'size_t'
})

const user32 = koffi.load('user32.dll')
const setWindowCompositionAttribute = user32.func(
  'bool __stdcall SetWindowCompositionAttribute(intptr_t hwnd, WINDOWCOMPOSITIONATTRIBDATA *data)'
)

// Applies an effect to the window. Returns whether Windows accepted it.
export function setAccent(window: BrowserWindow, accent: number, tint: Tint): boolean {
  const hwnd = handle(window)
  const policy = koffi.alloc(AccentPolicy, 1)
  try {
    koffi.encode(policy, AccentPolicy, {
      AccentState: accent,
      // 2: use GradientColor as the tint.
      AccentFlags: 2,
      GradientColor: toAbgr(tint),
      AnimationId: 0
    })
    return setWindowCompositionAttribute(hwnd, {
      Attribute: WCA_ACCENT_POLICY,
      Data: policy,
      SizeOfData: koffi.sizeof(AccentPolicy)
    })
  } finally {
    koffi.free(policy)
  }
}

// Window styles that let Windows snap the window to screen edges and draw its shadow.
const GWL_STYLE = -16
const WS_THICKFRAME = 0x00040000
const WS_CAPTION = 0x00c00000
// SWP_NOSIZE | SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED
const SWP_REFRESH_FRAME = 0x0001 | 0x0002 | 0x0004 | 0x0010 | 0x0020

const getWindowLongPtr = user32.func(
  'intptr_t __stdcall GetWindowLongPtrW(intptr_t hwnd, int index)'
)
const setWindowLongPtr = user32.func(
  'intptr_t __stdcall SetWindowLongPtrW(intptr_t hwnd, int index, intptr_t value)'
)
const setWindowPos = user32.func(
  'bool __stdcall SetWindowPos(intptr_t hwnd, intptr_t after, int x, int y, int cx, int cy, uint flags)'
)

export interface FrameStyles {
  thickFrame: boolean
  caption: boolean
}

export function getFrameStyles(window: BrowserWindow): FrameStyles {
  const style = Number(getWindowLongPtr(handle(window), GWL_STYLE))
  return {
    thickFrame: (style & WS_THICKFRAME) !== 0,
    caption: (style & WS_CAPTION) === WS_CAPTION
  }
}

// Electron removes these styles from transparent windows; this puts them back.
export function addFrameStyles(window: BrowserWindow): void {
  const hwnd = handle(window)
  const style = Number(getWindowLongPtr(hwnd, GWL_STYLE))
  setWindowLongPtr(hwnd, GWL_STYLE, BigInt(style | WS_THICKFRAME | WS_CAPTION))
  setWindowPos(hwnd, 0n, 0, 0, 0, 0, SWP_REFRESH_FRAME)
}

// Tells Windows that the whole window is part of its frame ("sheet of glass"), so that
// frame effects can show behind all of it. Returns whether Windows accepted it.
koffi.struct('MARGINS', {
  cxLeftWidth: 'int',
  cxRightWidth: 'int',
  cyTopHeight: 'int',
  cyBottomHeight: 'int'
})
const dwmapi = koffi.load('dwmapi.dll')
const dwmExtendFrameIntoClientArea = dwmapi.func(
  'long __stdcall DwmExtendFrameIntoClientArea(intptr_t hwnd, MARGINS *margins)'
)

export function extendFrameIntoClientArea(window: BrowserWindow): boolean {
  const all = { cxLeftWidth: -1, cxRightWidth: -1, cyTopHeight: -1, cyBottomHeight: -1 }
  return dwmExtendFrameIntoClientArea(handle(window), all) === 0
}

function handle(window: BrowserWindow): bigint {
  return window.getNativeWindowHandle().readBigInt64LE(0)
}

// Windows expects the tint as 0xAABBGGRR.
function toAbgr({ r, g, b, a }: Tint): number {
  const alpha = Math.round(Math.min(Math.max(a, 0), 1) * 255)
  return ((alpha << 24) | (b << 16) | (g << 8) | r) >>> 0
}
