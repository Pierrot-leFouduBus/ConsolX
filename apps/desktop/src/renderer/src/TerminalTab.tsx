// Tab of a terminal. Double-click to rename it; × or a middle click closes it.
import type { IDockviewPanelHeaderProps } from 'dockview-react'
import { useEffect, useState, type KeyboardEvent } from 'react'
import type { TerminalParams } from './terminals'

export function TerminalTab({ api, containerApi }: IDockviewPanelHeaderProps<TerminalParams>) {
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

  // Gives the keyboard to the terminal of this tab. A click on the tab gives it to the
  // page when the click ends, so it is done after the click.
  const focusTerminal = () => containerApi.getPanel(api.id)?.focus()

  // Closes the tab and gives the keyboard to the terminal left active.
  const close = () => {
    api.close()
    containerApi.activePanel?.focus()
  }

  // After Enter or Escape, the keyboard goes back to the terminal. Not after a click
  // elsewhere, which gives the keyboard to what was clicked.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') return
    finishEditing(event.key === 'Enter' ? event.currentTarget.value : null)
    focusTerminal()
  }

  return (
    <div
      className="tab"
      title={title}
      onClick={() => {
        if (!editing) focusTerminal()
      }}
      onDoubleClick={() => setEditing(true)}
      onMouseDown={(event) => {
        // Middle click closes the tab, as in a web browser.
        if (event.button === 1) {
          event.preventDefault()
          close()
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
          close()
        }}
      >
        ×
      </button>
    </div>
  )
}
