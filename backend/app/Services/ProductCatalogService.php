<?php

namespace App\Services;

use App\Models\Product;
use App\Support\Currency;
use Illuminate\Http\Request;

class ProductCatalogService
{
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
            ->with([
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
        $piecePrice = Currency::whole($product->display_price ?? 0);
        $availableStock = max(0, (int) ($product->available_stock ?? 0));
        $config = $this->unitConfig($product);

        $options = [
            $this->buildOption('piece', 1, $piecePrice, $piecePrice, $availableStock),
        ];

        if ($config['pieces_per_strip'] > 1) {
            $stripCompare = Currency::whole($piecePrice * $config['pieces_per_strip']);
            $stripPrice = Currency::whole($product->strip_price ?? $stripCompare);
            $options[] = $this->buildOption('strip', $config['pieces_per_strip'], $stripPrice, $stripCompare, $availableStock, true);
        }

        if ($config['pieces_per_box'] > 1) {
            $boxCompare = Currency::whole($piecePrice * $config['pieces_per_box']);
            $boxPrice = Currency::whole($product->box_price ?? $boxCompare);
            $options[] = $this->buildOption('box', $config['pieces_per_box'], $boxPrice, $boxCompare, $availableStock);
        }

        return $options;
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

    private function conversionLabel(string $code, int $piecesPerUnit): string
    {
        if ($code === 'piece') {
            return '1 piece';
        }

        return "1 {$this->unitLabel($code)} = {$piecesPerUnit} pieces";
    }
}
