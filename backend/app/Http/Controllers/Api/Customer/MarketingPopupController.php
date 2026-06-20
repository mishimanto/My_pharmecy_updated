<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\MarketingPopup;
use App\Support\ApiResponse;

class MarketingPopupController extends Controller
{
    use ApiResponse;

    public function show()
    {
        return $this->ok(
            MarketingPopup::query()
                ->with('sourceOffer')
                ->where('is_active', true)
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                ->latest()
                ->first(),
            'Popup loaded successfully.'
        );
    }
}
