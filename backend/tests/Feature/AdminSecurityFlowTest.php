<?php

namespace Tests\Feature;

use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSecurityFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_two_factor_login_requires_and_verifies_code(): void
    {
        Staff::create([
            'full_name' => 'Security Admin',
            'email' => 'security-admin@example.com',
            'phone' => '01700000111',
            'password' => 'password123',
            'status' => 'active',
            'two_factor_enabled' => true,
        ]);

        $challenge = $this->postJson('/api/admin/login', [
            'email' => 'security-admin@example.com',
            'password' => 'password123',
        ])->assertOk()
            ->assertJsonPath('data.requires_2fa', true)
            ->json('data');

        $this->postJson('/api/admin/login/2fa', [
            'challenge_token' => $challenge['challenge_token'],
            'code' => $challenge['test_code'],
        ])->assertOk()
            ->assertJsonPath('data.ability', 'staff')
            ->assertJsonStructure(['data' => ['token', 'staff']]);

        $this->assertDatabaseHas('staff_sessions', [
            'staff_id' => Staff::first()->id,
        ]);
        $this->assertDatabaseHas('staffs', [
            'email' => 'security-admin@example.com',
            'two_factor_code_hash' => null,
            'two_factor_expires_at' => null,
        ]);
    }

    public function test_admin_can_confirm_password_for_sensitive_actions(): void
    {
        Staff::create([
            'full_name' => 'Security Admin',
            'email' => 'security-confirm@example.com',
            'phone' => '01700000112',
            'password' => 'password123',
            'status' => 'active',
        ]);

        $token = $this->postJson('/api/admin/login', [
            'email' => 'security-confirm@example.com',
            'password' => 'password123',
        ])->assertOk()->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/security/password-confirm', [
                'password' => 'password123',
            ])->assertOk()
            ->assertJsonPath('data.password_confirmed_at', fn ($value) => filled($value));

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_type' => Staff::class,
            'tokenable_id' => Staff::first()->id,
        ]);
        $this->assertNotNull(Staff::first()->tokens()->first()->password_confirmed_at);
    }
}
