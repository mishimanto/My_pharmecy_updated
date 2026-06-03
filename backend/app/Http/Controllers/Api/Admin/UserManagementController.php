<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = User::query()->with('defaultAddress')->latest();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(fn ($where) => $where->where('full_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'কাস্টমার তালিকা পাওয়া গেছে।');
    }

    public function show(int $id)
    {
        return $this->ok(
            User::query()->with('defaultAddress', 'addresses', 'sessions')->findOrFail($id),
            'কাস্টমার বিস্তারিত পাওয়া গেছে।'
        );
    }

    public function status(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,blocked,inactive'],
            'reason' => ['nullable', 'string'],
        ]);

        $user = User::findOrFail($id);
        $oldStatus = $user->status;

        return DB::transaction(function () use ($request, $data, $user, $oldStatus, $activity) {
            $user->update(['status' => $data['status']]);

            DB::table('user_admin_actions')->insert([
                'user_id' => $user->id,
                'staff_id' => $request->user()->id,
                'action_type' => 'status_change',
                'reason' => $data['reason'] ?? null,
                'old_status' => $oldStatus,
                'new_status' => $data['status'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $activity->log(
                $request,
                'status_update',
                'users',
                $user->id,
                ['status' => $oldStatus],
                ['status' => $data['status'], 'reason' => $data['reason'] ?? null],
            );

            DB::table('notifications')->insert([
                'user_id' => $user->id,
                'notification_type' => 'account_status_update',
                'title' => 'অ্যাকাউন্ট স্ট্যাটাস আপডেট',
                'message' => "আপনার অ্যাকাউন্ট স্ট্যাটাস এখন {$data['status']}।",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $this->ok($user->fresh(), 'কাস্টমার স্ট্যাটাস আপডেট হয়েছে।');
        });
    }

    public function orders(int $id)
    {
        return $this->ok(User::findOrFail($id)->hasMany(\App\Models\Order::class)->with('items.product', 'payment', 'delivery')->latest()->paginate(10));
    }

    public function prescriptions(int $id)
    {
        return $this->ok(User::findOrFail($id)->hasMany(\App\Models\Prescription::class)->with('order', 'reviews')->latest()->paginate(10));
    }

    public function supportTickets(int $id)
    {
        return $this->ok(User::findOrFail($id)->hasMany(\App\Models\SupportTicket::class)->with('order', 'assignedStaff')->latest()->paginate(10));
    }

    public function returns(int $id)
    {
        return $this->ok(User::findOrFail($id)->hasMany(\App\Models\ReturnRequest::class)->with('order', 'orderItem.product', 'refund')->latest()->paginate(10));
    }
}
