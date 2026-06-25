<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class NotificationManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        return $this->ok(
            Notification::query()
                ->with('user', 'staff')
                ->whereNull('user_id')
                ->where(fn ($query) => $query->whereNull('staff_id')->orWhere('staff_id', $request->user()->id))
                ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
                ->latest()
                ->paginate($request->integer('per_page', 15)),
            'নোটিফিকেশন তালিকা পাওয়া গেছে।'
        );
    }

    public function read(Request $request, int $id)
    {
        $notification = Notification::query()
            ->whereNull('user_id')
            ->where(fn ($query) => $query->whereNull('staff_id')->orWhere('staff_id', $request->user()->id))
            ->findOrFail($id);
        $notification->update(['status' => 'read', 'read_at' => now()]);

        return $this->ok($notification->fresh(), 'নোটিফিকেশন পড়া হয়েছে।');
    }
}
