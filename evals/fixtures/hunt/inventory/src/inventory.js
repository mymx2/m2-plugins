// Cart inventory helpers. Shared by checkout and the invoicing batch job.
'use strict'

// Remove every expired item from the cart, in place.
function removeAllExpired(items) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].expired) {
      items.splice(i, 1)
    }
  }
  return items
}

// Drop cancelled orders from a batch before invoicing.
function dropCancelled(orders) {
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].status === 'cancelled') {
      orders.splice(i, 1)
    }
  }
  return orders
}

module.exports = { removeAllExpired, dropCancelled }
