# Database Module Explanation

## Authentication

- `users`: customer accounts.
- `staffs`: admin/staff accounts.
- `personal_access_tokens`: Sanctum tokens. Customer and staff tokens use separate abilities.
- `user_sessions`, `staff_sessions`: login history.

## Roles and Permissions

Spatie tables are used directly:

- `roles`
- `permissions`
- `model_has_roles`
- `model_has_permissions`
- `role_has_permissions`

Staff roles and permissions use `guard_name = staff`.

## Catalog

- `categories`: product categories, with optional parent category.
- `manufacturers`: medicine manufacturers.
- `products`: product identity and prescription requirement. Product stock and final selling price are not stored here.
- `product_images`: original image path and WebP path.

## Inventory

- `suppliers`: medicine suppliers.
- `inventory_batches`: stock source, expiry date, status, purchase price, selling price, stock quantity, reserved quantity.
- `inventory_transactions`: every stock movement.

Available stock:

```text
stock_quantity - reserved_quantity
```

Sellable batches must be active, non-expired, and have available stock.

## Cart and Checkout

- `carts`: one active cart per customer.
- `cart_items`: stores `product_id`, quantity, and current display unit price.

Batch allocation does not happen in cart. It happens during checkout.

## Orders

- `orders`: customer order summary, status, payment method/status, totals.
- `order_items`: stores `product_id`, quantity, unit price, and subtotal.
- `order_item_batches`: stores FEFO batch allocation for each order item.

One order item can be fulfilled by multiple inventory batches.

## Prescriptions

- `prescriptions`: customer uploaded prescription image or PDF. `order_id` is nullable because upload can happen before checkout.
- `prescription_reviews`: pharmacist review history.

Prescription files are not converted to WebP.

## Payment and Delivery

- `payments`: one payment per order. COD starts as pending and becomes paid when order/delivery is delivered.
- `delivery_areas`: configured delivery charges.
- `riders`: delivery staff/riders.
- `deliveries`: order delivery state and tracking number.

## Support

- `support_tickets`: customer support ticket with optional order and optional assigned staff.
- `ticket_replies`: replies from either customer or staff. Exactly one sender column should be populated.

## Return and Refund

- `return_requests`: customer return requests for delivered orders.
- `refunds`: refund record for a return request.

Refund completion updates return, order, and payment status when required.

## Notifications and Audit

- `notifications`: custom in-app notifications for customer/staff updates.
- `admin_activity_logs`: admin action audit trail.
- `user_admin_actions`: staff actions on customer accounts, such as block/unblock.
