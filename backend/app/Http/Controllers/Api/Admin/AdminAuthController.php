<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\StaffAuthService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

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

    public function logout(Request $request)
    {
        $request->user()->sessions()->whereNull('logout_at')->latest('id')->first()?->update(['logout_at' => now()]);
        $request->user()->currentAccessToken()?->delete();

        return $this->ok(null, 'লগআউট সফল হয়েছে।');
    }
}
