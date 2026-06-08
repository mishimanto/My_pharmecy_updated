<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ApiResponse;

    public function sales()
    {
        return $this->ok([
            'daily_sales' => DB::table('payments')
                ->selectRaw('DATE(paid_at) as date, SUM(amount) as revenue, COUNT(*) as payments')
                ->where('payment_status', 'paid')
                ->whereNotNull('paid_at')
                ->groupByRaw('DATE(paid_at)')
                ->orderByDesc('date')
                ->limit(30)
                ->get(),
            'monthly_sales' => DB::table('payments')
                ->selectRaw($this->monthExpression() . ' as month, SUM(amount) as revenue, COUNT(*) as payments')
                ->where('payment_status', 'paid')
                ->whereNotNull('paid_at')
                ->groupByRaw($this->monthExpression())
                ->orderByDesc('month')
                ->limit(12)
                ->get(),
            'top_selling_medicines' => DB::table('order_items')
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->select('products.id', 'products.product_name', DB::raw('SUM(order_items.piece_quantity) as quantity_sold'), DB::raw('SUM(order_items.subtotal) as sales_amount'))
                ->whereIn('orders.order_status', ['delivered', 'refunded'])
                ->groupBy('products.id', 'products.product_name')
                ->orderByDesc('quantity_sold')
                ->limit(10)
                ->get(),
        ], 'সেলস রিপোর্ট পাওয়া গেছে।');
    }

    public function orders()
    {
        return $this->ok([
            'status_report' => DB::table('orders')->select('order_status', DB::raw('COUNT(*) as total'), DB::raw('SUM(total_amount) as amount'))->groupBy('order_status')->get(),
            'today_orders' => DB::table('orders')->whereDate('order_date', now())->count(),
            'recent_orders' => \App\Models\Order::query()->with('user')->latest()->limit(15)->get(),
        ], 'অর্ডার রিপোর্ট পাওয়া গেছে।');
    }

    public function inventory()
    {
        return $this->ok([
            'low_stock' => DB::table('inventory_batches')
                ->join('products', 'products.id', '=', 'inventory_batches.product_id')
                ->select('inventory_batches.*', 'products.product_name', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
                ->whereRaw('(stock_quantity - reserved_quantity) <= 10')
                ->orderBy('available_stock')
                ->get(),
            'near_expiry' => DB::table('inventory_batches')
                ->join('products', 'products.id', '=', 'inventory_batches.product_id')
                ->select('inventory_batches.*', 'products.product_name', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
                ->whereDate('expiry_date', '>', now())
                ->whereDate('expiry_date', '<=', now()->addDays(30))
                ->orderBy('expiry_date')
                ->get(),
        ], 'ইনভেন্টরি রিপোর্ট পাওয়া গেছে।');
    }

    public function payments()
    {
        return $this->ok([
            'status_report' => DB::table('payments')->select('payment_status', DB::raw('COUNT(*) as total'), DB::raw('SUM(amount) as amount'))->groupBy('payment_status')->get(),
            'method_report' => DB::table('payments')->select('payment_method', DB::raw('COUNT(*) as total'), DB::raw('SUM(amount) as amount'))->groupBy('payment_method')->get(),
        ], 'পেমেন্ট রিপোর্ট পাওয়া গেছে।');
    }

    public function prescriptions()
    {
        return $this->ok([
            'status_report' => DB::table('prescriptions')->select('status', DB::raw('COUNT(*) as total'))->groupBy('status')->get(),
            'review_report' => DB::table('prescription_reviews')->select('review_status', DB::raw('COUNT(*) as total'))->groupBy('review_status')->get(),
            'recent_reviews' => \App\Models\PrescriptionReview::query()->with('prescription.user')->latest()->limit(15)->get(),
        ], 'প্রেসক্রিপশন রিপোর্ট পাওয়া গেছে।');
    }

    public function deliveries()
    {
        return $this->ok([
            'status_report' => DB::table('deliveries')->select('delivery_status', DB::raw('COUNT(*) as total'))->groupBy('delivery_status')->get(),
            'rider_report' => DB::table('deliveries')
                ->leftJoin('riders', 'riders.id', '=', 'deliveries.rider_id')
                ->select('riders.full_name', DB::raw('COUNT(deliveries.id) as total'), DB::raw("SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered"))
                ->groupBy('riders.full_name')
                ->get(),
        ], 'ডেলিভারি রিপোর্ট পাওয়া গেছে।');
    }

    public function refunds()
    {
        return $this->ok([
            'status_report' => DB::table('refunds')->select('status', DB::raw('COUNT(*) as total'), DB::raw('SUM(refund_amount) as amount'))->groupBy('status')->get(),
            'return_status_report' => DB::table('return_requests')->select('status', DB::raw('COUNT(*) as total'))->groupBy('status')->get(),
        ], 'রিফান্ড রিপোর্ট পাওয়া গেছে।');
    }

    private function monthExpression(): string
    {
        return DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', paid_at)"
            : "DATE_FORMAT(paid_at, '%Y-%m')";
    }
}
