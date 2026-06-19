<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function summary()
    {
        $this->forgetLegacyDashboardCache();

        $today = now()->toDateString();

        $summary = Cache::remember("admin.dashboard.v2.summary.{$today}", 60, fn () => [
            'total_users' => DB::table('users')->count(),
            'total_orders' => DB::table('orders')->count(),
            'today_orders' => DB::table('orders')->whereDate('order_date', $today)->count(),
            'total_revenue' => (float) DB::table('payments')->where('payment_status', 'paid')->sum('amount'),
            'pending_prescription_reviews' => DB::table('prescriptions')->where('status', 'pending')->count(),
            'pending_deliveries' => DB::table('deliveries')->where('delivery_status', 'pending')->count(),
            'low_stock_batches' => DB::table('inventory_batches')->whereRaw('(stock_quantity - reserved_quantity) <= 10')->count(),
            'near_expiry_batches' => DB::table('inventory_batches')->whereDate('expiry_date', '>', now())->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
            'open_support_tickets' => DB::table('support_tickets')->whereIn('status', ['open', 'in_progress'])->count(),
            'pending_return_requests' => DB::table('return_requests')->where('status', 'requested')->count(),
        ]);

        return $this->ok($summary, 'Dashboard summary loaded successfully.');
    }

    public function recentOrders()
    {
        $this->forgetLegacyDashboardCache();

        $orders = \App\Models\Order::query()
            ->with('user', 'payment', 'delivery')
            ->latest()
            ->limit(10)
            ->get()
            ->values()
            ->all();

        return $this->ok($orders, 'Recent orders loaded successfully.');
    }

    public function pendingPrescriptions()
    {
        $this->forgetLegacyDashboardCache();

        $prescriptions = \App\Models\Prescription::query()
            ->with('user', 'order')
            ->where('status', 'pending')
            ->latest()
            ->limit(10)
            ->get()
            ->values()
            ->all();

        return $this->ok($prescriptions, 'Pending prescriptions loaded successfully.');
    }

    public function lowStock()
    {
        $this->forgetLegacyDashboardCache();

        $batches = DB::table('inventory_batches')
            ->join('products', 'products.id', '=', 'inventory_batches.product_id')
            ->select('inventory_batches.*', 'products.product_name', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
            ->whereRaw('(stock_quantity - reserved_quantity) <= 10')
            ->orderBy('available_stock')
            ->limit(20)
            ->get()
            ->values()
            ->all();

        return $this->ok($batches, 'Low-stock batches loaded successfully.');
    }

    public function nearExpiry()
    {
        $this->forgetLegacyDashboardCache();

        $today = now()->toDateString();
        $batches = DB::table('inventory_batches')
            ->join('products', 'products.id', '=', 'inventory_batches.product_id')
            ->select('inventory_batches.*', 'products.product_name', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
            ->whereDate('expiry_date', '>', now())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->orderBy('expiry_date')
            ->limit(20)
            ->get()
            ->values()
            ->all();

        return $this->ok($batches, 'Near-expiry batches loaded successfully.');
    }

    private function forgetLegacyDashboardCache(): void
    {
        foreach ([
            'admin.dashboard.recent_orders',
            'admin.dashboard.pending_prescriptions',
            'admin.dashboard.low_stock',
            'admin.dashboard.near_expiry',
            'admin.dashboard.v2.recent_orders',
            'admin.dashboard.v2.pending_prescriptions',
            'admin.dashboard.v2.low_stock',
        ] as $key) {
            Cache::forget($key);
        }
    }
}
