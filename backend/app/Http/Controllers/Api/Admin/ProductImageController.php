<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\AdminActivityService;
use App\Services\ProductImageService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class ProductImageController extends Controller
{
    use ApiResponse;

    public function store(Request $request, int $id, ProductImageService $images, AdminActivityService $activity)
    {
        $data = Validator::make($request->all(), [
            'images' => ['nullable', 'array', 'min:1'],
            'images.*' => ['required_with:images', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'image_data' => ['nullable', 'array', 'min:1'],
            'image_data.*' => ['required_with:image_data', 'string'],
            'primary_index' => ['nullable', 'integer', 'min:0'],
        ])->after(function ($validator) use ($request) {
            if (! $request->hasFile('images') && blank($request->input('image_data'))) {
                $validator->errors()->add('images', 'At least one product image is required.');
            }
        })->validate();

        $product = Product::findOrFail($id);
        $created = [];
        $uploadedFiles = $data['images'] ?? [];
        $hasPrimaryIndex = array_key_exists('primary_index', $data) && $data['primary_index'] !== null;
        $primaryIndex = $hasPrimaryIndex ? (int) $data['primary_index'] : null;

        foreach ($uploadedFiles as $index => $file) {
            $payload = $images->store($file);
            $payload['product_id'] = $product->id;
            $payload['is_primary'] = $hasPrimaryIndex && $primaryIndex === $index;
            $created[] = ProductImage::create($payload);
        }

        foreach ($data['image_data'] ?? [] as $index => $dataUri) {
            $payload = $images->storeDataUri($dataUri);
            $payload['product_id'] = $product->id;
            $payload['is_primary'] = $hasPrimaryIndex && $primaryIndex === ($index + count($uploadedFiles));
            $created[] = ProductImage::create($payload);
        }

        if (collect($created)->contains('is_primary', true)) {
            ProductImage::where('product_id', $product->id)->whereNotIn('id', collect($created)->pluck('id'))->update(['is_primary' => false]);
        }

        $activity->log($request, 'upload_images', 'product', $product->id, null, collect($created)->map->toArray()->all());

        return $this->ok($product->load('images'), 'Product images uploaded.', 201);
    }

    public function chunk(Request $request, int $id, ProductImageService $images, AdminActivityService $activity)
    {
        $data = $request->validate([
            'upload_id' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9._-]+$/'],
            'index' => ['required', 'integer', 'min:0'],
            'total' => ['required', 'integer', 'min:1', 'max:200'],
            'chunk' => ['required', 'string'],
            'primary' => ['nullable', 'boolean'],
        ]);

        abort_if($data['index'] >= $data['total'], 422, 'Invalid image chunk index.');

        $product = Product::findOrFail($id);
        $directory = storage_path('app/product-image-chunks/'.$data['upload_id']);
        File::ensureDirectoryExists($directory);
        File::put($directory.DIRECTORY_SEPARATOR.$data['index'].'.part', $data['chunk']);

        for ($chunk = 0; $chunk < $data['total']; $chunk++) {
            if (! File::exists($directory.DIRECTORY_SEPARATOR.$chunk.'.part')) {
                return $this->ok(['received' => $data['index'], 'complete' => false], 'Product image chunk received.', 202);
            }
        }

        $dataUri = '';
        for ($chunk = 0; $chunk < $data['total']; $chunk++) {
            $dataUri .= File::get($directory.DIRECTORY_SEPARATOR.$chunk.'.part');
        }

        File::deleteDirectory($directory);

        $payload = $images->storeDataUri($dataUri);
        $payload['product_id'] = $product->id;
        $payload['is_primary'] = (bool) ($data['primary'] ?? false);
        $created = ProductImage::create($payload);

        if ($created->is_primary) {
            ProductImage::where('product_id', $product->id)->whereKeyNot($created->id)->update(['is_primary' => false]);
        }

        $activity->log($request, 'upload_images', 'product', $product->id, null, [$created->toArray()]);

        return $this->ok($product->load('images'), 'Product image uploaded.', 201);
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $image = ProductImage::findOrFail($id);
        $old = $image->toArray();
        $productId = $image->product_id;
        $image->delete();
        $activity->log($request, 'delete_image', 'product', $productId, $old);

        return $this->ok(null, 'Product image deleted.');
    }
}
