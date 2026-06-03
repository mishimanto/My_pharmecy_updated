<?php

namespace App\Models;

class Refund extends PharmacyModel
{
    public function returnRequest() { return $this->belongsTo(ReturnRequest::class, 'return_id'); }
}
