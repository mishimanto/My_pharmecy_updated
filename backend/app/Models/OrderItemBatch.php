<?php

namespace App\Models;

class OrderItemBatch extends PharmacyModel
{
    public function orderItem() { return $this->belongsTo(OrderItem::class); }
    public function batch() { return $this->belongsTo(InventoryBatch::class, 'batch_id'); }
}
