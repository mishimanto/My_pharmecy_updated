<?php

namespace App\Services;

use App\Support\Currency;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function buildSummary(float $subtotal, float $deliveryCharge, ?string $couponCode = null): array
    {
        $subtotal = Currency::whole($subtotal);
        $deliveryCharge = Currency::whole($deliveryCharge);
        $normalizedCode = $this->normalize($couponCode);
        $coupon = null;
        $discountAmount = 0.0;

        if ($normalizedCode !== null) {
            $coupon = $this->resolve($normalizedCode);

            if (! $coupon) {
                throw ValidationException::withMessages([
                    'coupon_code' => 'The coupon code is invalid.',
                ]);
            }

            $minimumSubtotal = (float) ($coupon['min_subtotal'] ?? 0);

            if ($minimumSubtotal > 0 && $subtotal < $minimumSubtotal) {
                throw ValidationException::withMessages([
                    'coupon_code' => "This coupon needs at least Tk {$minimumSubtotal} subtotal.",
                ]);
            }

            $discountAmount = match ($coupon['type'] ?? 'fixed') {
                'percent' => Currency::whole($subtotal * ((float) ($coupon['amount'] ?? 0) / 100)),
                'free_delivery' => Currency::whole($deliveryCharge),
                default => Currency::whole($coupon['amount'] ?? 0),
            };

            if (($coupon['type'] ?? 'fixed') !== 'free_delivery') {
                $discountAmount = min($discountAmount, $subtotal);
            }

            if (isset($coupon['max_discount'])) {
                $discountAmount = min($discountAmount, Currency::whole($coupon['max_discount']));
            }

            $discountAmount = max(0, Currency::whole($discountAmount));
        }

        $totalAmount = max(0, Currency::whole($subtotal + $deliveryCharge - $discountAmount));

        return [
            'subtotal_amount' => Currency::whole($subtotal),
            'delivery_charge' => Currency::whole($deliveryCharge),
            'discount_amount' => Currency::whole($discountAmount),
            'total_amount' => Currency::whole($totalAmount),
            'coupon' => $coupon && $normalizedCode ? [
                'code' => $normalizedCode,
                'label' => $coupon['label'] ?? $normalizedCode,
                'type' => $coupon['type'] ?? 'fixed',
            ] : null,
        ];
    }

    public function normalize(?string $couponCode): ?string
    {
        $normalized = strtoupper(trim((string) $couponCode));

        return $normalized !== '' ? $normalized : null;
    }

    private function resolve(string $couponCode): ?array
    {
        $coupons = config('coupons.available', []);

        return $coupons[$couponCode] ?? null;
    }
}
