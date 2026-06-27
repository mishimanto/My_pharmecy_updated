<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffSession;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class SecurityController extends Controller
{
    use ApiResponse;

    public function summary(Request $request)
    {
        $staff = $request->user();
        $token = $staff->currentAccessToken();
        $timeoutSeconds = (int) config('auth.password_timeout', 900);
        $confirmedAt = data_get($token, 'password_confirmed_at');
        $confirmedAt = $confirmedAt ? Carbon::parse($confirmedAt) : null;

        return $this->ok([
            'two_factor_enabled' => (bool) $staff->two_factor_enabled,
            'password_confirmed_at' => $confirmedAt,
            'password_confirmation_expires_at' => $confirmedAt
                ? $confirmedAt->copy()->addSeconds($timeoutSeconds)
                : null,
            'active_staff_sessions' => StaffSession::query()->whereNull('logout_at')->count(),
            'recent_staff_sessions' => $this->staffSessionQuery()->limit(8)->get(),
        ], 'Security summary loaded successfully.');
    }

    public function loginHistory(Request $request)
    {
        $data = $request->validate([
            'guard' => ['nullable', Rule::in(['staff', 'customer'])],
            'status' => ['nullable', Rule::in(['active', 'ended'])],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $guard = $data['guard'] ?? 'staff';
        $query = $guard === 'customer' ? $this->customerSessionQuery() : $this->staffSessionQuery();

        if (($data['status'] ?? null) === 'active') {
            $query->whereNull('sessions.logout_at');
        }

        if (($data['status'] ?? null) === 'ended') {
            $query->whereNotNull('sessions.logout_at');
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($where) use ($search) {
                $where
                    ->where('sessions.ip_address', 'like', "%{$search}%")
                    ->orWhere('sessions.device_type', 'like', "%{$search}%")
                    ->orWhere('actor.full_name', 'like', "%{$search}%")
                    ->orWhere('actor.email', 'like', "%{$search}%");
            });
        }

        return $this->ok(
            $query->paginate($request->integer('per_page', 15)),
            'Login history loaded successfully.'
        );
    }

    public function revokeStaffSession(Request $request, int $id, AdminActivityService $activity)
    {
        $session = StaffSession::query()->findOrFail($id);
        $currentTokenId = $request->user()?->currentAccessToken()?->id;

        if ($session->personal_access_token_id && $session->personal_access_token_id === $currentTokenId) {
            return $this->fail('Use logout to end your current session.', 422);
        }

        $old = $session->toArray();

        if (! $session->logout_at) {
            $session->update(['logout_at' => now()]);
        }

        if ($session->personal_access_token_id) {
            DB::table('personal_access_tokens')->where('id', $session->personal_access_token_id)->delete();
        }

        $activity->log($request, 'session_revoked', 'staff_sessions', $session->id, $old, $session->fresh()?->toArray());

        return $this->ok($session->fresh(), 'Staff session revoked successfully.');
    }

    public function confirmPassword(Request $request)
    {
        $data = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $staff = $request->user();

        if (! Hash::check($data['password'], $staff->password)) {
            return $this->fail('Password is incorrect.', 422, [
                'password' => ['Password is incorrect.'],
            ]);
        }

        $token = $staff->currentAccessToken();
        if (method_exists($token, 'forceFill')) {
            $token->forceFill(['password_confirmed_at' => now()])->save();
        }

        $freshToken = method_exists($token, 'fresh') ? $token->fresh() : $token;

        return $this->ok([
            'password_confirmed_at' => data_get($freshToken, 'password_confirmed_at'),
            'password_confirmation_expires_at' => now()->addSeconds((int) config('auth.password_timeout', 900)),
        ], 'Password confirmed successfully.');
    }

    public function updateTwoFactor(Request $request, AdminActivityService $activity)
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'current_password' => ['required', 'string'],
        ]);

        $staff = $request->user();

        if (! Hash::check($data['current_password'], $staff->password)) {
            return $this->fail('Current password is incorrect.', 422, [
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $old = ['two_factor_enabled' => (bool) $staff->two_factor_enabled];

        $staff->forceFill([
            'two_factor_enabled' => $data['enabled'],
            'two_factor_code_hash' => null,
            'two_factor_expires_at' => null,
        ])->save();

        $activity->log($request, $data['enabled'] ? 'two_factor_enabled' : 'two_factor_disabled', 'staffs', $staff->id, $old, [
            'two_factor_enabled' => (bool) $staff->two_factor_enabled,
        ]);

        return $this->ok([
            'two_factor_enabled' => (bool) $staff->two_factor_enabled,
        ], $data['enabled'] ? 'Two-factor login enabled.' : 'Two-factor login disabled.');
    }

    private function staffSessionQuery()
    {
        return DB::table('staff_sessions as sessions')
            ->join('staffs as actor', 'actor.id', '=', 'sessions.staff_id')
            ->select([
                'sessions.id',
                'sessions.staff_id as actor_id',
                'actor.full_name as actor_name',
                'actor.email as actor_email',
                DB::raw("'staff' as guard_name"),
                'sessions.device_type',
                'sessions.device_token',
                'sessions.ip_address',
                'sessions.login_at',
                'sessions.logout_at',
                'sessions.personal_access_token_id',
                'sessions.created_at',
            ])
            ->latest('sessions.login_at')
            ->latest('sessions.id');
    }

    private function customerSessionQuery()
    {
        return DB::table('user_sessions as sessions')
            ->join('users as actor', 'actor.id', '=', 'sessions.user_id')
            ->select([
                'sessions.id',
                'sessions.user_id as actor_id',
                'actor.full_name as actor_name',
                'actor.email as actor_email',
                DB::raw("'customer' as guard_name"),
                'sessions.device_type',
                'sessions.device_token',
                'sessions.ip_address',
                'sessions.login_at',
                'sessions.logout_at',
                'sessions.personal_access_token_id',
                'sessions.created_at',
            ])
            ->latest('sessions.login_at')
            ->latest('sessions.id');
    }
}
