<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    use ApiResponse;

    public function cod(Request $request, string $id, ShopperContextService $shopper)
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

    public function submitProof(Request $request, string $id, ShopperContextService $shopper)
    {
        $order = $this->customerOrder($request, $id, $shopper);

        abort_unless($order->payment_requires_proof, 422, 'Payment proof is only required for full-payment orders.');
        abort_unless(
            in_array($order->order_status, ['pending_confirmation', 'prescription_review', 'confirmed'], true),
            422,
            'Payment proof can only be submitted before delivery processing starts.'
        );
        abort_unless(
            in_array($order->payment_status, ['pending', 'awaiting_proof', 'failed', 'rejected'], true),
            422,
            'Payment proof is not ready for resubmission.'
        );

        $data = $request->validate([
            'transaction_id' => ['required', 'string', 'max:255'],
            'payment_screenshot' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $payment = $order->payment ?: $order->payment()->create([
            'payment_method' => $order->payment_method,
            'amount' => $order->total_amount,
            'payment_status' => 'awaiting_proof',
        ]);

        $oldProofPath = $payment->payment_proof_path;
        $path = $request->hasFile('payment_screenshot')
            ? $request->file('payment_screenshot')->store('payment-proofs', 'public')
            : $oldProofPath;

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

        if ($request->hasFile('payment_screenshot') && $oldProofPath && $oldProofPath !== $path) {
            Storage::disk('public')->delete($oldProofPath);
        }

        return $this->ok(
            $order->fresh()->load('payment'),
            'Payment proof submitted successfully. We will verify it shortly.'
        );
    }

    private function customerOrder(Request $request, string $id, ShopperContextService $shopper): Order
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        return Order::query()
            ->with('payment')
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken))
            ->where(fn ($query) => ctype_digit($id)
                ? $query->whereKey((int) $id)->orWhere('order_number', $id)
                : $query->where('order_number', $id))
            ->firstOrFail();
    }
}
