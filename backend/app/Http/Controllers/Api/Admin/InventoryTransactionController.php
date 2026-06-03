<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryTransactionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $transactions = DB::table('inventory_transactions')
            ->join('inventory_batches', 'inventory_transactions.batch_id', '=', 'inventory_batches.id')
            ->join('products', 'inventory_batches.product_id', '=', 'products.id')
            ->select('inventory_transactions.*', 'inventory_batches.batch_number', 'products.product_name')
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('transaction_type', 'like', "%{$search}%")
                ->orWhere('batch_number', 'like', "%{$search}%")
                ->orWhere('product_name', 'like', "%{$search}%")))
            ->orderByDesc('inventory_transactions.id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($transactions, 'ইনভেন্টরি লেনদেন পাওয়া গেছে।');
    }

    public function lowStock(Request $request)
    {
        $threshold = $request->integer('threshold', 10);
        $rows = DB::table('products')
            ->join('inventory_batches', 'products.id', '=', 'inventory_batches.product_id')
            ->where('inventory_batches.status', 'active')
            ->whereDate('inventory_batches.expiry_date', '>', now())
            ->select('products.id', 'products.product_name', DB::raw('SUM(inventory_batches.stock_quantity - inventory_batches.reserved_quantity) as available_stock'))
            ->groupBy('products.id', 'products.product_name')
            ->having('available_stock', '<=', $threshold)
            ->orderBy('available_stock')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($rows, 'লো স্টক রিপোর্ট পাওয়া গেছে।');
    }

    public function nearExpiry(Request $request)
    {
        $days = $request->integer('days', 30);
        $rows = DB::table('inventory_batches')
            ->join('products', 'inventory_batches.product_id', '=', 'products.id')
            ->join('suppliers', 'inventory_batches.supplier_id', '=', 'suppliers.id')
            ->where('inventory_batches.status', 'active')
            ->whereDate('inventory_batches.expiry_date', '>', now())
            ->whereDate('inventory_batches.expiry_date', '<=', now()->addDays($days))
            ->select('inventory_batches.*', 'products.product_name', 'suppliers.supplier_name', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
            ->orderBy('inventory_batches.expiry_date')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($rows, 'নিয়ার এক্সপায়ারি রিপোর্ট পাওয়া গেছে।');
    }
}

