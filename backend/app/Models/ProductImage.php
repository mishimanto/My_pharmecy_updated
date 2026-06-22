<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class ProductImage extends PharmacyModel
{
    protected $appends = ['thumbnail_url'];

    protected static function booted(): void
    {
        static::deleted(function (self $image): void {
            collect([
                $image->getRawOriginal('image_path'),
                $image->getRawOriginal('image_webp_path'),
                $image->getRawOriginal('thumbnail_path'),
            ])
                ->filter()
                ->unique()
                ->each(fn ($path) => Storage::disk('public')->delete($path));
        });
    }

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getImageUrlAttribute($value): ?string
    {
        if ($value) {
            return str_starts_with($value, 'http') ? $value : url($value);
        }

        if (! empty($this->attributes['image_path'])) {
            return url(Storage::disk('public')->url($this->attributes['image_path']));
        }

        return null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (! empty($this->attributes['thumbnail_path'])) {
            return url(Storage::disk('public')->url($this->attributes['thumbnail_path']));
        }

        return $this->image_url;
    }
}
