<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class CustomerAvatarService
{
    public function store(UploadedFile $file, ?string $previousAvatar = null): string
    {
        $path = 'avatars/webp/' . Str::uuid() . '.webp';

        $image = (new ImageManager(new Driver()))
            ->decodePath($file->getRealPath())
            ->coverDown(320, 320)
            ->encode(new WebpEncoder(82));

        Storage::disk('public')->put($path, (string) $image);

        $this->deleteIfLocal($previousAvatar);

        return $path;
    }

    public function deleteIfLocal(?string $path): void
    {
        if (blank($path) || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
