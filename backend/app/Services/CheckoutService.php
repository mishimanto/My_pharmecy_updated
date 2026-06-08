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

    public function checkout(
        Cart $cart,
        ?int $addressId,
        string $paymentMethod = 'COD',
        ?string $notes = null,
        ?int $prescriptionId = null,
        ?string $guestToken = null,
        ?array $guestAddress = null,
    ): Order {
        return DB::transaction(function () use ($cart, $addressId, $paymentMethod, $notes, $prescriptionId, $guestToken, $guestAddress) {
            $cart->load('items.product');
            abort_if($cart->items->isEmpty(), 422, 'Cart is empty.');

            $orderItems = collect();

            foreach ($cart->items as $cartItem) {
                abort_unless($cartItem->product->is_active, 422, "{$cartItem->product->product_name} is not active.");

                $pieceQuantity = max(1, (int) ($cartItem->piece_quantity ?: ($cartItem->quantity * max(1, $cartItem->pieces_per_unit))));
                $subtotal = round($cartItem->quantity * $cartItem->unit_price, 2);

                $allocations = $this->inventory->selectBatchesByFEFO($cartItem->product_id, $pieceQuantity)
                    ->map(fn ($allocation) => [
                        'batch' => $allocation['batch'],
                        'quantity' => $allocation['quantity'],
                        'unit_price' => $allocation['batch']->selling_price,
                    ]);

                $orderItems->push([
                    'product' => $cartItem->product,
                    'allocations' => $allocations,
                    'purchase_unit' => $cartItem->purchase_unit,
                    'purchase_quantity' => $cartItem->quantity,
                    'pieces_per_unit' => max(1, (int) $cartItem->pieces_per_unit),
                    'piece_quantity' => $pieceQuantity,
                    'unit_price' => (float) $cartItem->unit_price,
                    'subtotal' => $subtotal,
                ]);
            }

            $requiresPrescription = $cart->items->contains(fn ($item) => (bool) $item->product->requires_prescription);
            $prescription = $this->resolvePrescription($cart->user_id, $guestToken, $requiresPrescription, $prescriptionId);
            $subtotal = $orderItems->sum('subtotal');
            $delivery = 60;

            $order = Order::create([
                'user_id' => $cart->user_id,
                'address_id' => $addressId,
                'guest_token' => $cart->guest_token ?: $guestToken,
                'guest_full_name' => $addressId ? null : ($guestAddress['full_name'] ?? null),
                'guest_phone' => $addressId ? null : ($guestAddress['phone'] ?? null),
                'guest_address_line_1' => $addressId ? null : ($guestAddress['address_line_1'] ?? null),
                'guest_address_line_2' => $addressId ? null : ($guestAddress['address_line_2'] ?? null),
                'guest_city' => $addressId ? null : ($guestAddress['city'] ?? null),
                'guest_area' => $addressId ? null : ($guestAddress['area'] ?? null),
                'guest_postal_code' => $addressId ? null : ($guestAddress['postal_code'] ?? null),
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

            if ($cart->user_id) {
                DB::table('notifications')->insert([
                    'user_id' => $cart->user_id,
                    'notification_type' => 'order_status_update',
                    'title' => 'Order placed',
                    'message' => "Your order {$order->order_number} has been received.",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $cart->items()->delete();

            return $order->load('user', 'address', 'items.product', 'items.batches.batch', 'payment', 'delivery');
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
        if ($requiresPrescription && $prescription?->status === 'pending') {
            return 'prescription_review';
        }

        if ($requiresPrescription && $prescription?->status === 'approved') {
            return 'confirmed';
        }

        return 'pending';
    }
}
