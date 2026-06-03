<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    use ApiResponse;

    public function roles(Request $request)
    {
        $roles = Role::query()
            ->where('guard_name', 'staff')
            ->with('permissions:id,name')
            ->when($request->search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->latest('id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($roles, 'রোল তালিকা পাওয়া গেছে।');
    }

    public function storeRole(Request $request, AdminActivityService $activity)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->where('guard_name', 'staff')],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'staff']);
        $role->syncPermissions($data['permissions'] ?? []);
        $activity->log($request, 'create', 'role', $role->id, null, $role->load('permissions')->toArray());

        return $this->ok($role->load('permissions'), 'রোল তৈরি হয়েছে।', 201);
    }

    public function showRole(int $id)
    {
        return $this->ok(Role::where('guard_name', 'staff')->with('permissions:id,name')->findOrFail($id), 'রোল তথ্য পাওয়া গেছে।');
    }

    public function updateRole(Request $request, int $id, AdminActivityService $activity)
    {
        $role = Role::where('guard_name', 'staff')->with('permissions')->findOrFail($id);
        $old = $role->toArray();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->where('guard_name', 'staff')->ignore($role->id)],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->update(['name' => $data['name']]);
        $role->syncPermissions($data['permissions'] ?? []);
        $activity->log($request, 'update', 'role', $role->id, $old, $role->load('permissions')->toArray());

        return $this->ok($role->load('permissions'), 'রোল আপডেট হয়েছে।');
    }

    public function destroyRole(Request $request, int $id, AdminActivityService $activity)
    {
        $role = Role::where('guard_name', 'staff')->with('permissions')->findOrFail($id);
        abort_if($role->name === 'Super Admin', 422, 'Super Admin রোল ডিলিট করা যাবে না।');
        $old = $role->toArray();
        $role->delete();
        $activity->log($request, 'delete', 'role', $id, $old);

        return $this->ok(null, 'রোল ডিলিট হয়েছে।');
    }

    public function permissions()
    {
        return $this->ok(Permission::where('guard_name', 'staff')->orderBy('name')->get(['id', 'name']), 'পারমিশন তালিকা পাওয়া গেছে।');
    }

    public function syncPermissions(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::where('guard_name', 'staff')->with('permissions')->findOrFail($id);
        $old = $role->toArray();
        $role->syncPermissions($data['permissions']);
        $activity->log($request, 'sync_permissions', 'role', $role->id, $old, $role->load('permissions')->toArray());

        return $this->ok($role->load('permissions'), 'রোল পারমিশন আপডেট হয়েছে।');
    }
}

