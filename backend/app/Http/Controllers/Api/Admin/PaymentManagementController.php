<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Payment::query()->with('order.user')->latest();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($where) use ($search) {
                $where->where('payment_method', 'like', "%{$search}%")
                    ->orWhere('payment_status', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('payment_status', $request->string('status'));
        }

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'পেমেন্ট তালিকা পাওয়া গেছে।');
    }

    public function show(int $id)
    {
        return $this->ok(Payment::query()->with('order.user')->findOrFail($id), 'পেমেন্ট বিস্তারিত পাওয়া গেছে।');
    }

    public function status(Request $request, int $id)
    {
        $data = $request->validate([
            'payment_status' => ['required', 'in:pending,paid,failed,cancelled,refunded'],
        ]);

        $payment = Payment::query()->with('order')->findOrFail($id);
        $old = $payment->payment_status;
        $payment->update([
            'payment_status' => $data['payment_status'],
            'paid_at' => $data['payment_status'] === 'paid' ? now() : ($data['payment_status'] === 'pending' ? null : $payment->paid_at),
        ]);
        $payment->order?->update(['payment_status' => $data['payment_status']]);

        DB::table('admin_activity_logs')->insert([
            'staff_id' => $request->user()->id,
            'action_type' => 'status_update',
            'module_name' => 'payments',
            'record_id' => $payment->id,
            'old_value' => json_encode(['payment_status' => $old], JSON_UNESCAPED_UNICODE),
            'new_value' => json_encode(['payment_status' => $data['payment_status']], JSON_UNESCAPED_UNICODE),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($payment->order) {
            DB::table('notifications')->insert([
                'user_id' => $payment->order->user_id,
                'notification_type' => 'payment_update',
                'title' => 'পেমেন্ট আপডেট',
                'message' => "আপনার {$payment->order->order_number} অর্ডারের পেমেন্ট স্ট্যাটাস {$data['payment_status']}।",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $this->ok($payment->fresh()->load('order.user'), 'পেমেন্ট স্ট্যাটাস আপডেট হয়েছে।');
    }
}
