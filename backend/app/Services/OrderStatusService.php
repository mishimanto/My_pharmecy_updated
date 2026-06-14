<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Staff;
use Illuminate\Support\Facades\DB;

class OrderStatusService
{
    private const CUSTOMER_CANCELLABLE = ['pending_confirmation', 'prescription_review'];

    private const TRANSITIONS = [
        'pending_confirmation' => ['confirmed', 'cancelled'],
        'prescription_review' => ['pending_confirmation', 'confirmed', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['packed'],
        'packed' => ['out_for_delivery'],
        'out_for_delivery' => ['delivered'],
        'delivered' => ['returned', 'refunded'],
        'returned' => ['refunded'],
        'cancelled' => [],
        'refunded' => [],
    ];

    public function __construct(
        private InventoryService $inventory,
        private OrderCommunicationService $communication,
    ) {}

    public function cancelByCustomer(Order $order): Order
    {
        abort_unless(in_array($order->order_status, self::CUSTOMER_CANCELLABLE, true), 422, 'This order can no longer be cancelled.');

        return DB::transaction(function () use ($order) {
            $this->releaseReservedStock($order);
            $order->update([
                'order_status' => 'cancelled',
                'cancellation_reason' => 'Cancelled by customer before admin confirmation.',
                'cancelled_at' => now(),
            ]);

            $this->communication->notify(
                $order,
                'order_status_update',
                'Order cancelled',
                "Your order {$order->order_number} has been cancelled.",
                'Order cancelled',
                [
                    "Your order {$order->order_number} has been cancelled as requested.",
                    'If you still need the medicines, you can place a new order any time.',
                ],
            );

            return $order->fresh()->load($this->relations());
        });
    }

    public function updateByStaff(Order $order, string $status, Staff $staff, ?string $note = null, ?string $ipAddress = null): Order
    {
        abort_unless(in_array($status, $this->allowedNextStatuses($order->order_status), true), 422, 'The requested order status transition is not allowed.');
        abort_if($status === 'cancelled' && blank($note), 422, 'A cancellation reason is required.');
        abort_if($status === 'confirmed' && ! $this->canConfirmPrescriptionOrder($order), 422, $this->prescriptionConfirmationMessage($order));

        return DB::transaction(function () use ($order, $status, $staff, $note, $ipAddress) {
            $oldStatus = $order->order_status;
            $message = "Your order {$order->order_number} is now {$status}.";
            $emailLines = [$message];

            if ($status === 'cancelled') {
                $this->releaseReservedStock($order);
                if ($order->payment && $order->payment->payment_status !== 'paid') {
                    $order->payment->update(['payment_status' => 'cancelled']);
                    $order->payment_status = 'cancelled';
                }
                $message = "Your order {$order->order_number} has been cancelled. Reason: {$note}";
                $emailLines = [
                    "Your order {$order->order_number} has been cancelled by the admin team.",
                    "Reason: {$note}",
                ];
            }

            if ($status === 'delivered') {
                $this->markReservedStockSold($order);
                if ($order->payment_method === 'COD') {
                    $order->payment?->update([
                        'payment_status' => 'paid',
                        'paid_at' => now(),
                    ]);
                    $order->payment_status = 'paid';
                    $order = $this->communication->ensureMemo($order);
                }
            }

            if ($status === 'confirmed') {
                $order->confirmed_at = now();
                $order->confirmed_by_staff_id = $staff->id;
                $message = "Your order {$order->order_number} has been confirmed by the admin team.";
                $emailLines = [
                    "Your order {$order->order_number} has been confirmed by the admin team.",
                    $note ? "Note: {$note}" : 'We will start processing it shortly.',
                ];
            }

            $order->order_status = $status;
            $order->admin_note = $note;
            $order->cancellation_reason = $status === 'cancelled' ? $note : $order->cancellation_reason;
            $order->cancelled_at = $status === 'cancelled' ? now() : $order->cancelled_at;
            $order->cancelled_by_staff_id = $status === 'cancelled' ? $staff->id : $order->cancelled_by_staff_id;
            $order->save();

            DB::table('admin_activity_logs')->insert([
                'staff_id' => $staff->id,
                'action_type' => 'status_update',
                'module_name' => 'orders',
                'record_id' => $order->id,
                'old_value' => json_encode(['order_status' => $oldStatus], JSON_UNESCAPED_UNICODE),
                'new_value' => json_encode(['order_status' => $status, 'note' => $note], JSON_UNESCAPED_UNICODE),
                'ip_address' => $ipAddress,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->communication->notify(
                $order,
                'order_status_update',
                'Order status updated',
                $message,
                $status === 'cancelled' ? 'Order cancelled' : 'Order status updated',
                $emailLines,
            );

            return $order->fresh()->load($this->relations());
        });
    }

    public function allowedNextStatuses(string $status): array
    {
        return self::TRANSITIONS[$status] ?? [];
    }

    public function relations(): array
    {
        return ['user', 'address', 'deliveryArea', 'items.product', 'items.batches.batch', 'payment', 'delivery', 'prescription.reviews.reviewer'];
    }

    public function requiresPrescriptionReview(Order $order): bool
    {
        $order->loadMissing('items.product', 'prescription');

        return $order->items->contains(fn ($item) => (bool) $item->product?->requires_prescription)
            || $order->prescription !== null;
    }

    public function canConfirmPrescriptionOrder(Order $order): bool
    {
        if (! $this->requiresPrescriptionReview($order)) {
            return true;
        }

        if (! $order->prescription) {
            return false;
        }

        return $order->prescription_match_status === 'matched'
            && $order->prescription->status === 'approved';
    }

    public function prescriptionConfirmationMessage(Order $order): string
    {
        if (! $this->requiresPrescriptionReview($order) || ($order->prescription_match_status === 'matched' && $order->prescription?->status === 'approved')) {
            return 'This order is ready for confirmation.';
        }

        if (! $order->prescription) {
            return 'A linked prescription is required before this order can be confirmed.';
        }

        if ($order->prescription->status !== 'approved') {
            return 'Approve the linked prescription before confirming this order.';
        }

        return 'Mark the linked prescription as matched with the ordered medicines before confirming this order.';
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
}
