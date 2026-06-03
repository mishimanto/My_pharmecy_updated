<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class DeliveryTrackingController extends Controller
{
    use ApiResponse;

    public function show(Request $request, int $orderId)
    {
        $order = $request->user()->hasMany(\App\Models\Order::class)->with('delivery.rider')->findOrFail($orderId);

        return $this->ok([
            'order_number' => $order->order_number,
            'order_status' => $order->order_status,
            'delivery' => $order->delivery,
        ], 'ডেলিভারি ট্র্যাকিং পাওয়া গেছে।');
    }
}
