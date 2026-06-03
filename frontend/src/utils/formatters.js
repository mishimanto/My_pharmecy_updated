export const money = (value) => `৳${Number(value || 0).toFixed(2)}`
export const date = (value) => (value ? new Date(value).toLocaleDateString('bn-BD') : '-')
