<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class PaymentMethod extends PharmacyModel
{
    protected $casts = [
        'requires_proof' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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
