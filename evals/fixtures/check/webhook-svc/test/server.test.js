'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { verifySignature, parseBody } = require('../src/server')

test('verifies a correct HMAC signature', () => {
  const body = JSON.stringify({ action: 'opened' })
  const sig = 'sha256=' + crypto.createHmac('sha256', 'dev-secret').update(body).digest('hex')
  assert.equal(verifySignature(body, sig), true)
})

test('rejects a wrong signature', () => {
  assert.equal(verifySignature('{}', 'sha256=deadbeef'), false)
})

test('parses JSON bodies', () => {
  assert.deepEqual(parseBody(Buffer.from('{"a":1}')), { a: 1 })
})
