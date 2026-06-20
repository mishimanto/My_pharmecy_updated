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
        'address_bn' => 'ঢাকা সার্ভিস পয়েন্ট',
        'city' => 'Dhaka',
        'city_bn' => 'ঢাকা',
        'support_hours' => '8AM to 11PM support',
        'support_hours_bn' => 'সকাল ৮টা থেকে রাত ১১টা সাপোর্ট',
        'whatsapp_number' => '09610-001122',
        'facebook_url' => null,
        'instagram_url' => null,
        'youtube_url' => null,
        'map_embed_url' => 'https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=12&output=embed',
        'footer_note' => 'Prescription-aware online pharmacy experience',
        'footer_note_bn' => 'প্রেসক্রিপশন-সচেতন অনলাইন ফার্মেসি অভিজ্ঞতা',
        'logo_url' => null,
        'logo_path' => null,
        'favicon_url' => null,
        'favicon_path' => null,
    ];

    public function getLogoUrlAttribute($value): ?string
    {
        return $this->assetUrl($value, $this->attributes['logo_path'] ?? null);
    }

    public function getFaviconUrlAttribute($value): ?string
    {
        return $this->assetUrl($value, $this->attributes['favicon_path'] ?? null);
    }

    public static function singleton(): self
    {
        return static::query()->firstOrCreate(['id' => 1], static::DEFAULTS);
    }

    public function toPayload(): array
    {
        $payload = array_merge(
            static::DEFAULTS,
            $this->only([
                'id',
                'site_name',
                'site_tagline',
                'support_phone',
                'support_email',
                'address',
                'address_bn',
                'city',
                'city_bn',
                'support_hours',
                'support_hours_bn',
                'whatsapp_number',
                'facebook_url',
                'instagram_url',
                'youtube_url',
                'map_embed_url',
                'footer_note',
                'footer_note_bn',
                'logo_path',
                'favicon_path',
                'created_at',
                'updated_at',
            ]),
            [
                'logo_url' => $this->logo_url,
                'favicon_url' => $this->favicon_url,
            ]
        );

        foreach (['address_bn', 'city_bn', 'support_hours_bn', 'footer_note_bn'] as $key) {
            $payload[$key] = $payload[$key] ?: static::DEFAULTS[$key];
        }

        return $payload;
    }

    private function assetUrl(?string $value, ?string $path): ?string
    {
        if (! empty($path)) {
            return url(Storage::disk('public')->url($path));
        }

        if ($value) {
            return str_starts_with($value, 'http') ? $value : url($value);
        }

        return null;
    }
}
