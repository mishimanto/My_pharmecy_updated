<?php

namespace Tests\Feature;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_and_access_customer_profile(): void
    {
        $response = $this->postJson('/api/customer/register', [
            'full_name' => 'Test Customer',
            'phone' => '01812345678',
            'email' => 'customer@example.com',
            'password' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.ability', 'customer')
            ->assertJsonStructure(['data' => ['token', 'user']]);

        $this->assertTrue(Hash::check('password123', User::first()->password));
        $this->assertDatabaseHas('user_sessions', ['user_id' => User::first()->id]);
    }

    public function test_customer_token_cannot_access_admin_routes(): void
    {
        $user = User::create([
            'full_name' => 'Test Customer',
            'phone' => '01812345679',
            'email' => 'customer2@example.com',
            'password' => 'password123',
            'status' => 'active',
        ]);

        Sanctum::actingAs($user, ['customer']);

        $this->getJson('/api/admin/profile')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_staff_can_login_and_customer_routes_reject_staff_token(): void
    {
        $role = Role::create(['name' => 'Super Admin', 'guard_name' => 'staff']);
        Permission::create(['name' => 'user.view', 'guard_name' => 'staff']);
        $role->givePermissionTo('user.view');

        $staff = Staff::create([
            'role_id' => $role->id,
            'full_name' => 'Admin User',
            'email' => 'admin@example.com',
            'phone' => '01700000001',
            'password' => 'password123',
            'status' => 'active',
        ]);
        $staff->assignRole($role);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.ability', 'staff')
            ->assertJsonStructure(['data' => ['token', 'staff' => ['roles', 'permissions']]]);

        $this->assertDatabaseHas('staff_sessions', ['staff_id' => $staff->id]);

        Sanctum::actingAs($staff, ['staff']);

        $this->getJson('/api/customer/profile')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_customer_can_set_default_address(): void
    {
        $user = User::create([
            'full_name' => 'Address Customer',
            'phone' => '01812345680',
            'email' => 'address@example.com',
            'password' => 'password123',
            'status' => 'active',
        ]);
        Sanctum::actingAs($user, ['customer']);

        $addressId = $this->postJson('/api/customer/addresses', [
            'full_name' => 'Address Customer',
            'phone' => '01812345680',
            'address_line_1' => 'House 1',
            'city' => 'Dhaka',
            'area' => 'Dhanmondi',
        ])->assertCreated()->json('data.id');

        $this->patchJson("/api/customer/addresses/{$addressId}/default")
            ->assertOk()
            ->assertJsonPath('data.is_default', true);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'default_address_id' => $addressId]);
    }
}

