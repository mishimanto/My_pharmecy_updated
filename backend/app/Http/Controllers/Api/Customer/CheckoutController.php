<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\CheckoutService;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CheckoutController extends Controller
{
    use ApiResponse;

    public function store(Request $request, CheckoutService $checkout, ShopperContextService $shopper)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $data = $request->validate([
            'address_id' => ['nullable', 'exists:user_addresses,id'],
            'payment_method' => ['nullable', 'in:COD'],
            'prescription_id' => ['nullable', 'exists:prescriptions,id'],
            'notes' => ['nullable', 'string'],
            'delivery_address' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'array'],
            'delivery_address.full_name' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'string', 'max:255'],
            'delivery_address.phone' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'string', 'max:255'],
            'delivery_address.address_line_1' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'string', 'max:255'],
            'delivery_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'delivery_address.city' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'string', 'max:255'],
            'delivery_address.area' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'string', 'max:255'],
            'delivery_address.postal_code' => ['nullable', 'string', 'max:255'],
        ]);

        $addressId = null;
        $deliveryAddress = null;

        if ($user && ! empty($data['address_id'])) {
            abort_unless($user->addresses()->whereKey($data['address_id'])->exists(), 403);
            $addressId = (int) $data['address_id'];
        } else {
            $deliveryAddress = $data['delivery_address'] ?? null;
        }

        $cart = $user
            ? Cart::firstOrCreate(['user_id' => $user->id])
            : Cart::firstOrCreate(['guest_token' => $guestToken]);

        $order = $checkout->checkout(
            $cart,
            $addressId,
            $data['payment_method'] ?? 'COD',
            $data['notes'] ?? null,
            $data['prescription_id'] ?? null,
            $guestToken,
            $deliveryAddress,
        );

        return $this->ok($order, 'Order created successfully.', 201);
    }
}
