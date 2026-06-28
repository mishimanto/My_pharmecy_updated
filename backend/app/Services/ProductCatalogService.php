<?php

namespace App\Services;

use App\Models\Product;
use App\Support\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ProductCatalogService
{
    public function __construct(private OfferDiscountService $offers) {}

    private const UNIT_LABELS = [
        'piece' => 'Piece',
        'strip' => 'Strip',
        'box' => 'Box',
    ];

    public function validBatchConstraint(): \Closure
    {
        return function ($query) {
            $query
                ->where('status', 'active')
                ->whereDate('expiry_date', '>', now())
                ->whereRaw('(stock_quantity - reserved_quantity) > 0');

            if (method_exists($query, 'orderBy')) {
                $query->orderBy('expiry_date');
            }
        };
    }

    public function customerQuery(Request $request): \Illuminate\Database\Eloquent\Builder
    {
        return Product::query()
            ->select($this->customerSelectFields())
            ->with($this->customerRelations())
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

    public function customerSelectFields(): array
    {
        return [
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
            'strip_discount',
            'box_discount',
            'requires_prescription',
            'description',
            'description_bn',
            'is_active',
        ];
    }

    public function customerRelations(): array
    {
        return [
            'category:id,category_name',
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

    public function appendComputedFields(Product $product): Product
    {
        $validBatches = $product->relationLoaded('batches')
            ? $product->batches
            : $product->batches()->where('status', 'active')->whereDate('expiry_date', '>', now())->whereRaw('(stock_quantity - reserved_quantity) > 0')->orderBy('expiry_date')->get();

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

    public function unitLabel(string $unit): string
    {
        return self::UNIT_LABELS[$unit] ?? ucfirst($unit);
    }

    private function buildOption(
        string $code,
        int $piecesPerUnit,
        float $unitPrice,
        float $comparePrice,
        int $availableStock,
        bool $mostPopular = false
    ): array {
        $availableQuantity = intdiv($availableStock, max(1, $piecesPerUnit));
        $savings = max(0, Currency::whole($comparePrice - $unitPrice));

        return [
            'code' => $code,
            'label' => $this->unitLabel($code),
            'pieces_per_unit' => $piecesPerUnit,
            'unit_price' => Currency::whole($unitPrice),
            'compare_price' => Currency::whole($comparePrice),
            'savings' => $savings,
            'available_quantity' => $availableQuantity,
            'is_available' => $availableQuantity > 0,
            'badge' => $mostPopular ? 'Most Popular' : null,
            'conversion_label' => $this->conversionLabel($code, $piecesPerUnit),
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
}
