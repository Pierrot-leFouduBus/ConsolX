// Finds the shells installed on this computer: PowerShell 7, Windows PowerShell,
// the command prompt, Git Bash and the WSL distributions.
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { basename, win32 } from 'node:path'
import type { ShellProfile } from '../shared/consolx-api'

// A profile, with what is needed to start it.
export interface ShellProfileDefinition extends ShellProfile {
  file: string
  args: string[]
}

// Access to the system, replaced by a fake in tests.
export interface SystemProbe {
  platform: NodeJS.Platform
  env: NodeJS.ProcessEnv
  exists(path: string): boolean
  // Raw output of `wsl.exe --list --quiet`, or null when WSL is missing or fails.
  listWslDistributions(wslPath: string): Promise<Buffer | null>
}

export async function detectShellProfiles(
  system: SystemProbe = realSystem
): Promise<ShellProfileDefinition[]> {
  if (system.platform !== 'win32') return [unixShell(system.env)]

  const env = system.env
  const windows = env['SystemRoot'] ?? 'C:\\Windows'
  const programFiles = env['ProgramFiles'] ?? 'C:\\Program Files'
  const programFilesX86 = env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
  const localAppData = env['LOCALAPPDATA'] ?? ''
  const profiles: ShellProfileDefinition[] = []

  // Adds a profile when one of its possible locations exists.
  const add = (id: string, name: string, candidates: string[], args: string[] = []) => {
    const file = candidates.find((path) => path !== '' && system.exists(path))
    if (file) profiles.push({ id, name, file, args })
  }

  add('powershell', 'PowerShell', [
    win32.join(programFiles, 'PowerShell', '7', 'pwsh.exe'),
    localAppData && win32.join(localAppData, 'Microsoft', 'WindowsApps', 'pwsh.exe')
  ])
  add('powershell-preview', 'PowerShell Preview', [
    win32.join(programFiles, 'PowerShell', '7-preview', 'pwsh.exe')
  ])
  add('windows-powershell', 'Windows PowerShell', [
    win32.join(windows, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  ])
  add('cmd', 'Command Prompt', [env['ComSpec'] ?? '', win32.join(windows, 'System32', 'cmd.exe')])
  // --login -i: start an interactive login shell, as Git's own shortcut does.
  add(
    'git-bash',
    'Git Bash',
    [
      win32.join(programFiles, 'Git', 'bin', 'bash.exe'),
      win32.join(programFilesX86, 'Git', 'bin', 'bash.exe'),
      localAppData && win32.join(localAppData, 'Programs', 'Git', 'bin', 'bash.exe')
    ],
    ['--login', '-i']
  )

  const wsl = win32.join(windows, 'System32', 'wsl.exe')
  if (system.exists(wsl)) {
    for (const distribution of parseWslList(await system.listWslDistributions(wsl))) {
      // --cd ~ opens the Linux home folder rather than the Windows one.
      profiles.push({
        id: `wsl-${distribution}`,
        name: distribution,
        file: wsl,
        args: ['-d', distribution, '--cd', '~']
      })
    }
  }

  return profiles
}

// Profile opened when none is chosen: PowerShell 7 if installed, else Windows PowerShell.
export function defaultProfileId(profiles: ShellProfile[]): string | null {
  for (const id of ['powershell', 'windows-powershell']) {
    if (profiles.some((profile) => profile.id === id)) return id
  }
  return profiles[0]?.id ?? null
}

// `wsl --list --quiet` prints one distribution per line, in UTF-16 (or in UTF-8 when
// WSL_UTF8 is set). Docker Desktop's internal distributions are not meant to be opened.
export function parseWslList(output: Buffer | null): string[] {
  if (!output) return []
  const text = output.includes(0) ? output.toString('utf16le') : output.toString('utf8')
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\0/g, '').trim())
    .filter((name) => name !== '' && !name.startsWith('docker-desktop'))
}

// Outside Windows: the user's shell, as a login shell.
function unixShell(env: NodeJS.ProcessEnv): ShellProfileDefinition {
  const file = env['SHELL'] ?? '/bin/bash'
  return { id: 'default', name: basename(file), file, args: ['-l'] }
}

const realSystem: SystemProbe = {
  platform: process.platform,
  env: process.env,
  exists: existsSync,
  listWslDistributions: (wslPath) =>
    new Promise((resolve) => {
      execFile(
        wslPath,
        ['--list', '--quiet'],
        { encoding: 'buffer', timeout: 5000, windowsHide: true },
        (error, stdout) => resolve(error ? null : stdout)
      )
    })
}
