const path = require('path')

module.exports = () => ({
  resolve: {
    alias: {
      
      './html/SearchEngine.html': path.resolve(__dirname, 'template/alpix/SearchEngine.html'),   
      './js/SearchEngine.js': path.resolve(__dirname, 'template/alpix/SearchEngine.js'), 
     './html/APrices.html': path.resolve(__dirname, 'template/alpix/APrices.html'),
      './js/APrices.js': path.resolve(__dirname, 'template/alpix/APrices.js'),
      './html/TheProduct.html': path.resolve(__dirname, 'template/alpix/TheProduct.html'),
        './js/TheProduct.js': path.resolve(__dirname, 'template/alpix/TheProduct.js'),
        './html/CartItem.html': path.resolve(__dirname, 'template/alpix/CartItem.html'),
        './js/CartItem.js': path.resolve(__dirname, 'template/alpix/CartItem.js'),
        './html/QuantitySelector.html': path.resolve(__dirname, 'template/alpix/QuantitySelector.html'),
        './js/QuantitySelector.js': path.resolve(__dirname, 'template/alpix/QuantitySelector.js'),
        './html/CartQuickview.html': path.resolve(__dirname, 'template/alpix/CartQuickview.html'),
        './js/CartQuickview.js': path.resolve(__dirname, 'template/alpix/CartQuickview.js'),
         './html/ProductCard.html': path.resolve(__dirname, 'template/alpix/ProductCard.html'),
        './js/ProductCard.js': path.resolve(__dirname, 'template/alpix/ProductCard.js'),
         './html/InstantSearch.html': path.resolve(__dirname, 'template/alpix/InstantSearch.html'),
        './js/InstantSearch.js': path.resolve(__dirname, 'template/alpix/InstantSearch.js'),
        // './html/EcCheckout.html': path.resolve(__dirname, 'template/alpix/EcCheckout.html'),   
        // './js/EcCheckout.js': path.resolve(__dirname, 'template/alpix/EcCheckout.js'), 
        
    }
  }
})
