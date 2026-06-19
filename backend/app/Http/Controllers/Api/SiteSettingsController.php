<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SiteSettingsService;
use App\Support\ApiResponse;

class SiteSettingsController extends Controller
{
    use ApiResponse;

    public function show(SiteSettingsService $settings)
    {
        return $this->ok($settings->getPayload(), 'Site settings loaded successfully.');
    }
}
