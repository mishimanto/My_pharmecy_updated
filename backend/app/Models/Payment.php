<?php

namespace App\Models;

use App\Models\Concerns\RoundsCurrencyAttributes;
use Illuminate\Support\Facades\Storage;

class Payment extends PharmacyModel
{
    use RoundsCurrencyAttributes;

    protected $appends = ['payment_proof_url'];

    protected function roundedCurrencyAttributes(): array
    {
        return ['amount'];
    }

    public function order() { return $this->belongsTo(Order::class); }
    public function reviewer() { return $this->belongsTo(Staff::class, 'reviewed_by_staff_id'); }

    public function getPaymentProofUrlAttribute(): ?string
    {
        if (! $this->payment_proof_path) {
            return null;
        }

        return Storage::disk('public')->url($this->payment_proof_path);
    }
}
