<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Services\AdminActivityService;
use App\Services\SiteSettingsLogoService;
use App\Services\SiteSettingsService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class SiteSettingsController extends Controller
{
    use ApiResponse;

    public function show(SiteSettingsService $settings)
    {
        return $this->ok($settings->getPayload(), 'Site settings loaded successfully.');
    }

    public function update(
        Request $request,
        SiteSettingsService $settings,
        SiteSettingsLogoService $logos,
        AdminActivityService $activity
    ) {
        $record = SiteSetting::singleton();
        $old = $record->toPayload();

        $data = $request->validate([
            'site_name' => ['required', 'string', 'max:255'],
            'site_tagline' => ['nullable', 'string', 'max:255'],
            'support_phone' => ['nullable', 'string', 'max:50'],
            'support_email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'city' => ['nullable', 'string', 'max:255'],
            'support_hours' => ['nullable', 'string', 'max:255'],
            'whatsapp_number' => ['nullable', 'string', 'max:50'],
            'facebook_url' => ['nullable', 'url', 'max:1000'],
            'instagram_url' => ['nullable', 'url', 'max:1000'],
            'youtube_url' => ['nullable', 'url', 'max:1000'],
            'map_embed_url' => ['nullable', 'string', 'max:2000'],
            'footer_note' => ['nullable', 'string', 'max:1000'],
            'logo' => ['nullable', 'file'],
            'logo_data' => ['nullable', 'string'],
            'remove_logo' => ['nullable', 'boolean'],
        ]);

        unset($data['logo'], $data['logo_data'], $data['remove_logo']);

        if ($request->boolean('remove_logo') && $record->logo_path) {
            $logos->delete($record->logo_path);
            $data['logo_url'] = null;
            $data['logo_path'] = null;
        }

        if ($request->filled('logo_data')) {
            $data = [...$data, ...$logos->storeDataUri($request->string('logo_data')->toString(), $record->logo_path)];
        } elseif ($request->hasFile('logo')) {
            $data = [...$data, ...$logos->store($request->file('logo'), $record->logo_path)];
        }

        $record->update($data);
        $payload = $settings->refresh();

        $activity->log($request, 'update', 'site_settings', $record->id, $old, $payload);

        return $this->ok($payload, 'Site settings updated successfully.');
    }
}
