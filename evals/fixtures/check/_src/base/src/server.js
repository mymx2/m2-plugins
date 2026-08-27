// webhook-svc: receives webhooks, verifies signatures, forwards to the queue.
'use strict'
const http = require('node:http')
const crypto = require('node:crypto')

const SECRET = process.env.WEBHOOK_SECRET || 'dev-secret'

function verifySignature(rawBody, signature) {
  const expected = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature || ''))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function parseBody(chunk) {
  return JSON.parse(chunk.toString('utf8'))
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200).end('ok')
    return
  }
  if (req.method === 'POST' && req.url === '/hooks/github') {
    let raw = ''
    req.on('data', c => (raw += c))
    req.on('end', () => {
      if (!verifySignature(raw, req.headers['x-hub-signature-256'])) {
        res.writeHead(401).end('bad signature')
        return
      }
      const event = parseBody(raw)
      console.log('[hook] github', event.action || 'unknown')
      res.writeHead(202).end('queued')
    })
    return
  }
  res.writeHead(404).end('not found')
})

module.exports = { server, verifySignature, parseBody }
if (require.main === module) {
  server.listen(process.env.PORT || 8787)
}
