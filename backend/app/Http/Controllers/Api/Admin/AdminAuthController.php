<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Services\StaffAuthService;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
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

    public function verifyTwoFactor(Request $request, StaffAuthService $auth)
    {
        $data = $request->validate([
            'challenge_token' => ['required', 'string'],
            'code' => ['required', 'digits:6'],
            'device_type' => ['nullable', 'string', 'max:100'],
            'device_token' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $auth->verifyTwoFactor($data['challenge_token'], $data['code'], $request);

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

        $staff = Staff::query()->where('email', $data['email'])->first();
        $payload = null;

        if ($staff) {
            $token = Password::broker('staffs')->createToken($staff);
            $staff->sendPasswordResetNotification($token);

            if (app()->isLocal() || config('app.debug')) {
                $payload = [
                    'email' => $staff->email,
                    'reset_url' => $this->frontendResetUrl($token, $staff->email),
                ];
            }
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

        $status = Password::broker('staffs')->reset(
            $data,
            function (Staff $staff, string $password) {
                $staff->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($staff));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->fail('The password reset link is invalid or has expired.', 422, [
                'token' => ['The password reset link is invalid or has expired.'],
            ]);
        }

        return $this->ok(null, 'Your password has been reset successfully.');
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
    protected function frontendResetUrl(string $token, string $email): string
    {
        $baseUrl = rtrim((string) env('FRONTEND_URL', 'http://127.0.0.1:5173'), '/');

        return $baseUrl.'/admin/reset-password?token='.urlencode($token).'&email='.urlencode($email);
    }
}
