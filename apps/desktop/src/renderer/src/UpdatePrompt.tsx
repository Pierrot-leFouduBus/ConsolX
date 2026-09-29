// Asks whether to download an available update.
import { useEffect, useRef } from 'react'

interface UpdatePromptProps {
  appName: string
  version: string
  // The previous download attempt failed.
  failed?: boolean
  onUpdate(): void
  onDismiss(): void
}

export function UpdatePrompt({ appName, version, failed, onUpdate, onDismiss }: UpdatePromptProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // A modal <dialog> keeps the keyboard focus inside it, and gives it back to the
  // terminal when it closes.
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="update-title"
      onCancel={(event) => {
        // Escape means "Not now".
        event.preventDefault()
        onDismiss()
      }}
    >
      <h2 id="update-title">Update available</h2>
      <p>
        {failed
          ? `The download of ${appName} ${version} failed. Try again?`
          : `${appName} ${version} is available.`}
      </p>
      <div className="actions">
        <button type="button" onClick={onDismiss}>
          Not now
        </button>
        <button type="button" className="primary" onClick={onUpdate} autoFocus>
          Update
        </button>
      </div>
    </dialog>
  )
}
