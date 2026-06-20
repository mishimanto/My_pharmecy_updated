<?php

namespace App\Services;

use App\Models\Staff;
use Illuminate\Http\Request;
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

        $staff->forceFill(['last_login_at' => now()])->save();
        $staff->sessions()->create([
            'device_type' => $request->input('device_type'),
            'device_token' => $request->input('device_token'),
            'ip_address' => $request->ip(),
            'login_at' => now(),
        ]);

        return [
            'ok' => true,
            'message' => 'স্টাফ লগইন সফল হয়েছে।',
            'data' => [
                'staff' => $this->profile($staff),
                'token' => $staff->createToken('staff-token', ['staff'])->plainTextToken,
                'token_type' => 'Bearer',
                'ability' => 'staff',
            ],
        ];
    }

    public function profile(Staff $staff): Staff
    {
        $staff->load('roles');
        $staff->permissions = $staff->getAllPermissions()->pluck('name')->values();

        return $staff;
    }
}
