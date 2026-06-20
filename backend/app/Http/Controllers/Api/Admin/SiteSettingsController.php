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
            'address_bn' => ['nullable', 'string', 'max:1000'],
            'city' => ['nullable', 'string', 'max:255'],
            'city_bn' => ['nullable', 'string', 'max:255'],
            'support_hours' => ['nullable', 'string', 'max:255'],
            'support_hours_bn' => ['nullable', 'string', 'max:255'],
            'whatsapp_number' => ['nullable', 'string', 'max:50'],
            'facebook_url' => ['nullable', 'url', 'max:1000'],
            'instagram_url' => ['nullable', 'url', 'max:1000'],
            'youtube_url' => ['nullable', 'url', 'max:1000'],
            'map_embed_url' => ['nullable', 'string', 'max:2000'],
            'footer_note' => ['nullable', 'string', 'max:1000'],
            'footer_note_bn' => ['nullable', 'string', 'max:1000'],
            'logo_url' => ['nullable', 'url', 'max:2000'],
            'logo' => ['nullable', 'file'],
            'logo_data' => ['nullable', 'string'],
            'remove_logo' => ['nullable', 'boolean'],
            'favicon_url' => ['nullable', 'url', 'max:2000'],
            'favicon' => ['nullable', 'file'],
            'favicon_data' => ['nullable', 'string'],
            'remove_favicon' => ['nullable', 'boolean'],
        ]);

        unset($data['logo'], $data['logo_data'], $data['remove_logo'], $data['favicon'], $data['favicon_data'], $data['remove_favicon']);

        if ($request->boolean('remove_logo')) {
            $logos->delete($record->logo_path);
            $data['logo_url'] = null;
            $data['logo_path'] = null;
        }

        if ($request->filled('logo_data')) {
            $data = [...$data, ...$logos->storeDataUri($request->string('logo_data')->toString(), $record->logo_path)];
        } elseif ($request->hasFile('logo')) {
            $data = [...$data, ...$logos->store($request->file('logo'), $record->logo_path)];
        } elseif ($request->filled('logo_url') && $request->string('logo_url')->toString() !== $record->logo_url) {
            $logos->delete($record->logo_path);
            $data['logo_url'] = $request->string('logo_url')->toString();
            $data['logo_path'] = null;
        }

        if ($request->boolean('remove_favicon')) {
            $logos->delete($record->favicon_path);
            $data['favicon_url'] = null;
            $data['favicon_path'] = null;
        }

        if ($request->filled('favicon_data')) {
            $favicon = $logos->storeDataUri($request->string('favicon_data')->toString(), $record->favicon_path, 'site-settings/favicons');
            $data['favicon_url'] = $favicon['logo_url'];
            $data['favicon_path'] = $favicon['logo_path'];
        } elseif ($request->hasFile('favicon')) {
            $favicon = $logos->store($request->file('favicon'), $record->favicon_path, 'site-settings/favicons');
            $data['favicon_url'] = $favicon['logo_url'];
            $data['favicon_path'] = $favicon['logo_path'];
        } elseif ($request->filled('favicon_url') && $request->string('favicon_url')->toString() !== $record->favicon_url) {
            $logos->delete($record->favicon_path);
            $data['favicon_url'] = $request->string('favicon_url')->toString();
            $data['favicon_path'] = null;
        }

        $record->update($data);
        $payload = $settings->refresh();

        $activity->log($request, 'update', 'site_settings', $record->id, $old, $payload);

        return $this->ok($payload, 'Site settings updated successfully.');
    }
}
