<?php

namespace App\Models;

class CartItem extends PharmacyModel
{
    public function product() { return $this->belongsTo(Product::class); }
}
