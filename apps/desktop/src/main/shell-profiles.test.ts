import { describe, expect, it } from 'vitest'
import {
  defaultProfileId,
  detectShellProfiles,
  parseWslList,
  type SystemProbe
} from './shell-profiles'

const env = {
  SystemRoot: 'C:\\Windows',
  ProgramFiles: 'C:\\Program Files',
  'ProgramFiles(x86)': 'C:\\Program Files (x86)',
  LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local',
  ComSpec: 'C:\\Windows\\system32\\cmd.exe'
}

const WSL = 'C:\\Windows\\System32\\wsl.exe'

// A fake Windows system where only the given files exist.
function windowsWith(files: string[], wslOutput: Buffer | null = null): SystemProbe {
  return {
    platform: 'win32',
    env,
    exists: (path) => files.includes(path),
    listWslDistributions: async () => wslOutput
  }
}

describe('detectShellProfiles', () => {
  it('finds the installed shells, in a fixed order', async () => {
    const profiles = await detectShellProfiles(
      windowsWith([
        'C:\\Program Files\\Git\\bin\\bash.exe',
        'C:\\Windows\\system32\\cmd.exe',
        'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        'C:\\Program Files\\PowerShell\\7\\pwsh.exe'
      ])
    )

    expect(profiles).toEqual([
      {
        id: 'powershell',
        name: 'PowerShell',
        file: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
        args: []
      },
      {
        id: 'windows-powershell',
        name: 'Windows PowerShell',
        file: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        args: []
      },
      {
        id: 'cmd',
        name: 'Command Prompt',
        file: 'C:\\Windows\\system32\\cmd.exe',
        args: []
      },
      {
        id: 'git-bash',
        name: 'Git Bash',
        file: 'C:\\Program Files\\Git\\bin\\bash.exe',
        args: ['--login', '-i']
      }
    ])
  })

  it('skips the shells that are not installed', async () => {
    const profiles = await detectShellProfiles(windowsWith(['C:\\Windows\\system32\\cmd.exe']))
    expect(profiles.map((profile) => profile.id)).toEqual(['cmd'])
  })

  it('adds one profile per WSL distribution', async () => {
    const output = Buffer.from('Ubuntu\r\nDebian\r\n', 'utf16le')
    const profiles = await detectShellProfiles(windowsWith([WSL], output))

    expect(profiles).toEqual([
      { id: 'wsl-Ubuntu', name: 'Ubuntu', file: WSL, args: ['-d', 'Ubuntu', '--cd', '~'] },
      { id: 'wsl-Debian', name: 'Debian', file: WSL, args: ['-d', 'Debian', '--cd', '~'] }
    ])
  })

  it('does not ask WSL when it is not installed', async () => {
    const profiles = await detectShellProfiles(windowsWith([], Buffer.from('Ubuntu', 'utf8')))
    expect(profiles).toEqual([])
  })

  it("uses the user's shell outside Windows", async () => {
    const profiles = await detectShellProfiles({
      platform: 'linux',
      env: { SHELL: '/usr/bin/zsh' },
      exists: () => false,
      listWslDistributions: async () => null
    })
    expect(profiles).toEqual([{ id: 'default', name: 'zsh', file: '/usr/bin/zsh', args: ['-l'] }])
  })
})

describe('parseWslList', () => {
  it('reads the UTF-16 output of wsl.exe', () => {
    expect(parseWslList(Buffer.from('\uFEFFUbuntu-22.04\r\n\r\n', 'utf16le'))).toEqual([
      'Ubuntu-22.04'
    ])
  })

  it('reads the UTF-8 output used when WSL_UTF8 is set', () => {
    expect(parseWslList(Buffer.from('Ubuntu\nkali-linux\n', 'utf8'))).toEqual([
      'Ubuntu',
      'kali-linux'
    ])
  })

  it("hides Docker Desktop's internal distributions", () => {
    const output = Buffer.from('docker-desktop\r\ndocker-desktop-data\r\nUbuntu\r\n', 'utf16le')
    expect(parseWslList(output)).toEqual(['Ubuntu'])
  })

  it('returns nothing when WSL failed', () => {
    expect(parseWslList(null)).toEqual([])
  })
})

describe('defaultProfileId', () => {
  const profile = (id: string) => ({ id, name: id })

  it('prefers PowerShell 7, then Windows PowerShell', () => {
    expect(defaultProfileId([profile('cmd'), profile('powershell')])).toBe('powershell')
    expect(defaultProfileId([profile('cmd'), profile('windows-powershell')])).toBe(
      'windows-powershell'
    )
  })

  it('falls back to the first profile, or none', () => {
    expect(defaultProfileId([profile('git-bash'), profile('cmd')])).toBe('git-bash')
    expect(defaultProfileId([])).toBeNull()
  })
})
