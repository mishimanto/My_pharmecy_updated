<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
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

    public function forgotPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        $payload = null;

        if ($user) {
            $token = Password::broker('users')->createToken($user);
            $user->sendPasswordResetNotification($token);
        }

        if ($user && (app()->isLocal() || config('app.debug'))) {
            $payload = [
                'email' => $user->email,
                'reset_url' => $this->frontendResetUrl($token, $user->email),
            ];
        }

        return $this->ok($payload, 'Password reset instructions have been sent to your email address.');
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::broker('users')->reset(
            $data,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->fail('The password reset link is invalid or has expired.', 422, [
                'token' => ['The password reset link is invalid or has expired.'],
            ]);
        }

        return $this->ok(null, 'Your password has been reset successfully.');
    }

    public function profile(Request $request)
    {
        return $this->ok($request->user()->load('addresses', 'defaultAddress'), 'Customer profile loaded successfully.');
    }

    public function updateProfile(Request $request, AuthService $auth)
    {
        $data = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:30', 'unique:users,phone,' . $request->user()->id],
            'email' => ['nullable', 'email', 'unique:users,email,' . $request->user()->id],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        return $this->ok($auth->updateProfile($request->user(), $data, $request->file('avatar')), 'Customer profile updated successfully.');
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'different:current_password'],
            'new_password_confirmation' => ['required', 'same:new_password'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return $this->fail('Current password is incorrect.', 422, [
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['new_password']),
            'remember_token' => Str::random(60),
        ])->save();

        return $this->ok(null, 'Password changed successfully.');
    }

    public function me(Request $request)
    {
        return $this->profile($request);
    }

    public function logout(Request $request)
    {
        $request->user()->sessions()->whereNull('logout_at')->latest('id')->first()?->update(['logout_at' => now()]);
        $request->user()->currentAccessToken()?->delete();

        return $this->ok(null, 'Customer logout completed successfully.');
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

    protected function frontendResetUrl(string $token, string $email): string
    {
        $baseUrl = rtrim((string) env('FRONTEND_URL', 'http://127.0.0.1:5173'), '/');

        return $baseUrl.'/reset-password?token='.urlencode($token).'&email='.urlencode($email);
    }
}
