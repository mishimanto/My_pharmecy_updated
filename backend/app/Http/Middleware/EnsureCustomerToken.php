<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class EnsureCustomerToken
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->tokenCan('customer') || $user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'সক্রিয় কাস্টমার টোকেন প্রয়োজন।',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
