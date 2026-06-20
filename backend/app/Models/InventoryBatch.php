<?php

namespace App\Models;

class InventoryBatch extends PharmacyModel
{
    use Concerns\RoundsCurrencyAttributes;

    protected function casts(): array
    {
        return ['expiry_date' => 'date', 'manufactured_date' => 'date'];
    }

    protected function roundedCurrencyAttributes(): array
    {
        return ['purchase_price', 'selling_price'];
    }

    public function product() { return $this->belongsTo(Product::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
}
