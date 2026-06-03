<?php

namespace App\Models;

class Rider extends PharmacyModel
{
    public function deliveries() { return $this->hasMany(Delivery::class); }
}
