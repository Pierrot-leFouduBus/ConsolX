// Window buttons drawn by the app, since the window has no system frame: minimize,
// maximize or restore, and close. They sit in the top right corner, over the tab bar.
import { useEffect, useState, type MouseEvent } from 'react'

export function WindowButtons() {
  const appWindow = window.consolx.appWindow
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    void appWindow.isMaximized().then(setMaximized)
    return appWindow.onMaximizedChange(setMaximized)
  }, [appWindow])

  return (
    <div className="window-buttons">
      <button
        type="button"
        aria-label="Minimize"
        title="Minimize"
        tabIndex={-1}
        onMouseDown={keepFocus}
        onClick={() => appWindow.minimize()}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true">
          <path d="M0 5.5h10" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={maximized ? 'Restore' : 'Maximize'}
        title={maximized ? 'Restore' : 'Maximize'}
        tabIndex={-1}
        onMouseDown={keepFocus}
        onClick={() => appWindow.toggleMaximize()}
      >
        {maximized ? (
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2.5 2.5v-2h7v7h-2" />
            <rect x="0.5" y="2.5" width="7" height="7" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="close"
        aria-label="Close"
        title="Close"
        tabIndex={-1}
        onMouseDown={keepFocus}
        onClick={() => appWindow.close()}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true">
          <path d="M0 0l10 10M10 0L0 10" />
        </svg>
      </button>
    </div>
  )
}

// A click on a button must not take the keyboard away from the terminal.
function keepFocus(event: MouseEvent) {
  event.preventDefault()
}
