<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use ApiResponse;

    public function cod(Request $request, int $id, ShopperContextService $shopper)
    {
        $order = $this->customerOrder($request, $id, $shopper);

        abort_unless($order->payment_method === 'COD', 422, 'This order is not using cash on delivery.');

        $payment = $order->payment ?: $order->payment()->create([
            'payment_method' => 'COD',
            'amount' => $order->total_amount,
            'payment_status' => 'pending',
        ]);

        return $this->ok([
            'payment' => $payment,
            'message' => 'No advance payment is needed. The invoice will be handed over during delivery.',
        ], 'COD payment remains pending until delivery.');
    }

    public function submitProof(Request $request, int $id, ShopperContextService $shopper)
    {
        $order = $this->customerOrder($request, $id, $shopper);

        abort_if($order->payment_method === 'COD', 422, 'Payment proof is only required for full-payment orders.');

        $data = $request->validate([
            'transaction_id' => ['required', 'string', 'max:255'],
            'payment_screenshot' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $request->hasFile('payment_screenshot')
            ? $request->file('payment_screenshot')->store('payment-proofs', 'public')
            : null;

        $payment = $order->payment ?: $order->payment()->create([
            'payment_method' => $order->payment_method,
            'amount' => $order->total_amount,
            'payment_status' => 'awaiting_proof',
        ]);

        $payment->update([
            'transaction_id' => $data['transaction_id'],
            'payment_proof_path' => $path,
            'proof_submitted_at' => now(),
            'payment_status' => 'under_review',
            'reviewed_note' => null,
            'reviewed_at' => null,
            'reviewed_by_staff_id' => null,
        ]);

        $order->update(['payment_status' => 'under_review']);

        return $this->ok(
            $order->fresh()->load('payment'),
            'Payment proof submitted successfully. The admin team will verify it.'
        );
    }

    private function customerOrder(Request $request, int $id, ShopperContextService $shopper): Order
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        return Order::query()
            ->with('payment')
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken))
            ->findOrFail($id);
    }
}
