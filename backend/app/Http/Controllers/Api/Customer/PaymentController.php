<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use ApiResponse;

    public function cod(Request $request, int $id)
    {
        $order = $request->user()->hasMany(Order::class)->with('payment')->findOrFail($id);
        abort_unless($order->payment_method === 'COD', 422, 'এই অর্ডারের পেমেন্ট COD নয়।');

        $payment = $order->payment ?: $order->payment()->create([
            'payment_method' => 'COD',
            'amount' => $order->total_amount,
            'payment_status' => 'pending',
        ]);

        return $this->ok([
            'payment' => $payment,
            'placeholders' => [
                'bkash' => 'শিগগিরই আসছে',
                'nagad' => 'শিগগিরই আসছে',
                'card' => 'শিগগিরই আসছে',
                'sslcommerz' => 'শিগগিরই আসছে',
            ],
        ], 'COD পেমেন্ট পেন্ডিং আছে। ডেলিভারির সময় পরিশোধ করুন।');
    }
}
