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

    private const STATUS_TRANSITIONS = [
        'pending' => ['delivered', 'failed', 'returned'],
        'delivered' => ['returned'],
        'failed' => ['pending', 'returned'],
        'returned' => [],
    ];

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
                    ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', "%{$search}%"));
            });
        }

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'Delivery list loaded successfully.');
    }

    public function show(int $id)
    {
        return $this->ok(
            Delivery::query()->with('order.user', 'order.items.product', 'rider')->findOrFail($id),
            'Delivery details loaded successfully.'
        );
    }

    public function createForOrder(Request $request, int $id, AdminActivityService $activity, OrderStatusService $orders)
    {
        $order = Order::query()->with('delivery')->findOrFail($id);

        abort_unless(
            in_array($order->order_status, ['confirmed', 'processing'], true),
            422,
            'Move the order into active processing before creating a delivery record.'
        );

        if ($order->delivery) {
            return $this->ok($order->delivery->load('order.user', 'rider'), 'A delivery record already exists for this order.');
        }

        if ($order->order_status === 'confirmed') {
            $order = $orders->updateByStaff($order, 'processing', $request->user(), 'Delivery created.', $request->ip());
        }

        $delivery = $order->delivery()->create([
            'delivery_charge' => $order->delivery_charge,
            'tracking_no' => 'TRK-' . Str::upper(Str::random(8)),
            'delivery_status' => 'pending',
        ]);

        $activity->log($request, 'create', 'deliveries', $delivery->id, null, $delivery->toArray());

        return $this->ok($delivery->load('order.user', 'rider'), 'Delivery created successfully.', 201);
    }

    public function status(Request $request, int $id, AdminActivityService $activity, OrderStatusService $orders)
    {
        $data = $request->validate([
            'delivery_status' => ['required', 'in:pending,delivered,failed,returned'],
        ]);

        $delivery = Delivery::query()->with('order.payment')->findOrFail($id);

        abort_unless(
            $this->isAllowedDeliveryTransition($delivery->delivery_status, $data['delivery_status']),
            422,
            'The requested delivery status transition is not allowed.'
        );

        if ($data['delivery_status'] === 'delivered' && $delivery->order->order_status !== 'delivered') {
            if ($delivery->order->order_status === 'confirmed') {
                $orders->updateByStaff($delivery->order, 'processing', $request->user(), 'Delivery started.', $request->ip());
                $delivery->load('order.payment');
            }

            abort_unless(
                in_array('delivered', $orders->allowedNextStatuses($delivery->order->order_status), true),
                422,
                'The order status flow is not ready for delivered.'
            );
        }

        $old = $delivery->toArray();
        $updates = ['delivery_status' => $data['delivery_status']];

        if ($data['delivery_status'] === 'delivered') {
            $updates['delivered_at'] = now();
        }

        if ($data['delivery_status'] === 'pending') {
            $updates['delivered_at'] = null;
        }

        $delivery->update($updates);
        $activity->log($request, 'status_update', 'deliveries', $delivery->id, $old, $delivery->fresh()->toArray());

        if ($data['delivery_status'] === 'delivered' && $delivery->order->order_status !== 'delivered') {
            $delivery->load('order.payment', 'order.delivery');
            $orders->updateByStaff($delivery->order, 'delivered', $request->user(), null, $request->ip());
        }

        DB::table('notifications')->insert([
            'user_id' => $delivery->order->user_id,
            'notification_type' => 'delivery_update',
            'title' => 'Delivery update',
            'message' => "Your {$delivery->order->order_number} delivery status is now {$data['delivery_status']}.",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->ok($delivery->fresh()->load('order.user', 'rider'), 'Delivery status updated successfully.');
    }

    private function isAllowedDeliveryTransition(string $currentStatus, string $nextStatus): bool
    {
        if ($currentStatus === $nextStatus) {
            return true;
        }

        return in_array($nextStatus, self::STATUS_TRANSITIONS[$currentStatus] ?? [], true);
    }
}
