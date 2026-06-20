<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\BannerImage;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class BannerImageController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        return $this->ok(
            BannerImage::query()
                ->where('status', 'active')
                ->where('placement', $request->string('placement', 'homepage')->toString())
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
            'Banner images loaded successfully.'
        );
    }
}
