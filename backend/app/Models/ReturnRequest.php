<?php

namespace App\Models;

class ReturnRequest extends PharmacyModel
{
    public function order() { return $this->belongsTo(Order::class); }
    public function orderItem() { return $this->belongsTo(OrderItem::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function approvedBy() { return $this->belongsTo(Staff::class, 'approved_by_staff_id'); }
    public function refund() { return $this->hasOne(Refund::class, 'return_id'); }
}
