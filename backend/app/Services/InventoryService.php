<?php

namespace App\Services;

use App\Models\InventoryBatch;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function getAvailableStock(int $productId): int
    {
        return (int) $this->getAvailableBatches($productId)
            ->get()
            ->sum(fn (InventoryBatch $batch) => max(0, $batch->stock_quantity - $batch->reserved_quantity));
    }

    public function getAvailableStockMap(array $productIds): array
    {
        $ids = collect($productIds)
            ->filter(fn ($id) => filled($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return InventoryBatch::query()
            ->selectRaw('product_id, SUM(GREATEST(stock_quantity - reserved_quantity, 0)) as available_stock')
            ->whereIn('product_id', $ids)
            ->where('status', 'active')
            ->where('expiry_date', '>', now()->toDateString())
            ->whereRaw('(stock_quantity - reserved_quantity) > 0')
            ->groupBy('product_id')
            ->pluck('available_stock', 'product_id')
            ->map(fn ($stock) => (int) $stock)
            ->all();
    }

    public function getAvailableBatches(int $productId)
    {
        return InventoryBatch::query()
            ->where('product_id', $productId)
            ->where('status', 'active')
            ->where('expiry_date', '>', now()->toDateString())
            ->whereRaw('(stock_quantity - reserved_quantity) > 0')
            ->orderBy('expiry_date');
    }

    public function selectBatchesByFEFO(int $productId, int $quantity): Collection
    {
        $remaining = $quantity;
        $selected = collect();

        $this->getAvailableBatches($productId)->lockForUpdate()->get()->each(function (InventoryBatch $batch) use (&$remaining, $selected) {
            if ($remaining <= 0) {
                return;
            }

            $available = max(0, $batch->stock_quantity - $batch->reserved_quantity);
            $take = min($available, $remaining);
            if ($take > 0) {
                $selected->push(['batch' => $batch, 'quantity' => $take]);
                $remaining -= $take;
            }
        });

        abort_if($remaining > 0, 422, 'পর্যাপ্ত স্টক নেই।');

        return $selected;
    }

    public function reserveStock(int $batchId, int $quantity, string $referenceType, int $referenceId): void
    {
        DB::transaction(function () use ($batchId, $quantity, $referenceType, $referenceId) {
            $batch = InventoryBatch::query()->lockForUpdate()->findOrFail($batchId);
            abort_if($this->available($batch) < $quantity, 422, 'পর্যাপ্ত স্টক নেই।');
            $batch->increment('reserved_quantity', $quantity);
            $this->transaction($batch->id, 'reserve', $quantity, $referenceType, $referenceId);
        });
    }

    public function releaseReservedStock(int $batchId, int $quantity, string $referenceType, int $referenceId): void
    {
        DB::transaction(function () use ($batchId, $quantity, $referenceType, $referenceId) {
            $batch = InventoryBatch::query()->lockForUpdate()->findOrFail($batchId);
            $release = min($batch->reserved_quantity, $quantity);
            $batch->decrement('reserved_quantity', $release);
            $this->transaction($batch->id, 'release', -$release, $referenceType, $referenceId);
        });
    }

    public function markStockSold(int $batchId, int $quantity, string $referenceType, int $referenceId): void
    {
        DB::transaction(function () use ($batchId, $quantity, $referenceType, $referenceId) {
            $batch = InventoryBatch::query()->lockForUpdate()->findOrFail($batchId);
            $batch->decrement('reserved_quantity', min($batch->reserved_quantity, $quantity));
            $batch->decrement('stock_quantity', $quantity);
            $this->transaction($batch->id, 'sold', -$quantity, $referenceType, $referenceId);
        });
    }

    public function returnStock(int $batchId, int $quantity, string $referenceType, int $referenceId): void
    {
        $batch = InventoryBatch::findOrFail($batchId);
        $batch->increment('stock_quantity', $quantity);
        $this->transaction($batch->id, 'return', $quantity, $referenceType, $referenceId);
    }

    public function adjustStock(int $batchId, int $quantity, ?string $note = null): void
    {
        $batch = InventoryBatch::findOrFail($batchId);
        $batch->increment('stock_quantity', $quantity);
        $this->transaction($batch->id, 'adjustment', $quantity, 'inventory_batch', $batch->id, $note);
    }

    public function findSellableBatch(int $productId, int $quantity): InventoryBatch
    {
        return $this->selectBatchesByFEFO($productId, $quantity)->first()['batch'];
    }

    public function reserve(InventoryBatch $batch, int $quantity, string $referenceType, int $referenceId): void
    {
        $this->reserveStock($batch->id, $quantity, $referenceType, $referenceId);
    }

    public function release(InventoryBatch $batch, int $quantity, string $referenceType, int $referenceId): void
    {
        $this->releaseReservedStock($batch->id, $quantity, $referenceType, $referenceId);
    }

    public function sold(InventoryBatch $batch, int $quantity, string $referenceType, int $referenceId): void
    {
        $this->markStockSold($batch->id, $quantity, $referenceType, $referenceId);
    }

    public function transaction(int $batchId, string $type, int $change, ?string $referenceType = null, ?int $referenceId = null, ?string $note = null): void
    {
        DB::table('inventory_transactions')->insert([
            'batch_id' => $batchId,
            'transaction_type' => $type,
            'quantity_change' => $change,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'note' => $note,
            'transaction_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function available(InventoryBatch $batch): int
    {
        return max(0, $batch->stock_quantity - $batch->reserved_quantity);
    }
}
