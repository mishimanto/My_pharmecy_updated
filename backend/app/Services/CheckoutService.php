<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\DeliveryArea;
use App\Models\Order;
use App\Models\Prescription;
use App\Support\Currency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutService
{
    public function __construct(
        private InventoryService $inventory,
        private OrderCommunicationService $communication,
        private CouponService $coupons,
    ) {}

    public function checkout(
        Cart $cart,
        ?int $addressId,
        int $deliveryAreaId,
        string $paymentMethod = 'COD',
        ?string $notes = null,
        ?int $prescriptionId = null,
        ?string $couponCode = null,
        ?string $guestToken = null,
        ?array $guestAddress = null,
    ): Order {
        return DB::transaction(function () use ($cart, $addressId, $deliveryAreaId, $paymentMethod, $notes, $prescriptionId, $couponCode, $guestToken, $guestAddress) {
            $cart->load('items.product');
            abort_if($cart->items->isEmpty(), 422, 'Cart is empty.');

            $deliveryArea = DeliveryArea::query()
                ->where('status', 'active')
                ->findOrFail($deliveryAreaId);

            $orderItems = collect();

            foreach ($cart->items as $cartItem) {
                abort_unless($cartItem->product->is_active, 422, "{$cartItem->product->product_name} is not active.");

                $pieceQuantity = max(1, (int) ($cartItem->piece_quantity ?: ($cartItem->quantity * max(1, $cartItem->pieces_per_unit))));
                $subtotal = Currency::whole($cartItem->quantity * $cartItem->unit_price);

                $allocations = $this->inventory->selectBatchesByFEFO($cartItem->product_id, $pieceQuantity)
                    ->map(fn ($allocation) => [
                        'batch' => $allocation['batch'],
                        'quantity' => $allocation['quantity'],
                        'unit_price' => Currency::whole($allocation['batch']->selling_price),
                    ]);

                $orderItems->push([
                    'product' => $cartItem->product,
                    'allocations' => $allocations,
                    'purchase_unit' => $cartItem->purchase_unit,
                    'purchase_quantity' => $cartItem->quantity,
                    'pieces_per_unit' => max(1, (int) $cartItem->pieces_per_unit),
                    'piece_quantity' => $pieceQuantity,
                    'unit_price' => Currency::whole($cartItem->unit_price),
                    'subtotal' => $subtotal,
                ]);
            }

            $requiresPrescription = $cart->items->contains(fn ($item) => (bool) $item->product->requires_prescription);
            $prescription = $this->resolvePrescription($cart->user_id, $guestToken, $requiresPrescription, $prescriptionId);
            $subtotal = Currency::whole($orderItems->sum('subtotal'));
            $delivery = Currency::whole($deliveryArea->delivery_charge);
            $pricing = $this->coupons->buildSummary($subtotal, $delivery, $couponCode);
            $order = Order::create([
                'user_id' => $cart->user_id,
                'address_id' => $addressId,
                'delivery_area_id' => $deliveryArea->id,
                'guest_token' => $cart->guest_token ?: $guestToken,
                'guest_full_name' => $addressId ? null : ($guestAddress['full_name'] ?? null),
                'guest_phone' => $addressId ? null : ($guestAddress['phone'] ?? null),
                'guest_email' => $addressId ? null : ($guestAddress['email'] ?? null),
                'guest_address_line_1' => $addressId ? null : ($guestAddress['address_line_1'] ?? null),
                'guest_address_line_2' => $addressId ? null : ($guestAddress['address_line_2'] ?? null),
                'guest_city' => $addressId ? null : $deliveryArea->city,
                'guest_area' => $addressId ? null : $deliveryArea->area_name,
                'guest_postal_code' => $addressId ? null : ($guestAddress['postal_code'] ?? null),
                'order_number' => $this->generateOrderNumber(),
                'order_date' => now(),
                'order_status' => $this->initialStatus($requiresPrescription, $prescription),
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentMethod === 'COD' ? 'pending' : 'awaiting_proof',
                'subtotal_amount' => $pricing['subtotal_amount'],
                'discount_amount' => $pricing['discount_amount'],
                'delivery_charge' => $pricing['delivery_charge'],
                'cod_fee' => 0,
                'total_amount' => $pricing['total_amount'],
                'notes' => $notes,
                'prescription_match_status' => $requiresPrescription ? 'pending' : null,
            ]);

            foreach ($orderItems as $item) {
                $orderItem = $order->items()->create([
                    'product_id' => $item['product']->id,
                    'purchase_unit' => $item['purchase_unit'],
                    'quantity' => $item['purchase_quantity'],
                    'pieces_per_unit' => $item['pieces_per_unit'],
                    'piece_quantity' => $item['piece_quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount' => 0,
                    'subtotal' => $item['subtotal'],
                ]);

                foreach ($item['allocations'] as $allocation) {
                    $orderItem->batches()->create([
                        'batch_id' => $allocation['batch']->id,
                        'quantity' => $allocation['quantity'],
                        'unit_price' => $allocation['unit_price'],
                        'subtotal' => Currency::whole($allocation['quantity'] * $allocation['unit_price']),
                    ]);

                    $this->inventory->reserveStock($allocation['batch']->id, $allocation['quantity'], 'order_item', $orderItem->id);
                }
            }

            $order->payment()->create([
                'payment_method' => $paymentMethod,
                'amount' => $order->total_amount,
                'payment_status' => $paymentMethod === 'COD' ? 'pending' : 'awaiting_proof',
            ]);

            if ($prescription) {
                $prescription->update(['order_id' => $order->id]);
            }

            $this->communication->notify(
                $order,
                'order_status_update',
                'Order received',
                "Your order {$order->order_number} has been received and is waiting for admin confirmation.",
                'Order received',
                [
                    "We received your order {$order->order_number}.",
                    $paymentMethod === 'COD'
                        ? 'Cash on delivery has been selected. No advance payment is required.'
                        : 'Please submit your payment proof from the payment page so the admin can review it.',
                    'The order will move forward after admin confirmation.',
                ],
            );

            $cart->items()->delete();

            return $order->load('user', 'address', 'deliveryArea', 'items.product', 'items.batches.batch', 'payment', 'delivery');
        });
    }

    private function resolvePrescription(?int $userId, ?string $guestToken, bool $required, ?int $prescriptionId): ?Prescription
    {
        if (! $required && ! $prescriptionId) {
            return null;
        }

        abort_if($required && ! $prescriptionId, 422, 'A prescription is required for this order.');

        $prescription = Prescription::query()
            ->when($userId, fn ($query) => $query->where('user_id', $userId))
            ->when(! $userId, fn ($query) => $query->where('guest_token', $guestToken))
            ->findOrFail($prescriptionId);

        abort_if($prescription->status === 'rejected', 422, 'The selected prescription was rejected.');
        abort_if($prescription->status === 'need_clarification', 422, 'The selected prescription needs clarification.');

        return $prescription;
    }

    private function initialStatus(bool $requiresPrescription, ?Prescription $prescription): string
    {
        if ($requiresPrescription) {
            return 'prescription_review';
        }

        return 'pending_confirmation';
    }

    private function generateOrderNumber(): string
    {
        do {
            $candidate = 'ORD-' . Str::upper(Str::random(6));
        } while (Order::query()->where('order_number', $candidate)->exists());

        return $candidate;
    }
}
