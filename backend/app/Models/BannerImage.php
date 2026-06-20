<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class BannerImage extends PharmacyModel
{
    protected $appends = ['image_src'];

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
