<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;
use Throwable;

class SiteSettingsLogoService
{
    public function store(UploadedFile $file, ?string $previousPath = null): array
    {
        return $this->storeImage(fn (ImageManager $manager) => $manager->decodePath($file->getRealPath()), $previousPath);
    }

    public function storeDataUri(string $dataUri, ?string $previousPath = null): array
    {
        if (! preg_match('/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/', $dataUri, $matches)) {
            throw ValidationException::withMessages([
                'logo' => 'The logo must be a valid image file.',
            ]);
        }

        $binary = base64_decode($matches[1], true);
        if ($binary === false) {
            throw ValidationException::withMessages([
                'logo' => 'The logo must be a valid image file.',
            ]);
        }

        return $this->storeImage(fn (ImageManager $manager) => $manager->decodeBinary($binary), $previousPath);
    }

    private function storeImage(callable $decoder, ?string $previousPath = null): array
    {
        $path = 'site-settings/' . Str::uuid() . '.webp';

        try {
            $image = $decoder(new ImageManager(new Driver()))
                ->scaleDown(512, 512)
                ->encode(new WebpEncoder(84));
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'logo' => 'The logo must be a valid image file.',
            ]);
        }

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
