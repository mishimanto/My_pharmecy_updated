<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use App\Support\ApiResponse;

class HeroSlideController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->ok(
            HeroSlide::query()
                ->where('status', 'active')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
            'Hero slides loaded successfully.'
        );
    }
}
