// "+" button at the right of each group of tabs: a menu to open a shell in a new tab,
// to split the group, or to open the settings.
import type { IDockviewHeaderActionsProps } from 'dockview-react'
import { useContext, useEffect, useRef, useState } from 'react'
import type { ShellProfile } from '../../shared/consolx-api'
import type { Shortcut } from '../../shared/shortcuts'
import { defaultShell, openTerminal, ShellsContext, splitTerminal } from './terminals'
import { useSettings } from './useSettings'

export function NewTerminalMenu({ containerApi, group }: IDockviewHeaderActionsProps) {
  const shells = useContext(ShellsContext)
  const settings = useSettings()
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

  const split = (direction: 'right' | 'below') => {
    setPosition(null)
    splitTerminal(containerApi, shells, settings.defaultProfile, group, direction)
  }

  const openSettings = () => {
    setPosition(null)
    window.consolx.settings.open()
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
            <MenuItem
              key={profile.id}
              label={profile.name}
              // The new tab shortcut opens the default shell.
              shortcut={
                profile === defaultShell(shells, settings.defaultProfile)
                  ? settings.keys.newTab
                  : null
              }
              onClick={() => newTab(profile)}
            />
          ))}
          <div className="menu-separator" role="separator" />
          <MenuItem
            label="Split right"
            shortcut={settings.keys.splitRight}
            onClick={() => split('right')}
          />
          <MenuItem
            label="Split down"
            shortcut={settings.keys.splitDown}
            onClick={() => split('below')}
          />
          <div className="menu-separator" role="separator" />
          <MenuItem label="Settings" shortcut={settings.keys.openSettings} onClick={openSettings} />
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  label: string
  // Shown at the right of the entry; null when the action has no shortcut.
  shortcut: Shortcut | null
  onClick(): void
}

function MenuItem({ label, shortcut, onClick }: MenuItemProps) {
  return (
    <button type="button" role="menuitem" aria-keyshortcuts={shortcut?.label} onClick={onClick}>
      {label}
      {shortcut && (
        <kbd className="menu-shortcut" aria-hidden="true">
          {shortcut.label}
        </kbd>
      )}
    </button>
  )
}
