<?php

namespace App\Models;

class OrderItemBatch extends PharmacyModel
{
    use Concerns\RoundsCurrencyAttributes;

    protected function roundedCurrencyAttributes(): array
    {
        return ['unit_price', 'subtotal'];
    }

    public function orderItem() { return $this->belongsTo(OrderItem::class); }
    public function batch() { return $this->belongsTo(InventoryBatch::class, 'batch_id'); }
}
