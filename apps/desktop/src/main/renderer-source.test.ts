import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getRendererSource } from './renderer-source'

const mainDir = join('app', 'out', 'main')
const builtUi = join('app', 'out', 'renderer', 'index.html')

describe('getRendererSource', () => {
  it('uses the dev server in development', () => {
    expect(getRendererSource(false, 'http://localhost:5173/', mainDir)).toEqual({
      type: 'url',
      url: 'http://localhost:5173/'
    })
  })

  it('loads the built files when no dev server is running', () => {
    expect(getRendererSource(false, undefined, mainDir)).toEqual({ type: 'file', path: builtUi })
  })

  it('ignores the dev server URL in a packaged app', () => {
    expect(getRendererSource(true, 'https://example.com/', mainDir)).toEqual({
      type: 'file',
      path: builtUi
    })
  })
})
