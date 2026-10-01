// Reads CHANGELOG.md: the notes of one version, for its GitHub release.

// The text of the section of a version ("## [1.0.0] - 2026-10-01"), without its title,
// up to the next version. Undefined when the changelog has no section for it.
export function releaseNotes(changelog, version) {
  const lines = changelog.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`))
  if (start === -1) return undefined
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '))
  // The link definitions at the end of the file belong to no version.
  const section = lines
    .slice(start + 1, end === -1 ? undefined : end)
    .filter((line) => !/^\[[^\]]+\]: /.test(line))
  const notes = unwrap(section).join('\n').trim()
  return notes === '' ? undefined : notes
}

// The changelog is wrapped at 100 characters, but GitHub shows each line break of a
// release as a new line: join the lines of each paragraph and list item.
function unwrap(lines) {
  const joined = []
  let inCode = false
  for (const line of lines) {
    if (line.startsWith('```')) inCode = !inCode
    const previous = joined.at(-1)
    if (!inCode && previous && line.trim() !== '' && continuesBlock(previous, line)) {
      joined[joined.length - 1] = `${previous} ${line.trim()}`
    } else {
      joined.push(line)
    }
  }
  return joined
}

// Lines that start a block of their own: titles, list items, tables, code, quotes.
const BLOCK_START = /^(#|[-*] |\d+\. |\||```|>)/

// Whether a line goes on with the text of the line before it.
function continuesBlock(previous, line) {
  // A title, a table row or a code fence never goes on to the next line.
  if (/^(#|\||```)/.test(previous)) return false
  return previous.trim() !== '' && !BLOCK_START.test(line.trim())
}
