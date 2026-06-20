<?php

namespace App\Models;

class OrderItem extends PharmacyModel
{
    use Concerns\RoundsCurrencyAttributes;

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'pieces_per_unit' => 'integer',
            'piece_quantity' => 'integer',
            'unit_price' => 'float',
            'discount' => 'float',
            'subtotal' => 'float',
        ];
    }

    protected function roundedCurrencyAttributes(): array
    {
        return ['unit_price', 'discount', 'subtotal'];
    }

    public function product() { return $this->belongsTo(Product::class); }
    public function batches() { return $this->hasMany(OrderItemBatch::class); }
}
