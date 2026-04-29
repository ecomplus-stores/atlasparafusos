// Add your custom JavaScript for storefront pages here.
const EcomPassport = require('@ecomplus/passport-client');
const client = EcomPassport.ecomPassport.getCustomer();   

if(client.display_name){
  $('[data-username]').text(client.display_name || `Visitante` )
  $(`[data-isnotlogged]`).hide()
}else{
  $(`[data-islogged]`).hide()
}
window.addEventListener('load', function () {
  const backshadow = document.getElementById('menu-backshadow')
  if (!backshadow) return
  const submenus = document.querySelectorAll('.header__submenu')
  if (!submenus.length) return
  const updateBackshadow = function () {
    const anyOpen = document.querySelector('.header__submenu[style*="grid"]')
    backshadow.classList.toggle('show', !!anyOpen)
  }
  submenus.forEach(function (el) {
    new MutationObserver(updateBackshadow).observe(el, { attributes: true, attributeFilter: ['style'] })
  })
})

if (document.getElementById('page-products')) {
  window.addEventListener('load', function () {
    if(window.innerWidth > 990){
      var description = document.getElementById('product-description')
      var gallery = document.getElementById('product-gallery')
      if (description && gallery) {
        gallery.after(description)
      }
    }
  })
}

// ── Smart Shelves ──────────────────────────────────────────────
;(function () {
  var VIEWED_KEY = '_ss_viewed'
  var SEARCHES_KEY = '_ss_searches'
  var storeId = (window._settings && window._settings.store_id) ? window._settings.store_id : 0

  // ── Track product page views ──────────────────────────────────
  var bodyEl = document.body
  var pageResource = bodyEl.getAttribute('data-resource')
  var pageResourceId = bodyEl.getAttribute('data-resource-id')
  if (pageResource === 'products' && pageResourceId) {
    try {
      var viewed = JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]')
      var vIdx = viewed.indexOf(pageResourceId)
      if (vIdx > -1) viewed.splice(vIdx, 1)
      viewed.unshift(pageResourceId)
      localStorage.setItem(VIEWED_KEY, JSON.stringify(viewed.slice(0, 30)))
    } catch (_e) {}
  }

  // ── Track search queries ──────────────────────────────────────
  var urlQ = new URLSearchParams(window.location.search).get('q')
  if (urlQ && urlQ.trim().length > 1) {
    try {
      var searches = JSON.parse(localStorage.getItem(SEARCHES_KEY) || '[]')
      var sIdx = searches.indexOf(urlQ)
      if (sIdx > -1) searches.splice(sIdx, 1)
      searches.unshift(urlQ)
      localStorage.setItem(SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)))
    } catch (_e) {}
  }

  // ── Only proceed on pages that have the smart shelves section ──
  var shelves = document.querySelector('[data-smart-shelves]')
  if (!shelves) return

  // Arrow navigation
  var arrowBtn = document.querySelector('[data-smart-shelves-next]')
  if (arrowBtn) {
    arrowBtn.addEventListener('click', function () {
      shelves.scrollBy({ left: shelves.clientWidth * 0.7, behavior: 'smooth' })
    })
  }

  // ── Search API helper ─────────────────────────────────────────
  function searchItems (esQuery, size) {
    if (!storeId) return Promise.resolve([])
    var body = JSON.stringify({
      query: esQuery,
      size: size || 2,
      _source: ['_id', 'name', 'slug', 'price', 'base_price', 'pictures', 'free_shipping']
    })
    return fetch('https://apiv2.e-com.plus/v2/@' + storeId + '/search/v1/_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        return (data && data.hits && Array.isArray(data.hits.hits))
          ? data.hits.hits.map(function (h) { return h._source })
          : []
      })
      .catch(function () { return [] })
  }

  // ── Render helpers ────────────────────────────────────────────
  function fmtPrice (n) {
    return 'R$\u00a0' + Number(n).toFixed(2).replace('.', ',')
  }

  function productHTML (item) {
    var img = ''
    if (item.pictures && item.pictures[0] && item.pictures[0].normal) {
      img = '<img src="' + item.pictures[0].normal.url + '" alt="' + escAttr(item.name) + '" loading="lazy">'
    }
    var priceBlock = ''
    var price = Number(item.price)
    var base = Number(item.base_price)
    if (price > 0) {
      var discHTML = ''
      var compareHTML = ''
      if (base > price) {
        var pct = Math.round((1 - price / base) * 100)
        compareHTML = '<span class="ss-compare">' + fmtPrice(base) + '</span> '
        discHTML = '<span class="ss-discount">' + pct + '% OFF</span>'
      }
      priceBlock = '<p class="ss-price">' + compareHTML + fmtPrice(price) + discHTML + '</p>'
    }
    var shipHTML = item.free_shipping ? '<p class="ss-free-ship">Frete gr\u00e1tis</p>' : ''
    return '<a href="/' + item.slug + '">'
      + img
      + '<span class="ss-name">' + (item.name || '') + '</span>'
      + priceBlock
      + shipHTML
      + '</a>'
  }

  function escAttr (str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  }

  // ── Populate each block ───────────────────────────────────────
  var blocks = Array.from(shelves.querySelectorAll('[data-block-type]'))

  blocks.forEach(function (block) {
    var type = block.getAttribute('data-block-type')
    var slot = block.querySelector('[data-block-products]')

    function show () { block.style.display = '' }

    // Payment methods is always visible (rendered server-side)
    if (type === 'payment-methods') return

    // ── Recently viewed ─────────────────────────────────────────
    if (type === 'recently-viewed') {
      try {
        var viewedIds = JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]')
        if (!viewedIds.length || !slot) return
        searchItems({ ids: { values: [viewedIds[0]] } }, 1)
          .then(function (items) {
            if (items.length) {
              slot.innerHTML = productHTML(items[0])
              show()
            }
          })
      } catch (_e) {}
    }

    // ── Cart ────────────────────────────────────────────────────
    else if (type === 'cart') {
      try {
        var ecomCart = require('@ecomplus/shopping-cart')
        var cartItems = (ecomCart.data && Array.isArray(ecomCart.data.items))
          ? ecomCart.data.items.filter(function (i) { return i.quantity > 0 })
          : []
        if (!cartItems.length || !slot) return
        var pid = cartItems[0].product_id
        searchItems({ ids: { values: [pid] } }, 1)
          .then(function (items) {
            if (items.length) {
              slot.innerHTML = productHTML(items[0])
              show()
            }
          })
      } catch (_e) {}
    }

    // ── Last search ─────────────────────────────────────────────
    else if (type === 'last-search') {
      try {
        var searchList = JSON.parse(localStorage.getItem(SEARCHES_KEY) || '[]')
        if (!searchList.length || !slot) return
        var q = searchList[0]
        searchItems({
          multi_match: { query: q, fields: ['name^2', 'keywords'], type: 'best_fields' }
        }, 1)
          .then(function (items) {
            if (items.length) {
              slot.innerHTML = productHTML(items[0])
              show()
            }
          })
      } catch (_e) {}
    }

    // ── Wishlist ────────────────────────────────────────────────
    else if (type === 'wishlist') {
      try {
        var passport = require('@ecomplus/passport-client')
        var customer = passport.ecomPassport.getCustomer()
        var wishlist = customer && Array.isArray(customer.wishlist) ? customer.wishlist : []
        if (!wishlist.length || !slot) return
        var wid = wishlist[wishlist.length - 1]
        searchItems({ ids: { values: [wid] } }, 1)
          .then(function (items) {
            if (items.length) {
              slot.innerHTML = productHTML(items[0])
              show()
            }
          })
      } catch (_e) {}
    }

    // ── Last order (2-product grid) ─────────────────────────────
    else if (type === 'last-order') {
      try {
        var pp = require('@ecomplus/passport-client')
        var cust = pp.ecomPassport.getCustomer()
        if (!cust || !cust._id || !slot) return
        pp.ecomPassport.requestApi('/orders.json?limit=1&sort=-created_at&fields=items')
          .then(function (res) {
            var orders = res && res.data && Array.isArray(res.data.result) ? res.data.result : []
            if (!orders.length) return
            var orderItems = orders[0].items || []
            var ids = orderItems.slice(0, 2).map(function (i) { return i.product_id }).filter(Boolean)
            if (!ids.length) return
            searchItems({ ids: { values: ids } }, 2)
              .then(function (items) {
                if (items.length) {
                  slot.innerHTML = items.map(function (item) {
                    var img = (item.pictures && item.pictures[0] && item.pictures[0].normal)
                      ? item.pictures[0].normal.url : ''
                    return '<a href="/' + item.slug + '">'
                      + (img ? '<img src="' + img + '" alt="' + escAttr(item.name) + '" loading="lazy">' : '')
                      + '</a>'
                  }).join('')
                  show()
                }
              })
          })
          .catch(function () {})
      } catch (_e) {}
    }
  })
})()
