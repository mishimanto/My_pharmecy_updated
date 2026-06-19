<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminActivityLogController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\DeliveryAreaController;
use App\Http\Controllers\Api\Admin\DeliveryController;
use App\Http\Controllers\Api\Admin\InventoryBatchController;
use App\Http\Controllers\Api\Admin\InventoryTransactionController;
use App\Http\Controllers\Api\Admin\ManufacturerController;
use App\Http\Controllers\Api\Admin\NotificationManagementController;
use App\Http\Controllers\Api\Admin\OrderManagementController;
use App\Http\Controllers\Api\Admin\PaymentManagementController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\ProductImageController;
use App\Http\Controllers\Api\Admin\PrescriptionReviewController;
use App\Http\Controllers\Api\Admin\RefundController;
use App\Http\Controllers\Api\Admin\ReturnManagementController;
use App\Http\Controllers\Api\Admin\RiderController;
use App\Http\Controllers\Api\Admin\RolePermissionController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\SiteSettingsController as AdminSiteSettingsController;
use App\Http\Controllers\Api\Admin\StaffController;
use App\Http\Controllers\Api\Admin\SupplierController;
use App\Http\Controllers\Api\Admin\SupportManagementController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\Customer\AddressController;
use App\Http\Controllers\Api\Customer\AuthController;
use App\Http\Controllers\Api\Customer\CartController;
use App\Http\Controllers\Api\Customer\CategoryBrowseController;
use App\Http\Controllers\Api\Customer\CheckoutController;
use App\Http\Controllers\Api\Customer\DeliveryTrackingController;
use App\Http\Controllers\Api\Customer\NotificationController;
use App\Http\Controllers\Api\Customer\OrderController;
use App\Http\Controllers\Api\Customer\PaymentController;
use App\Http\Controllers\Api\Customer\PrescriptionController;
use App\Http\Controllers\Api\Customer\ProductBrowseController;
use App\Http\Controllers\Api\Customer\ReturnRequestController;
use App\Http\Controllers\Api\Customer\SupportTicketController;
use App\Http\Controllers\Api\SiteSettingsController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['success' => true, 'message' => 'ফার্মেসি API চলছে।', 'data' => null, 'errors' => null]);

Route::get('/products', [ProductBrowseController::class, 'index']);
Route::get('/products/{slug}', [ProductBrowseController::class, 'show']);
Route::get('/categories', [CategoryBrowseController::class, 'index']);
Route::get('/categories/{id}/products', [CategoryBrowseController::class, 'products']);
Route::get('/delivery-areas', fn () => [
    'success' => true,
    'message' => 'Delivery areas loaded successfully.',
    'data' => \App\Models\DeliveryArea::query()
        ->where('status', 'active')
        ->orderBy('city')
        ->orderBy('area_name')
        ->get(),
    'errors' => null,
]);
Route::get('/manufacturers', fn () => [
    'success' => true,
    'message' => 'ম্যানুফ্যাকচারার তালিকা পাওয়া গেছে।',
    'data' => \App\Models\Manufacturer::where('status', 'active')->orderBy('manufacturer_name')->get(),
    'errors' => null,
]);

Route::get('/site-settings', [SiteSettingsController::class, 'show']);

