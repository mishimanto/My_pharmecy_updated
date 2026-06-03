<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class Prescription extends PharmacyModel
{
    protected function casts(): array
    {
        return ['uploaded_at' => 'datetime'];
    }

    protected $appends = ['file_url'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(PrescriptionReview::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->prescription_image ? Storage::disk('public')->url($this->prescription_image) : null;
    }
}

