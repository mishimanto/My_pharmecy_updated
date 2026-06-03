<?php

namespace App\Models;

class Cart extends PharmacyModel
{
    public function items() { return $this->hasMany(CartItem::class); }
    public function user() { return $this->belongsTo(User::class); }
}
