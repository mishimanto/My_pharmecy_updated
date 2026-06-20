<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Support\ApiResponse;

class OfferController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->ok(
            Offer::query()
                ->where('status', 'active')
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                ->orderByDesc('show_in_nav')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
            'Offers loaded successfully.'
        );
    }
}
