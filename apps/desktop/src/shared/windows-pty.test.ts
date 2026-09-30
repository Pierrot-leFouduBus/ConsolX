import { describe, expect, it } from 'vitest'
import { ConptyScrollFix, windowsPty } from './windows-pty'

describe('windowsPty', () => {
  it('describes the recent ConPTY shipped with node-pty', () => {
    expect(windowsPty('10.0.19045')).toEqual({ backend: 'conpty', buildNumber: 21376 })
    expect(windowsPty('10.0.22631')).toEqual({ backend: 'conpty', buildNumber: 22631 })
  })

  it('uses winpty before build 18309, as node-pty does', () => {
    expect(windowsPty('10.0.17763')).toEqual({ backend: 'winpty', buildNumber: 17763 })
    expect(windowsPty('10.0.18309')?.backend).toBe('conpty')
  })

  it('gives nothing for a version it cannot read', () => {
    expect(windowsPty('')).toBeUndefined()
    expect(windowsPty('10.0')).toBeUndefined()
    expect(windowsPty('10.0.beta')).toBeUndefined()
  })
})

describe('ConptyScrollFix', () => {
  const scroll = (count: number) => `\x1b7\x1b[9999;1H${'\n'.repeat(count)}\x1b8`

  it('turns "scroll up" into newlines on the last row', () => {
    const fix = new ConptyScrollFix()
    expect(fix.rewrite('a\x1b[1Sb')).toBe(`a${scroll(1)}b`)
    expect(fix.rewrite('\x1b[3S')).toBe(scroll(3))
    expect(fix.rewrite('\x1b[S')).toBe(scroll(1))
  })

  it('leaves other output alone', () => {
    const fix = new ConptyScrollFix()
    const output = 'PS C:\\> \x1b[97m1\x1b[m\x1b[K\r\n1\x1b[8;1H'
    expect(fix.rewrite(output)).toBe(output)
  })

  it('handles a sequence split between two outputs', () => {
    const fix = new ConptyScrollFix()
    expect(fix.rewrite('a\x1b[')).toBe('a')
    expect(fix.rewrite('2Sb')).toBe(`${scroll(2)}b`)
  })

  it('keeps "scroll up" while a program uses scroll margins', () => {
    const fix = new ConptyScrollFix()
    expect(fix.rewrite('\x1b[2;10r\x1b[1S')).toBe('\x1b[2;10r\x1b[1S')
    expect(fix.rewrite('\x1b[r\x1b[1S')).toBe(`\x1b[r${scroll(1)}`)
  })
})
