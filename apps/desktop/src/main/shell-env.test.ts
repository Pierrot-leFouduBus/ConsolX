import { describe, expect, it } from 'vitest'
import { shellEnvironment } from './shell-env'

describe('shellEnvironment', () => {
  it('keeps the app environment', () => {
    const env = shellEnvironment({ PATH: 'C:\\Windows', USERPROFILE: 'C:\\Users\\me' }, '0.2.0')
    expect(env['PATH']).toBe('C:\\Windows')
    expect(env['USERPROFILE']).toBe('C:\\Users\\me')
  })

  it("removes Electron's own variables, whatever their case", () => {
    const env = shellEnvironment(
      { ELECTRON_RUN_AS_NODE: '1', Electron_Renderer_Url: 'http://localhost:5173', HOME: '/home' },
      '0.2.0'
    )
    expect(Object.keys(env)).not.toContain('ELECTRON_RUN_AS_NODE')
    expect(Object.keys(env)).not.toContain('Electron_Renderer_Url')
    expect(env['HOME']).toBe('/home')
  })

  it('tells command-line tools which terminal they run in', () => {
    const env = shellEnvironment({ TERM_PROGRAM: 'vscode' }, '0.2.0')
    expect(env).toMatchObject({
      TERM_PROGRAM: 'ConsolX',
      TERM_PROGRAM_VERSION: '0.2.0',
      COLORTERM: 'truecolor'
    })
  })
})
