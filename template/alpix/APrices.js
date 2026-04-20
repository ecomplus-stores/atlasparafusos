import {
  i19asOf,
  i19from,
  i19interestFree,
  i19of,
  i19to,
  i19upTo,
  i19youEarn
} from '@ecomplus/i18n'

import {
  i18n,
  price as getPrice,
  onPromotion as checkOnPromotion,
  formatMoney
} from '@ecomplus/utils'

import waitStorefrontInfo from '@ecomplus/storefront-components/src/js/helpers/wait-storefront-info'
import { getProgressiveDiscount } from './helpers/parseProgressiveDiscount'

const getPriceWithDiscount = (price, discount) => {
  const { type, value } = discount
  let priceWithDiscount
  if (value) {
    if (type === 'percentage') {
      priceWithDiscount = price * (100 - value) / 100
    } else {
      priceWithDiscount = price - value
    }
    return priceWithDiscount > 0 ? priceWithDiscount : 0
  }
}

export default {
  name: 'APrices',

  props: {
    product: {
      type: Object,
      required: true
    },
    isLiteral: Boolean,
    isBig: Boolean,
    isAmountTotal: Boolean,
    installmentsOption: Object,
    discountOption: Object,
    discountText: {
      type: [String, Boolean],
      default: ''
    },
    canShowPriceOptions: {
      type: Boolean,
      default: true
    },
    quantity: Number
  },

  data () {
    return {
      installmentsNumber: 0,
      monthlyInterest: 0,
      discount: {
        type: null,
        value: 0
      },
      extraDiscount: {
        type: null,
        value: 0,
        min_amount: 0
      },
      discountLabel: this.discountText,
      pointsProgramName: null,
      pointsMinPrice: 0,
      earnPointsFactor: 0
    }
  },

  computed: {
    i19asOf: () => i18n(i19asOf),
    i19from: () => i18n(i19from),
    i19interestFree: () => i18n(i19interestFree),
    i19of: () => i18n(i19of),
    i19to: () => i18n(i19to),
    i19upTo: () => i18n(i19upTo),
    i19youEarn: () => i18n(i19youEarn),
    
    price () {
      const price = getPrice(this.product)
      if (
        this.extraDiscount.value &&
        (!this.extraDiscount.min_amount || price > this.extraDiscount.min_amount)
      ) {
        return getPriceWithDiscount(price, this.extraDiscount)
      }
      return price
    },

    comparePrice () {
      if (checkOnPromotion(this.product)) {
        return this.product.base_price
      } else if (this.extraDiscount.value) {
        return getPrice(this.product)
      }
    },

    hasVariedPrices () {
      const { variations } = this.product
      if (variations) {
        const productPrice = getPrice(this.product)
        for (let i = 0; i < variations.length; i++) {
          const price = getPrice({
            ...this.product,
            ...variations[i]
          })
          if (price > productPrice) {
            return true
          }
        }
      }
      return false
    },

    priceWithDiscount () {
      return this.canShowPriceOptions && getPriceWithDiscount(this.finalPrice, this.discount)
    },

    installmentValue () {
      if (this.canShowPriceOptions && this.installmentsNumber >= 2) {
        if (!this.monthlyInterest) {
          return this.price / this.installmentsNumber
        } else {
          const interest = this.monthlyInterest / 100
          return this.price * interest /
            (1 - Math.pow(1 + interest, -this.installmentsNumber))
        }
      }
      return 0
    },
    progressiveDiscount () {
      const { flags } = this.product
      if (!this.quantity) return 0
      const discount = getProgressiveDiscount(flags, this.quantity)
      if (!discount) return 0
      if (discount.type === '%') {
        return discount.value
      } else if (discount.type === '$' && this.price > 0) {
        return ((discount.value / this.price) * 100).toFixed(0)
      }
      return 0
    },

    progressiveDiscountInfo () {
      const { flags } = this.product
      if (!flags || !this.quantity) return null
      const discount = getProgressiveDiscount(flags, this.quantity)
      if (!discount) return null
      
      if (discount.type === '%') {
        return {
          type: '%',
          percentage: discount.value,
          absolute: (this.price * discount.value / 100).toFixed(2)
        }
      } else if (discount.type === '$') {
        return {
          type: '$',
          absolute: discount.value.toFixed(2),
          percentage: ((discount.value / this.price) * 100).toFixed(1)
        }
      }
      return null
    },

    finalPrice () {
      const { flags } = this.product
      if (!flags || !this.quantity) return this.price
      const discount = getProgressiveDiscount(flags, this.quantity)
      if (!discount) return this.price
      
      if (discount.type === '%') {
        return this.price * (1 - discount.value / 100)
      } else if (discount.type === '$') {
        return Math.max(0, this.price - discount.value)
      }
      return this.price
    },

    paymentDiscountPercentage () {
      if (!this.discount || !this.discount.value) return 0
      if (this.discount.type === 'percentage') {
        return this.discount.value
      }
      if (this.finalPrice > 0) {
        return ((this.discount.value / this.finalPrice) * 100).toFixed(0)
      }
      return 0
    },

    totalDiscountValue () {
      const bestPrice = typeof this.priceWithDiscount === 'number' && this.priceWithDiscount < this.finalPrice
        ? this.priceWithDiscount
        : this.finalPrice
      return this.price > bestPrice ? this.price - bestPrice : 0
    },

    totalDiscountPercentage () {
      if (!this.price || !this.totalDiscountValue) return 0
      return ((this.totalDiscountValue / this.price) * 100).toFixed(0)
    }
  },

  methods: {
    formatMoney,

    updateInstallments (installments) {
      if (installments) {
        this.monthlyInterest = installments.monthly_interest
        const minInstallment = installments.min_installment || 5
        const installmentsNumber = parseInt(this.price / minInstallment, 10)
        this.installmentsNumber = Math.min(installmentsNumber, installments.max_number)
      }
    },

    updateDiscount (discount) {
      if (
        discount &&
        (!discount.min_amount || discount.min_amount <= this.price) &&
        (!this.isAmountTotal || discount.apply_at === 'total')
      ) {
        this.discount = discount
        if (!this.discountText && this.discountText !== false && discount.label) {
          this.discountLabel = `via ${discount.label}`
        }
      }
    }
  },

  watch: {
    finalPrice: {
      handler (price) {
        this.$emit('fix-price', price)
      },
      immediate: true
    }
  },

  created () {
    if (this.canShowPriceOptions) {
      if (this.discountOption) {
        this.updateDiscount(this.discountOption)
      } else {
        waitStorefrontInfo('apply_discount')
          .then(discountCampaign => {
            if (discountCampaign.available_extra_discount) {
              this.extraDiscount = discountCampaign.available_extra_discount
            }
          })
      }
      if (this.installmentsOption) {
        this.updateInstallments(this.installmentsOption)
      } else {
        waitStorefrontInfo('list_payments')
          .then(paymentInfo => {
            this.updateInstallments(paymentInfo.installments_option)
            this.updateDiscount(paymentInfo.discount_option)
            const pointsPrograms = paymentInfo.loyalty_points_programs
            if (this.isLiteral && pointsPrograms) {
              this.$nextTick(() => {
                for (const programId in pointsPrograms) {
                  const pointsProgram = pointsPrograms[programId]
                  if (pointsProgram && pointsProgram.earn_percentage > 0) {
                    this.pointsMinPrice = pointsProgram.min_subtotal_to_earn
                    this.pointsProgramName = pointsProgram.name
                    this.earnPointsFactor = pointsProgram.earn_percentage / 100
                    break
                  }
                }
              })
            }
          })
      }
    }
  }
}