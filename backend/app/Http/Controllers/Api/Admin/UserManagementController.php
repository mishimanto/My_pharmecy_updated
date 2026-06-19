<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendUserAccountCommunicationJob;
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

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'Customer users loaded successfully.');
    }

    public function customers(Request $request)
    {
        $query = DB::table('orders')
            ->leftJoin('users', 'users.id', '=', 'orders.user_id')
            ->when($request->filled('search'), function ($builder) use ($request) {
                $search = $request->string('search');

                $builder->where(function ($inner) use ($search) {
                    $inner
                        ->where('users.full_name', 'like', "%{$search}%")
                        ->orWhere('users.email', 'like', "%{$search}%")
                        ->orWhere('users.phone', 'like', "%{$search}%")
                        ->orWhere('orders.guest_full_name', 'like', "%{$search}%")
                        ->orWhere('orders.guest_email', 'like', "%{$search}%")
                        ->orWhere('orders.guest_phone', 'like', "%{$search}%")
                        ->orWhere('orders.order_number', 'like', "%{$search}%");
                });
            })
            ->when($request->input('type') === 'registered', fn ($builder) => $builder->whereNotNull('orders.user_id'))
            ->when($request->input('type') === 'guest', fn ($builder) => $builder->whereNull('orders.user_id'))
            ->groupBy('orders.user_id', 'orders.guest_token')
            ->selectRaw("
                orders.user_id,
                orders.guest_token,
                CASE WHEN orders.user_id IS NULL THEN 'guest' ELSE 'registered' END as customer_type,
                COALESCE(MAX(users.full_name), MAX(orders.guest_full_name), 'Guest customer') as customer_name,
                COALESCE(MAX(users.phone), MAX(orders.guest_phone)) as customer_phone,
                COALESCE(MAX(users.email), MAX(orders.guest_email)) as customer_email,
                MAX(users.status) as account_status,
                COUNT(*) as orders_count,
                MAX(orders.id) as latest_order_id,
                SUBSTRING_INDEX(GROUP_CONCAT(orders.order_number ORDER BY orders.order_date DESC, orders.id DESC SEPARATOR ','), ',', 1) as latest_order_number,
                SUM(orders.total_amount) as total_spent,
                MAX(orders.order_date) as last_order_at
            ")
            ->orderByDesc('last_order_at');

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'Customers loaded successfully.');
    }

    public function show(int $id)
    {
        return $this->ok(
            User::query()->with('defaultAddress', 'addresses', 'sessions')->findOrFail($id),
            'Customer details loaded successfully.'
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
            $reason = $data['reason'] ?? null;

            $user->update(['status' => $data['status']]);

            DB::table('user_admin_actions')->insert([
                'user_id' => $user->id,
                'staff_id' => $request->user()->id,
                'action_type' => 'status_change',
                'reason' => $reason,
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
                ['status' => $data['status'], 'reason' => $reason],
            );

            SendUserAccountCommunicationJob::dispatch(
                userId: $user->id,
                email: $user->email,
                fullName: $user->full_name ?: 'Customer',
                notificationType: 'account_status_update',
                title: 'Account status updated',
                message: "Your account status is now {$data['status']}.",
                emailSubject: 'Your My Pharmecy account status was updated',
                emailLines: [
                    "Your account status is now {$data['status']}.",
                    $reason ? "Reason: {$reason}" : 'If you have questions, please contact support.',
                ],
            )->afterCommit();

            return $this->ok($user->fresh(), 'Customer status updated successfully.');
        });
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $user = User::findOrFail($id);

        abort_if(
            DB::table('orders')->where('user_id', $user->id)->exists(),
            422,
            'This user has order history and cannot be deleted. Block the account instead.'
        );

        $old = $user->toArray();
        $email = $user->email;
        $fullName = $user->full_name ?: 'Customer';

        return DB::transaction(function () use ($request, $activity, $user, $old, $email, $fullName) {
            $activity->log($request, 'delete', 'users', $user->id, $old, ['deleted' => true]);

            $user->delete();

            SendUserAccountCommunicationJob::dispatch(
                userId: null,
                email: $email,
                fullName: $fullName,
                notificationType: 'account_deleted',
                title: 'Account deleted',
                message: 'Your My Pharmecy account has been deleted by an administrator.',
                emailSubject: 'Your My Pharmecy account was deleted',
                emailLines: [
                    'Your My Pharmecy account has been deleted by an administrator.',
                    'If you believe this was a mistake, please contact support.',
                ],
            )->afterCommit();

            return $this->ok(null, 'Customer deleted successfully.');
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
