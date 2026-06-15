export const money = (value, locale = 'en-US') => {
  const amount = Number(value || 0)
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(amount) ? 0 : amount)

  return `৳${formatted}`
}

export const date = (value, locale = 'bn-BD') => (value ? new Date(value).toLocaleDateString(locale) : '-')
