import { i19discount } from '@ecomplus/i18n'
import { i18n } from '@ecomplus/utils'
import CartQuickviewMixin from '@ecomplus/storefront-components/src/js/CartQuickview.js'
import { getProgressiveDiscount } from './helpers/parseProgressiveDiscount'

export default {
  ...CartQuickviewMixin,

  computed: {
    ...CartQuickviewMixin.computed,

    i19discount: () => i18n(i19discount),

    totalProgressiveDiscount () {
      const items = this.cart.items
      if (!items || !items.length) return 0
      return items.reduce((acc, item) => {
        const flags = item.flags
        const quantity = item.quantity
        if (!flags || !quantity) return acc
        const price = item.final_price || item.price
        const discount = getProgressiveDiscount(flags, quantity)
        if (!discount) return acc
        if (discount.type === '%') {
          return acc + price * (discount.value / 100) * quantity
        } else if (discount.type === '$') {
          return acc + discount.value * quantity
        }
        return acc
      }, 0)
    },

    totalAfterDiscount () {
      return this.total - this.totalProgressiveDiscount
    }
  }
}
