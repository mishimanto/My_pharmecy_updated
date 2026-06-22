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

class ProductImageService
{
    public function store(UploadedFile $file): array
    {
        return $this->storeImage(fn (ImageManager $manager) => $manager->decodePath($file->getRealPath()));
    }

    public function storeDataUri(string $dataUri): array
    {
        if (! preg_match('/^data:image\/[a-zA-Z0-9.+-]+;base64,/', $dataUri)) {
            throw ValidationException::withMessages([
                'images' => 'Each product image must be a valid image file.',
            ]);
        }

        return $this->storeImage(fn (ImageManager $manager) => $manager->decodeDataUri($dataUri));
    }

    private function storeImage(callable $decoder): array
    {
        $path = 'products/' . Str::uuid() . '.webp';
        $thumbnailPath = 'products/thumbnails/' . Str::uuid() . '.webp';

        try {
            $manager = new ImageManager(new Driver());
            $image = $decoder($manager)
                ->scaleDown(width: 900, height: 900)
                ->encode(new WebpEncoder(78));
            $thumbnail = $decoder($manager)
                ->scaleDown(width: 360, height: 360)
                ->encode(new WebpEncoder(72));
        } catch (Throwable $exception) {
            Log::warning('Product image decode failed', [
                'message' => $exception->getMessage(),
                'exception' => $exception::class,
            ]);

            throw ValidationException::withMessages([
                'images' => 'Each product image must be a valid image file.',
            ]);
        }

        Storage::disk('public')->put($path, (string) $image);
        Storage::disk('public')->put($thumbnailPath, (string) $thumbnail);

        return [
            'image_path' => $path,
            'image_webp_path' => $path,
            'thumbnail_path' => $thumbnailPath,
            'image_url' => Storage::url($path),
        ];
    }
}
