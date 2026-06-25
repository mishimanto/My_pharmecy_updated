<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class Offer extends PharmacyModel
{
    protected $appends = ['image_src'];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'show_in_nav' => 'boolean',
        'show_popup' => 'boolean',
        'discount_value' => 'float',
        'max_discount' => 'float',
        'product_ids' => 'array',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function manufacturer()
    {
        return $this->belongsTo(Manufacturer::class);
    }

    public function getImageSrcAttribute(): ?string
    {
        if ($this->image_path) {
            return url(Storage::disk('public')->url($this->image_path));
        }

        if ($this->image_url) {
            return str_starts_with($this->image_url, 'http') ? $this->image_url : url($this->image_url);
        }

        return null;
    }
}
