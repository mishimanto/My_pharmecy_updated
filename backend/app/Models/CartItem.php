<?php

namespace App\Models;

class CartItem extends PharmacyModel
{
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'pieces_per_unit' => 'integer',
            'piece_quantity' => 'integer',
            'unit_price' => 'float',
        ];
    }

    public function product() { return $this->belongsTo(Product::class); }
}
