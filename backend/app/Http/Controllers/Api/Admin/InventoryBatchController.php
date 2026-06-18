<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InventoryBatchRequest;
use App\Models\InventoryBatch;
use App\Services\AdminActivityService;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryBatchController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $batches = InventoryBatch::query()
            ->with('product:id,product_name', 'supplier:id,supplier_name')
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('batch_number', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%")
                ->orWhereHas('product', fn ($product) => $product->where('product_name', 'like', "%{$search}%"))
                ->orWhereHas('supplier', fn ($supplier) => $supplier->where('supplier_name', 'like', "%{$search}%"))))
            ->when($request->product_id, fn ($query, $id) => $query->where('product_id', $id))
            ->when($request->supplier_id, fn ($query, $id) => $query->where('supplier_id', $id))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->input('status')))
            ->when($request->stock_state === 'in_stock', fn ($query) => $query->whereRaw('(stock_quantity - reserved_quantity) > 0'))
            ->when($request->stock_state === 'reserved', fn ($query) => $query->where('reserved_quantity', '>', 0))
            ->when($request->stock_state === 'out_of_stock', fn ($query) => $query->whereRaw('(stock_quantity - reserved_quantity) <= 0'))
            ->orderByRaw("CASE WHEN status = 'active' THEN 0 WHEN status = 'inactive' THEN 1 WHEN status = 'expired' THEN 2 ELSE 3 END")
            ->orderBy('expiry_date')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        $batches->getCollection()->transform(fn ($batch) => $this->appendAvailable($batch));

        return $this->ok($batches, 'Inventory batches retrieved.');
    }

    public function store(InventoryBatchRequest $request, AdminActivityService $activity, InventoryService $inventory)
    {
        $data = $this->validated($request);
        $batch = InventoryBatch::create($data);
        $inventory->transaction($batch->id, 'stock_in', (int) $batch->stock_quantity, 'inventory_batch', $batch->id, 'Initial stock');
        $activity->log($request, 'create', 'inventory_batch', $batch->id, null, $batch->toArray());

        return $this->ok($this->appendAvailable($batch->load('product', 'supplier')), 'Inventory batch created.', 201);
    }

    public function show(int $id)
    {
        return $this->ok($this->appendAvailable(InventoryBatch::with('product', 'supplier')->findOrFail($id)), 'Inventory batch details retrieved.');
    }

    public function update(InventoryBatchRequest $request, int $id, AdminActivityService $activity, InventoryService $inventory)
    {
        $batch = InventoryBatch::findOrFail($id);
        $old = $batch->toArray();
        $data = $this->validated($request);
        $stockDiff = (int) $data['stock_quantity'] - (int) $batch->stock_quantity;
        $batch->update($data);

        if ($stockDiff !== 0) {
            $inventory->transaction($batch->id, 'adjustment', $stockDiff, 'inventory_batch', $batch->id, 'Batch quantity updated');
        }

        $activity->log($request, 'update', 'inventory_batch', $batch->id, $old, $batch->fresh()->toArray());

        return $this->ok($this->appendAvailable($batch->load('product', 'supplier')), 'Inventory batch updated.');
    }

    public function status(Request $request, int $id, AdminActivityService $activity, InventoryService $inventory)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['active', 'inactive', 'expired', 'damaged'])]]);
        $batch = InventoryBatch::findOrFail($id);
        $old = ['status' => $batch->status];
        $batch->update(['status' => $data['status']]);

        if (in_array($data['status'], ['expired', 'damaged'], true)) {
            $inventory->transaction($batch->id, $data['status'], 0, 'inventory_batch', $batch->id, 'Batch status changed');
        }

        $activity->log($request, 'status', 'inventory_batch', $batch->id, $old, ['status' => $batch->status]);

        return $this->ok($this->appendAvailable($batch->load('product', 'supplier')), 'Inventory batch status updated.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $batch = InventoryBatch::findOrFail($id);
        abort_if($batch->reserved_quantity > 0, 422, 'Batch has reserved stock and cannot be deleted.');
        $old = $batch->toArray();
        $batch->delete();
        $activity->log($request, 'delete', 'inventory_batch', $id, $old);

        return $this->ok(null, 'Inventory batch deleted.');
    }

    private function validated(InventoryBatchRequest $request): array
    {
        return $request->validated();
    }

    private function appendAvailable(InventoryBatch $batch): InventoryBatch
    {
        $batch->available_stock = max(0, $batch->stock_quantity - $batch->reserved_quantity);

        return $batch;
    }
}
