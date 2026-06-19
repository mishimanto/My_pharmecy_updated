<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class SiteSetting extends PharmacyModel
{
    public const DEFAULTS = [
        'site_name' => 'My Pharmecy',
        'site_tagline' => 'Trusted online pharmacy support',
        'support_phone' => '09610-001122',
        'support_email' => 'support@mypharmecy.test',
        'address' => 'Dhaka service point',
        'city' => 'Dhaka',
        'support_hours' => '8AM to 11PM support',
        'whatsapp_number' => '09610-001122',
        'facebook_url' => null,
        'instagram_url' => null,
        'youtube_url' => null,
        'map_embed_url' => 'https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=12&output=embed',
        'footer_note' => 'Prescription-aware online pharmacy experience',
        'logo_url' => null,
        'logo_path' => null,
    ];

    public function getLogoUrlAttribute($value): ?string
    {
        if (! empty($this->attributes['logo_path'])) {
            return url(Storage::disk('public')->url($this->attributes['logo_path']));
        }

        if ($value) {
            return str_starts_with($value, 'http') ? $value : url($value);
        }

        return null;
    }

    public static function singleton(): self
    {
        return static::query()->firstOrCreate(['id' => 1], static::DEFAULTS);
    }

    public function toPayload(): array
    {
        return array_merge(
            static::DEFAULTS,
            $this->only([
                'id',
                'site_name',
                'site_tagline',
                'support_phone',
                'support_email',
                'address',
                'city',
                'support_hours',
                'whatsapp_number',
                'facebook_url',
                'instagram_url',
                'youtube_url',
                'map_embed_url',
                'footer_note',
                'logo_path',
                'created_at',
                'updated_at',
            ]),
            ['logo_url' => $this->logo_url]
        );
    }
}
