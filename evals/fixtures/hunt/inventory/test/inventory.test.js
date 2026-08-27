'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { removeAllExpired } = require('../src/inventory')

test('removes every expired item from the cart', () => {
  const cart = [
    { id: 1, expired: true },
    { id: 2, expired: true },
    { id: 3, expired: false },
    { id: 4, expired: true },
  ]
  const result = removeAllExpired(cart)
  assert.deepEqual(
    result.map(i => i.id),
    [3],
  )
})
