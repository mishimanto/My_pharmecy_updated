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
        $products = $catalog->customerQuery($request)->paginate($request->integer('per_page', 16));

        return $this->ok($catalog->appendCollection($products), 'Products loaded successfully.');
    }

    public function show(string $slugOrId, ProductCatalogService $catalog)
    {
        $product = Product::query()
            ->select([
                'id',
                'slug',
                'category_id',
                'manufacturer_id',
                'product_name',
                'generic_name',
                'brand_name',
                'strength',
                'dosage_form',
                'pieces_per_strip',
                'strips_per_box',
                'strip_price',
                'box_price',
                'requires_prescription',
                'description',
                'description_bn',
                'is_active',
            ])
            ->with(['category', 'manufacturer', 'images', 'batches' => $catalog->validBatchConstraint()])
            ->where('is_active', true)
            ->whereHas('batches', $catalog->validBatchConstraint())
            ->where(function ($query) use ($slugOrId) {
                $query->where('slug', $slugOrId);

                if (ctype_digit($slugOrId)) {
                    $query->orWhere($query->getModel()->getQualifiedKeyName(), (int) $slugOrId);
                }
            })
            ->firstOrFail();

        return $this->ok($catalog->appendComputedFields($product), 'Product loaded successfully.');
    }
}
