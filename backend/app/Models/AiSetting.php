<?php

namespace App\Models;

class AiSetting extends PharmacyModel
{
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }
}
