<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductCatalogService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ProductBrowseController extends Controller
{
    use ApiResponse;

    public function index(Request $request, ProductCatalogService $catalog)
    {
        $products = $catalog->customerQuery($request)->paginate($request->integer('per_page', 12));

        return $this->ok($catalog->appendCollection($products), 'প্রোডাক্ট তালিকা পাওয়া গেছে।');
    }

    public function show(int $id, ProductCatalogService $catalog)
    {
        $product = Product::query()
            ->with(['category', 'manufacturer', 'images', 'batches' => $catalog->validBatchConstraint()])
            ->where('is_active', true)
            ->whereHas('batches', $catalog->validBatchConstraint())
            ->findOrFail($id);

        return $this->ok($catalog->appendComputedFields($product), 'প্রোডাক্ট তথ্য পাওয়া গেছে।');
    }
}

