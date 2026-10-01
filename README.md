# ConsolX

A free terminal for Windows that brings your shells together in one window: PowerShell, the
command prompt, Git Bash and your WSL distributions, in tabs and split panes.

ConsolX runs on 64-bit Windows 10, version 1809 or later. It should also run on Windows 11, which
is not tested yet.

## Features

- **Every shell in one place**: ConsolX finds the shells installed on your computer and opens the
  one you choose.
- **Tabs and split panes**: open as many terminals as you need, split them side by side or one
  above the other, and drag tabs to arrange them.
- **Keyboard shortcuts**: the shortcuts of Windows Terminal by default, and you can change them.
- **Your look**: a dark and a light theme, or the mode of Windows; your own colors and styles in a
  CSS file; a translucent window, the desktop blurred behind it.
- **One settings file**: plain text, with every setting explained inside; changes apply as soon as
  you save.
- **Automatic updates**: ConsolX tells you when a new version is out and installs it for you.

## Install

1. Download `ConsolX-Setup-<version>.exe` from the
   [latest release](https://github.com/Pierrot-leFouduBus/ConsolX/releases/latest).
2. Run it. ConsolX installs for your Windows account only: no administrator rights are needed.

Windows may warn that the installer comes from an unknown publisher: see
[Installation](docs/user/installation.md) for why, and how to go on.

## First steps

- ConsolX opens a terminal with your default shell: PowerShell 7 if it is installed, else Windows
  PowerShell.
- The **+** button, at the right of the tabs, opens another shell in a new tab, splits the
  terminal, or opens the settings.
- Drag a tab onto the edge of a terminal to split it, or onto another group of tabs to move it.
- `Ctrl+Shift+T` opens a tab, `Ctrl+Shift+W` closes it, `Ctrl+,` opens the settings.

## User guide

- [Installation](docs/user/installation.md): install, update and uninstall ConsolX.
- [Tabs, panes and shells](docs/user/tabs-and-panes.md): how to work with terminals.
- [Settings](docs/user/settings.md): the settings file and every setting.
- [Keyboard shortcuts](docs/user/shortcuts.md): the shortcuts, and how to change them.
- [Themes and user CSS](docs/user/themes.md): the light and dark themes, and your own styles.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to build ConsolX, the
rules for code and commits, and how to submit changes.

## License

ConsolX is free software, licensed under the GNU General Public License version 3, with an
additional permission for plugins: see [LICENSE](LICENSE), [LICENSE-EXCEPTION](LICENSE-EXCEPTION)
and [NOTICE](NOTICE).
