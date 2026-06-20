<?php

namespace App\Models;

class DeliveryArea extends PharmacyModel
{
    use Concerns\RoundsCurrencyAttributes;

    protected function roundedCurrencyAttributes(): array
    {
        return ['delivery_charge'];
    }
}
