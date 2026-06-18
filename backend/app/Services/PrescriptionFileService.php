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

class PrescriptionFileService
{
    public function store(UploadedFile $file): string
    {
        if ($this->isPdf($file)) {
            return $file->store('prescriptions', 'public');
        }

        return $this->storeImage($file);
    }

    public function delete(?string $path): void
    {
        if (blank($path) || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    private function storeImage(UploadedFile $file): string
    {
        $path = 'prescriptions/'.Str::uuid().'.webp';

        try {
            $image = (new ImageManager(new Driver()))
                ->decodePath($file->getRealPath())
                ->scaleDown(width: 1600, height: 1600)
                ->encode(new WebpEncoder(82));
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'prescription_file' => 'The prescription file must be a valid image or PDF.',
            ]);
        }

        Storage::disk('public')->put($path, (string) $image);

        return $path;
    }

    private function isPdf(UploadedFile $file): bool
    {
        return $file->getClientOriginalExtension()
            && strtolower($file->getClientOriginalExtension()) === 'pdf';
    }
}
