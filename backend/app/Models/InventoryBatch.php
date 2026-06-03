<?php

namespace App\Models;

class InventoryBatch extends PharmacyModel
{
    protected function casts(): array
    {
        return ['expiry_date' => 'date', 'manufactured_date' => 'date'];
    }

    public function product() { return $this->belongsTo(Product::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
}

