<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryBatch;
use App\Models\Product;
use App\Services\AdminActivityService;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $products = Product::query()
            ->with([
                'category:id,category_name',
                'manufacturer:id,manufacturer_name',
                'images',
                'batches' => fn ($query) => $query
                    ->orderByRaw("CASE WHEN status = 'active' AND expiry_date > CURDATE() AND (stock_quantity - reserved_quantity) > 0 THEN 0 ELSE 1 END")
                    ->orderBy('expiry_date'),
            ])
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('product_name', 'like', "%{$search}%")
                ->orWhere('generic_name', 'like', "%{$search}%")
                ->orWhere('brand_name', 'like', "%{$search}%")))
            ->when($request->category_id, fn ($query, $id) => $query->where('category_id', $id))
            ->when($request->manufacturer_id, fn ($query, $id) => $query->where('manufacturer_id', $id))
            ->when($request->filled('status'), fn ($query) => $query->where('is_active', $request->input('status') === 'active'))
            ->when($request->filled('prescription'), fn ($query) => $query->where('requires_prescription', $request->input('prescription') === 'required'))
            ->orderBy('product_name')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($products, 'Product list retrieved.');
    }

    public function store(Request $request, AdminActivityService $activity, InventoryService $inventory)
    {
        $data = $this->validated($request);
        $batchData = $this->initialBatchData($data);

        $product = DB::transaction(function () use ($data, $batchData, $activity, $inventory, $request) {
            $product = Product::create($data);
            $this->createInitialBatch($product, $batchData, $inventory);
            $activity->log($request, 'create', 'product', $product->id, null, $product->toArray());

            return $product;
        });

        return $this->ok($product->load('category', 'manufacturer', 'images', 'batches'), 'Product created.', 201);
    }

    public function show(int $id)
    {
        return $this->ok(Product::with('category', 'manufacturer', 'images', 'batches.supplier')->findOrFail($id), 'Product details retrieved.');
    }

    public function update(Request $request, int $id, AdminActivityService $activity, InventoryService $inventory)
    {
        $product = Product::findOrFail($id);
        $old = $product->toArray();
        $data = $this->validated($request);
        $batchData = $this->initialBatchData($data);

        DB::transaction(function () use ($product, $data, $batchData, $activity, $inventory, $request, $old) {
            $product->update($data);
            $this->createInitialBatch($product, $batchData, $inventory);
            $activity->log($request, 'update', 'product', $product->id, $old, $product->fresh()->toArray());
        });

        return $this->ok($product->load('category', 'manufacturer', 'images', 'batches'), 'Product updated.');
    }

    public function status(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $product = Product::findOrFail($id);
        $old = ['is_active' => $product->is_active];
        $product->update($data);
        $activity->log($request, 'status', 'product', $product->id, $old, ['is_active' => $product->is_active]);

        return $this->ok($product, 'Product status updated.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $product = Product::with('images')->findOrFail($id);
        $old = $product->toArray();
        $product->delete();
        $activity->log($request, 'delete', 'product', $id, $old);

        return $this->ok(null, 'Product deleted.');
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
            'description_bn' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'initial_batch' => ['nullable', 'array'],
            'initial_batch.enabled' => ['nullable', 'boolean'],
            'initial_batch.supplier_id' => ['required_if:initial_batch.enabled,true', 'nullable', 'exists:suppliers,id'],
            'initial_batch.batch_number' => ['required_if:initial_batch.enabled,true', 'nullable', 'string', 'max:100'],
            'initial_batch.expiry_date' => ['required_if:initial_batch.enabled,true', 'nullable', 'date', 'after:today'],
            'initial_batch.manufactured_date' => ['nullable', 'date'],
            'initial_batch.purchase_price' => ['required_if:initial_batch.enabled,true', 'nullable', 'numeric', 'min:0'],
            'initial_batch.selling_price' => ['required_if:initial_batch.enabled,true', 'nullable', 'numeric', 'min:0'],
            'initial_batch.stock_quantity' => ['required_if:initial_batch.enabled,true', 'nullable', 'integer', 'min:1'],
        ]);
    }

    private function initialBatchData(array &$data): ?array
    {
        $batch = $data['initial_batch'] ?? null;
        unset($data['initial_batch']);

        if (! is_array($batch) || ! ($batch['enabled'] ?? false)) {
            return null;
        }

        unset($batch['enabled']);
        $batch['reserved_quantity'] = 0;
        $batch['status'] = 'active';

        return $batch;
    }

    private function createInitialBatch(Product $product, ?array $batchData, InventoryService $inventory): void
    {
        if (! $batchData) {
            return;
        }

        $batch = InventoryBatch::create([
            ...$batchData,
            'product_id' => $product->id,
        ]);

        $inventory->transaction($batch->id, 'stock_in', (int) $batch->stock_quantity, 'inventory_batch', $batch->id, 'Initial stock');
    }
}
