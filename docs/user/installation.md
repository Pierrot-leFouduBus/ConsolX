# Installation

## Requirements

- Windows 10, version 1809 or later. Windows 11 should work too, but is not tested yet.
- A 64-bit (x64) computer

## Install

1. Download `ConsolX-Setup-<version>.exe` from the
   [latest release](https://github.com/Pierrot-leFouduBus/ConsolX/releases/latest).
2. Run it, accept the license, and choose the folder to install to if you want another one.

ConsolX installs for your Windows account only, so no administrator rights are needed. The
installer adds ConsolX to the Start menu.

### "Windows protected your PC"

The installer is not signed with a code signing certificate yet, so Windows SmartScreen may show
this warning. To go on, click **More info**, then **Run anyway**.

Only do this with an installer downloaded from the
[ConsolX releases page](https://github.com/Pierrot-leFouduBus/ConsolX/releases).

## Updates

ConsolX looks for a new version each time it starts. When there is one, it asks you:

- **Update** downloads the new version in the background. The progress shows in the status bar,
  at the bottom of the window. Once it is downloaded, click **Restart now** to install it at
  once, or keep working: it installs when you quit ConsolX.
- **Not now** skips it. ConsolX asks again at the next start.

Your settings are kept when ConsolX updates.

If updates do not work, the file `%APPDATA%\ConsolX\logs\updater.log` tells what happened.

## Uninstall

Open the Windows **Settings**, then **Apps**, select **ConsolX** and click **Uninstall**.

Your settings stay in the `%APPDATA%\ConsolX` folder, in case you install ConsolX again. Delete
this folder to remove them too.
