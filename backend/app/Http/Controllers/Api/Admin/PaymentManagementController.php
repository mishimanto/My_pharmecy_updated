<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\OrderCommunicationService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentManagementController extends Controller
{
    use ApiResponse;

    public function __construct(private OrderCommunicationService $communication) {}

    public function index(Request $request)
    {
        $query = Payment::query()->with('order.user', 'order.deliveryArea', 'reviewer')->latest();

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

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'Payment list loaded successfully.');
    }

    public function show(int $id)
    {
        return $this->ok(
            Payment::query()->with('order.user', 'order.deliveryArea', 'reviewer')->findOrFail($id),
            'Payment details loaded successfully.'
        );
    }

    public function status(Request $request, int $id)
    {
        $data = $request->validate([
            'payment_status' => ['required', 'in:awaiting_proof,paid,refunded,unpaid'],
            'reviewed_note' => ['nullable', 'string'],
        ]);
        $data['payment_status'] = $data['payment_status'] === 'unpaid' ? 'awaiting_proof' : $data['payment_status'];

        $payment = Payment::query()->with('order.user', 'order.deliveryArea')->findOrFail($id);
        $old = $payment->payment_status;

        $payment->update([
            'payment_status' => $data['payment_status'],
            'reviewed_note' => $data['reviewed_note'] ?? null,
            'reviewed_by_staff_id' => $request->user()->id,
            'reviewed_at' => now(),
            'paid_at' => $data['payment_status'] === 'paid' ? now() : ($data['payment_status'] === 'awaiting_proof' ? null : $payment->paid_at),
        ]);

        if ($payment->order) {
            $payment->order->update(['payment_status' => $data['payment_status']]);
        }

        DB::table('admin_activity_logs')->insert([
            'staff_id' => $request->user()->id,
            'action_type' => 'status_update',
            'module_name' => 'payments',
            'record_id' => $payment->id,
            'old_value' => json_encode(['payment_status' => $old], JSON_UNESCAPED_UNICODE),
            'new_value' => json_encode(['payment_status' => $data['payment_status'], 'reviewed_note' => $data['reviewed_note'] ?? null], JSON_UNESCAPED_UNICODE),
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($payment->order && $data['payment_status'] === 'paid' && $payment->order->payment_method !== 'COD') {
            $order = $this->communication->ensureMemo($payment->order, true);
            $this->communication->notify(
                $order,
                'payment_update',
                'Payment verified',
                "Your payment for {$order->order_number} has been verified.",
                'Payment verified and memo issued',
                [
                    "Your payment for {$order->order_number} has been verified by the admin team.",
                    "Memo number: {$order->memo_number}",
                    'A digital memo is included in this email for your record.',
                ],
            );
        } elseif ($payment->order) {
            $note = $data['reviewed_note'] ? " Note: {$data['reviewed_note']}" : '';
            $this->communication->notify(
                $payment->order,
                'payment_update',
                'Payment update',
                "Your {$payment->order->order_number} payment status is now {$data['payment_status']}.{$note}",
                'Payment status updated',
                [
                    "The payment status for {$payment->order->order_number} is now {$data['payment_status']}.",
                    $data['reviewed_note'] ? "Admin note: {$data['reviewed_note']}" : 'Please check your order details for the latest update.',
                ],
            );
        }

        return $this->ok($payment->fresh()->load('order.user', 'order.deliveryArea', 'reviewer'), 'Payment status updated successfully.');
    }
}
