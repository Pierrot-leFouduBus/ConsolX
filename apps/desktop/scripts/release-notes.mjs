// Prints the notes of a version from CHANGELOG.md, for its GitHub release:
// node apps/desktop/scripts/release-notes.mjs 1.0.0
// Fails when the changelog has no section for the version, so that no release goes out
// without its notes.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { releaseNotes } from './changelog.mjs'

const version = process.argv[2]
const changelog = readFileSync(join(import.meta.dirname, '..', '..', '..', 'CHANGELOG.md'), 'utf8')
const notes = version ? releaseNotes(changelog, version) : undefined

if (notes === undefined) {
  console.error(`CHANGELOG.md has no section for version ${version}: add one before releasing.`)
  process.exit(1)
}
console.log(notes)
