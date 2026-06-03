<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderStatusService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        return $this->ok(
            $request->user()->hasMany(Order::class)
                ->with('items.product', 'items.batches.batch', 'payment', 'delivery')
                ->latest()
                ->paginate(10),
            'অর্ডার তালিকা পাওয়া গেছে।'
        );
    }

    public function show(Request $request, int $id)
    {
        return $this->ok(
            $request->user()->hasMany(Order::class)
                ->with('items.product', 'items.batches.batch', 'payment', 'delivery')
                ->findOrFail($id),
            'অর্ডার বিস্তারিত পাওয়া গেছে।'
        );
    }

    public function cancel(Request $request, int $id, OrderStatusService $orders)
    {
        $order = $request->user()->hasMany(Order::class)->findOrFail($id);

        return $this->ok($orders->cancelByCustomer($order), 'অর্ডার বাতিল করা হয়েছে।');
    }
}
