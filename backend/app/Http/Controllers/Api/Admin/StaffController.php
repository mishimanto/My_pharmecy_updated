<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class StaffController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $staff = Staff::query()
            ->with('roles:id,name')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest('id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($staff, 'স্টাফ তালিকা পাওয়া গেছে।');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:staffs,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'exists:roles,id'],
            'license_no' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $role = Role::where('guard_name', 'staff')->findOrFail($data['role_id']);
        $staff = Staff::create($data);
        $staff->assignRole($role);
        $activity->log($request, 'create', 'staff', $staff->id, null, $staff->load('roles')->toArray());

        return $this->ok($staff->load('roles'), 'স্টাফ তৈরি হয়েছে।', 201);
    }

    public function show(int $id)
    {
        $staff = Staff::with('roles:id,name')->findOrFail($id);
        $staff->permissions = $staff->getAllPermissions()->pluck('name')->values();

        return $this->ok($staff, 'স্টাফ তথ্য পাওয়া গেছে।');
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $staff = Staff::with('roles')->findOrFail($id);
        $old = $staff->toArray();

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('staffs', 'email')->ignore($staff->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
            'role_id' => ['required', 'exists:roles,id'],
            'license_no' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $role = Role::where('guard_name', 'staff')->findOrFail($data['role_id']);
        $staff->update($data);
        $staff->syncRoles([$role]);
        $activity->log($request, 'update', 'staff', $staff->id, $old, $staff->load('roles')->toArray());

        return $this->ok($staff->load('roles'), 'স্টাফ আপডেট হয়েছে।');
    }

    public function status(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $staff = Staff::findOrFail($id);
        $old = ['status' => $staff->status];
        $staff->update(['status' => $data['status']]);
        $activity->log($request, 'status', 'staff', $staff->id, $old, ['status' => $staff->status]);

        return $this->ok($staff->load('roles'), 'স্টাফ স্ট্যাটাস আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $staff = Staff::with('roles')->findOrFail($id);
        $old = $staff->toArray();
        $staff->delete();
        $activity->log($request, 'delete', 'staff', $id, $old);

        return $this->ok(null, 'স্টাফ ডিলিট হয়েছে।');
    }
}
