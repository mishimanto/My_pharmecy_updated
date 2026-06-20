<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class AuthService
{
    public function __construct(
        private readonly CustomerAvatarService $customerAvatarService,
    ) {
    }

    public function register(array $data, Request $request): array
    {
        return DB::transaction(function () use ($data, $request) {
            $user = User::create([
                'full_name' => $data['full_name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'password' => $data['password'],
                'status' => 'active',
            ]);

            return $this->issueToken($user, $request, 'কাস্টমার রেজিস্ট্রেশন সম্পন্ন হয়েছে।');
        });
    }

    public function login(string $login, string $password, Request $request): array
    {
        $user = User::query()
            ->where('email', $login)
            ->orWhere('phone', $login)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return ['ok' => false, 'status' => 401, 'message' => 'The email/phone or password is incorrect.'];
        }

        if ($user->status !== 'active') {
            return ['ok' => false, 'status' => 403, 'message' => 'The customer account is not active.'];
        }

        return $this->issueToken($user, $request, 'কাস্টমার লগইন সফল হয়েছে।');
    }

    public function updateProfile(User $user, array $data, ?UploadedFile $avatar = null): User
    {
        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }

        if ($avatar) {
            $data['avatar'] = $this->customerAvatarService->store($avatar, $user->getRawOriginal('avatar'));
        }

        $user->update($data);

        return $user->refresh()->load('addresses', 'defaultAddress');
    }

    public function findOrCreateSocialCustomer(string $provider, SocialiteUser $providerUser, Request $request): array
    {
        $email = $providerUser->getEmail();
        $providerId = (string) $providerUser->getId();

        $user = User::query()
            ->where('social_provider', $provider)
            ->where('social_provider_id', $providerId)
            ->when($email, fn ($query) => $query->orWhere('email', $email))
            ->first();

        if (! $user) {
            $user = User::create([
                'full_name' => $providerUser->getName() ?: $providerUser->getNickname() ?: 'সোশ্যাল কাস্টমার',
                'phone' => 'social-' . $provider . '-' . $providerId,
                'email' => $email,
                'password' => Hash::make(str()->random(32)),
                'status' => 'active',
                'social_provider' => $provider,
                'social_provider_id' => $providerId,
                'avatar' => $providerUser->getAvatar(),
                'email_verified_at' => $email ? now() : null,
            ]);
        } else {
            $user->update([
                'social_provider' => $provider,
                'social_provider_id' => $providerId,
                'avatar' => $providerUser->getAvatar(),
            ]);
        }

        return $this->issueToken($user, $request, 'সোশ্যাল লগইন সফল হয়েছে।');
    }

    private function issueToken(User $user, Request $request, string $message): array
    {
        $user->sessions()->create([
            'device_type' => $request->input('device_type'),
            'device_token' => $request->input('device_token'),
            'ip_address' => $request->ip(),
            'login_at' => now(),
        ]);

        return [
            'ok' => true,
            'message' => $message,
            'data' => [
                'user' => $user->load('addresses', 'defaultAddress'),
                'token' => $user->createToken('customer-token', ['customer'])->plainTextToken,
                'token_type' => 'Bearer',
                'ability' => 'customer',
            ],
        ];
    }
}
