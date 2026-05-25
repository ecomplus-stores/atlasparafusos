import {
  i19addToFavorites,
  i19buy,
  i19connectionErrorProductMsg,
  i19outOfStock,
  i19unavailable
} from '@ecomplus/i18n'

import {
  i18n,
  name as getName,
  inStock as checkInStock,
  onPromotion as checkOnPromotion,
  price as getPrice,
  formatMoney
} from '@ecomplus/utils'

import Vue from 'vue'
import { store } from '@ecomplus/client'
import ecomCart from '@ecomplus/shopping-cart'
import ALink from '@ecomplus/storefront-components/src/ALink.vue'
import APicture from '@ecomplus/storefront-components/src/APicture.vue'
import APrices from '@ecomplus/storefront-components/src/APrices.vue'
import ecomPassport from '@ecomplus/passport-client'
import { toggleFavorite, checkFavorite } from '@ecomplus/storefront-components/src/js/helpers/favorite-products'
import { getProgressiveDiscount } from './helpers/parseProgressiveDiscount'

const getExternalHtml = (varName, product) => {
  if (typeof window === 'object') {
    varName = `productCard${varName}Html`
    const html = typeof window[varName] === 'function'
      ? window[varName](product)
      : window[varName]
    if (typeof html === 'string') {
      return html
    }
  }
  return undefined
}

