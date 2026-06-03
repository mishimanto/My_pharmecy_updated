<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\AdminActivityService;
use App\Services\ProductImageService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ProductImageController extends Controller
{
    use ApiResponse;

    public function store(Request $request, int $id, ProductImageService $images, AdminActivityService $activity)
    {
        $data = $request->validate([
            'images' => ['required', 'array', 'min:1'],
            'images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'primary_index' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = Product::findOrFail($id);
        $created = [];
        foreach ($data['images'] as $index => $file) {
            $payload = $images->store($file);
            $payload['product_id'] = $product->id;
            $payload['is_primary'] = (int) ($data['primary_index'] ?? 0) === $index;
            $created[] = ProductImage::create($payload);
        }

        if (collect($created)->contains('is_primary', true)) {
            ProductImage::where('product_id', $product->id)->whereNotIn('id', collect($created)->pluck('id'))->update(['is_primary' => false]);
        }

        $activity->log($request, 'upload_images', 'product', $product->id, null, collect($created)->map->toArray()->all());

        return $this->ok($product->load('images'), 'প্রোডাক্ট ছবি আপলোড হয়েছে।', 201);
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $image = ProductImage::findOrFail($id);
        $old = $image->toArray();
        $productId = $image->product_id;
        $image->delete();
        $activity->log($request, 'delete_image', 'product', $productId, $old);

        return $this->ok(null, 'প্রোডাক্ট ছবি ডিলিট হয়েছে।');
    }
}

