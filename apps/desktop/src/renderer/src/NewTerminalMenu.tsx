// "+" button at the right of each group of tabs: a menu to open a shell in a new tab,
// or to split the group.
import type { IDockviewHeaderActionsProps } from 'dockview-react'
import { useContext, useEffect, useRef, useState } from 'react'
import type { ShellProfile } from '../../shared/consolx-api'
import { defaultShell, openTerminal, ShellsContext, type TerminalParams } from './terminals'

export function NewTerminalMenu({ containerApi, group, activePanel }: IDockviewHeaderActionsProps) {
  const shells = useContext(ShellsContext)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // Where the menu opens, below the button; null when closed.
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null)

  // Close the menu on a click outside it, or with Escape.
  useEffect(() => {
    if (!position) return
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setPosition(null)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPosition(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [position])

  const toggle = () => {
    if (position) return setPosition(null)
    const box = buttonRef.current?.getBoundingClientRect()
    if (box) setPosition({ top: box.bottom + 2, right: window.innerWidth - box.right })
  }

  const newTab = (profile: ShellProfile) => {
    setPosition(null)
    openTerminal(containerApi, profile, { referenceGroup: group })
  }

  // A split runs the same shell as the active tab of the group.
  const split = (direction: 'right' | 'below') => {
    setPosition(null)
    const activeId = (activePanel?.params as TerminalParams | undefined)?.profileId
    const profile = shells.profiles.find((shell) => shell.id === activeId) ?? defaultShell(shells)
    if (profile) openTerminal(containerApi, profile, { referenceGroup: group, direction })
  }

  return (
    <div className="group-actions">
      <button
        ref={buttonRef}
        type="button"
        className="icon-button"
        aria-label="New terminal"
        aria-haspopup="menu"
        aria-expanded={position !== null}
        onClick={toggle}
      >
        +
      </button>
      {position && (
        <div ref={menuRef} className="menu" role="menu" style={position}>
          {shells.profiles.map((profile) => (
            <button key={profile.id} type="button" role="menuitem" onClick={() => newTab(profile)}>
              {profile.name}
            </button>
          ))}
          <div className="menu-separator" role="separator" />
          <button type="button" role="menuitem" onClick={() => split('right')}>
            Split right
          </button>
          <button type="button" role="menuitem" onClick={() => split('below')}>
            Split down
          </button>
        </div>
      )}
    </div>
  )
}
