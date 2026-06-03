<?php

namespace App\Models;

class PrescriptionReview extends PharmacyModel
{
    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(Staff::class, 'reviewed_by');
    }
}

