<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class EnsureSensitiveActionConfirmed
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->user()?->currentAccessToken();
        $confirmedAt = data_get($token, 'password_confirmed_at');
        $timeoutSeconds = (int) config('auth.password_timeout', 900);
        $confirmedAt = $confirmedAt ? Carbon::parse($confirmedAt) : null;
        $confirmed = $confirmedAt && $confirmedAt->greaterThanOrEqualTo(now()->subSeconds($timeoutSeconds));

        if (! $confirmed) {
            return response()->json([
                'success' => false,
                'message' => 'Password confirmation is required before this sensitive action.',
                'data' => [
                    'password_confirmation_required' => true,
                ],
                'errors' => null,
            ], 423);
        }

        return $next($request);
    }
}
