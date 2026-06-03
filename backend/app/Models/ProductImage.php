<?php

namespace App\Models;

class ProductImage extends PharmacyModel
{
    protected function casts(): array { return ['is_primary' => 'boolean']; }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
