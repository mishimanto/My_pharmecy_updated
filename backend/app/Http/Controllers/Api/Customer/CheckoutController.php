<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\DeliveryArea;
use App\Services\CouponService;
use App\Services\CheckoutService;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CheckoutController extends Controller
{
    use ApiResponse;

    public function store(Request $request, CheckoutService $checkout)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $data = $request->validate([
            'address_id' => ['required', 'exists:user_addresses,id'],
            'payment_method' => ['nullable', 'in:COD'],
            'prescription_id' => ['nullable', 'exists:prescriptions,id'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
        ]);

        abort_unless($request->user()->addresses()->whereKey($data['address_id'])->exists(), 403);

        $order = $checkout->checkout(
            Cart::firstOrCreate(['user_id' => $request->user()->id]),
            $data['address_id'],
            $data['payment_method'] ?? 'COD',
            $data['notes'] ?? null,
            $data['prescription_id'] ?? null,
        );

        return $this->ok($order, 'Order created successfully.', 201);
    }
}
