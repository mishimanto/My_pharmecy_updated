<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class Category extends PharmacyModel
{
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function getImageUrlAttribute($value): ?string
    {
        if (! empty($this->attributes['image_path'])) {
            return url(Storage::disk('public')->url($this->attributes['image_path']));
        }

        if ($value) {
            return str_starts_with($value, 'http') ? $value : url($value);
        }

        return null;
    }
}
