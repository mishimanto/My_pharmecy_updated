<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderStatusService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class OrderManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request, OrderStatusService $orders)
    {
        $query = Order::query()->with('user', 'payment', 'delivery')->latest();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($where) use ($search) {
                $where->where('order_number', 'like', "%{$search}%")
                    ->orWhere('guest_full_name', 'like', "%{$search}%")
                    ->orWhere('guest_phone', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($user) => $user->where('full_name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('order_status', $request->string('status'));
        }

        return $this->ok($query->paginate((int) $request->input('per_page', 10)), 'অর্ডার তালিকা পাওয়া গেছে।');
    }

    public function show(int $id, OrderStatusService $orders)
    {
        return $this->ok(
            Order::query()->with($orders->relations())->findOrFail($id),
            'অর্ডার বিস্তারিত পাওয়া গেছে।'
        );
    }

    public function status(Request $request, int $id, OrderStatusService $orders)
    {
        $data = $request->validate([
            'order_status' => ['required', 'in:pending,prescription_review,confirmed,processing,packed,out_for_delivery,delivered,cancelled,returned,refunded'],
        ]);

        $order = Order::query()->with('payment')->findOrFail($id);

        return $this->ok(
            $orders->updateByStaff($order, $data['order_status'], $request->user(), $request->ip()),
            'অর্ডার স্ট্যাটাস আপডেট করা হয়েছে।'
        );
    }
}
