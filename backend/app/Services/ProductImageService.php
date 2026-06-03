<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProductImageService
{
    public function store(UploadedFile $file): array
    {
        $path = $file->store('products/originals', 'public');
        $webpPath = 'products/webp/' . pathinfo($path, PATHINFO_FILENAME) . '.webp';

        $image = (new ImageManager(new Driver()))->read($file->getRealPath())->toWebp(82);
        Storage::disk('public')->put($webpPath, (string) $image);

        return [
            'image_path' => $path,
            'image_webp_path' => $webpPath,
            'image_url' => Storage::url($webpPath),
        ];
    }
}

