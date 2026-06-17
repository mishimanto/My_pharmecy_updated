<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Services\AdminActivityService;
use App\Services\OrderStatusService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeliveryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Delivery::query()->with('order.user', 'rider')->latest();
        if ($request->filled('status')) {
            $query->where('delivery_status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($where) use ($search) {
                $where->where('tracking_no', 'like', "%{$search}%")
                    ->orWhere('delivery_status', 'like', "%{$search}%")
                    ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', "%{$search}%"))
                    ->orWhereHas('rider', fn ($rider) => $rider->where('full_name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"));
            });
        }

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'ডেলিভারি তালিকা পাওয়া গেছে।');
    }

    public function show(int $id)
    {
        return $this->ok(Delivery::query()->with('order.user', 'order.items.product', 'rider')->findOrFail($id), 'ডেলিভারি বিস্তারিত পাওয়া গেছে।');
    }

    public function createForOrder(Request $request, int $id, AdminActivityService $activity)
    {
        $order = Order::query()->with('delivery')->findOrFail($id);
        abort_unless(in_array($order->order_status, ['confirmed', 'processing', 'packed', 'out_for_delivery'], true), 422, 'ডেলিভারি তৈরি করার আগে অর্ডার কনফার্ম হতে হবে।');

        if ($order->delivery) {
            return $this->ok($order->delivery->load('order.user', 'rider'), 'এই অর্ডারের ডেলিভারি আগে থেকেই আছে।');
        }

        $delivery = $order->delivery()->create([
            'delivery_charge' => $order->delivery_charge,
            'tracking_no' => 'TRK-' . Str::upper(Str::random(8)),
            'delivery_status' => 'pending',
        ]);
        $activity->log($request, 'create', 'deliveries', $delivery->id, null, $delivery->toArray());

        return $this->ok($delivery->load('order.user', 'rider'), 'ডেলিভারি তৈরি হয়েছে।', 201);
    }

    public function assignRider(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'rider_id' => ['required', 'exists:riders,id'],
        ]);

        $delivery = Delivery::findOrFail($id);
        $old = $delivery->toArray();
        $delivery->update([
            'rider_id' => $data['rider_id'],
            'delivery_status' => 'assigned',
            'assigned_at' => now(),
        ]);
        $activity->log($request, 'assign_rider', 'deliveries', $delivery->id, $old, $delivery->fresh()->toArray());

        return $this->ok($delivery->fresh()->load('order.user', 'rider'), 'রাইডার অ্যাসাইন করা হয়েছে।');
    }

    public function status(Request $request, int $id, AdminActivityService $activity, OrderStatusService $orders)
    {
        $data = $request->validate([
            'delivery_status' => ['required', 'in:pending,assigned,picked_up,out_for_delivery,delivered,failed,returned'],
        ]);

        $delivery = Delivery::query()->with('order.payment')->findOrFail($id);
        if ($data['delivery_status'] === 'out_for_delivery' && $delivery->order->order_status !== 'out_for_delivery') {
            abort_unless(in_array('out_for_delivery', $orders->allowedNextStatuses($delivery->order->order_status), true), 422, 'অর্ডার স্ট্যাটাস ফ্লো সঠিক নয়।');
        }
        if ($data['delivery_status'] === 'delivered' && $delivery->order->order_status !== 'delivered') {
            abort_unless(in_array('delivered', $orders->allowedNextStatuses($delivery->order->order_status), true), 422, 'অর্ডার স্ট্যাটাস ফ্লো সঠিক নয়।');
        }

        $old = $delivery->toArray();
        $updates = ['delivery_status' => $data['delivery_status']];
        if ($data['delivery_status'] === 'picked_up') {
            $updates['picked_at'] = now();
        }
        if ($data['delivery_status'] === 'delivered') {
            $updates['delivered_at'] = now();
        }

        $delivery->update($updates);
        $activity->log($request, 'status_update', 'deliveries', $delivery->id, $old, $delivery->fresh()->toArray());

        if ($data['delivery_status'] === 'out_for_delivery' && $delivery->order->order_status === 'packed') {
            $orders->updateByStaff($delivery->order, 'out_for_delivery', $request->user(), $request->ip());
        }

        if ($data['delivery_status'] === 'delivered' && $delivery->order->order_status !== 'delivered') {
            $orders->updateByStaff($delivery->order, 'delivered', $request->user(), $request->ip());
        }

        DB::table('notifications')->insert([
            'user_id' => $delivery->order->user_id,
            'notification_type' => 'delivery_update',
            'title' => 'ডেলিভারি আপডেট',
            'message' => "আপনার {$delivery->order->order_number} অর্ডারের ডেলিভারি স্ট্যাটাস {$data['delivery_status']}।",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->ok($delivery->fresh()->load('order.user', 'rider'), 'ডেলিভারি স্ট্যাটাস আপডেট হয়েছে।');
    }
}
