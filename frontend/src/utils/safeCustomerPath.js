export function safeCustomerPath(value, fallback = '/') {
  const path = String(value || '').trim()

  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return fallback
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    return fallback
  }

  return path
}