export default {
  name: 'ProductCard',

  components: {
    ALink,
    APicture,
    APrices
  },

  props: {
    product: Object,
    productId: String,
    isSmall: Boolean,
    headingTag: {
      type: String,
      default: 'h3'
    },
    buyText: String,
    transitionClass: {
      type: String,
      default: 'animated fadeIn'
    },
    canAddToCart: {
      type: Boolean,
      default: true
    },
    ecomPassport: {
      type: Object,
      default () {
        return ecomPassport
      }
    },
    accountUrl: {
      type: String,
      default: '/app/#/account/'
    },
    isLoaded: Boolean,
    installmentsOption: Object,
    discountOption: Object,
    tableCategorySlugs: {
      type: Array,
      default () {
        return window.productCardTableCategories || []
      }
    },
    tableLayoutExclude: {
      type: Boolean,
      default () {
        return window.productCardTableLayoutExclude || false
      }
    },
    stamps: {
      type: Array,
      default () {
        return window.productCardStamps || []
      }
    }
  },

  data () {
    return {
      body: {},
      isLoading: false,
      isWaitingBuy: false,
      isHovered: false,
      isFavorite: false,
      error: '',
      tableQty: 1,
      selectedVariationId: null
    }
  },

  computed: {
    i19addToFavorites: () => i18n(i19addToFavorites),
    i19outOfStock: () => i18n(i19outOfStock),
    i19unavailable: () => i18n(i19unavailable),
    i19uponRequest: () => 'Sob consulta',

    isWithoutPrice () {
      return !getPrice(this.body)
    },

    minVariationPrice () {
      if (!this.body.variations || !this.body.variations.length) return 0
      return this.body.variations.reduce((min, variation) => {
        const price = variation.price
        if (price > 0 && (min === 0 || price < min)) {
          return price
        }
        return min
      }, 0)
    },

    isFromPrice () {
      return this.isWithoutPrice && !!this.body.variations && !!this.body.variations.length &&
        !this.selectedVariationId && this.minVariationPrice > 0
    },

    cardProductForPrices () {
      if (this.isFromPrice) {
        return { ...this.body, price: this.minVariationPrice }
      }
      return this.body
    },

    ratingHtml () {
      return getExternalHtml('Rating', this.body)
    },

    buyHtml () {
      return getExternalHtml('Buy', this.body)
    },

    footerHtml () {
      return getExternalHtml('Footer', this.body)
    },

    name () {
      return getName(this.body)
    },

    strBuy () {
      return this.buyText ||
        (typeof window === 'object' && window.productCardBuyText) ||
        i18n(i19buy)
    },

    isInStock () {
      return checkInStock(this.body)
    },

    isActive () {
      return this.body.available && this.body.visible && this.isInStock
    },

    isLogged () {
      return ecomPassport.checkAuthorization()
    },

    discount () {
      const { body } = this
      return checkOnPromotion(body)
        ? Math.round(((body.base_price - getPrice(body)) * 100) / body.base_price)
        : 0
    },

    isTableLayout () {
      if (typeof window === 'object' && window.storefront && window.storefront.context) {
        const context = window.storefront.context
        if (context.resource === 'categories' && context.body && context.body.slug) {
          const categorySlug = context.body.slug
          const isInList = this.tableCategorySlugs.includes(categorySlug)
          return this.tableLayoutExclude ? !isInList : isInList
        }
      }
      return false
    },

    selectedVariation () {
      if (this.selectedVariationId && this.body.variations) {
        return this.body.variations.find(v => v._id === this.selectedVariationId) || null
      }
      return null
    },

    currentFlags () {
      // Prioriza flags da variação selecionada, senão usa flags do produto
      const variation = this.selectedVariation
      if (variation && variation.flags && Array.isArray(variation.flags) && variation.flags.length > 0) {
        return variation.flags
      }
      return this.body.flags || []
    },

    progressivePriceTiers () {
      const tiers = []
      const flags = this.currentFlags
      const selectedProduct = this.selectedVariation || this.body
      const basePrice = getPrice(selectedProduct)
      
      // Always include base price (qty=1)
      tiers.push({
        quantity: 1,
        price: basePrice,
        label: 'Peça Avulsa'
      })
      
      // Add tiers from flags
      if (Array.isArray(flags) && flags.length > 0) {
        flags.forEach(flag => {
          if (typeof flag === 'string') {
            const [qtyStr, type, valueStr] = flag.split('|')
            const quantity = parseInt(qtyStr, 10)
            const value = parseFloat(valueStr)
            
            if (!isNaN(quantity) && !isNaN(value) && quantity > 1) {
              let price = basePrice
              if (type === '%') {
                price = basePrice * (1 - value / 100)
              } else if (type === '$') {
                price = Math.max(0, basePrice - value)
              }
              
              tiers.push({
                quantity,
                price,
                label: `${quantity} pç`
              })
            }
          }
        })
      }
      
      return tiers
    },

    currentTablePrice () {
      const discount = getProgressiveDiscount(this.currentFlags, this.tableQty)
      if (discount) {
        const basePrice = getPrice(this.selectedVariation || this.body)
        if (discount.type === '%') {
          return basePrice * (1 - discount.value / 100)
        } else if (discount.type === '$') {
          return Math.max(0, basePrice - discount.value)
        }
      }
      return getPrice(this.selectedVariation || this.body)
    },

    currentTableTotal () {
      return this.currentTablePrice * this.tableQty
    },

    validStamps () {
      if (!Array.isArray(this.stamps)) return []
      return this.stamps.filter((stamp) => {
        if (stamp && stamp.img) {
          if (Array.isArray(stamp.skus) && stamp.skus.length) {
            return stamp.skus.includes(this.body.sku)
          }
        }
        return false
      })
    }
  },

  methods: {
    setBody (data) {
      this.body = Object.assign({}, data)
      delete this.body.body_html
      delete this.body.body_text
      delete this.body.inventory_records
      delete this.body.price_change_records
      this.isFavorite = checkFavorite(this.body._id, this.ecomPassport)
    },

    fetchItem () {
      const productId = this.productId || (this.product && this.product._id)
      if (productId) {
        this.isLoading = true
        store({ 
          url: `/products/${productId}.json`,
          axiosConfig: {
            params: {
              fields: 'variations,flags,price'
            }
          }
        })
          .then(({ data }) => {
            this.$emit('update:product', data)
            this.setBody(data)
            this.$emit('update:is-loaded', true)
          })
          .catch(err => {
            console.error('Error fetching product:', err)
            if (!this.body.name || !this.body.slug || !this.body.pictures) {
              this.error = i18n(i19connectionErrorProductMsg)
            }
          })
          .finally(() => {
            this.isLoading = false
          })
      }
    },

    toggleFavorite () {
      if (this.isLogged) {
        this.isFavorite = toggleFavorite(this.body._id, this.ecomPassport)
      }
    },

    buy (qty) {
      const product = { ...this.body }
      delete product.body_html
      delete product.body_text
      delete product.inventory_records
      delete product.price_change_records

      const variationId = this.selectedVariationId || undefined

      this.$emit('buy', { product, variationId })

      if (this.canAddToCart) {
        // Table layout: add directly without quickview
        if (this.isTableLayout) {
          const quantity = qty || this.tableQty
          const productToCart = { ...product }
          const discount = getProgressiveDiscount(this.currentFlags, quantity)
          if (discount) {
            const basePrice = (variationId && this.selectedVariation && this.selectedVariation.price) || product.price
            if (basePrice) {
              if (!productToCart.base_price) {
                productToCart.base_price = basePrice
              }
              let finalPrice = basePrice
              if (discount.type === '%') {
                finalPrice = basePrice * (1 - discount.value / 100)
              } else if (discount.type === '$') {
                finalPrice = Math.max(0, basePrice - discount.value)
              }
              productToCart.price = parseFloat(finalPrice.toFixed(2))
            }
          }
          ecomCart.addProduct(productToCart, variationId, quantity)
          return
        }

        // Normal layout: show quickview if product has variations/customizations
        this.isWaitingBuy = true
        store({
          url: `/products/${product._id}.json`,
          axiosConfig: {
            params: {
              fields: 'variations,flags,price,customizations,kit_composition'
            }
          }
        })
          .then(({ data }) => {
            const selectFields = ['variations', 'customizations', 'kit_composition']
            for (let i = 0; i < selectFields.length; i++) {
              const selectOptions = data[selectFields[i]]
              if (selectOptions && selectOptions.length) {
                return import('@ecomplus/storefront-components/src/ProductQuickview.vue')
                  .then(quickview => {
                    new Vue({
                      render: h => h(quickview.default, {
                        props: {
                          product: data
                        }
                      })
                    }).$mount(this.$refs.quickview)
                  })
              }
            }
            ecomCart.addProduct({ ...data }, variationId, 1)
          })
          .catch(err => {
            console.error(err)
            window.location = `/${this.body.slug}`
          })
          .finally(() => {
            this.isWaitingBuy = false
          })
      }
    },

    selectVariation (variationId) {
      this.selectedVariationId = variationId
    },

    formatMoney (price) {
      return formatMoney(price || 0)
    }
  },

  created () {
    if (this.product) {
      this.setBody(this.product)
      if (this.product.available === undefined) {
        this.body.available = true
      }
      if (this.product.visible === undefined) {
        this.body.visible = true
      }
    }
    
    // Só fazer fetch se não temos dados completos ou se precisamos buscar flags
    if (!this.isLoaded && this.productId) {
      this.fetchItem()
    } else if (this.product && !this.product.flags) {
      this.fetchItem()
    }
  }
}