import { describe, expect, it } from 'vitest'
import { nextDevVersion } from './dev-channel.mjs'

describe('nextDevVersion', () => {
  it('starts the first dev build of the next minor version', () => {
    expect(nextDevVersion('0.1.0', undefined)).toBe('0.2.0-dev.1')
  })

  it('increments the build number', () => {
    expect(nextDevVersion('0.1.0', '0.2.0-dev.1')).toBe('0.2.0-dev.2')
    expect(nextDevVersion('0.1.0', '0.2.0-dev.9')).toBe('0.2.0-dev.10')
  })

  it('restarts at 1 when the app version has changed', () => {
    expect(nextDevVersion('0.2.0', '0.2.0-dev.7')).toBe('0.3.0-dev.1')
  })

  it('ignores a published version that is not a dev build', () => {
    expect(nextDevVersion('0.1.0', '0.1.0')).toBe('0.2.0-dev.1')
  })
})
