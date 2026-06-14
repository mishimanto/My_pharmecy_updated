<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class CouponService
{
    public function buildSummary(float $subtotal, float $deliveryCharge, ?string $couponCode = null): array
    {
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
                'percent' => round($subtotal * ((float) ($coupon['amount'] ?? 0) / 100), 2),
                'free_delivery' => round($deliveryCharge, 2),
                default => round((float) ($coupon['amount'] ?? 0), 2),
            };

            if (($coupon['type'] ?? 'fixed') !== 'free_delivery') {
                $discountAmount = min($discountAmount, $subtotal);
            }

            if (isset($coupon['max_discount'])) {
                $discountAmount = min($discountAmount, (float) $coupon['max_discount']);
            }

            $discountAmount = max(0, round($discountAmount, 2));
        }

        $totalAmount = max(0, round($subtotal + $deliveryCharge - $discountAmount, 2));

        return [
            'subtotal_amount' => round($subtotal, 2),
            'delivery_charge' => round($deliveryCharge, 2),
            'discount_amount' => $discountAmount,
            'total_amount' => $totalAmount,
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
