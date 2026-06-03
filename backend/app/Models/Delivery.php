<?php

namespace App\Models;

class Delivery extends PharmacyModel
{
    public function order() { return $this->belongsTo(Order::class); }
    public function rider() { return $this->belongsTo(Rider::class); }
}
