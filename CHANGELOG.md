# Changelog

What changes in each version of ConsolX. The release workflow publishes the section of a version
as the notes of its GitHub release.

## [1.1.0] - 2026-10-05

ConsolX takes your colors: a light theme, your own CSS, and a translucent window.

### Added

- A light theme, and the `theme` setting to choose the colors of ConsolX: `"dark"`, `"light"`,
  or `"system"` to follow the light or dark mode of Windows.
- A user CSS file, `%APPDATA%\ConsolX\user.css`: CSS applied on top of the theme as soon as it
  is saved. It changes the look of ConsolX through the theme variables, listed in the
  [user guide](https://github.com/Pierrot-leFouduBus/ConsolX/blob/main/docs/user/themes.md).
- A translucent window: the terminals, the tab bars and the status bar each have an opacity
  setting (`terminal.opacity`, `tabs.opacity`, `window.opacity`), and what is behind them is
  blurred.

## [1.0.0] - 2026-10-01

The first stable version of ConsolX: a terminal for Windows that brings your shells together in
one window, in tabs and split panes. The
[user guide](https://github.com/Pierrot-leFouduBus/ConsolX/tree/main/docs/user) explains everything.

### Added

- Keyboard shortcuts, as in Windows Terminal: `Ctrl+Shift+T` opens a tab, `Ctrl+Shift+W` closes
  it, `Ctrl+Tab` goes to the next one, `Alt+Shift+=` and `Alt+Shift+-` split the terminal, `Alt`
  with an arrow key goes to the terminal next to it, and `Ctrl+,` opens the settings.
- Copy and paste: `Ctrl+C` copies the selected text (and still stops the command running when no
  text is selected), `Ctrl+V` pastes. `Ctrl+Shift+C` and `Ctrl+Shift+V` work too.
- Every shortcut can be changed or turned off in the settings file, with one `keys.` setting per
  shortcut. The **+** menu shows them.
- A user guide: installation, tabs and panes, settings and shortcuts.

### Fixed

- The settings file opens in front of ConsolX, instead of behind it.

## [0.2.0] - 2026-10-01

### Added

- ConsolX finds the shells installed on the computer: PowerShell 7, Windows PowerShell, the
  command prompt, Git Bash and the WSL distributions. The **+** menu opens any of them.
- Tabs: open, rename (double-click), close (× or middle click) and reorder them.
- Split panes: split a terminal to the right or below, drag tabs from one pane to another, resize
  the panes.
- A title bar drawn in the tab bar, with the window buttons, Windows snapping and a real maximize.
- A settings file, `%APPDATA%\ConsolX\settings.json`, applied as soon as it is saved: default
  shell, what happens when a shell ends, font of the terminals. A notice tells what is wrong in
  the file, and on which line.

### Fixed

- PowerShell output scrolled out of the window is kept in the history.
- The terminal gets the keyboard back after a click on its tab.

## [0.1.2] - 2026-09-29

### Changed

- ConsolX asks before downloading an update: **Update** or **Not now**.

## [0.1.1] - 2026-09-29

### Fixed

- Releases now publish their installer reliably, so that installed versions find their updates.

## [0.1.0] - 2026-09-29

### Added

- The first installable version: a window with a PowerShell terminal, an installer for Windows,
  and automatic updates from GitHub.

[1.1.0]: https://github.com/Pierrot-leFouduBus/ConsolX/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Pierrot-leFouduBus/ConsolX/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/Pierrot-leFouduBus/ConsolX/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Pierrot-leFouduBus/ConsolX/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Pierrot-leFouduBus/ConsolX/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Pierrot-leFouduBus/ConsolX/releases/tag/v0.1.0
