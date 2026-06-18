<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class Manufacturer extends PharmacyModel
{
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function getLogoUrlAttribute($value): ?string
    {
        if (! empty($this->attributes['logo_path'])) {
            return url(Storage::disk('public')->url($this->attributes['logo_path']));
        }

        if ($value) {
            return str_starts_with($value, 'http') ? $value : url($value);
        }

        return null;
    }
}
