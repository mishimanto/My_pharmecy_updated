<?php

namespace App\Services;

use App\Models\Staff;

class PermissionService
{
    public function hasPermission(Staff $staff, string $permission): bool
    {
        return $staff->hasPermissionTo($permission, 'staff');
    }

    public function profilePayload(Staff $staff): array
    {
        $staff->load('roles');

        return [
            'roles' => $staff->roles->pluck('name')->values(),
            'permissions' => $staff->getAllPermissions()->pluck('name')->values(),
        ];
    }
}

