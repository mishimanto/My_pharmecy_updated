<?php

namespace App\Models;

class Order extends PharmacyModel
{
    public function items() { return $this->hasMany(OrderItem::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function delivery() { return $this->hasOne(Delivery::class); }
    public function payment() { return $this->hasOne(Payment::class); }
    public function returns() { return $this->hasMany(ReturnRequest::class); }
}
