<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;

class GuestSessionController extends Controller
{
    use ApiResponse;

    public function store(ShopperContextService $shopper)
    {
        return $this->ok([
            'guest_token' => $shopper->issueGuestToken(),
        ], 'Guest session created successfully.', 201);
    }
}
