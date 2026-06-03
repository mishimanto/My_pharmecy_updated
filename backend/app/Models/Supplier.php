<?php

namespace App\Models;

class Supplier extends PharmacyModel
{
    public function batches()
    {
        return $this->hasMany(InventoryBatch::class);
    }
}
