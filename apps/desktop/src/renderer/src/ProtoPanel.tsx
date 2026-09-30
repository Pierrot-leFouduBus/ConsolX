// PROTOTYPE: panel to switch transparency modes and tune opacities.
import type { WindowInfo, WindowMode, WindowSettings } from '../../shared/prototype'
import { WINDOW_MODES } from '../../shared/prototype'

const MODE_LABELS: Record<WindowMode, string> = {
  opaque: 'Opaque (reference)',
  transparent: 'Transparent, no blur',
  blur: 'Blur (Windows 10)',
  acrylic: 'Acrylic (Windows 10)',
  mica: 'Mica (Windows 11)',
  acrylic11: 'Acrylic (Windows 11)'
}

interface ProtoPanelProps {
  settings: WindowSettings
  info: WindowInfo | undefined
  // Settings being edited, not yet applied to the window.
  draft: WindowSettings
  onDraftChange(draft: WindowSettings): void
  onLiveChange(settings: WindowSettings): void
}

export function ProtoPanel({
  settings,
  info,
  draft,
  onDraftChange,
  onLiveChange
}: ProtoPanelProps) {
  const proto = window.consolx.proto
  const slider = (key: 'tintAlpha' | 'uiAlpha' | 'terminalAlpha', label: string) => (
    <label className="slider">
      {label}: {Math.round(settings[key] * 100)}%
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(settings[key] * 100)}
        onChange={(event) => onLiveChange({ ...settings, [key]: Number(event.target.value) / 100 })}
      />
    </label>
  )

  return (
    <aside className="proto-panel">
      <h2>Window (applied by recreating it)</h2>
      {WINDOW_MODES.map((mode) => (
        <label key={mode}>
          <input
            type="radio"
            name="mode"
            checked={draft.mode === mode}
            onChange={() => onDraftChange({ ...draft, mode })}
          />
          {MODE_LABELS[mode]}
        </label>
      ))}
      <label>
        <input
          type="checkbox"
          checked={draft.resizable}
          onChange={(event) => onDraftChange({ ...draft, resizable: event.target.checked })}
        />
        resizable
      </label>
      <label>
        <input
          type="checkbox"
          checked={draft.thickFrame}
          onChange={(event) => onDraftChange({ ...draft, thickFrame: event.target.checked })}
        />
        thickFrame (shadow, resize edges)
      </label>
      <label>
        <input
          type="checkbox"
          checked={draft.forceFrameStyles}
          onChange={(event) => onDraftChange({ ...draft, forceFrameStyles: event.target.checked })}
        />
        Force frame styles (snap fix)
      </label>
      <button
        type="button"
        className="primary"
        onClick={() =>
          // Keep the live opacities; take the creation settings from the draft.
          proto.recreate({
            ...settings,
            mode: draft.mode,
            resizable: draft.resizable,
            thickFrame: draft.thickFrame,
            forceFrameStyles: draft.forceFrameStyles
          })
        }
      >
        Recreate window
      </button>

      <h2>Live</h2>
      {slider('tintAlpha', 'Blur tint (Windows 10)')}
      {slider('uiAlpha', 'App background')}
      {slider('terminalAlpha', 'Terminal background')}
      <label>
        <input
          type="checkbox"
          checked={settings.lightBlurWhileMoving}
          onChange={(event) =>
            onLiveChange({ ...settings, lightBlurWhileMoving: event.target.checked })
          }
        />
        Lighter blur while moving (Acrylic lag fix)
      </label>

      <h2>Info</h2>
      <p>
        Current mode: {MODE_LABELS[settings.mode]}
        <br />
        Windows: {info?.osRelease ?? '…'}
        <br />
        Effect accepted by Windows:{' '}
        {info?.accentApplied == null ? 'n/a' : info.accentApplied ? 'yes' : 'NO'}
        <br />
        Maximized: {info?.maximized ? 'yes' : 'no'}
        <br />
        Win32 styles:{' '}
        {info?.frameStyles
          ? `thick frame ${info.frameStyles.thickFrame ? 'yes' : 'NO'}, caption ${info.frameStyles.caption ? 'yes' : 'NO'}`
          : 'n/a'}
      </p>
    </aside>
  )
}
