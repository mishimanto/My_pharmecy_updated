<?php

namespace App\Models;

class Delivery extends PharmacyModel
{
    use Concerns\RoundsCurrencyAttributes;

    protected function roundedCurrencyAttributes(): array
    {
        return ['delivery_charge'];
    }

    public function order() { return $this->belongsTo(Order::class); }
    public function rider() { return $this->belongsTo(Rider::class); }
}
