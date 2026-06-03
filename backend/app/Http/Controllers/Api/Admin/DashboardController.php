<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function summary()
    {
        $today = now()->toDateString();

        return $this->ok([
            'total_users' => DB::table('users')->count(),
            'total_orders' => DB::table('orders')->count(),
            'today_orders' => DB::table('orders')->whereDate('order_date', $today)->count(),
            'total_revenue' => (float) DB::table('payments')->where('payment_status', 'paid')->sum('amount'),
            'pending_prescription_reviews' => DB::table('prescriptions')->where('status', 'pending')->count(),
            'pending_deliveries' => DB::table('deliveries')->whereIn('delivery_status', ['pending', 'assigned', 'picked_up', 'out_for_delivery'])->count(),
            'low_stock_batches' => DB::table('inventory_batches')->whereRaw('(stock_quantity - reserved_quantity) <= 10')->count(),
            'near_expiry_batches' => DB::table('inventory_batches')->whereDate('expiry_date', '>', now())->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
            'open_support_tickets' => DB::table('support_tickets')->whereIn('status', ['open', 'in_progress'])->count(),
            'pending_return_requests' => DB::table('return_requests')->where('status', 'requested')->count(),
        ], 'ড্যাশবোর্ড সারাংশ পাওয়া গেছে।');
    }

    public function recentOrders()
    {
        return $this->ok(\App\Models\Order::query()->with('user', 'payment', 'delivery')->latest()->limit(10)->get(), 'সাম্প্রতিক অর্ডার পাওয়া গেছে।');
    }

    public function pendingPrescriptions()
    {
        return $this->ok(\App\Models\Prescription::query()->with('user', 'order')->where('status', 'pending')->latest()->limit(10)->get(), 'পেন্ডিং প্রেসক্রিপশন পাওয়া গেছে।');
    }

    public function lowStock()
    {
        return $this->ok(DB::table('inventory_batches')
            ->join('products', 'products.id', '=', 'inventory_batches.product_id')
            ->select('inventory_batches.*', 'products.product_name', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
            ->whereRaw('(stock_quantity - reserved_quantity) <= 10')
            ->orderBy('available_stock')
            ->limit(20)
            ->get(), 'লো স্টক পাওয়া গেছে।');
    }

    public function nearExpiry()
    {
        return $this->ok(DB::table('inventory_batches')
            ->join('products', 'products.id', '=', 'inventory_batches.product_id')
            ->select('inventory_batches.*', 'products.product_name', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
            ->whereDate('expiry_date', '>', now())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->orderBy('expiry_date')
            ->limit(20)
            ->get(), 'নিয়ার এক্সপায়ারি পাওয়া গেছে।');
    }
}
