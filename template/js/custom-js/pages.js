// Add your custom JavaScript for storefront pages here.

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
    var description = document.getElementById('product-description')
    var gallery = document.getElementById('product-gallery')
    if (description && gallery) {
      gallery.after(description)
    }
  })
}
