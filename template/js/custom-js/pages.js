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

    // ── Wishlist ──────────────────────────────────────────────────
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

// ── Reviews API ──────────────────────────────────────────────────────────────
;(function () {
  var REVIEWS_BASE = 'https://us-central1-apx-eplus-progressive-discount.cloudfunctions.net/app'
  var storeId = (window._settings && window._settings.store_id)

  // ── Star HTML helper ─────────────────────────────────────────
  function starsHtml (average, size) {
    var rounded = Math.round(average || 0)
    var html = '<span class="pt-stars pt-stars--' + (size || 'sm') + '" aria-label="' + (average || 0) + ' de 5 estrelas">'
    for (var i = 1; i <= 5; i++) {
      html += '<span class="pt-star' + (i <= rounded ? ' pt-star--full' : '') + '">★</span>'
    }
    html += '</span>'
    return html
  }

  // ── Date formatter ───────────────────────────────────────────
  function formatDate (iso) {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString('pt-BR') } catch (_e) { return '' }
  }

  // ── Avatar initials ──────────────────────────────────────────
  function avatarHtml (name) {
    var initials = name
      ? name.split(' ').slice(0, 2).map(function (p) { return p[0] || '' }).join('').toUpperCase()
      : '?'
    return '<div class="pt-avatar" aria-hidden="true">' + initials + '</div>'
  }

  // ── Single review card ───────────────────────────────────────
  function reviewCardHtml (review) {
    var photosHtml = ''
    if (review.photos && review.photos.length) {
      photosHtml = '<div class="pt-review-photos">'
      review.photos.forEach(function (url) {
        var isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(url)
        if (isVideo) {
          photosHtml += '<button class="pt-media-trigger pt-media-trigger--video" type="button" data-src="' + url + '" aria-label="Ver v\u00eddeo">'
            + '<svg class="pt-video-play" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#fff" viewBox="0 0 256 256" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48.24-94.78-64-40A8,8,0,0,0,100,88v80a8,8,0,0,0,12.24,6.78l64-40a8,8,0,0,0,0-13.56ZM116,153.57V102.43L156.91,128Z"></path></svg>'
            + '</button>'
        } else {
          photosHtml += '<button class="pt-media-trigger" type="button" data-src="' + url + '" aria-label="Ver foto">'
            + '<img class="pt-review-media" src="' + url + '" alt="Foto do cliente" loading="lazy">'
            + '</button>'
        }
      })
      photosHtml += '</div>'
    }
    return '<div class="pt-review">'
      + '<div class="pt-review-header">'
      + avatarHtml(review.customerName || '?')
      + '<div class="pt-review-meta">'
      + '<span class="pt-review-name">' + (review.customerName || 'Anônimo') + '</span>'
      + '<div class="pt-review-verified">Compra Verificada</div>'
      + '<div class="pt-review-date">' + formatDate(review.createdAt) + '</div>'
      + '</div>'
      + '</div>'
      + starsHtml(review.rating, 'md')
      + (review.text ? '<p class="pt-review-text">' + review.text + '</p>' : '')
      + (review.recommended != null
        ? (review.recommended
          ? '<span class="pt-recommended">✓ Sim, recomendo este produto</span>'
          : '<span class="pt-recommended pt-recommended--no">✗ Não recomendo este produto</span>')
        : '')
      + photosHtml
      + '</div>'
  }

  // ── Summary panel ────────────────────────────────────────────
  function renderSummary (summary) {
    var avgEl = document.getElementById('pt-avg-number')
    var starsEl = document.getElementById('pt-avg-stars')
    var countEl = document.getElementById('pt-avg-count')
    var barsEl = document.getElementById('pt-bars')
    var recEl = document.getElementById('pt-recommended')

    if (avgEl) avgEl.textContent = summary.averageRating ? summary.averageRating.toFixed(1) : '—'
    if (starsEl) starsEl.innerHTML = starsHtml(summary.averageRating || 0, 'lg')
    if (countEl) countEl.textContent = '(' + summary.totalReviews + ')'

    if (barsEl) {
      var counts = summary.ratingCounts || {}
      var maxCount = Math.max.apply(null, [5, 4, 3, 2, 1].map(function (n) { return counts[String(n)] || 0 }))
      var barsMarkup = ''
      for (var s = 5; s >= 1; s--) {
        var c = counts[String(s)] || 0
        var pct = maxCount > 0 ? Math.round((c / maxCount) * 100) : 0
        barsMarkup += '<div class="pt-bar-row">'
          + '<span class="pt-bar-label">' + s + ' ★</span>'
          + '<div class="pt-bar-track"><div class="pt-bar-fill" style="width:' + pct + '%"></div></div>'
          + '</div>'
      }
      barsEl.innerHTML = barsMarkup
    }

    if (recEl && summary.recommendedCounts) {
      var yes = summary.recommendedCounts.yes || 0
      var no = summary.recommendedCounts.no || 0
      var total = yes + no
      var pctRec = total > 0 ? Math.round((yes / total) * 100) : 0
      recEl.innerHTML = '<div class="pt-rec-ring">'
        + '<svg viewBox="0 0 36 36" class="pt-ring-svg">'
        + '<path class="pt-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>'
        + '<path class="pt-ring-fill" stroke-dasharray="' + pctRec + ', 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>'
        + '</svg>'
        + '<span class="pt-ring-text">' + pctRec + '%</span>'
        + '</div>'
        + '<p class="pt-rec-label">dos clientes recomendam<br>este produto</p>'
    }
  }

  // ── Gallery builder ──────────────────────────────────────────
  function buildGallery (reviews) {
    var galleryWrap = document.getElementById('pt-gallery-wrap')
    var galleryEl = document.getElementById('pt-gallery')
    if (!galleryWrap || !galleryEl) return
    var photos = []
    reviews.forEach(function (r) {
      if (r.photos && r.photos.length) {
        r.photos.forEach(function (url) { photos.push(url) })
      }
    })
    if (!photos.length) {
      galleryWrap.style.display = 'none'
      return
    }
    galleryEl.innerHTML = photos.map(function (url) {
      var isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(url)
      if (isVideo) {
        return '<div class="pt-gallery-item">'
          + '<button class="pt-media-trigger pt-media-trigger--video pt-media-trigger--gallery" type="button" data-src="' + url + '" aria-label="Ver v\u00eddeo">'
          + '<svg class="pt-video-play" xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#fff" viewBox="0 0 256 256" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48.24-94.78-64-40A8,8,0,0,0,100,88v80a8,8,0,0,0,12.24,6.78l64-40a8,8,0,0,0,0-13.56ZM116,153.57V102.43L156.91,128Z"></path></svg>'
          + '</button>'
          + '</div>'
      }
      return '<div class="pt-gallery-item">'
        + '<button class="pt-media-trigger" type="button" data-src="' + url + '" aria-label="Ver foto">'
        + '<img class="pt-gallery-thumb" src="' + url + '" alt="Foto do cliente" loading="lazy">'
        + '</button>'
        + '</div>'
    }).join('')
    galleryWrap.style.display = ''
  }

  // ── Testimonials section init ────────────────────────────────
  function initTestimonials (productId) {
    var section = document.getElementById('product-testimonials')
    if (!section) return

    var listEl = document.getElementById('pt-list')
    var loadMoreWrap = document.getElementById('pt-loadmore-wrap')
    var loadMoreBtn = document.getElementById('pt-loadmore')
    var bodyEl = document.getElementById('pt-body')
    var loadingEl = document.getElementById('pt-loading')
    var emptyEl = document.getElementById('pt-empty')
    var sortEl = document.getElementById('pt-sort')
    var countBadgeWrap = document.getElementById('pt-count-badge')
    var countBadgeEl = document.getElementById('pt-count-text')

    var state = {
      page: 1,
      limit: 10,
      sort: 'recent',
      allReviews: [],
      totalFromAPI: 0
    }

    function getSorted () {
      var reviews = state.allReviews.slice()
      if (state.sort === 'best') reviews.sort(function (a, b) { return b.rating - a.rating })
      else if (state.sort === 'worst') reviews.sort(function (a, b) { return a.rating - b.rating })
      return reviews
    }

    function renderList () {
      if (!listEl) return
      var sorted = getSorted()
        listEl.innerHTML = sorted.map(reviewCardHtml).join('')
    }

    function fetchPage (page) {
      return fetch(
        REVIEWS_BASE + '/reviews/list'
        + '?store_id=' + storeId
        + '&product_id=' + productId
        + '&page=' + page
        + '&limit=' + state.limit
      ).then(function (r) { return r.json() })
    }

    // Initial load
    fetchPage(1)
      .then(function (data) {
        if (loadingEl) loadingEl.style.display = 'none'
        if (!data || !data.summary || !data.summary.totalReviews) {
          if (emptyEl) emptyEl.style.display = ''
          return
        }
        state.totalFromAPI = data.pagination.total
        state.allReviews = data.reviews || []

        if (countBadgeEl) countBadgeEl.textContent = data.summary.totalReviews + ' avaliações de clientes'
        if (countBadgeWrap) countBadgeWrap.style.display = ''

        renderSummary(data.summary)
        renderList()
        buildGallery(state.allReviews)

        if (bodyEl) bodyEl.style.display = ''
        if (state.allReviews.length < state.totalFromAPI && loadMoreWrap) {
          loadMoreWrap.style.display = ''
        }
      })
      .catch(function () {
        if (loadingEl) loadingEl.style.display = 'none'
        if (emptyEl) emptyEl.style.display = ''
      })

    // Sort change
    if (sortEl) {
      sortEl.addEventListener('change', function () {
        state.sort = sortEl.value
        renderList()
      })
    }

    // Load more
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        loadMoreBtn.disabled = true
        loadMoreBtn.textContent = 'Carregando…'
        state.page += 1
        fetchPage(state.page)
          .then(function (data) {
            if (data && data.reviews) {
              state.allReviews = state.allReviews.concat(data.reviews)
              renderList()
              buildGallery(state.allReviews)
            }
            if (state.allReviews.length >= state.totalFromAPI) {
              if (loadMoreWrap) loadMoreWrap.style.display = 'none'
            } else {
              loadMoreBtn.disabled = false
              loadMoreBtn.textContent = 'Carregar mais avaliações'
            }
          })
          .catch(function () {
            loadMoreBtn.disabled = false
            loadMoreBtn.textContent = 'Carregar mais avaliações'
          })
      })
    }
  }

  // ── Product detail: compact rating widget ────────────────────
  function initProductRating (productId) {
    fetch(
      REVIEWS_BASE + '/reviews/list'
      + '?store_id=' + storeId
      + '&product_id=' + productId
      + '&limit=1'
    )
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (!data || !data.summary || !data.summary.totalReviews) return
        var s = data.summary
        var el = document.querySelector('.product__rating')
        if (el) {
          el.innerHTML = '<a href="#product-testimonials" class="product__rating-link">'
            + starsHtml(s.averageRating, 'sm')
            + '<span class="product__rating-count ml-1">(' + s.totalReviews + ')</span>'
            + '</a>'
        }
      })
      .catch(function () {})
  }

  // ── Listing pages: batch ratings ────────────────────────────
  function initListingRatings () {
    var cards = document.querySelectorAll('.product-card[data-product-id]')
    if (!cards.length) return
    var ids = []
    cards.forEach(function (card) {
      var id = card.getAttribute('data-product-id')
      if (id && ids.indexOf(id) === -1) ids.push(id)
    })
    if (!ids.length) return
    fetch(
      REVIEWS_BASE + '/reviews/ratings'
      + '?store_id=' + storeId
      + '&product_ids=' + ids.join(',')
    )
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (!data || !data.ratings) return
        cards.forEach(function (card) {
          var id = card.getAttribute('data-product-id')
          var stats = data.ratings[id]
          if (!stats) return
          var el = card.querySelector('.product-card__rating')
          if (!el) return
          el.innerHTML = '<div class="product-card__rating-inner">'
            + starsHtml(stats.average, 'xs')
            + '<span class="product-card__rating-count">(' + stats.total + ')</span>'
            + '</div>'
        })
      })
      .catch(function () {})
  }

  // ── Lightbox ─────────────────────────────────────────────────
  function initLightbox () {
    if (document.getElementById('pt-lightbox')) return
    var lb = document.createElement('div')
    lb.id = 'pt-lightbox'
    lb.setAttribute('role', 'dialog')
    lb.setAttribute('aria-modal', 'true')
    lb.innerHTML = '<div class="pt-lb-backdrop"></div>'
      + '<button class="pt-lb-close" type="button" aria-label="Fechar">&#10005;</button>'
      + '<img class="pt-lb-img" src="" alt="Foto do cliente" style="display:none">'
      + '<video class="pt-lb-video" controls playsinline style="display:none"></video>'
    document.body.appendChild(lb)
    var lbImg = lb.querySelector('.pt-lb-img')
    var lbVideo = lb.querySelector('.pt-lb-video')
    function openLb (src) {
      var isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(src)
      if (isVideo) {
        lbImg.style.display = 'none'
        lbImg.src = ''
        lbVideo.src = src
        lbVideo.style.display = ''
      } else {
        lbVideo.style.display = 'none'
        lbVideo.src = ''
        lbImg.src = src
        lbImg.style.display = ''
      }
      lb.classList.add('pt-lb--open')
      document.body.style.overflow = 'hidden'
    }
    function closeLb () {
      lb.classList.remove('pt-lb--open')
      document.body.style.overflow = ''
      lbImg.src = ''
      lbVideo.pause()
      lbVideo.src = ''
    }
    lb.querySelector('.pt-lb-backdrop').addEventListener('click', closeLb)
    lb.querySelector('.pt-lb-close').addEventListener('click', closeLb)
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb() })
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('.pt-media-trigger')
      if (!trigger) return
      var src = trigger.getAttribute('data-src')
      if (!src) return
      openLb(src)
    })
  }

  // ── Entry point ──────────────────────────────────────────────
  window.addEventListener('load', function () {
    initLightbox()
    var pageResource = document.body.getAttribute('data-resource')
    var pageResourceId = document.body.getAttribute('data-resource-id')
    if (pageResource === 'products' && pageResourceId) {
      initProductRating(pageResourceId)
      initTestimonials(pageResourceId)
    } else {
      // Listing/search pages — wait for Vue to render product cards
      setTimeout(initListingRatings, 800)
    }
  })
})()
