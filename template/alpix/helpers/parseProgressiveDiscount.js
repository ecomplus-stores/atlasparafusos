/**
 * Calcula o desconto progressivo baseado nos flags
 * Formato dos flags: ["1|$|.5", "2|%|20", "3|$|.9"]
 * Retorna o desconto para a quantidade especificada
 * @param {Array} flags - Array de strings com formato "quantidade|tipo|valor"
 * @param {Number} quantity - Quantidade de itens
 * @returns {Object|null} { type: '$' ou '%', value: number } ou null se sem desconto
 */
export const getProgressiveDiscount = (flags, quantity) => {
  if (!flags || !Array.isArray(flags) || !quantity) return null

  // Filtra as faixas aplicáveis para a quantidade atual
  const aplicavel = flags
    .map(flag => {
      const [qtd, type, value] = flag.split('|')
      return {
        quantity: parseInt(qtd, 10),
        type,
        value: parseFloat(value)
      }
    })
    .filter(flag => flag.quantity <= quantity)
    .sort((a, b) => b.quantity - a.quantity) // maior faixa primeiro

  return aplicavel.length ? aplicavel[0] : null
}

/**
 * Calcula o preço final com desconto progressivo aplicado
 * @param {Number} price - Preço base
 * @param {Array} flags - Array de flags de desconto progressivo
 * @param {Number} quantity - Quantidade de itens
 * @returns {Number} Preço com desconto aplicado
 */
export const getDiscountedPrice = (price, flags, quantity) => {
  const discount = getProgressiveDiscount(flags, quantity)
  if (!discount) return price

  if (discount.type === '%') {
    return price * (1 - discount.value / 100)
  } else if (discount.type === '$') {
    return Math.max(0, price - discount.value)
  }
  return price
}

/**
 * Retorna a porcentagem de desconto para exibição
 * @param {Array} flags - Array de flags de desconto progressivo
 * @param {Number} quantity - Quantidade de itens
 * @returns {Number} Porcentagem de desconto ou 0
 */
export const getDiscountPercentage = (flags, quantity) => {
  const discount = getProgressiveDiscount(flags, quantity)
  if (!discount) return 0

  if (discount.type === '%') {
    return discount.value
  }
  // Se é desconto em valor, não podemos calcular % sem saber o preço
  return 0
}
