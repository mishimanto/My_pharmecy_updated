<?php

namespace App\Models;

class OrderItem extends PharmacyModel
{
    public function product() { return $this->belongsTo(Product::class); }
    public function batches() { return $this->hasMany(OrderItemBatch::class); }
}
