<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Staff;
use Illuminate\Support\Facades\DB;

class OrderStatusService
{
    private const CUSTOMER_CANCELLABLE = ['pending', 'prescription_review', 'confirmed'];

    private const TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'prescription_review' => ['confirmed', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['packed'],
        'packed' => ['out_for_delivery'],
        'out_for_delivery' => ['delivered'],
        'delivered' => ['returned', 'refunded'],
        'returned' => ['refunded'],
        'cancelled' => [],
        'refunded' => [],
    ];

    public function __construct(private InventoryService $inventory) {}

    public function cancelByCustomer(Order $order): Order
    {
        abort_unless(in_array($order->order_status, self::CUSTOMER_CANCELLABLE, true), 422, 'এই অর্ডার আর বাতিল করা যাবে না।');

        return DB::transaction(function () use ($order) {
            $this->releaseReservedStock($order);
            $oldStatus = $order->order_status;
            $order->update(['order_status' => 'cancelled']);
            $this->notify($order, 'অর্ডার বাতিল হয়েছে', "আপনার অর্ডার {$order->order_number} বাতিল করা হয়েছে।");

            return $order->fresh()->load($this->relations());
        });
    }

    public function updateByStaff(Order $order, string $status, Staff $staff, ?string $ipAddress = null): Order
    {
        abort_unless(in_array($status, $this->allowedNextStatuses($order->order_status), true), 422, 'অর্ডার স্ট্যাটাস ফ্লো সঠিক নয়।');

        return DB::transaction(function () use ($order, $status, $staff, $ipAddress) {
            $oldStatus = $order->order_status;

            if ($status === 'cancelled') {
                $this->releaseReservedStock($order);
            }

            if ($status === 'delivered') {
                $this->markReservedStockSold($order);
                if ($order->payment_method === 'COD') {
                    $order->payment?->update([
                        'payment_status' => 'paid',
                        'paid_at' => now(),
                    ]);
                    $order->payment_status = 'paid';
                }
            }

            $order->order_status = $status;
            $order->save();

            DB::table('admin_activity_logs')->insert([
                'staff_id' => $staff->id,
                'action_type' => 'status_update',
                'module_name' => 'orders',
                'record_id' => $order->id,
                'old_value' => json_encode(['order_status' => $oldStatus], JSON_UNESCAPED_UNICODE),
                'new_value' => json_encode(['order_status' => $status], JSON_UNESCAPED_UNICODE),
                'ip_address' => $ipAddress,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->notify($order, 'অর্ডার স্ট্যাটাস আপডেট', "আপনার অর্ডার {$order->order_number} এখন {$status}।");

            return $order->fresh()->load($this->relations());
        });
    }

    public function allowedNextStatuses(string $status): array
    {
        return self::TRANSITIONS[$status] ?? [];
    }

    public function relations(): array
    {
        return ['user', 'address', 'items.product', 'items.batches.batch', 'payment', 'delivery'];
    }

    private function releaseReservedStock(Order $order): void
    {
        $order->loadMissing('items.batches');
        foreach ($order->items as $item) {
            foreach ($item->batches as $allocation) {
                $this->inventory->releaseReservedStock($allocation->batch_id, $allocation->quantity, 'order_item', $item->id);
            }
        }
    }

    private function markReservedStockSold(Order $order): void
    {
        $order->loadMissing('items.batches', 'payment');
        foreach ($order->items as $item) {
            foreach ($item->batches as $allocation) {
                $this->inventory->markStockSold($allocation->batch_id, $allocation->quantity, 'order_item', $item->id);
            }
        }
    }

    private function notify(Order $order, string $title, string $message): void
    {
        if (! $order->user_id) {
            return;
        }

        DB::table('notifications')->insert([
            'user_id' => $order->user_id,
            'notification_type' => 'order_status_update',
            'title' => $title,
            'message' => $message,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
