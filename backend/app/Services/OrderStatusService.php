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
        'prescription_review' => ['pending_confirmation', 'cancelled'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['delivered'],
        'delivered' => ['returned', 'refunded'],
        'returned' => ['refunded'],
        'cancelled' => [],
        'refunded' => [],
    ];

    public function __construct(
        private InventoryService $inventory,
        private OrderCommunicationService $communication,
        private RewardService $rewards,
    ) {}

    public function cancelByCustomer(Order $order): Order
    {
        $order->loadMissing('delivery');

        abort_unless(in_array($order->order_status, self::CUSTOMER_CANCELLABLE, true), 422, 'This order can no longer be cancelled.');
        abort_if($order->delivery, 422, 'This order already has a delivery record and can no longer be cancelled.');

        return DB::transaction(function () use ($order) {
            $this->releaseReservedStock($order);
            $order->update([
                'order_status' => 'cancelled',
                'cancellation_reason' => 'Cancelled by customer before confirmation.',
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
                    'If you still need the products, you can place a new order any time.',
                ],
            );

            return $order->fresh()->load($this->relations());
        });
    }

    public function updateByStaff(Order $order, string $status, Staff $staff, ?string $note = null, ?string $ipAddress = null): Order
    {
        $order->loadMissing('delivery', 'payment');

        abort_unless(in_array($status, $this->allowedNextStatuses($order->order_status), true), 422, 'The requested order status transition is not allowed.');
        abort_if($status === 'cancelled' && blank($note), 422, 'A cancellation reason is required.');
        abort_if($status === 'cancelled' && $order->delivery, 422, 'This order already has a delivery record and can no longer be cancelled.');
        abort_if($status === 'pending_confirmation' && $order->order_status === 'prescription_review' && ! $this->canConfirmPrescriptionOrder($order), 422, $this->prescriptionConfirmationMessage($order));
        abort_if($status === 'confirmed' && ! $this->canConfirmOrder($order), 422, $this->confirmationBlockMessage($order));
        abort_if($status === 'delivered' && ! $this->canMarkOrderDelivered($order), 422, $this->deliveredBlockMessage($order));

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
                    "Your order {$order->order_number} has been cancelled.",
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
                $order = $this->communication->ensureMemo($order);
                $message = "Your order {$order->order_number} has been confirmed.";
                $emailLines = [
                    "Your order {$order->order_number} has been confirmed.",
                    $order->payment_requires_proof
                        ? 'Your payment has been verified and your invoice is attached with this email.'
                        : 'Your invoice has been prepared and will be handed over when you receive the delivery.',
                    $note ? "Note: {$note}" : 'We will prepare your order for delivery shortly.',
                ];
            }

            $order->order_status = $status;
            $order->admin_note = $note;
            $order->cancellation_reason = $status === 'cancelled' ? $note : $order->cancellation_reason;
            $order->cancelled_at = $status === 'cancelled' ? now() : $order->cancelled_at;
            $order->cancelled_by_staff_id = $status === 'cancelled' ? $staff->id : $order->cancelled_by_staff_id;
            $order->save();
            $this->syncDeliveryStatusFromOrder($order, $status);

            if ($status === 'delivered') {
                $this->rewards->awardOrderPoints($order);
            }

            if ($status === 'refunded') {
                $this->rewards->reverseOrderPoints($order);
            }

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
                $status === 'confirmed' ? 'Order confirmed' : 'Order status updated',
                $message,
                $status === 'cancelled' ? 'Order cancelled' : ($status === 'confirmed' ? 'Order confirmed' : 'Order status updated'),
                $emailLines,
                $status === 'confirmed' && $order->payment_requires_proof && $order->payment_status === 'paid',
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

    public function canConfirmOrder(Order $order): bool
    {
        $order->loadMissing('payment');

        return $this->canConfirmPrescriptionOrder($order)
            && $this->hasRequiredPaymentVerification($order);
    }

    public function hasRequiredPaymentVerification(Order $order): bool
    {
        $paymentMethod = strtoupper((string) $order->payment_method);

        if ($paymentMethod === 'COD') {
            return true;
        }

        return $order->payment_status === 'paid';
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

        return 'Mark the linked prescription as matched with the ordered products before confirming this order.';
    }

    public function confirmationBlockMessage(Order $order): string
    {
        if (! $this->hasRequiredPaymentVerification($order)) {
            return 'Verify the full payment and mark it as paid before confirming this order.';
        }

        return $this->prescriptionConfirmationMessage($order);
    }

    public function canMarkOrderDelivered(Order $order): bool
    {
        $order->loadMissing('delivery');

        if (! $order->delivery) {
            return false;
        }

        return in_array($order->delivery->delivery_status, ['pending', 'delivered'], true);
    }

    public function deliveredBlockMessage(Order $order): string
    {
        $order->loadMissing('delivery');

        if (! $order->delivery) {
            return 'Create a delivery record before marking this order as delivered.';
        }

        return 'The linked delivery must stay active before marking the order as delivered.';
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

    private function syncDeliveryStatusFromOrder(Order $order, string $status): void
    {
        if (! $order->delivery) {
            return;
        }

        $updates = match ($status) {
            'delivered' => [
                'delivery_status' => 'delivered',
                'delivered_at' => $order->delivery->delivered_at ?: now(),
            ],
            'returned', 'refunded' => ['delivery_status' => 'returned'],
            default => null,
        };

        if ($updates) {
            $order->delivery->update($updates);
        }
    }
}
