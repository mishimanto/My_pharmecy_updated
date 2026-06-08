<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $products = Product::query()
            ->with('category:id,category_name', 'manufacturer:id,manufacturer_name', 'images', 'batches')
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('product_name', 'like', "%{$search}%")
                ->orWhere('generic_name', 'like', "%{$search}%")
                ->orWhere('brand_name', 'like', "%{$search}%")))
            ->when($request->category_id, fn ($query, $id) => $query->where('category_id', $id))
            ->when($request->manufacturer_id, fn ($query, $id) => $query->where('manufacturer_id', $id))
            ->latest('id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($products, 'প্রোডাক্ট তালিকা পাওয়া গেছে।');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $this->validated($request);
        $product = Product::create($data);
        $activity->log($request, 'create', 'product', $product->id, null, $product->toArray());

        return $this->ok($product->load('category', 'manufacturer', 'images'), 'প্রোডাক্ট তৈরি হয়েছে।', 201);
    }

    public function show(int $id)
    {
        return $this->ok(Product::with('category', 'manufacturer', 'images', 'batches.supplier')->findOrFail($id), 'প্রোডাক্ট তথ্য পাওয়া গেছে।');
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $product = Product::findOrFail($id);
        $old = $product->toArray();
        $product->update($this->validated($request));
        $activity->log($request, 'update', 'product', $product->id, $old, $product->fresh()->toArray());

        return $this->ok($product->load('category', 'manufacturer', 'images'), 'প্রোডাক্ট আপডেট হয়েছে।');
    }

    public function status(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $product = Product::findOrFail($id);
        $old = ['is_active' => $product->is_active];
        $product->update($data);
        $activity->log($request, 'status', 'product', $product->id, $old, ['is_active' => $product->is_active]);

        return $this->ok($product, 'প্রোডাক্ট স্ট্যাটাস আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $product = Product::with('images')->findOrFail($id);
        $old = $product->toArray();
        $product->delete();
        $activity->log($request, 'delete', 'product', $id, $old);

        return $this->ok(null, 'প্রোডাক্ট ডিলিট হয়েছে।');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'manufacturer_id' => ['required', 'exists:manufacturers,id'],
            'product_name' => ['required', 'string', 'max:255'],
            'generic_name' => ['nullable', 'string', 'max:255'],
            'brand_name' => ['nullable', 'string', 'max:255'],
            'strength' => ['nullable', 'string', 'max:100'],
            'dosage_form' => ['nullable', 'string', 'max:100'],
            'pieces_per_strip' => ['required', 'integer', 'min:1'],
            'strips_per_box' => ['required', 'integer', 'min:1'],
            'strip_price' => ['nullable', 'numeric', 'min:0'],
            'box_price' => ['nullable', 'numeric', 'min:0'],
            'requires_prescription' => ['required', 'boolean'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
