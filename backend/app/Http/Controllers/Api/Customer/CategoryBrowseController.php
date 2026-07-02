<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\ProductCatalogService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CategoryBrowseController extends Controller
{
    use ApiResponse;

    public function index(Request $request, ProductCatalogService $catalog)
    {
        $query = Category::query()
            ->where('status', 'active')
            ->with('children')
            ->orderBy('category_name');

        if ($request->boolean('has_sellable_products')) {
            $query->whereHas('products', function ($productQuery) use ($catalog) {
                $productQuery
                    ->where('is_active', true)
                    ->whereHas('batches', $catalog->validBatchConstraint());
            });
        }

        return $this->ok($query->get(), 'Category list loaded successfully.');
    }

    public function products(Request $request, int $id, ProductCatalogService $catalog)
    {
        $products = $catalog->customerQuery($request)
            ->where('category_id', $id)
            ->paginate($request->integer('per_page', 12));

        return $this->ok($catalog->appendCollection($products), 'Category products loaded successfully.');
    }
}
