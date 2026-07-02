<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Services\RewardService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class RewardController extends Controller
{
    use ApiResponse;

    public function summary(Request $request, RewardService $rewards)
    {
        return $this->ok(
            $rewards->summaryForUser($request->user()),
            'Rewards summary loaded successfully.'
        );
    }

    public function claim(Request $request, RewardService $rewards)
    {
        $data = $request->validate([
            'option_id' => ['required', 'string', 'max:50'],
        ]);

        return $this->ok(
            $rewards->claim($request->user(), $data['option_id']),
            'Reward coupon claimed successfully.',
            201
        );
    }
}
