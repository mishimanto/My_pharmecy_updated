<?php

namespace App\Models;

class ProductAlternative extends PharmacyModel
{
    public function product() { return $this->belongsTo(Product::class); }
    public function alternative() { return $this->belongsTo(Product::class, 'alternative_product_id'); }
}
