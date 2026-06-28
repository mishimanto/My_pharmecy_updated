<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $now = now();
        $permissionId = DB::table('permissions')->where([
            'name' => 'stock-adjustment.approve',
            'guard_name' => 'staff',
        ])->value('id');

        if (! $permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'stock-adjustment.approve',
                'guard_name' => 'staff',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        if (! Schema::hasTable('roles') || ! Schema::hasTable('role_has_permissions')) {
            return;
        }

        $superAdminRoleId = DB::table('roles')->where([
            'name' => 'Super Admin',
            'guard_name' => 'staff',
        ])->value('id');

        if ($superAdminRoleId) {
            DB::table('role_has_permissions')->updateOrInsert([
                'permission_id' => $permissionId,
                'role_id' => $superAdminRoleId,
            ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('permissions')) {
            return;
        }

        $permissionId = DB::table('permissions')->where([
            'name' => 'stock-adjustment.approve',
            'guard_name' => 'staff',
        ])->value('id');

        if (! $permissionId) {
            return;
        }

        if (Schema::hasTable('role_has_permissions')) {
            DB::table('role_has_permissions')->where('permission_id', $permissionId)->delete();
        }

        DB::table('permissions')->where('id', $permissionId)->delete();
    }
};
