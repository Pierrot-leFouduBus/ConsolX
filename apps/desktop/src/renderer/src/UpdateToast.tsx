// Tells that a downloaded update is ready, and offers to restart now.
// It does not take the keyboard focus away from the terminal.
interface UpdateToastProps {
  appName: string
  version: string
  onRestart(): void
  onClose(): void
}

export function UpdateToast({ appName, version, onRestart, onClose }: UpdateToastProps) {
  return (
    <div className="toast" role="status">
      <p>
        {appName} {version} is ready to install.
      </p>
      <div className="actions">
        <button type="button" onClick={onClose}>
          Later
        </button>
        <button type="button" className="primary" onClick={onRestart}>
          Restart now
        </button>
      </div>
    </div>
  )
}
