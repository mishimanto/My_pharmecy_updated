<?php

namespace App\Models;

class CartItem extends PharmacyModel
{
    use Concerns\RoundsCurrencyAttributes;

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'pieces_per_unit' => 'integer',
            'piece_quantity' => 'integer',
            'unit_price' => 'float',
        ];
    }

    protected function roundedCurrencyAttributes(): array
    {
        return ['unit_price'];
    }

    public function product() { return $this->belongsTo(Product::class); }
}
