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

    public function quote(Request $request, ShopperContextService $shopper, CouponService $coupons)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $data = $request->validate([
            'delivery_area_id' => ['nullable', 'exists:delivery_areas,id'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
        ]);

        $cart = $user
            ? Cart::firstOrCreate(['user_id' => $user->id])
            : Cart::firstOrCreate(['guest_token' => $guestToken]);

        $cart->load('items');

        $subtotal = (float) $cart->items->sum(fn ($item) => (float) $item->quantity * (float) $item->unit_price);
        $deliveryArea = ! empty($data['delivery_area_id'])
            ? DeliveryArea::query()->where('status', 'active')->findOrFail($data['delivery_area_id'])
            : null;

        $summary = $coupons->buildSummary(
            $subtotal,
            (float) ($deliveryArea?->delivery_charge ?? 0),
            $data['coupon_code'] ?? null,
        );

        return $this->ok([
            ...$summary,
            'delivery_area_id' => $deliveryArea?->id,
        ], 'Checkout summary loaded successfully.');
    }

    public function store(Request $request, CheckoutService $checkout, ShopperContextService $shopper)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $data = $request->validate([
            'address_id' => ['nullable', 'exists:user_addresses,id'],
            'delivery_area_id' => ['required', 'exists:delivery_areas,id'],
            'payment_method' => ['nullable', 'in:COD,BKASH,NAGAD'],
            'prescription_id' => ['nullable', 'exists:prescriptions,id'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'delivery_address' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'array'],
            'delivery_address.full_name' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'string', 'max:255'],
            'delivery_address.phone' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'string', 'max:255'],
            'delivery_address.email' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'email', 'max:255'],
            'delivery_address.address_line_1' => [Rule::requiredIf(! $user || ! $request->filled('address_id')), 'string', 'max:255'],
            'delivery_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'delivery_address.postal_code' => ['nullable', 'string', 'max:255'],
        ]);

        $deliveryArea = DeliveryArea::query()
            ->where('status', 'active')
            ->findOrFail($data['delivery_area_id']);

        $addressId = null;
        $deliveryAddress = null;

        if ($user && ! empty($data['address_id'])) {
            $address = $user->addresses()->whereKey($data['address_id'])->firstOrFail();
            abort_unless(
                strcasecmp((string) $address->area, (string) $deliveryArea->area_name) === 0
                && strcasecmp((string) $address->city, (string) $deliveryArea->city) === 0,
                422,
                'The selected saved address is outside the active delivery area.'
            );
            $addressId = (int) $data['address_id'];
        } else {
            $deliveryAddress = $data['delivery_address'] ?? null;
        }

        $cart = $user
            ? Cart::firstOrCreate(['user_id' => $user->id])
            : Cart::firstOrCreate(['guest_token' => $guestToken]);

        abort_if(
            ! $user && $cart->items()->whereHas('product', fn ($query) => $query->where('requires_prescription', true))->exists(),
            403,
            'Please login before checking out prescription medicines.'
        );

        $order = $checkout->checkout(
            $cart,
            $addressId,
            (int) $data['delivery_area_id'],
            $data['payment_method'] ?? 'COD',
            $data['notes'] ?? null,
            $data['prescription_id'] ?? null,
            $data['coupon_code'] ?? null,
            $guestToken,
            $deliveryAddress,
        );

        return $this->ok($order, 'Order created successfully.', 201);
    }
}
