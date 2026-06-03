<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Prescription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutService
{
    public function __construct(private InventoryService $inventory) {}

    public function checkout(Cart $cart, int $addressId, string $paymentMethod = 'COD', ?string $notes = null, ?int $prescriptionId = null): Order
    {
        return DB::transaction(function () use ($cart, $addressId, $paymentMethod, $notes, $prescriptionId) {
            $cart->load('items.product');
            abort_if($cart->items->isEmpty(), 422, 'কার্ট খালি।');

            $orderItems = collect();
            foreach ($cart->items as $cartItem) {
                abort_unless($cartItem->product->is_active, 422, "{$cartItem->product->product_name} সক্রিয় নয়।");

                $allocations = $this->inventory->selectBatchesByFEFO($cartItem->product_id, $cartItem->quantity)
                    ->map(fn ($allocation) => [
                        'batch' => $allocation['batch'],
                        'quantity' => $allocation['quantity'],
                        'unit_price' => $allocation['batch']->selling_price,
                    ]);

                $orderItems->push([
                    'cart_item' => $cartItem,
                    'product' => $cartItem->product,
                    'allocations' => $allocations,
                    'unit_price' => $allocations->first()['unit_price'],
                    'subtotal' => $allocations->sum(fn ($allocation) => $allocation['quantity'] * $allocation['unit_price']),
                ]);
            }

            $requiresPrescription = $cart->items->contains(fn ($item) => (bool) $item->product->requires_prescription);
            $prescription = $this->resolvePrescription($cart->user_id, $requiresPrescription, $prescriptionId);
            $subtotal = $orderItems->sum('subtotal');
            $delivery = 60;

            $order = Order::create([
                'user_id' => $cart->user_id,
                'address_id' => $addressId,
                'order_number' => 'PH-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6)),
                'order_date' => now(),
                'order_status' => $this->initialStatus($requiresPrescription, $prescription),
                'payment_method' => $paymentMethod,
                'payment_status' => 'pending',
                'subtotal_amount' => $subtotal,
                'discount_amount' => 0,
                'delivery_charge' => $delivery,
                'total_amount' => $subtotal + $delivery,
                'notes' => $notes,
            ]);

            foreach ($orderItems as $item) {
                $orderItem = $order->items()->create([
                    'product_id' => $item['product']->id,
                    'quantity' => $item['cart_item']->quantity,
                    'unit_price' => $item['unit_price'],
                    'discount' => 0,
                    'subtotal' => $item['subtotal'],
                ]);

                foreach ($item['allocations'] as $allocation) {
                    $orderItem->batches()->create([
                        'batch_id' => $allocation['batch']->id,
                        'quantity' => $allocation['quantity'],
                        'unit_price' => $allocation['unit_price'],
                        'subtotal' => $allocation['quantity'] * $allocation['unit_price'],
                    ]);

                    $this->inventory->reserveStock($allocation['batch']->id, $allocation['quantity'], 'order_item', $orderItem->id);
                }
            }

            $order->payment()->create([
                'payment_method' => $paymentMethod,
                'amount' => $order->total_amount,
                'payment_status' => 'pending',
            ]);

            if ($prescription) {
                $prescription->update(['order_id' => $order->id]);
            }

            DB::table('notifications')->insert([
                'user_id' => $cart->user_id,
                'notification_type' => 'order_status_update',
                'title' => 'অর্ডার করা হয়েছে',
                'message' => "আপনার অর্ডার {$order->order_number} গ্রহণ করা হয়েছে।",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $cart->items()->delete();

            return $order->load('items.product', 'items.batches.batch', 'payment', 'delivery');
        });
    }

    private function resolvePrescription(int $userId, bool $required, ?int $prescriptionId): ?Prescription
    {
        if (!$required && !$prescriptionId) {
            return null;
        }

        abort_if($required && !$prescriptionId, 422, 'প্রেসক্রিপশন আবশ্যক।');

        $prescription = Prescription::query()
            ->where('user_id', $userId)
            ->findOrFail($prescriptionId);

        abort_if($prescription->status === 'rejected', 422, 'প্রেসক্রিপশন বাতিল করা হয়েছে।');
        abort_if($prescription->status === 'need_clarification', 422, 'প্রেসক্রিপশনে আরও তথ্য দরকার।');

        return $prescription;
    }

    private function initialStatus(bool $requiresPrescription, ?Prescription $prescription): string
    {
        if ($requiresPrescription && $prescription?->status === 'pending') {
            return 'prescription_review';
        }

        if ($requiresPrescription && $prescription?->status === 'approved') {
            return 'confirmed';
        }

        return 'pending';
    }
}
