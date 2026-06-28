<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryBatch;
use App\Models\StockAdjustmentRequest;
use App\Services\AdminActivityService;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StockAdjustmentRequestController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $requests = StockAdjustmentRequest::query()
            ->with([
                'batch.product:id,product_name',
                'batch.supplier:id,supplier_name',
                'requestedBy:id,full_name,email',
                'reviewedBy:id,full_name,email',
            ])
            ->when(! $this->canApproveStockAdjustments($request), fn ($query) => $query->where('requested_by_staff_id', $request->user()?->id))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->input('status')))
            ->when($request->filled('reason'), fn ($query) => $query->where('reason', $request->input('reason')))
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('reason', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%")
                ->orWhere('note', 'like', "%{$search}%")
                ->orWhere('review_note', 'like', "%{$search}%")
                ->orWhereHas('batch', fn ($batch) => $batch->where('batch_number', 'like', "%{$search}%"))
                ->orWhereHas('batch.product', fn ($product) => $product->where('product_name', 'like', "%{$search}%"))))
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 WHEN status = 'approved' THEN 1 ELSE 2 END")
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($requests, 'Stock adjustment requests loaded.');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        if ($this->canApproveStockAdjustments($request)) {
            return $this->fail('Approvers should use direct stock adjustment instead of creating a pending request.');
        }

        $data = $this->validatedAdjustment($request);

        $this->ensureRequestedStockIsValid($data);

        $adjustment = StockAdjustmentRequest::create([
            ...$data,
            'requested_by_staff_id' => $request->user()?->id,
            'status' => 'pending',
        ]);

        $activity->log($request, 'create', 'stock_adjustment_request', $adjustment->id, null, $adjustment->toArray());

        return $this->ok($adjustment->load('batch.product', 'batch.supplier', 'requestedBy'), 'Stock adjustment request created.', 201);
    }

    public function direct(Request $request, AdminActivityService $activity, InventoryService $inventory)
    {
        $this->authorizeApproval($request);

        $data = $this->validatedAdjustment($request);

        $adjustment = DB::transaction(function () use ($data, $request, $activity, $inventory) {
            $batch = InventoryBatch::query()->lockForUpdate()->findOrFail($data['batch_id']);
            $stockBefore = (int) $batch->stock_quantity;
            $stockAfter = $stockBefore + (int) $data['quantity_change'];

            $this->abortIfStockInvalid($stockAfter, (int) $batch->reserved_quantity);

            $adjustment = StockAdjustmentRequest::create([
                ...$data,
                'requested_by_staff_id' => $request->user()?->id,
                'reviewed_by_staff_id' => $request->user()?->id,
                'status' => 'approved',
                'review_note' => 'Applied directly by approver.',
                'reviewed_at' => now(),
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'reserved_quantity_snapshot' => (int) $batch->reserved_quantity,
            ]);

            $batch->update(['stock_quantity' => $stockAfter]);

            $inventory->transaction(
                $batch->id,
                'adjustment',
                (int) $adjustment->quantity_change,
                'stock_adjustment_request',
                $adjustment->id,
                $this->transactionNote($adjustment)
            );

            $activity->log($request, 'direct_adjustment', 'stock_adjustment_request', $adjustment->id, null, $adjustment->fresh()->toArray());

            return $adjustment->fresh(['batch.product', 'batch.supplier', 'requestedBy', 'reviewedBy']);
        });

        return $this->ok($adjustment, 'Direct stock adjustment applied.', 201);
    }

    public function approve(Request $request, int $id, AdminActivityService $activity, InventoryService $inventory)
    {
        $this->authorizeApproval($request);

        $data = $request->validate([
            'review_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $adjustment = DB::transaction(function () use ($id, $request, $data, $activity, $inventory) {
            $adjustment = StockAdjustmentRequest::query()->lockForUpdate()->findOrFail($id);
            abort_if($adjustment->status !== 'pending', 422, 'Only pending requests can be approved.');

            $batch = InventoryBatch::query()->lockForUpdate()->findOrFail($adjustment->batch_id);
            $stockBefore = (int) $batch->stock_quantity;
            $stockAfter = $stockBefore + (int) $adjustment->quantity_change;

            $this->abortIfStockInvalid($stockAfter, (int) $batch->reserved_quantity);

            $old = $adjustment->toArray();
            $batch->update(['stock_quantity' => $stockAfter]);

            $adjustment->update([
                'status' => 'approved',
                'review_note' => $data['review_note'] ?? null,
                'reviewed_by_staff_id' => $request->user()?->id,
                'reviewed_at' => now(),
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'reserved_quantity_snapshot' => (int) $batch->reserved_quantity,
            ]);

            $inventory->transaction(
                $batch->id,
                'adjustment',
                (int) $adjustment->quantity_change,
                'stock_adjustment_request',
                $adjustment->id,
                $this->transactionNote($adjustment)
            );

            $activity->log($request, 'approve', 'stock_adjustment_request', $adjustment->id, $old, $adjustment->fresh()->toArray());

            return $adjustment->fresh(['batch.product', 'batch.supplier', 'requestedBy', 'reviewedBy']);
        });

        return $this->ok($adjustment, 'Stock adjustment request approved.');
    }

    public function reject(Request $request, int $id, AdminActivityService $activity)
    {
        $this->authorizeApproval($request);

        $data = $request->validate([
            'review_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $adjustment = StockAdjustmentRequest::query()->findOrFail($id);
        abort_if($adjustment->status !== 'pending', 422, 'Only pending requests can be rejected.');

        $old = $adjustment->toArray();
        $adjustment->update([
            'status' => 'rejected',
            'review_note' => $data['review_note'] ?? null,
            'reviewed_by_staff_id' => $request->user()?->id,
            'reviewed_at' => now(),
        ]);

        $activity->log($request, 'reject', 'stock_adjustment_request', $adjustment->id, $old, $adjustment->fresh()->toArray());

        return $this->ok($adjustment->fresh(['batch.product', 'batch.supplier', 'requestedBy', 'reviewedBy']), 'Stock adjustment request rejected.');
    }

    private function authorizeApproval(Request $request): void
    {
        abort_unless($this->canApproveStockAdjustments($request), 403, 'Only super admins can approve stock adjustments.');
    }

    private function canApproveStockAdjustments(Request $request): bool
    {
        $staff = $request->user();

        return (bool) ($staff?->hasRole('Super Admin') || $staff?->can('stock-adjustment.approve'));
    }

    private function validatedAdjustment(Request $request): array
    {
        $data = $request->validate([
            'batch_id' => ['required', 'integer', 'exists:inventory_batches,id'],
            'quantity_change' => ['required', 'integer', 'not_in:0'],
            'reason' => ['required', Rule::in(StockAdjustmentRequest::REASONS)],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        if (in_array($data['reason'], ['damaged', 'expired', 'lost'], true) && (int) $data['quantity_change'] > 0) {
            abort(422, 'Damaged, expired, and lost stock adjustments must reduce stock.');
        }

        return $data;
    }

    private function ensureRequestedStockIsValid(array $data): void
    {
        $batch = InventoryBatch::findOrFail($data['batch_id']);
        $stockAfter = (int) $batch->stock_quantity + (int) $data['quantity_change'];

        abort_if(
            $stockAfter < 0 || $stockAfter < (int) $batch->reserved_quantity,
            422,
            'Requested quantity would make stock lower than reserved quantity.'
        );
    }

    private function abortIfStockInvalid(int $stockAfter, int $reservedQuantity): void
    {
        abort_if($stockAfter < 0, 422, 'Stock cannot be negative.');
        abort_if($stockAfter < $reservedQuantity, 422, 'Stock quantity cannot be lower than the reserved quantity.');
    }

    private function transactionNote(StockAdjustmentRequest $adjustment): string
    {
        $reason = ucfirst(str_replace('_', ' ', $adjustment->reason));
        $note = trim((string) $adjustment->note);

        return $note ? "{$reason}: {$note}" : "{$reason} stock adjustment approved.";
    }
}
