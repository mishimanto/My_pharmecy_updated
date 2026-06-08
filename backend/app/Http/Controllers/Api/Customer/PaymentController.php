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
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $order = Order::query()
            ->with('payment')
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken))
            ->findOrFail($id);

        abort_unless($order->payment_method === 'COD', 422, 'This order is not using COD.');

        $payment = $order->payment ?: $order->payment()->create([
            'payment_method' => 'COD',
            'amount' => $order->total_amount,
            'payment_status' => 'pending',
        ]);

        return $this->ok([
            'payment' => $payment,
            'placeholders' => [
                'bkash' => 'Coming soon',
                'nagad' => 'Coming soon',
                'card' => 'Coming soon',
                'sslcommerz' => 'Coming soon',
            ],
        ], 'COD payment remains pending until delivery.');
    }
}
