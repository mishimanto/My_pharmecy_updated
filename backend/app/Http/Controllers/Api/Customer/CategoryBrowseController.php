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

    public function index()
    {
        return $this->ok(Category::where('status', 'active')->with('children')->orderBy('category_name')->get(), 'ক্যাটাগরি তালিকা পাওয়া গেছে।');
    }

    public function products(Request $request, int $id, ProductCatalogService $catalog)
    {
        $products = $catalog->customerQuery($request)
            ->where('category_id', $id)
            ->paginate($request->integer('per_page', 12));

        return $this->ok($catalog->appendCollection($products), 'ক্যাটাগরির প্রোডাক্ট পাওয়া গেছে।');
    }
}

