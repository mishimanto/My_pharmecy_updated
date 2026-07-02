<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Support\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class ProductCatalogService
{
    private ?bool $hasCategoryBanglaNameColumn = null;
    private ?bool $hasProductBanglaNameColumn = null;
    private ?bool $hasGenericBanglaNameColumn = null;

    public function __construct(private OfferDiscountService $offers) {}

    private const UNIT_LABELS = [
        'piece' => 'Piece',
        'strip' => 'Strip',
        'box' => 'Box',
        'pack' => 'Pack',
        'packet' => 'Packet',
        'bottle' => 'Bottle',
        'kit' => 'Kit',
        'device' => 'Device',
        'tube' => 'Tube',
        'jar' => 'Jar',
        'unit' => 'Unit',
    ];

    private const NON_MEDICINE_CATEGORY_KEYWORDS = [
        'Medical Device',
        'First Aid',
        'Hygiene',
        'Mother & Baby',
        'Mother and Baby',
        'Personal Care',
        'Skin Care',
        'Vitamins',
        'Supplements',
        "Women's Health",
    ];

    public function validBatchConstraint(): \Closure
    {
        return function ($query) {
            $query
                ->where('status', 'active')
                ->where('expiry_date', '>', now()->toDateString())
                ->whereRaw('(stock_quantity - reserved_quantity) > 0');

            if (method_exists($query, 'orderBy')) {
                $query->orderBy('expiry_date');
            }
        };
    }

    public function customerQuery(Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $categoryFilter = $this->resolveCustomerCategoryFilter($request);
        $manufacturerFilter = $this->resolveCustomerManufacturerFilter($request);
        $prescriptionFilter = $this->resolveCustomerPrescriptionFilter($request);
        $productTypeFilter = $this->resolveCustomerProductTypeFilter($request);

        return Product::query()
            ->select($this->customerListSelectFields())
            ->with($this->customerListRelations())
            ->where('is_active', true)
            ->whereHas('batches', $this->validBatchConstraint())
            ->when($request->search, function ($query, $search) {
                $term = trim((string) $search);
                $lowerTerm = mb_strtolower($term);
                $contains = "%{$lowerTerm}%";
                $startsWith = "{$lowerTerm}%";

                $query
                    ->where(fn ($inner) => $inner
                        ->where('product_name', 'like', "%{$term}%")
                        ->orWhere('generic_name', 'like', "%{$term}%")
                        ->orWhere('brand_name', 'like', "%{$term}%"))
                    ->orderByRaw(
                        "CASE
                            WHEN LOWER(product_name) = ? THEN 0
                            WHEN LOWER(product_name) LIKE ? THEN 1
                            WHEN LOWER(brand_name) = ? THEN 2
                            WHEN LOWER(brand_name) LIKE ? THEN 3
                            WHEN LOWER(generic_name) = ? THEN 4
                            WHEN LOWER(generic_name) LIKE ? THEN 5
                            WHEN LOWER(product_name) LIKE ? THEN 6
                            WHEN LOWER(brand_name) LIKE ? THEN 7
                            WHEN LOWER(generic_name) LIKE ? THEN 8
                            ELSE 9
                        END",
                        [
                            $lowerTerm,
                            $startsWith,
                            $lowerTerm,
                            $startsWith,
                            $lowerTerm,
                            $startsWith,
                            $contains,
                            $contains,
                            $contains,
                        ]
                    )
                    ->orderBy('product_name');
            })
            ->when($categoryFilter['requested'] && ! $categoryFilter['id'], fn ($query) => $query->whereRaw('1 = 0'))
            ->when($categoryFilter['id'], fn ($query, $id) => $query->where('category_id', $id))
            ->when($manufacturerFilter['requested'] && ! $manufacturerFilter['id'], fn ($query) => $query->whereRaw('1 = 0'))
            ->when($manufacturerFilter['id'], fn ($query, $id) => $query->where('manufacturer_id', $id))
            ->when($productTypeFilter === 'medicine', fn ($query) => $this->applyMedicineFilter($query))
            ->when($productTypeFilter === 'non_medicine', fn ($query) => $this->applyNonMedicineFilter($query))
            ->when($prescriptionFilter['requested'], fn ($query) => $query->where('requires_prescription', $prescriptionFilter['value']));
    }

    private function resolveCustomerCategoryFilter(Request $request): array
    {
        if ($request->filled('category_id')) {
            return ['requested' => true, 'id' => (int) $request->input('category_id')];
        }

        $category = trim((string) $request->input('category', ''));

        if ($category === '') {
            return ['requested' => false, 'id' => null];
        }

        if (ctype_digit($category)) {
            return ['requested' => true, 'id' => (int) $category];
        }

        $categoryId = Category::query()
            ->select($this->categoryLookupSelectFields())
            ->where('status', 'active')
            ->get()
            ->first(fn ($item) => $this->filterSlug($item->category_name) === $this->filterSlug($category))
            ?->id;

        return ['requested' => true, 'id' => $categoryId ? (int) $categoryId : null];
    }

    private function resolveCustomerManufacturerFilter(Request $request): array
    {
        if ($request->filled('manufacturer_id')) {
            return ['requested' => true, 'id' => (int) $request->input('manufacturer_id')];
        }

        $manufacturer = trim((string) $request->input('manufacturer', ''));

        if ($manufacturer === '') {
            return ['requested' => false, 'id' => null];
        }

        if (ctype_digit($manufacturer)) {
            return ['requested' => true, 'id' => (int) $manufacturer];
        }

        $manufacturerId = Manufacturer::query()
            ->select(['id', 'manufacturer_name'])
            ->where('status', 'active')
            ->get()
            ->first(fn ($item) => $this->filterSlug($item->manufacturer_name) === $this->filterSlug($manufacturer))
            ?->id;

        return ['requested' => true, 'id' => $manufacturerId ? (int) $manufacturerId : null];
    }

    private function resolveCustomerPrescriptionFilter(Request $request): array
    {
        if ($request->filled('prescription')) {
            $value = strtolower(trim((string) $request->input('prescription')));

            if (in_array($value, ['required', 'rx', 'yes', 'true', '1'], true)) {
                return ['requested' => true, 'value' => true];
            }

            if (in_array($value, ['not-required', 'not_required', 'otc', 'no', 'false', '0'], true)) {
                return ['requested' => true, 'value' => false];
            }

            return ['requested' => false, 'value' => null];
        }

        if ($request->filled('requires_prescription')) {
            return ['requested' => true, 'value' => $request->boolean('requires_prescription')];
        }

        return ['requested' => false, 'value' => null];
    }

    private function resolveCustomerProductTypeFilter(Request $request): ?string
    {
        $value = strtolower(trim((string) (
            $request->input('type')
            ?: $request->input('product_type')
            ?: $request->input('category_group')
        )));

        if (in_array($value, ['medicine', 'medicines'], true)) {
            return 'medicine';
        }

        if (in_array($value, ['other', 'others', 'non_medicine', 'non-medicine', 'nonmedicine', 'healthcare'], true)) {
            return 'non_medicine';
        }

        return null;
    }

    private function applyNonMedicineFilter($query)
    {
        return $query
            ->where('requires_prescription', false)
            ->where(fn ($group) => $group
                ->where('product_type', '!=', 'medicine')
                ->orWhereHas('category', fn ($category) => $this->applyNonMedicineCategoryKeywordFilter($category))
                ->orWhere(fn ($legacy) => $legacy
                    ->where(fn ($fields) => $fields
                        ->whereNull('generic_name')
                        ->orWhere('generic_name', ''))
                    ->where(fn ($fields) => $fields
                        ->whereNull('strength')
                        ->orWhere('strength', ''))
                    ->where(fn ($fields) => $fields
                        ->whereNull('dosage_form')
                        ->orWhere('dosage_form', ''))
                    ->whereHas('category', fn ($category) => $category->where(function ($inner) {
                        foreach (self::NON_MEDICINE_CATEGORY_KEYWORDS as $index => $keyword) {
                            $method = $index === 0 ? 'where' : 'orWhere';
                            $inner->{$method}('category_name', 'like', "%{$keyword}%");
                        }
                    }))));
    }

    private function applyMedicineFilter($query)
    {
        return $query
            ->where(fn ($group) => $group
                ->where('product_type', 'medicine')
                ->orWhere(fn ($legacy) => $legacy
                    ->where(fn ($fields) => $fields
                        ->whereNull('product_type')
                        ->orWhere('product_type', ''))))
            ->whereDoesntHave('category', fn ($category) => $this->applyNonMedicineCategoryKeywordFilter($category));
    }

    private function applyNonMedicineCategoryKeywordFilter($query)
    {
        return $query->where(function ($inner) {
            foreach (self::NON_MEDICINE_CATEGORY_KEYWORDS as $index => $keyword) {
                $method = $index === 0 ? 'where' : 'orWhere';
                $inner->{$method}('category_name', 'like', "%{$keyword}%");
            }
        });
    }

    private function filterSlug(string $value): string
    {
        $slug = preg_replace('/[^\p{L}\p{N}]+/u', '-', mb_strtolower(str_replace('&', ' and ', trim($value))));

        return trim((string) $slug, '-');
    }

    public function customerSelectFields(): array
    {
        $fields = [
            'id',
            'slug',
            'category_id',
            'manufacturer_id',
            'product_type',
            'product_name',
            'generic_name',
            'brand_name',
            'strength',
            'dosage_form',
            'package_unit',
            'package_size',
            'pieces_per_strip',
            'strips_per_box',
            'strip_price',
            'box_price',
            'strip_discount',
            'box_discount',
            'requires_prescription',
            'description',
            'description_bn',
            'indications',
            'indications_bn',
            'pharmacology',
            'pharmacology_bn',
            'dosage_administration',
            'dosage_administration_bn',
            'interaction_details',
            'interaction_details_bn',
            'contraindications',
            'contraindications_bn',
            'side_effects',
            'side_effects_bn',
            'pregnancy_lactation',
            'pregnancy_lactation_bn',
            'precautions_warnings',
            'precautions_warnings_bn',
            'therapeutic_class',
            'therapeutic_class_bn',
            'storage_conditions',
            'storage_conditions_bn',
            'leaflet_url',
            'specifications',
            'is_active',
        ];

        if ($this->hasProductBanglaNameColumn()) {
            $fields[] = 'product_name_bn';
        }

        if ($this->hasGenericBanglaNameColumn()) {
            $fields[] = 'generic_name_bn';
        }

        return $fields;
    }

    public function customerListSelectFields(): array
    {
        $fields = [
            'id',
            'slug',
            'category_id',
            'manufacturer_id',
            'product_type',
            'product_name',
            'generic_name',
            'brand_name',
            'strength',
            'dosage_form',
            'package_unit',
            'package_size',
            'pieces_per_strip',
            'strips_per_box',
            'strip_price',
            'box_price',
            'strip_discount',
            'box_discount',
            'requires_prescription',
            'is_active',
        ];

        if ($this->hasProductBanglaNameColumn()) {
            $fields[] = 'product_name_bn';
        }

        if ($this->hasGenericBanglaNameColumn()) {
            $fields[] = 'generic_name_bn';
        }

        return $fields;
    }

    public function customerRelations(): array
    {
        return [
            'category:' . implode(',', $this->categoryLookupSelectFields()),
            'manufacturer:id,manufacturer_name,logo_url,logo_path',
            'images:id,product_id,image_url,image_path,image_webp_path,thumbnail_path,is_primary',
            'batches' => function ($query) {
                ($this->validBatchConstraint())($query);
                $query->select([
                    'id',
                    'product_id',
                    'batch_number',
                    'selling_price',
                    'stock_quantity',
                    'reserved_quantity',
                    'status',
                    'expiry_date',
                ]);
            },
        ];
    }

    public function customerListRelations(): array
    {
        return [
            'category:' . implode(',', $this->categoryLookupSelectFields()),
            'manufacturer:id,manufacturer_name,logo_url,logo_path',
            'images:id,product_id,image_url,image_path,image_webp_path,thumbnail_path,is_primary',
            'batches' => function ($query) {
                ($this->validBatchConstraint())($query);
                $query->select([
                    'id',
                    'product_id',
                    'selling_price',
                    'stock_quantity',
                    'reserved_quantity',
                    'expiry_date',
                ]);
            },
        ];
    }

    private function categoryLookupSelectFields(): array
    {
        $fields = ['id', 'category_name'];

        if ($this->hasCategoryBanglaNameColumn()) {
            $fields[] = 'category_name_bn';
        }

        return $fields;
    }

    private function hasCategoryBanglaNameColumn(): bool
    {
        return $this->hasCategoryBanglaNameColumn ??= Schema::hasColumn('categories', 'category_name_bn');
    }

    private function hasProductBanglaNameColumn(): bool
    {
        return $this->hasProductBanglaNameColumn ??= Schema::hasColumn('products', 'product_name_bn');
    }

    private function hasGenericBanglaNameColumn(): bool
    {
        return $this->hasGenericBanglaNameColumn ??= Schema::hasColumn('products', 'generic_name_bn');
    }

    public function appendComputedFields(Product $product): Product
    {
        $validBatches = $product->relationLoaded('batches')
            ? $product->batches
            : $product->batches()->where('status', 'active')->where('expiry_date', '>', now()->toDateString())->whereRaw('(stock_quantity - reserved_quantity) > 0')->orderBy('expiry_date')->get();

        $fefoBatch = $validBatches->first();
        $baseDisplayPrice = Currency::whole($fefoBatch?->selling_price ?? 0);
        $pricing = $this->offers->priceForProduct($product, $baseDisplayPrice);
        $product->available_stock = $validBatches->sum(fn ($batch) => max(0, $batch->stock_quantity - $batch->reserved_quantity));
        $product->base_display_price = $baseDisplayPrice;
        $product->display_price = $pricing['final_price'];
        $product->discount_amount = $pricing['discount_amount'];
        $product->active_offer = $pricing['offer'];
        $product->lowest_valid_price = $validBatches->min('selling_price');
        $product->primary_image = $product->images->firstWhere('is_primary', true) ?? $product->images->first();
        $product->unit_config = $this->unitConfig($product);
        $product->purchase_options = $this->purchaseOptions($product);
        $product->default_purchase_unit = $this->defaultPurchaseUnit($product);

        return $product;
    }

    public function appendCollection($products)
    {
        $products->getCollection()->transform(fn (Product $product) => $this->appendComputedFields($product));

        return $products;
    }

    public function appendProductCollection(Collection $products): Collection
    {
        return $products->map(fn (Product $product) => $this->appendComputedFields($product))->values();
    }

    public function alternativesFor(Product $product, int $limit = 6): Collection
    {
        $ids = $product->alternatives()->pluck('products.id');

        if ($ids->isEmpty()) {
            return collect();
        }

        return $this->appendProductCollection(
            Product::query()
                ->select($this->customerSelectFields())
                ->with($this->customerRelations())
                ->whereKey($ids)
                ->where('is_active', true)
                ->whereHas('batches', $this->validBatchConstraint())
                ->orderBy('product_name')
                ->limit($limit)
                ->get()
        );
    }

    public function genericRelatedFor(Product $product, int $limit = 8): Collection
    {
        $generic = trim((string) $product->generic_name);

        if ($generic === '') {
            return collect();
        }

        $alternativeIds = $product->alternatives()->pluck('products.id')->all();

        return $this->appendProductCollection(
            Product::query()
                ->select($this->customerSelectFields())
                ->with($this->customerRelations())
                ->where('is_active', true)
                ->where('generic_name', $generic)
                ->whereKeyNot($product->id)
                ->when($alternativeIds !== [], fn ($query) => $query->whereNotIn('id', $alternativeIds))
                ->whereHas('batches', $this->validBatchConstraint())
                ->orderBy('product_name')
                ->limit($limit)
                ->get()
        );
    }

    public function unitConfig(Product $product): array
    {
        if (! $this->isMedicine($product)) {
            return [
                'pieces_per_strip' => 1,
                'strips_per_box' => 1,
                'pieces_per_box' => 1,
            ];
        }

        $piecesPerStrip = max(1, (int) ($product->pieces_per_strip ?: 10));
        $stripsPerBox = max(1, (int) ($product->strips_per_box ?: 10));

        return [
            'pieces_per_strip' => $piecesPerStrip,
            'strips_per_box' => $stripsPerBox,
            'pieces_per_box' => $piecesPerStrip * $stripsPerBox,
        ];
    }

    public function purchaseOptions(Product $product): array
    {
        $piecePrice = Currency::whole($product->base_display_price ?? $product->display_price ?? 0);
        $availableStock = max(0, (int) ($product->available_stock ?? 0));

        if (! $this->isMedicine($product)) {
            return [
                $this->applyOfferToOption(
                    $product,
                    $this->buildOption(
                        $this->packageUnit($product),
                        1,
                        $piecePrice,
                        $piecePrice,
                        $availableStock,
                        false,
                        $this->unitLabel($this->packageUnit($product), $product),
                        $this->conversionLabelFor($product, $this->packageUnit($product), 1),
                    )
                ),
            ];
        }

        $config = $this->unitConfig($product);

        $options = [
            $this->buildOption('piece', 1, $piecePrice, $piecePrice, $availableStock),
        ];

        if ($config['pieces_per_strip'] > 1) {
            $stripCompare = Currency::whole($piecePrice * $config['pieces_per_strip']);
            $stripPrice = $this->unitPriceFromRule($product->strip_price, $product->strip_discount, $stripCompare);
            $options[] = $this->buildOption('strip', $config['pieces_per_strip'], $stripPrice, $stripCompare, $availableStock, true);
        }

        if ($config['pieces_per_box'] > 1) {
            $boxCompare = Currency::whole($piecePrice * $config['pieces_per_box']);
            $boxPrice = $this->unitPriceFromRule($product->box_price, $product->box_discount, $boxCompare);
            $options[] = $this->buildOption('box', $config['pieces_per_box'], $boxPrice, $boxCompare, $availableStock);
        }

        return array_map(fn (array $option) => $this->applyOfferToOption($product, $option), $options);
    }

    public function defaultPurchaseUnit(Product $product): string
    {
        if (! $this->isMedicine($product)) {
            return $this->packageUnit($product);
        }

        $options = collect($this->purchaseOptions($product));
        $strip = $options->first(fn (array $option) => $option['code'] === 'strip' && $option['is_available']);

        if ($strip) {
            return 'strip';
        }

        $firstAvailable = $options->firstWhere('is_available', true);

        return $firstAvailable['code'] ?? 'piece';
    }

    public function purchaseOption(Product $product, string $unit): ?array
    {
        return collect($this->purchaseOptions($product))
            ->first(fn (array $option) => $option['code'] === $unit);
    }

    public function unitLabel(string $unit, ?Product $product = null): string
    {
        if ($product && ! $this->isMedicine($product)) {
            return self::UNIT_LABELS[$this->packageUnit($product)] ?? ucfirst(str_replace('_', ' ', $this->packageUnit($product)));
        }

        return self::UNIT_LABELS[$unit] ?? ucfirst(str_replace('_', ' ', $unit));
    }

    public function conversionLabelFor(Product $product, string $code, int $piecesPerUnit): string
    {
        if (! $this->isMedicine($product)) {
            $unit = $this->unitLabel($code, $product);
            $packageSize = trim((string) $product->package_size);

            return $packageSize !== '' ? $packageSize : "1 {$unit}";
        }

        return $this->conversionLabel($code, $piecesPerUnit);
    }

    private function buildOption(
        string $code,
        int $piecesPerUnit,
        float $unitPrice,
        float $comparePrice,
        int $availableStock,
        bool $mostPopular = false,
        ?string $label = null,
        ?string $conversionLabel = null,
    ): array {
        $availableQuantity = intdiv($availableStock, max(1, $piecesPerUnit));
        $savings = max(0, Currency::whole($comparePrice - $unitPrice));

        return [
            'code' => $code,
            'label' => $label ?: $this->unitLabel($code),
            'pieces_per_unit' => $piecesPerUnit,
            'unit_price' => Currency::whole($unitPrice),
            'compare_price' => Currency::whole($comparePrice),
            'savings' => $savings,
            'available_quantity' => $availableQuantity,
            'is_available' => $availableQuantity > 0,
            'badge' => $mostPopular ? 'Most Popular' : null,
            'conversion_label' => $conversionLabel ?: $this->conversionLabel($code, $piecesPerUnit),
        ];
    }

    private function unitPriceFromRule(null|int|float|string $fixedPrice, null|int|float|string $discount, float $comparePrice): float
    {
        if ($fixedPrice !== null && $fixedPrice !== '') {
            return Currency::whole($fixedPrice);
        }

        return Currency::whole(max(0, $comparePrice - Currency::whole($discount)));
    }

    private function applyOfferToOption(Product $product, array $option): array
    {
        $pricing = $this->offers->priceForProduct($product, $option['unit_price']);

        $option['base_unit_price'] = $option['unit_price'];
        $option['unit_price'] = $pricing['final_price'];
        $option['discount_amount'] = $pricing['discount_amount'];
        $option['offer'] = $pricing['offer'];
        $option['compare_price'] = max($option['compare_price'], $option['base_unit_price']);
        $option['savings'] = Currency::whole(($option['savings'] ?? 0) + $pricing['discount_amount']);

        return $option;
    }

    private function conversionLabel(string $code, int $piecesPerUnit): string
    {
        if ($code === 'piece') {
            return '1 piece';
        }

        return "1 {$this->unitLabel($code)} = {$piecesPerUnit} pieces";
    }

    private function isMedicine(Product $product): bool
    {
        return ($product->product_type ?: 'medicine') === 'medicine';
    }

    private function packageUnit(Product $product): string
    {
        $unit = strtolower(trim((string) ($product->package_unit ?: 'piece')));

        return array_key_exists($unit, self::UNIT_LABELS) ? $unit : 'unit';
    }
}
