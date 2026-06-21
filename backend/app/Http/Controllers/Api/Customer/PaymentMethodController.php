<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Support\ApiResponse;

class PaymentMethodController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->ok(
            PaymentMethod::query()->active()->orderBy('sort_order')->orderBy('id')->get(),
            'Payment methods loaded successfully.'
        );
    }
}
