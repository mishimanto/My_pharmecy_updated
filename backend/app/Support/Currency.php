<?php

namespace App\Support;

class Currency
{
    public static function whole(int|float|string|null $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        return (float) round((float) $value, 0);
    }
}
