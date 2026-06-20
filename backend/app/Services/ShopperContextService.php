<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class ShopperContextService
{
    private const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

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

        if ($token === '') {
            return null;
        }

        return $this->isValidGuestToken($token) ? $token : null;
    }

    public function issueGuestToken(): string
    {
        $nonce = $this->base64UrlEncode(random_bytes(32));
        $expiresAt = now()->addSeconds(self::TOKEN_TTL_SECONDS)->timestamp;
        $payload = "{$nonce}.{$expiresAt}";

        return "gst.{$payload}.".$this->signature($payload);
    }

    public function requireGuestOrUser(Request $request): array
    {
        $user = $this->user($request);
        $guestToken = $this->guestToken($request);

        abort_if(! $user && ! $guestToken, 401, 'Customer login or guest session is required.');

        return [$user, $guestToken];
    }

    private function isValidGuestToken(string $token): bool
    {
        $parts = explode('.', $token);

        if (count($parts) !== 4 || $parts[0] !== 'gst') {
            return false;
        }

        [, $nonce, $expiresAt, $signature] = $parts;

        if (! preg_match('/^[A-Za-z0-9_-]{32,}$/', $nonce) || ! ctype_digit($expiresAt)) {
            return false;
        }

        if ((int) $expiresAt < now()->timestamp) {
            return false;
        }

        return hash_equals($this->signature("{$nonce}.{$expiresAt}"), $signature);
    }

    private function signature(string $payload): string
    {
        return hash_hmac('sha256', $payload, (string) config('app.key'));
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
