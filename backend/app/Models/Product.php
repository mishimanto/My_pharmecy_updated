<?php

namespace App\Models;

class Product extends PharmacyModel
{
    protected function casts(): array
    {
        return ['requires_prescription' => 'boolean', 'is_active' => 'boolean'];
    }

    public function category() { return $this->belongsTo(Category::class); }
    public function manufacturer() { return $this->belongsTo(Manufacturer::class); }
    public function images() { return $this->hasMany(ProductImage::class); }
    public function batches() { return $this->hasMany(InventoryBatch::class); }
}

