<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class DeliveryTrackingController extends Controller
{
    use ApiResponse;

    public function show(Request $request, int $orderId, ShopperContextService $shopper)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $order = Order::query()
            ->with('delivery.rider')
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken))
            ->findOrFail($orderId);

        return $this->ok([
            'order_number' => $order->order_number,
            'order_status' => $order->order_status,
            'delivery' => $order->delivery,
        ], 'Delivery tracking loaded successfully.');
    }
}
