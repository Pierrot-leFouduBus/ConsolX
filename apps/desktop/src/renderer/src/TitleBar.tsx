// PROTOTYPE: title bar drawn by the app, since the window has no system frame.
// The bar moves the window (drag region); Windows handles double-click to maximize.
interface TitleBarProps {
  title: string
  maximized: boolean
  onTogglePanel(): void
}

export function TitleBar({ title, maximized, onTogglePanel }: TitleBarProps) {
  const proto = window.consolx.proto
  return (
    <header className="title-bar">
      <span className="title">{title}</span>
      <div className="window-buttons">
        <button type="button" onClick={onTogglePanel} aria-label="Transparency settings">
          ⚙
        </button>
        <button type="button" onClick={() => proto.minimize()} aria-label="Minimize">
          ─
        </button>
        <button
          type="button"
          onClick={() => proto.toggleMaximize()}
          aria-label={maximized ? 'Restore' : 'Maximize'}
        >
          {maximized ? '❐' : '☐'}
        </button>
        <button type="button" className="close" onClick={() => proto.close()} aria-label="Close">
          ✕
        </button>
      </div>
    </header>
  )
}
