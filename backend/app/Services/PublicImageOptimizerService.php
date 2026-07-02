<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;
use Throwable;

class PublicImageOptimizerService
{
    public function store(
        UploadedFile $file,
        string $directory,
        ?string $previousPath = null,
        int $maxWidth = 1920,
        int $maxHeight = 1080,
        int $quality = 82,
    ): string {
        $path = trim($directory, '/') . '/' . Str::uuid() . '.webp';

        try {
            $image = (new ImageManager(new Driver()))
                ->decodePath($file->getRealPath())
                ->scaleDown(width: $maxWidth, height: $maxHeight)
                ->encode(new WebpEncoder($quality));
        } catch (Throwable $exception) {
            Log::warning('Public image optimization failed', [
                'directory' => $directory,
                'message' => $exception->getMessage(),
                'exception' => $exception::class,
            ]);

            throw ValidationException::withMessages([
                'image' => 'The image must be a valid image file.',
            ]);
        }

        Storage::disk('public')->put($path, (string) $image);
        $this->delete($previousPath);

        return $path;
    }

    public function delete(?string $path): void
    {
        if (blank($path) || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
