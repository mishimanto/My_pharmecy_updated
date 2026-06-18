<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class Prescription extends PharmacyModel
{
    protected static function booted(): void
    {
        static::created(function (self $prescription): void {
            if ($prescription->prescription_code) {
                return;
            }

            $prescription->forceFill([
                'prescription_code' => $prescription->generatePrescriptionCode(),
            ])->saveQuietly();
        });
    }

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

    public function generatePrescriptionCode(): string
    {
        $date = ($this->created_at ?? now())->format('Ymd');

        return sprintf('RX-%s-%05d', $date, $this->id);
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->prescription_image ? Storage::disk('public')->url($this->prescription_image) : null;
    }
}
