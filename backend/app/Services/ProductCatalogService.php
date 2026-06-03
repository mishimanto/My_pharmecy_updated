<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class ProductCatalogService
{
    public function validBatchConstraint(): \Closure
    {
        return fn ($query) => $query
            ->where('status', 'active')
            ->whereDate('expiry_date', '>', now())
            ->whereRaw('(stock_quantity - reserved_quantity) > 0')
            ->orderBy('expiry_date');
    }

    public function customerQuery(Request $request): Builder
    {
        return Product::query()
            ->with([
                'category',
                'manufacturer',
                'images',
                'batches' => $this->validBatchConstraint(),
            ])
            ->where('is_active', true)
            ->whereHas('batches', $this->validBatchConstraint())
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('product_name', 'like', "%{$search}%")
                ->orWhere('generic_name', 'like', "%{$search}%")
                ->orWhere('brand_name', 'like', "%{$search}%")))
            ->when($request->category_id, fn ($query, $id) => $query->where('category_id', $id))
            ->when($request->manufacturer_id, fn ($query, $id) => $query->where('manufacturer_id', $id))
            ->when($request->filled('requires_prescription'), fn ($query) => $query->where('requires_prescription', $request->boolean('requires_prescription')));
    }

    public function appendComputedFields(Product $product): Product
    {
        $validBatches = $product->relationLoaded('batches')
            ? $product->batches
            : $product->batches()->where('status', 'active')->whereDate('expiry_date', '>', now())->whereRaw('(stock_quantity - reserved_quantity) > 0')->orderBy('expiry_date')->get();

        $fefoBatch = $validBatches->first();
        $product->available_stock = $validBatches->sum(fn ($batch) => max(0, $batch->stock_quantity - $batch->reserved_quantity));
        $product->display_price = $fefoBatch?->selling_price;
        $product->lowest_valid_price = $validBatches->min('selling_price');
        $product->primary_image = $product->images->firstWhere('is_primary', true) ?? $product->images->first();

        return $product;
    }

    public function appendCollection($products)
    {
        $products->getCollection()->transform(fn (Product $product) => $this->appendComputedFields($product));

        return $products;
    }
}
