// Tells what is wrong in the settings file, and offers to open it. It does not take the
// keyboard focus away from the terminal.
interface SettingsNoticeProps {
  problems: string[]
  onOpen(): void
  onClose(): void
}

export function SettingsNotice({ problems, onOpen, onClose }: SettingsNoticeProps) {
  return (
    <div className="toast settings-notice" role="status">
      <p>Problem in settings.json:</p>
      <ul>
        {problems.map((problem) => (
          <li key={problem}>{problem}</li>
        ))}
      </ul>
      <div className="actions">
        <button type="button" onClick={onClose}>
          Close
        </button>
        <button type="button" className="primary" onClick={onOpen}>
          Open settings
        </button>
      </div>
    </div>
  )
}
