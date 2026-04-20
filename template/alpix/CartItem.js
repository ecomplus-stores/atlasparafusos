import CartItemMixin from '@ecomplus/storefront-components/src/js/CartItem.js'
import { getProgressiveDiscount } from './helpers/parseProgressiveDiscount'

export default {
  ...CartItemMixin,

  computed: {
    ...CartItemMixin.computed,

    progressiveDiscount () {
      const flags = this.item.flags
      if (!flags || !this.quantity) return 0
      const discount = getProgressiveDiscount(flags, this.quantity)
      if (!discount) return 0
      // Retorna a porcentagem de desconto para exibição
      if (discount.type === '%') {
        return discount.value
      }
      return 0
    },

    discountRule () {
      const flags = this.item.flags
      if (!flags) return null
      const discount = getProgressiveDiscount(flags, this.quantity)
      if (!discount) return null
      
      if (discount.type === '%') {
        return `${discount.value}% OFF`
      } else if (discount.type === '$') {
        return `R$ ${discount.value.toFixed(2)} OFF/un`
      }
      return null
    },

    totalDiscount () {
      const flags = this.item.flags
      if (!flags || !this.quantity) return 0
      const discount = getProgressiveDiscount(flags, this.quantity)
      if (!discount) return 0
      
      if (discount.type === '%') {
        const discountPerUnit = this.price * (discount.value / 100)
        return discountPerUnit * this.quantity
      } else if (discount.type === '$') {
        return discount.value * this.quantity
      }
      return 0
    },

    finalPrice () {
      return this.price
    },

    discountedUnitPrice () {
      if (!this.discountRule || !this.quantity) return this.price
      return this.price - this.totalDiscount / this.quantity
    },

    parsedFlags () {
      const flags = this.item.flags
      if (!flags || !Array.isArray(flags)) return []
      return flags
        .map(flag => {
          const parts = flag.split('|')
          if (parts.length !== 3) return null
          const quantity = parseInt(parts[0], 10)
          const type = parts[1]
          const value = parseFloat(parts[2])
          if (isNaN(quantity) || (type !== '%' && type !== '$') || isNaN(value)) return null
          let price = this.price
          if (type === '%') {
            price = this.price * (1 - value / 100)
          } else if (type === '$') {
            price = Math.max(0, this.price - value)
          }
          return { quantity, type, value, price: parseFloat(price.toFixed(2)) }
        })
        .filter(Boolean)
        .sort((a, b) => a.quantity - b.quantity)
    }
  }
}
