<?php

namespace App\Models;

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
}
