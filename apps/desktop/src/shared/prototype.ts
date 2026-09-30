// PROTOTYPE: settings and API of the transparency test window.
import type { Unsubscribe } from './consolx-api'

export type WindowMode =
  // Frameless window with a solid background: the reference.
  | 'opaque'
  // Transparent window, no blur.
  | 'transparent'
  // Windows 10 blur (SetWindowCompositionAttribute).
  | 'blur'
  | 'acrylic'
  // Windows 11 materials (Electron's backgroundMaterial option).
  | 'mica'
  | 'acrylic11'

export const WINDOW_MODES: WindowMode[] = [
  'opaque',
  'transparent',
  'blur',
  'acrylic',
  'mica',
  'acrylic11'
]

export interface WindowSettings {
  mode: WindowMode
  // Applied when the window is created.
  resizable: boolean
  thickFrame: boolean
  // Put back the frame styles Electron removes (snapping, shadow).
  forceFrameStyles: boolean
  // Applied live, from 0 to 1: tint over the Windows 10 blur, app background,
  // terminal background.
  tintAlpha: number
  uiAlpha: number
  terminalAlpha: number
  // Workaround for Acrylic lag on Windows 10: lighter blur while moving or resizing.
  lightBlurWhileMoving: boolean
}

export interface WindowInfo {
  maximized: boolean
  // Whether Windows accepted the Windows 10 effect; null when not used.
  accentApplied: boolean | null
  // Windows version, for example "10.0.19045".
  osRelease: string
  // Actual Win32 styles of the window; null outside Windows.
  frameStyles: { thickFrame: boolean; caption: boolean } | null
}

export interface PrototypeApi {
  getSettings(): Promise<WindowSettings>
  // Replaces the window, for settings that only apply at creation.
  recreate(settings: WindowSettings): void
  // Applies the live settings.
  update(settings: WindowSettings): void
  getInfo(): Promise<WindowInfo>
  onInfo(listener: (info: WindowInfo) => void): Unsubscribe
  // Buttons of the custom title bar.
  minimize(): void
  toggleMaximize(): void
  close(): void
}
