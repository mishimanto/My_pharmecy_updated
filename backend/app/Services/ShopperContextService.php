<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class ShopperContextService
{
    public function user(Request $request): ?User
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        $accessToken = PersonalAccessToken::findToken($token);
        $user = $accessToken?->tokenable;

        if (! $user instanceof User || ! $accessToken->can('customer') || $user->status !== 'active') {
            return null;
        }

        return $user;
    }

    public function guestToken(Request $request): ?string
    {
        $token = trim((string) $request->header('X-Guest-Session', ''));

        return $token !== '' ? $token : null;
    }

    public function requireGuestOrUser(Request $request): array
    {
        $user = $this->user($request);
        $guestToken = $this->guestToken($request);

        abort_if(! $user && ! $guestToken, 401, 'Customer login or guest session is required.');

        return [$user, $guestToken];
    }
}
