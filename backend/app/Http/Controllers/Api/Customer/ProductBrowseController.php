<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\DrugInteractionService;
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

    public function show(string $slugOrId, ProductCatalogService $catalog, DrugInteractionService $interactions)
    {
        $product = Product::query()
            ->select($catalog->customerSelectFields())
            ->with($catalog->customerRelations())
            ->where('is_active', true)
            ->whereHas('batches', $catalog->validBatchConstraint())
            ->where(function ($query) use ($slugOrId) {
                $query->where('slug', $slugOrId);

                if (ctype_digit($slugOrId)) {
                    $query->orWhere($query->getModel()->getQualifiedKeyName(), (int) $slugOrId);
                }
            })
            ->firstOrFail();

        $product = $catalog->appendComputedFields($product);
        $product->setAttribute('alternatives', $catalog->alternativesFor($product));
        $product->setAttribute('generic_related_products', $catalog->genericRelatedFor($product));
        $product->setAttribute('interaction_warnings', $interactions->displayForGeneric($product->generic_name));

        return $this->ok($product, 'Product loaded successfully.');
    }
}
