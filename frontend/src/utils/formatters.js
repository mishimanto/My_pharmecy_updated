export const money = (value, locale = 'en-US') => {
  const amount = Number(value || 0)
  const rounded = Math.round(Number.isNaN(amount) ? 0 : amount)
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded)

  return `\u09F3${formatted}`
}

export const date = (value, locale = 'bn-BD') => (value ? new Date(value).toLocaleDateString(locale) : '-')
