# API Route List

All API responses follow:

```json
{
  "success": true,
  "message": "Message",
  "data": {},
  "errors": null
}
```

Validation errors return `success: false`, `data: null`, and an `errors` object.

## Public

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/{id}`
- `GET /api/categories`
- `GET /api/categories/{id}/products`
- `GET /api/manufacturers`

## Customer Auth

- `POST /api/customer/register`
- `POST /api/customer/login`
- `POST /api/customer/logout`
- `GET /api/customer/profile`
- `PUT /api/customer/profile`
- `GET /api/customer/auth/{provider}/redirect`
- `GET /api/customer/auth/{provider}/callback`

## Customer

- Addresses: `/api/customer/addresses`, `/api/customer/addresses/{id}`, `/api/customer/addresses/{id}/default`
- Cart: `/api/customer/cart`, `/api/customer/cart/items`, `/api/customer/cart/items/{id}`, `/api/customer/cart/clear`
- Checkout: `POST /api/customer/checkout`
- Orders: `/api/customer/orders`, `/api/customer/orders/{id}`, `/api/customer/orders/{id}/cancel`
- Payment: `POST /api/customer/orders/{id}/payment/cod`
- Tracking: `GET /api/customer/orders/{id}/tracking`
- Prescriptions: `/api/customer/prescriptions`, `/api/customer/prescriptions/{id}`
- Support: `/api/customer/support-tickets`, `/api/customer/support-tickets/{id}`, `/api/customer/support-tickets/{id}/replies`
- Returns: `/api/customer/returns`, `/api/customer/returns/{id}`, `/api/customer/orders/{id}/return-request`
- Notifications: `/api/customer/notifications`, `/api/customer/notifications/{id}/read`

## Admin Auth

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/profile`
- `GET /api/admin/me`

## Admin Users, Staff, Roles

- Users: `/api/admin/users`, `/api/admin/users/{id}`, `/api/admin/users/{id}/status`
- User history: `/api/admin/users/{id}/orders`, `/prescriptions`, `/support-tickets`, `/returns`
- Staff: `/api/admin/staff`, `/api/admin/staff/{id}`, `/api/admin/staff/{id}/status`
- Roles: `/api/admin/roles`, `/api/admin/roles/{id}`, `/api/admin/roles/{id}/permissions`
- Permissions: `/api/admin/permissions`

## Admin Catalog and Inventory

- Categories: `/api/admin/categories`
- Manufacturers: `/api/admin/manufacturers`
- Products: `/api/admin/products`, `/api/admin/products/{id}/images`, `/api/admin/products/{id}/status`
- Product images: `/api/admin/product-images/{id}`
- Suppliers: `/api/admin/suppliers`
- Inventory batches: `/api/admin/inventory/batches`, `/api/admin/inventory/batches/{id}/status`
- Inventory reports: `/api/admin/inventory/transactions`, `/low-stock`, `/near-expiry`

## Admin Operations

- Prescriptions: `/api/admin/prescriptions`, `/api/admin/prescriptions/{id}/review`
- Orders: `/api/admin/orders`, `/api/admin/orders/{id}/status`
- Delivery creation: `POST /api/admin/orders/{id}/delivery`
- Payments: `/api/admin/payments`, `/api/admin/payments/{id}/status`
- Delivery areas: `/api/admin/delivery-areas`
- Riders: `/api/admin/riders`
- Deliveries: `/api/admin/deliveries`, `/api/admin/deliveries/{id}/assign-rider`, `/api/admin/deliveries/{id}/status`
- Support tickets: `/api/admin/support-tickets`, `/api/admin/support-tickets/{id}/assign`, `/status`, `/replies`
- Returns: `/api/admin/returns`, `/api/admin/returns/{id}/status`, `/api/admin/returns/{id}/refund`
- Refunds: `/api/admin/refunds`, `/api/admin/refunds/{id}/status`
- Notifications: `/api/admin/notifications`, `/api/admin/notifications/{id}/read`
- Activity logs: `/api/admin/admin_activity_logs`

## Dashboard and Reports

- Dashboard: `/api/admin/dashboard/summary`, `/recent-orders`, `/pending-prescriptions`, `/low-stock`, `/near-expiry`
- Reports: `/api/admin/reports/sales`, `/orders`, `/inventory`, `/payments`, `/prescriptions`, `/deliveries`, `/refunds`
