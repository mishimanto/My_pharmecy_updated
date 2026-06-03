<?php

namespace App\Http\Middleware;

use App\Models\Staff;
use Closure;
use Illuminate\Http\Request;

class EnsureStaffToken
{
    public function handle(Request $request, Closure $next)
    {
        $staff = $request->user();

        if (! $staff instanceof Staff || ! $staff->tokenCan('staff') || $staff->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'সক্রিয় স্টাফ টোকেন প্রয়োজন।',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
