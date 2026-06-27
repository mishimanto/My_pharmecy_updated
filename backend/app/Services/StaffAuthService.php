<?php

namespace App\Services;

use App\Models\Staff;
use App\Notifications\AdminTwoFactorCodeNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

class StaffAuthService
{
    public function login(string $email, string $password, Request $request): array
    {
        $staff = Staff::where('email', $email)->first();

        if (! $staff || ! Hash::check($password, $staff->password)) {
            return ['ok' => false, 'status' => 401, 'message' => 'The email or password is incorrect.'];
        }

        if ($staff->status !== 'active') {
            return ['ok' => false, 'status' => 403, 'message' => 'The staff account is not active.'];
        }

        if ($staff->two_factor_enabled) {
            return $this->createTwoFactorChallenge($staff);
        }

        return $this->issueToken($staff, $request, 'Staff login completed successfully.');
    }

    public function verifyTwoFactor(string $challengeToken, string $code, Request $request): array
    {
        try {
            $staffId = Crypt::decryptString($challengeToken);
        } catch (\Throwable) {
            return ['ok' => false, 'status' => 422, 'message' => 'The two-factor challenge is invalid.'];
        }

        $staff = Staff::query()->find($staffId);

        if (! $staff || $staff->status !== 'active' || ! $staff->two_factor_enabled) {
            return ['ok' => false, 'status' => 422, 'message' => 'The two-factor challenge is invalid.'];
        }

        if (! $staff->two_factor_code_hash || ! $staff->two_factor_expires_at || $staff->two_factor_expires_at->isPast()) {
            return ['ok' => false, 'status' => 422, 'message' => 'The two-factor code has expired.'];
        }

        if (! Hash::check($code, $staff->two_factor_code_hash)) {
            return ['ok' => false, 'status' => 422, 'message' => 'The two-factor code is incorrect.'];
        }

        $staff->forceFill([
            'two_factor_code_hash' => null,
            'two_factor_expires_at' => null,
        ])->save();

        return $this->issueToken($staff, $request, 'Two-factor login verified successfully.');
    }

    public function profile(Staff $staff): Staff
    {
        $staff->load('roles');
        $staff->permissions = $staff->getAllPermissions()->pluck('name')->values();

        return $staff;
    }

    private function createTwoFactorChallenge(Staff $staff): array
    {
        $code = (string) random_int(100000, 999999);

        $staff->forceFill([
            'two_factor_code_hash' => Hash::make($code),
            'two_factor_expires_at' => now()->addMinutes(10),
        ])->save();

        $staff->notify(new AdminTwoFactorCodeNotification($code));

        return [
            'ok' => true,
            'message' => 'Two-factor verification is required.',
            'data' => [
                'requires_2fa' => true,
                'challenge_token' => Crypt::encryptString((string) $staff->id),
                'expires_at' => $staff->two_factor_expires_at,
                'delivery_hint' => 'Use the generated admin verification code.',
                'test_code' => (app()->isLocal() || config('app.debug')) ? $code : null,
            ],
        ];
    }

    private function issueToken(Staff $staff, Request $request, string $message): array
    {
        $staff->forceFill(['last_login_at' => now()])->save();
        $token = $staff->createToken('staff-token', ['staff']);

        $staff->sessions()->create([
            'personal_access_token_id' => $token->accessToken->id,
            'device_type' => $request->input('device_type'),
            'device_token' => $request->input('device_token'),
            'ip_address' => $request->ip(),
            'login_at' => now(),
        ]);

        return [
            'ok' => true,
            'message' => $message,
            'data' => [
                'staff' => $this->profile($staff),
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'ability' => 'staff',
            ],
        ];
    }
}
