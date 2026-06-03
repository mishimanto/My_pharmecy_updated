<?php

namespace App\Models;

class Payment extends PharmacyModel
{
    public function order() { return $this->belongsTo(Order::class); }
}
