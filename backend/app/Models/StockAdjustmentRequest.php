<?php

namespace App\Models;

class StockAdjustmentRequest extends PharmacyModel
{
    public const REASONS = ['damaged', 'expired', 'lost', 'correction'];

    public const STATUSES = ['pending', 'approved', 'rejected'];

    protected function casts(): array
    {
        return [
            'quantity_change' => 'integer',
            'stock_before' => 'integer',
            'stock_after' => 'integer',
            'reserved_quantity_snapshot' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function batch()
    {
        return $this->belongsTo(InventoryBatch::class, 'batch_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(Staff::class, 'requested_by_staff_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(Staff::class, 'reviewed_by_staff_id');
    }
}
