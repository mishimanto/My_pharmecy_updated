<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    use ApiResponse;

    public function register(Request $request, AuthService $auth)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'unique:users,phone'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'device_type' => ['nullable', 'string', 'max:100'],
            'device_token' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $auth->register($data, $request);

        return $this->ok($result['data'], $result['message'], 201);
    }

    public function login(Request $request, AuthService $auth)
    {
        $data = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'device_type' => ['nullable', 'string', 'max:100'],
            'device_token' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $auth->login($data['login'], $data['password'], $request);

        if (! $result['ok']) {
            return $this->fail($result['message'], $result['status']);
        }

        return $this->ok($result['data'], $result['message']);
    }

    public function profile(Request $request)
    {
        return $this->ok($request->user()->load('addresses', 'defaultAddress'), 'প্রোফাইল তথ্য পাওয়া গেছে।');
    }

    public function updateProfile(Request $request, AuthService $auth)
    {
        $data = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:30', 'unique:users,phone,' . $request->user()->id],
            'email' => ['nullable', 'email', 'unique:users,email,' . $request->user()->id],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        return $this->ok($auth->updateProfile($request->user(), $data), 'প্রোফাইল আপডেট হয়েছে।');
    }

    public function me(Request $request)
    {
        return $this->profile($request);
    }

    public function logout(Request $request)
    {
        $request->user()->sessions()->whereNull('logout_at')->latest('id')->first()?->update(['logout_at' => now()]);
        $request->user()->currentAccessToken()?->delete();

        return $this->ok(null, 'লগআউট সফল হয়েছে।');
    }

    public function redirect(string $provider)
    {
        return Socialite::driver($provider)->stateless()->redirect();
    }

    public function callback(string $provider, Request $request, AuthService $auth)
    {
        $providerUser = Socialite::driver($provider)->stateless()->user();
        $result = $auth->findOrCreateSocialCustomer($provider, $providerUser, $request);

        return $this->ok($result['data'], $result['message']);
    }
}
