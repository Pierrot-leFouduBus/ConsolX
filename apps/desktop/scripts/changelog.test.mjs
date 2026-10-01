import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { releaseNotes } from './changelog.mjs'

const changelog = [
  '# Changelog',
  '',
  'Intro.',
  '',
  '## [1.1.0] - 2026-11-02',
  '',
  '### Added',
  '',
  '- Themes.',
  '',
  '## [1.0.0] - 2026-10-01',
  '',
  '- First stable version.',
  '',
  '[1.1.0]: https://example.com/compare/v1.0.0...v1.1.0',
  '[1.0.0]: https://example.com/compare/v0.2.0...v1.0.0',
  ''
].join('\r\n')

describe('releaseNotes', () => {
  it('gives the section of a version, up to the next one', () => {
    expect(releaseNotes(changelog, '1.1.0')).toBe('### Added\n\n- Themes.')
  })

  it('leaves out the link definitions at the end of the file', () => {
    expect(releaseNotes(changelog, '1.0.0')).toBe('- First stable version.')
  })

  it('joins the lines of each paragraph and list item, which GitHub would break', () => {
    const wrapped = [
      '## [1.2.0]',
      '',
      'A paragraph',
      'on two lines.',
      '',
      '### Added',
      '',
      '- An item',
      '  on two lines.',
      '- Another item.',
      '',
      '```',
      'code stays',
      'as it is',
      '```'
    ].join('\n')
    expect(releaseNotes(wrapped, '1.2.0')).toBe(
      [
        'A paragraph on two lines.',
        '',
        '### Added',
        '',
        '- An item on two lines.',
        '- Another item.',
        '',
        '```',
        'code stays',
        'as it is',
        '```'
      ].join('\n')
    )
  })

  it('gives nothing for a version without a section', () => {
    expect(releaseNotes(changelog, '2.0.0')).toBeUndefined()
    expect(releaseNotes(changelog, '1.0')).toBeUndefined()
  })

  it('finds the notes of the current version in CHANGELOG.md', () => {
    const root = join(import.meta.dirname, '..', '..', '..')
    const version = JSON.parse(
      readFileSync(join(root, 'apps/desktop/package.json'), 'utf8')
    ).version
    const file = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
    expect(releaseNotes(file, version)).toBeDefined()
  })
})
