<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\StaffAuthService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminAuthController extends Controller
{
    use ApiResponse;

    public function login(Request $request, StaffAuthService $auth)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_type' => ['nullable', 'string', 'max:100'],
            'device_token' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $auth->login($data['email'], $data['password'], $request);

        if (! $result['ok']) {
            return $this->fail($result['message'], $result['status']);
        }

        return $this->ok($result['data'], $result['message']);
    }

    public function profile(Request $request, StaffAuthService $auth)
    {
        return $this->ok($auth->profile($request->user()), 'স্টাফ প্রোফাইল পাওয়া গেছে।');
    }

    public function me(Request $request, StaffAuthService $auth)
    {
        return $this->profile($request, $auth);
    }

    public function updateProfile(Request $request, StaffAuthService $auth)
    {
        $staff = $request->user();

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('staffs', 'email')->ignore($staff->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'license_no' => ['nullable', 'string', 'max:100'],
        ]);

        $staff->update($data);

        return $this->ok($auth->profile($staff->fresh()), 'প্রোফাইল আপডেট হয়েছে।');
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'different:current_password'],
            'new_password_confirmation' => ['required', 'same:new_password'],
        ]);

        $staff = $request->user();

        if (! Hash::check($data['current_password'], $staff->password)) {
            return $this->fail('Current password is incorrect.', 422);
        }

        $staff->update([
            'password' => $data['new_password'],
        ]);

        return $this->ok(null, 'পাসওয়ার্ড পরিবর্তন হয়েছে।');
    }

    public function logout(Request $request)
    {
        $request->user()->sessions()->whereNull('logout_at')->latest('id')->first()?->update(['logout_at' => now()]);
        $request->user()->currentAccessToken()?->delete();

        return $this->ok(null, 'লগআউট সফল হয়েছে।');
    }
}
