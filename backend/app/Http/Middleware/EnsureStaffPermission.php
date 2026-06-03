<?php

namespace App\Http\Middleware;

use App\Models\Staff;
use App\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;

class EnsureStaffPermission
{
    public function __construct(private PermissionService $permissions) {}

    public function handle(Request $request, Closure $next, string $permission)
    {
        $staff = $request->user();

        if (! $staff instanceof Staff || ! $staff->tokenCan('staff') || $staff->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'সক্রিয় স্টাফ টোকেন প্রয়োজন।',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        if (! $this->permissions->hasPermission($staff, $permission)) {
            return response()->json([
                'success' => false,
                'message' => 'এই কাজের অনুমতি নেই।',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
