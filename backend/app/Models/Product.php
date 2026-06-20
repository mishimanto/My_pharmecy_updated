<?php

namespace App\Models;

use App\Models\Concerns\RoundsCurrencyAttributes;
use Illuminate\Support\Str;

class Product extends PharmacyModel
{
    use RoundsCurrencyAttributes;

    protected static function booted(): void
    {
        static::saving(function (Product $product) {
            if ($product->product_name && (! $product->slug || $product->isDirty('product_name'))) {
                $product->slug = static::uniqueSlug($product->product_name, $product->id);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'requires_prescription' => 'boolean',
            'is_active' => 'boolean',
            'pieces_per_strip' => 'integer',
            'strips_per_box' => 'integer',
            'strip_price' => 'float',
            'box_price' => 'float',
        ];
    }

    protected function roundedCurrencyAttributes(): array
    {
        return ['strip_price', 'box_price'];
    }

    private static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $suffix = 2;

        while (
            static::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix += 1;
        }

        return $slug;
    }

    public function category() { return $this->belongsTo(Category::class); }
    public function manufacturer() { return $this->belongsTo(Manufacturer::class); }
    public function images() { return $this->hasMany(ProductImage::class); }
    public function batches() { return $this->hasMany(InventoryBatch::class); }
}
