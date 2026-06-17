<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class ManufacturerLogoService
{
    public function store(UploadedFile $file, ?string $previousPath = null): array
    {
        $path = 'manufacturers/webp/' . Str::uuid() . '.webp';

        $image = (new ImageManager(new Driver()))
            ->decodePath($file->getRealPath())
            ->coverDown(512, 512)
            ->encode(new WebpEncoder(84));

        Storage::disk('public')->put($path, (string) $image);
        $this->delete($previousPath);

        return [
            'logo_url' => Storage::url($path),
            'logo_path' => $path,
        ];
    }

    public function delete(?string $path): void
    {
        if (blank($path) || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
