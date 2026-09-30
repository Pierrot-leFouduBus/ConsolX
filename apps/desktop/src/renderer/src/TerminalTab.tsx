// Tab of a terminal. Double-click to rename it; × or a middle click closes it.
import type { IDockviewPanelHeaderProps } from 'dockview-react'
import { useEffect, useState, type KeyboardEvent } from 'react'
import type { TerminalParams } from './terminals'

export function TerminalTab({ api }: IDockviewPanelHeaderProps<TerminalParams>) {
  const [title, setTitle] = useState(api.title ?? '')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const listener = api.onDidTitleChange((event) => setTitle(event.title))
    return () => listener.dispose()
  }, [api])

  const finishEditing = (newTitle: string | null) => {
    setEditing(false)
    const trimmed = newTitle?.trim()
    if (trimmed) api.setTitle(trimmed)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') finishEditing(event.currentTarget.value)
    if (event.key === 'Escape') finishEditing(null)
  }

  return (
    <div
      className="tab"
      title={title}
      onDoubleClick={() => setEditing(true)}
      onMouseDown={(event) => {
        // Middle click closes the tab, as in a web browser.
        if (event.button === 1) {
          event.preventDefault()
          api.close()
        }
      }}
    >
      {editing ? (
        <input
          className="tab-rename"
          aria-label="Tab name"
          defaultValue={title}
          autoFocus
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={onKeyDown}
          onBlur={(event) => finishEditing(event.currentTarget.value)}
          // Typing in the field must not start dragging the tab.
          onMouseDown={(event) => event.stopPropagation()}
          draggable={false}
        />
      ) : (
        <span className="tab-title">{title}</span>
      )}
      <button
        type="button"
        className="tab-close"
        aria-label={`Close ${title}`}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          api.close()
        }}
      >
        ×
      </button>
    </div>
  )
}