Route::prefix('customer')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/products', [ProductBrowseController::class, 'index']);
    Route::get('/products/{slug}', [ProductBrowseController::class, 'show']);
    Route::get('/auth/{provider}/redirect', [AuthController::class, 'redirect']);
    Route::get('/auth/{provider}/callback', [AuthController::class, 'callback']);
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'store']);
    Route::put('/cart/items/{itemId}', [CartController::class, 'update']);
    Route::delete('/cart/items/{itemId}', [CartController::class, 'destroy']);
    Route::delete('/cart/clear', [CartController::class, 'clear']);
    Route::post('/checkout/quote', [CheckoutController::class, 'quote']);
    Route::post('/checkout', [CheckoutController::class, 'store']);
    Route::get('/orders/{id}/tracking', [DeliveryTrackingController::class, 'show']);
    Route::post('/orders/{id}/payment/cod', [PaymentController::class, 'cod']);
    Route::post('/orders/{id}/payment-proof', [PaymentController::class, 'submitProof']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::middleware(['auth:sanctum', 'customer.auth'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::apiResource('addresses', AddressController::class)->except(['show']);
        Route::patch('/addresses/{id}/default', [AddressController::class, 'setDefault']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders/{id}/return-request', [ReturnRequestController::class, 'store']);
        Route::get('/orders/{orderId}/delivery', [DeliveryTrackingController::class, 'show']);
        Route::get('/support-tickets', [SupportTicketController::class, 'index']);
        Route::post('/support-tickets', [SupportTicketController::class, 'store']);
        Route::get('/support-tickets/{id}', [SupportTicketController::class, 'show']);
        Route::post('/support-tickets/{id}/replies', [SupportTicketController::class, 'reply']);
        Route::get('/returns', [ReturnRequestController::class, 'index']);
        Route::get('/returns/{id}', [ReturnRequestController::class, 'show']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'read']);
        Route::get('/prescriptions', [PrescriptionController::class, 'index']);
        Route::post('/prescriptions', [PrescriptionController::class, 'store']);
        Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show']);
        Route::delete('/prescriptions/{id}', [PrescriptionController::class, 'destroy']);

    });
});

Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'staff.auth'])->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::get('/profile', [AdminAuthController::class, 'profile']);
        Route::put('/profile', [AdminAuthController::class, 'updateProfile']);
        Route::put('/profile/password', [AdminAuthController::class, 'changePassword']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/dashboard', [DashboardController::class, 'summary'])->middleware('permission:report.view');
        Route::get('/dashboard/summary', [DashboardController::class, 'summary'])->middleware('permission:report.view');
        Route::get('/dashboard/recent-orders', [DashboardController::class, 'recentOrders'])->middleware('permission:report.view');
        Route::get('/dashboard/pending-prescriptions', [DashboardController::class, 'pendingPrescriptions'])->middleware('permission:report.view');
        Route::get('/dashboard/low-stock', [DashboardController::class, 'lowStock'])->middleware('permission:report.view');
        Route::get('/dashboard/near-expiry', [DashboardController::class, 'nearExpiry'])->middleware('permission:report.view');

        Route::get('/users', [UserManagementController::class, 'index'])->middleware('permission:user.view');
        Route::get('/users/customers', [UserManagementController::class, 'customers'])->middleware('permission:user.view');
        Route::get('/users/{id}', [UserManagementController::class, 'show'])->middleware('permission:user.view');
        Route::patch('/users/{id}/status', [UserManagementController::class, 'status'])->middleware('permission:user.manage');
        Route::delete('/users/{id}', [UserManagementController::class, 'destroy'])->middleware('permission:user.manage');
        Route::get('/users/{id}/orders', [UserManagementController::class, 'orders'])->middleware('permission:user.view');
        Route::get('/users/{id}/prescriptions', [UserManagementController::class, 'prescriptions'])->middleware('permission:user.view');
        Route::get('/users/{id}/support-tickets', [UserManagementController::class, 'supportTickets'])->middleware('permission:user.view');
        Route::get('/users/{id}/returns', [UserManagementController::class, 'returns'])->middleware('permission:user.view');

        Route::get('/staff', [StaffController::class, 'index'])->middleware('permission:staff.view');
        Route::post('/staff', [StaffController::class, 'store'])->middleware('permission:staff.manage');
        Route::get('/staff/{id}', [StaffController::class, 'show'])->middleware('permission:staff.view');
        Route::put('/staff/{id}', [StaffController::class, 'update'])->middleware('permission:staff.manage');
        Route::patch('/staff/{id}/status', [StaffController::class, 'status'])->middleware('permission:staff.manage');
        Route::delete('/staff/{id}', [StaffController::class, 'destroy'])->middleware('permission:staff.manage');

        Route::get('/roles', [RolePermissionController::class, 'roles'])->middleware('permission:role.manage');
        Route::post('/roles', [RolePermissionController::class, 'storeRole'])->middleware('permission:role.manage');
        Route::get('/roles/{id}', [RolePermissionController::class, 'showRole'])->middleware('permission:role.manage');
        Route::put('/roles/{id}', [RolePermissionController::class, 'updateRole'])->middleware('permission:role.manage');
        Route::delete('/roles/{id}', [RolePermissionController::class, 'destroyRole'])->middleware('permission:role.manage');
        Route::get('/permissions', [RolePermissionController::class, 'permissions'])->middleware('permission:role.manage');
        Route::post('/roles/{id}/permissions', [RolePermissionController::class, 'syncPermissions'])->middleware('permission:role.manage');
        Route::get('/site-settings', [AdminSiteSettingsController::class, 'show'])->middleware('permission:role.manage');
        Route::put('/site-settings', [AdminSiteSettingsController::class, 'update'])->middleware('permission:role.manage');

        Route::get('/categories', [CategoryController::class, 'index'])->middleware('permission:product.view');
        Route::post('/categories', [CategoryController::class, 'store'])->middleware('permission:product.create');
        Route::get('/categories/{id}', [CategoryController::class, 'show'])->middleware('permission:product.view');
        Route::put('/categories/{id}', [CategoryController::class, 'update'])->middleware('permission:product.edit');
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->middleware('permission:product.delete');

        Route::get('/manufacturers', [ManufacturerController::class, 'index'])->middleware('permission:product.view');
        Route::post('/manufacturers', [ManufacturerController::class, 'store'])->middleware('permission:product.create');
        Route::get('/manufacturers/{id}', [ManufacturerController::class, 'show'])->middleware('permission:product.view');
        Route::post('/manufacturers/{id}', [ManufacturerController::class, 'update'])->middleware('permission:product.edit');
        Route::put('/manufacturers/{id}', [ManufacturerController::class, 'update'])->middleware('permission:product.edit');
        Route::delete('/manufacturers/{id}', [ManufacturerController::class, 'destroy'])->middleware('permission:product.delete');

        Route::get('/products', [ProductController::class, 'index'])->middleware('permission:product.view');
        Route::post('/products', [ProductController::class, 'store'])->middleware('permission:product.create');
        Route::get('/products/{id}', [ProductController::class, 'show'])->middleware('permission:product.view');
        Route::put('/products/{id}', [ProductController::class, 'update'])->middleware('permission:product.edit');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('permission:product.delete');
        Route::put('/products/{id}/images', [ProductImageController::class, 'store'])->middleware('permission:product.edit');
        Route::get('/products/{id}/images/chunk', [ProductImageController::class, 'chunk'])->middleware('permission:product.edit');
        Route::delete('/product-images/{id}', [ProductImageController::class, 'destroy'])->middleware('permission:product.delete');
        Route::patch('/products/{id}/status', [ProductController::class, 'status'])->middleware('permission:product.edit');

        Route::get('/suppliers', [SupplierController::class, 'index'])->middleware('permission:inventory.view');
        Route::post('/suppliers', [SupplierController::class, 'store'])->middleware('permission:inventory.manage');
        Route::get('/suppliers/{id}', [SupplierController::class, 'show'])->middleware('permission:inventory.view');
        Route::put('/suppliers/{id}', [SupplierController::class, 'update'])->middleware('permission:inventory.manage');
        Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy'])->middleware('permission:inventory.manage');

        Route::get('/inventory/batches', [InventoryBatchController::class, 'index'])->middleware('permission:inventory.view');
        Route::post('/inventory/batches', [InventoryBatchController::class, 'store'])->middleware('permission:inventory.manage');
        Route::get('/inventory/batches/{id}', [InventoryBatchController::class, 'show'])->middleware('permission:inventory.view');
        Route::put('/inventory/batches/{id}', [InventoryBatchController::class, 'update'])->middleware('permission:inventory.manage');
        Route::delete('/inventory/batches/{id}', [InventoryBatchController::class, 'destroy'])->middleware('permission:inventory.manage');
        Route::patch('/inventory/batches/{id}/status', [InventoryBatchController::class, 'status'])->middleware('permission:inventory.manage');

        Route::get('/inventory/transactions', [InventoryTransactionController::class, 'index'])->middleware('permission:inventory.view');
        Route::get('/inventory/low-stock', [InventoryTransactionController::class, 'lowStock'])->middleware('permission:inventory.view');
        Route::get('/inventory/near-expiry', [InventoryTransactionController::class, 'nearExpiry'])->middleware('permission:inventory.view');

        Route::get('/prescriptions', [PrescriptionReviewController::class, 'index'])->middleware('permission:prescription.view');
        Route::get('/prescriptions/{id}', [PrescriptionReviewController::class, 'show'])->middleware('permission:prescription.view');
        Route::post('/prescriptions/{id}/review', [PrescriptionReviewController::class, 'review'])->middleware('permission:prescription.review');

        Route::get('/orders', [OrderManagementController::class, 'index'])->middleware('permission:order.view');
        Route::get('/orders/{id}', [OrderManagementController::class, 'show'])->middleware('permission:order.view');
        Route::patch('/orders/{id}/prescription-match', [OrderManagementController::class, 'prescriptionMatch'])->middleware('permission:prescription.review');
        Route::patch('/orders/{id}/status', [OrderManagementController::class, 'status'])->middleware('permission:order.update');
        Route::patch('/orders/{id}/force-status', [OrderManagementController::class, 'forceStatus'])->middleware('permission:order.update');

        Route::get('/payments', [PaymentManagementController::class, 'index'])->middleware('permission:payment.view');
        Route::get('/payments/{id}', [PaymentManagementController::class, 'show'])->middleware('permission:payment.view');
        Route::patch('/payments/{id}/status', [PaymentManagementController::class, 'status'])->middleware('permission:payment.view');

        Route::get('/delivery-areas', [DeliveryAreaController::class, 'index'])->middleware('permission:delivery.manage');
        Route::post('/delivery-areas', [DeliveryAreaController::class, 'store'])->middleware('permission:delivery.manage');
        Route::get('/delivery-areas/{id}', [DeliveryAreaController::class, 'show'])->middleware('permission:delivery.manage');
        Route::put('/delivery-areas/{id}', [DeliveryAreaController::class, 'update'])->middleware('permission:delivery.manage');
        Route::delete('/delivery-areas/{id}', [DeliveryAreaController::class, 'destroy'])->middleware('permission:delivery.manage');

        Route::get('/riders', [RiderController::class, 'index'])->middleware('permission:delivery.manage');
        Route::post('/riders', [RiderController::class, 'store'])->middleware('permission:delivery.manage');
        Route::get('/riders/{id}', [RiderController::class, 'show'])->middleware('permission:delivery.manage');
        Route::put('/riders/{id}', [RiderController::class, 'update'])->middleware('permission:delivery.manage');
        Route::delete('/riders/{id}', [RiderController::class, 'destroy'])->middleware('permission:delivery.manage');

        Route::get('/deliveries', [DeliveryController::class, 'index'])->middleware('permission:delivery.manage');
        Route::get('/deliveries/{id}', [DeliveryController::class, 'show'])->middleware('permission:delivery.manage');
        Route::post('/orders/{id}/delivery', [DeliveryController::class, 'createForOrder'])->middleware('permission:delivery.manage');
        Route::patch('/deliveries/{id}/status', [DeliveryController::class, 'status'])->middleware('permission:delivery.manage');

        Route::get('/support-tickets', [SupportManagementController::class, 'index'])->middleware('permission:support.manage');
        Route::get('/support-tickets/{id}', [SupportManagementController::class, 'show'])->middleware('permission:support.manage');
        Route::patch('/support-tickets/{id}/assign', [SupportManagementController::class, 'assign'])->middleware('permission:support.manage');
        Route::patch('/support-tickets/{id}/status', [SupportManagementController::class, 'status'])->middleware('permission:support.manage');
        Route::post('/support-tickets/{id}/replies', [SupportManagementController::class, 'reply'])->middleware('permission:support.manage');

        Route::get('/returns', [ReturnManagementController::class, 'index'])->middleware('permission:return.manage');
        Route::get('/returns/{id}', [ReturnManagementController::class, 'show'])->middleware('permission:return.manage');
        Route::patch('/returns/{id}/status', [ReturnManagementController::class, 'status'])->middleware('permission:return.manage');
        Route::post('/returns/{id}/refund', [ReturnManagementController::class, 'refund'])->middleware('permission:refund.approve');

        Route::get('/refunds', [RefundController::class, 'index'])->middleware('permission:refund.approve');
        Route::get('/refunds/{id}', [RefundController::class, 'show'])->middleware('permission:refund.approve');
        Route::patch('/refunds/{id}/status', [RefundController::class, 'status'])->middleware('permission:refund.approve');

        Route::get('/notifications', [NotificationManagementController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationManagementController::class, 'read']);

        Route::get('/reports/sales', [ReportController::class, 'sales'])->middleware('permission:report.view');
        Route::get('/reports/orders', [ReportController::class, 'orders'])->middleware('permission:report.view');
        Route::get('/reports/inventory', [ReportController::class, 'inventory'])->middleware('permission:report.view');
        Route::get('/reports/payments', [ReportController::class, 'payments'])->middleware('permission:report.view');
        Route::get('/reports/prescriptions', [ReportController::class, 'prescriptions'])->middleware('permission:report.view');
        Route::get('/reports/deliveries', [ReportController::class, 'deliveries'])->middleware('permission:report.view');
        Route::get('/reports/refunds', [ReportController::class, 'refunds'])->middleware('permission:report.view');

        Route::get('/admin_activity_logs', [AdminActivityLogController::class, 'index'])->middleware('permission:activity-log.view');
        Route::get('/admin_activity_logs/{id}', [AdminActivityLogController::class, 'show'])->middleware('permission:activity-log.view');

    });
});
