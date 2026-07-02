<?php

namespace App\Models;

class Coupon extends PharmacyModel
{
    protected $casts = [
        'amount' => 'float',
        'min_subtotal' => 'float',
        'max_discount' => 'float',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
