const ADMIN_SESSION_CACHE_KEYS = [
  'admin_resource_cache_v3',
  'admin_dashboard_payload_v3',
  'admin_orders_payload_v1',
  'admin_users_payload_v2',
  'admin_manufacturers_payload_v2',
  'admin_products_payload_v2',
  'admin_categories_payload_v1',
  'admin_suppliers_payload_v1',
  'admin_inventory_batches_payload_v1',
  'admin_inventory_transactions_payload_v1',
  'admin_support_tickets_payload_v1',
  'admin_staff_payload_v1',
  'admin_roles_payload_v1',
  'admin_riders_payload_v1',
  'admin_returns_payload_v1',
  'admin_refunds_payload_v1',
  'admin_payments_payload_v1',
  'admin_prescriptions_payload_v1',
  'admin_activity_logs_payload_v1',
  'admin_delivery_areas_payload_v1',
  'admin_deliveries_payload_v1',
]

export function clearAdminSessionCaches(keys = ADMIN_SESSION_CACHE_KEYS) {
  if (typeof window === 'undefined') return

  keys.forEach((key) => {
    window.sessionStorage.removeItem(key)
  })
}

export function getAdminSessionCacheKeys() {
  return [...ADMIN_SESSION_CACHE_KEYS]
}
