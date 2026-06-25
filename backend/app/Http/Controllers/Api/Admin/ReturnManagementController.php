<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Services\AdminActivityService;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReturnManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = ReturnRequest::query()
            ->with('user', 'order', 'orderItem.product', 'approvedBy', 'refund')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($where) use ($search) {
                $where
                    ->where('status', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($user) use ($search) {
                        $user
                            ->where('full_name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return $this->ok(
            $query->paginate($request->integer('per_page', 10)),
            'রিটার্ন তালিকা পাওয়া গেছে।'
        );
    }

    public function show(int $id)
    {
        return $this->ok(
            ReturnRequest::query()->with('user', 'order.payment', 'orderItem.product', 'approvedBy', 'refund')->findOrFail($id),
            'রিটার্ন বিস্তারিত পাওয়া গেছে।'
        );
    }

    public function status(Request $request, int $id, AdminActivityService $activity, NotificationService $notifications)
    {
        $data = $request->validate([
            'status' => ['required', 'in:requested,approved,rejected,picked_up,refunded,closed'],
        ]);

        $return = ReturnRequest::findOrFail($id);
        $old = $return->toArray();
        $return->update([
            'status' => $data['status'],
            'approved_by_staff_id' => in_array($data['status'], ['approved', 'picked_up', 'refunded', 'closed'], true)
                ? $request->user()->id
                : $return->approved_by_staff_id,
        ]);

        $activity->log($request, 'status_update', 'return_requests', $return->id, $old, $return->fresh()->toArray());
        $this->notify($notifications, $return->fresh(), 'রিটার্ন স্ট্যাটাস আপডেট', "আপনার রিটার্ন অনুরোধ এখন {$data['status']}।");

        return $this->ok(
            $return->fresh()->load('user', 'order', 'orderItem.product', 'approvedBy', 'refund'),
            'রিটার্ন স্ট্যাটাস আপডেট হয়েছে।'
        );
    }

    public function refund(Request $request, int $id, AdminActivityService $activity, NotificationService $notifications)
    {
        $data = $request->validate([
            'refund_amount' => ['required', 'numeric', 'min:0'],
            'refund_method' => ['required', 'string', 'max:100'],
            'status' => ['nullable', 'in:pending,processing,completed,rejected'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
        ]);

        $return = ReturnRequest::query()->with('order.payment')->findOrFail($id);
        abort_unless(
            in_array($return->status, ['approved', 'picked_up', 'refunded'], true),
            422,
            'রিফান্ড করার আগে রিটার্ন অনুমোদন করতে হবে।'
        );

        return DB::transaction(function () use ($request, $data, $return, $activity, $notifications) {
            $refund = $return->refund()->updateOrCreate(
                ['return_id' => $return->id],
                [
                    'refund_amount' => $data['refund_amount'],
                    'refund_method' => $data['refund_method'],
                    'transaction_id' => $data['transaction_id'] ?? null,
                    'status' => $data['status'] ?? 'pending',
                    'refunded_at' => ($data['status'] ?? null) === 'completed' ? now() : null,
                ]
            );

            if ($refund->status === 'completed') {
                $return->update(['status' => 'refunded', 'approved_by_staff_id' => $request->user()->id]);
                $return->order?->update(['order_status' => 'refunded', 'payment_status' => 'refunded']);
                $return->order?->payment?->update(['payment_status' => 'refunded']);
            }

            $activity->log($request, 'refund', 'refunds', $refund->id, null, $refund->fresh()->toArray());
            $this->notify($notifications, $return->fresh(), 'রিফান্ড আপডেট', "আপনার রিফান্ড স্ট্যাটাস {$refund->status}।");

            return $this->ok(
                $return->fresh()->load('user', 'order.payment', 'orderItem.product', 'approvedBy', 'refund'),
                'রিফান্ড আপডেট হয়েছে।'
            );
        });
    }

    private function notify(NotificationService $notifications, ReturnRequest $return, string $title, string $message): void
    {
        $notifications->create([
            'user_id' => $return->user_id,
            'notification_type' => 'return_status_update',
            'title' => $title,
            'message' => $message,
        ]);
    }
}
