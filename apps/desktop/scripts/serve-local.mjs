// Local update server (npm run serve:local): serves the .dev-updates folder over HTTP,
// so that ConsolX Dev installs, on this PC or on the network, can update themselves.
// Plain HTTP is enough: electron-updater checks each installer against its sha512.
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import { PORT, SERVE_ROOT, UPDATE_URL } from './dev-channel.mjs'

const CONTENT_TYPES = { '.yml': 'text/yaml; charset=utf-8', '.exe': 'application/octet-stream' }

const server = createServer((request, response) => {
  const status = serve(request, response)
  console.log(`${new Date().toLocaleTimeString()} ${request.method} ${request.url} ${status}`)
})

server.listen(PORT, () => {
  console.log(`Serving ${SERVE_ROOT}`)
  console.log(`ConsolX Dev updates: ${UPDATE_URL}`)
})

// Answers one request and returns its HTTP status.
function serve(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return end(response, 405)

  // Only files inside the served folder can be read.
  let path
  try {
    const { pathname } = new URL(request.url, 'http://localhost')
    path = normalize(join(SERVE_ROOT, decodeURIComponent(pathname)))
  } catch {
    return end(response, 400)
  }
  if (!path.startsWith(SERVE_ROOT + sep)) return end(response, 404)

  let size
  try {
    const stats = statSync(path)
    if (!stats.isFile()) return end(response, 404)
    size = stats.size
  } catch {
    return end(response, 404)
  }

  const headers = {
    'Content-Type': CONTENT_TYPES[extname(path)] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache'
  }

  // electron-updater may download only the changed parts of an installer (one range per request).
  const range = parseRange(request.headers.range, size)
  if (range === null) {
    response.writeHead(416, { 'Content-Range': `bytes */${size}` })
    response.end()
    return 416
  }
  const { start, end: last } = range ?? { start: 0, end: size - 1 }
  const status = range ? 206 : 200
  if (range) headers['Content-Range'] = `bytes ${start}-${last}/${size}`
  headers['Content-Length'] = size === 0 ? 0 : last - start + 1

  response.writeHead(status, headers)
  if (request.method === 'HEAD' || size === 0) response.end()
  else createReadStream(path, { start, end: last }).pipe(response)
  return status
}

// Reads a single "bytes=start-end" range. Returns undefined to send the whole file
// (no range, or several ranges), or null when the range is outside the file.
function parseRange(header, size) {
  if (!header) return undefined
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return undefined
  const [, from, to] = match
  let start
  let last
  if (from === '') {
    // "bytes=-500": the last 500 bytes.
    start = Math.max(size - Number(to), 0)
    last = size - 1
  } else {
    start = Number(from)
    last = to === '' ? size - 1 : Math.min(Number(to), size - 1)
  }
  if (start > last || start >= size) return null
  return { start, end: last }
}

function end(response, status) {
  response.writeHead(status)
  response.end()
  return status
}
