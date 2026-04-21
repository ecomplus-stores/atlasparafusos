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
