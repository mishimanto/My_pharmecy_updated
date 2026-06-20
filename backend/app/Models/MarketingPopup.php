<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class MarketingPopup extends PharmacyModel
{
    protected $appends = ['image_src'];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function sourceOffer()
    {
        return $this->belongsTo(Offer::class, 'source_offer_id');
    }

    public function getImageSrcAttribute(): ?string
    {
        if ($this->image_path) {
            return url(Storage::disk('public')->url($this->image_path));
        }

        if ($this->image_url) {
            return str_starts_with($this->image_url, 'http') ? $this->image_url : url($this->image_url);
        }

        if ($this->sourceOffer) {
            return $this->sourceOffer->image_src;
        }

        return null;
    }
}
