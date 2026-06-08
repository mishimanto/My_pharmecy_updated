<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class ProductImage extends PharmacyModel
{
    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getImageUrlAttribute($value): ?string
    {
        if ($value) {
            return str_starts_with($value, 'http') ? $value : url($value);
        }

        if (! empty($this->attributes['image_path'])) {
            return url(Storage::disk('public')->url($this->attributes['image_path']));
        }

        return null;
    }
}
