<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class Manufacturer extends PharmacyModel
{
    public function getLogoUrlAttribute($value): ?string
    {
        if ($value) {
            return str_starts_with($value, 'http') ? $value : url($value);
        }

        if (! empty($this->attributes['logo_path'])) {
            return url(Storage::disk('public')->url($this->attributes['logo_path']));
        }

        return null;
    }
}
