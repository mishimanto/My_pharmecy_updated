<?php

namespace App\Models;

class DrugInteraction extends PharmacyModel
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
