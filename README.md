# Pharmacy E-commerce System

A Laravel 13 + React + MySQL pharmacy e-commerce application with a Bengali-first customer storefront and a permission-based admin panel.

## Project Overview

The system supports customer medicine browsing, cart, checkout, prescriptions, orders, COD payment, delivery tracking, support tickets, returns, refunds, and notifications. The admin panel supports staff authentication, Spatie roles/permissions, catalog management, inventory batch management, prescription review, order/payment/delivery operations, support, returns/refunds, user management, dashboard summaries, and reports.

## Stack

- Backend: Laravel 13, PHP 8.3+
- Database: MySQL
- API auth: Laravel Sanctum
- Staff roles: Spatie Laravel Permission
- Image handling: Intervention Image
- Social login: Laravel Socialite
- Frontend: React, React Router, Tailwind CSS, Axios, SweetAlert2, react-hot-toast

## Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure MySQL in `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=my_pharmacy
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations, seeders, and storage link:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Default admin:

- Email: `admin@pharmacy.com`
- Password: `password`

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend env:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## Package Setup Notes

Sanctum:

- Personal access tokens table is migrated.
- Customer tokens use the `customer` ability.
- Staff tokens use the `staff` ability.

Spatie Permission:

- Permission tables use Spatie defaults.
- Staff permissions use `guard_name = staff`.
- Super Admin is seeded with all permissions.

Intervention Image:

- Product images are stored and converted to WebP.
- Prescription uploads are not converted to WebP.

Socialite:

- Customer social login routes are present.
- Configure provider keys in `.env` before enabling real provider callbacks.

## API Overview

- Public product browsing: `/api/products`, `/api/categories`
- Customer routes: `/api/customer/*`
- Admin routes: `/api/admin/*`
- Customer routes require Sanctum + `customer.auth`.
- Admin routes require Sanctum + `staff.auth`.
- Admin module routes use Spatie permission middleware.

See [docs/API_ROUTES.md](docs/API_ROUTES.md) for route groups.

## Modules

- Authentication: separate customer and staff auth
- Customer profile and addresses
- Product catalog and product images
- Inventory suppliers, batches, stock transactions
- Cart and checkout
- Prescription upload and review
- Orders and batch allocation
- COD payment and delivery
- Support tickets
- Returns and refunds
- Notifications
- Staff, roles, permissions
- User management
- Dashboard and reports
- Admin activity logs

## Database Module Explanation

See [docs/DATABASE_MODULES.md](docs/DATABASE_MODULES.md).

Important stock rules:

- Products do not store sellable stock.
- Customer cart stores `product_id`, not `batch_id`.
- `order_items` stores `product_id`.
- `order_item_batches` stores FEFO batch allocation.
- Available stock is `stock_quantity - reserved_quantity`.
- Expired or inactive batches cannot be sold.
- Every stock movement creates `inventory_transactions`.

## Testing Checklist

Backend:

```bash
cd backend
php artisan test
php artisan migrate:fresh --seed --env=testing
php artisan route:list --path=api
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Manual test checklist:

- Customer register/login/logout
- Staff login/logout
- Customer token rejected from admin routes
- Staff token rejected from customer routes
- Role and permission assignment
- Staff create/block/unblock
- Category, manufacturer, product CRUD
- Product WebP upload
- Customer product listing active/available products only
- Supplier and inventory batch CRUD
- Expired/inactive batches not sellable
- FEFO batch selection
- Cart product add/update/remove
- Checkout prescription rules
- Order reserve/release/sold stock flow
- COD payment and delivery delivered flow
- Prescription upload/review notifications
- Support ticket customer/staff replies
- Return and refund processing
- Dashboard and report endpoints
- Admin activity logs and user admin actions

## Security Notes

- Keep `APP_DEBUG=false` in production.
- Use strong passwords and rotate default admin credentials.
- Use HTTPS in production.
- Keep private files out of public web roots.
- Review `config/filesystems.php` before storing sensitive prescription files in production.
