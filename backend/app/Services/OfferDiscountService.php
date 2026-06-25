<?php

namespace App\Services;

use App\Models\Offer;
use App\Models\Product;
use App\Support\Currency;
use Illuminate\Support\Collection;

class OfferDiscountService
{
    private ?Collection $activeOffers = null;

    public function activeOffers(): Collection
    {
        if ($this->activeOffers !== null) {
            return $this->activeOffers;
        }

        return $this->activeOffers = Offer::query()
            ->where('status', 'active')
            ->where('discount_value', '>', 0)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->orderByDesc('discount_value')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function bestForProduct(Product $product, float $basePrice): ?array
    {
        return $this->activeOffers()
            ->filter(fn (Offer $offer) => $this->appliesToProduct($offer, $product))
            ->map(fn (Offer $offer) => $this->priceForOffer($offer, $basePrice))
            ->filter(fn (array $candidate) => $candidate['discount_amount'] > 0)
            ->sortByDesc('discount_amount')
            ->first();
    }

    public function priceForProduct(Product $product, float $basePrice): array
    {
        $basePrice = Currency::whole($basePrice);
        $offer = $this->bestForProduct($product, $basePrice);

        if (! $offer) {
            return [
                'base_price' => $basePrice,
                'final_price' => $basePrice,
                'discount_amount' => 0,
                'offer' => null,
            ];
        }

        return [
            'base_price' => $basePrice,
            'final_price' => $offer['final_price'],
            'discount_amount' => $offer['discount_amount'],
            'offer' => $offer['offer'],
        ];
    }

    private function appliesToProduct(Offer $offer, Product $product): bool
    {
        return match ($offer->applies_to ?? 'all') {
            'category' => (int) $offer->category_id === (int) $product->category_id,
            'manufacturer' => (int) $offer->manufacturer_id === (int) $product->manufacturer_id,
            'products' => in_array((int) $product->id, array_map('intval', $offer->product_ids ?? []), true),
            default => true,
        };
    }

    private function priceForOffer(Offer $offer, float $basePrice): array
    {
        $basePrice = Currency::whole($basePrice);
        $discount = match ($offer->discount_type) {
            'fixed' => Currency::whole($offer->discount_value),
            default => Currency::whole($basePrice * ((float) $offer->discount_value / 100)),
        };

        if ($offer->max_discount !== null) {
            $discount = min($discount, Currency::whole($offer->max_discount));
        }

        $discount = min($discount, $basePrice);
        $finalPrice = max(0, Currency::whole($basePrice - $discount));

        return [
            'final_price' => $finalPrice,
            'discount_amount' => Currency::whole($basePrice - $finalPrice),
            'offer' => [
                'id' => $offer->id,
                'title' => $offer->title,
                'title_bn' => $offer->title_bn,
                'label' => $offer->label,
                'label_bn' => $offer->label_bn,
                'discount_type' => $offer->discount_type,
                'discount_value' => $offer->discount_value,
                'applies_to' => $offer->applies_to,
                'ends_at' => $offer->ends_at,
            ],
        ];
    }
}
