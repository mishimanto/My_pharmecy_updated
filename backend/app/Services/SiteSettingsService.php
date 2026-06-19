<?php

namespace App\Services;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;

class SiteSettingsService
{
    private const CACHE_KEY = 'site_settings_payload';

    public function getPayload(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => SiteSetting::singleton()->toPayload());
    }

    public function refresh(): array
    {
        Cache::forget(self::CACHE_KEY);

        return $this->getPayload();
    }
}
