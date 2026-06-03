<?php

namespace App\Models;

class Notification extends PharmacyModel
{
    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function user() { return $this->belongsTo(User::class); }
    public function staff() { return $this->belongsTo(Staff::class); }
}
