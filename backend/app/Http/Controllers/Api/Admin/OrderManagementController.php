<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderStatusService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request, OrderStatusService $orders)
    {
        $query = Order::query()->with('user', 'payment', 'delivery', 'deliveryArea')->latest();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($where) use ($search) {
                $where->where('order_number', 'like', "%{$search}%")
                    ->orWhere('guest_full_name', 'like', "%{$search}%")
                    ->orWhere('guest_phone', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($user) => $user->where('full_name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('order_status', $request->string('status'));
        }

        return $this->ok($query->paginate((int) $request->input('per_page', 10)), 'Order list loaded successfully.');
    }

    public function show(int $id, OrderStatusService $orders)
    {
        return $this->ok(
            Order::query()->with($orders->relations())->findOrFail($id),
            'Order details loaded successfully.'
        );
    }

    public function status(Request $request, int $id, OrderStatusService $orders)
    {
        $data = $request->validate([
            'order_status' => ['required', 'in:pending_confirmation,prescription_review,confirmed,processing,packed,out_for_delivery,delivered,cancelled,returned,refunded'],
            'note' => ['nullable', 'string'],
        ]);

        $order = Order::query()->with('payment')->findOrFail($id);

        return $this->ok(
            $orders->updateByStaff($order, $data['order_status'], $request->user(), $data['note'] ?? null, $request->ip()),
            'Order status updated successfully.'
        );
    }

    public function prescriptionMatch(Request $request, int $id, OrderStatusService $orders)
    {
        $data = $request->validate([
            'prescription_match_status' => ['required', Rule::in(['matched', 'mismatch', 'need_clarification'])],
            'prescription_match_note' => [
                Rule::requiredIf(fn () => in_array($request->input('prescription_match_status'), ['mismatch', 'need_clarification'], true)),
                'nullable',
                'string',
            ],
        ]);

        $order = Order::query()->with($orders->relations())->findOrFail($id);

        abort_unless($orders->requiresPrescriptionReview($order), 422, 'This order does not need a prescription review.');
        abort_unless($order->prescription, 422, 'No prescription is linked to this order yet.');

        $updatedOrder = DB::transaction(function () use ($order, $request, $data, $orders) {
            $oldValue = [
                'prescription_match_status' => $order->prescription_match_status,
                'prescription_match_note' => $order->prescription_match_note,
            ];

            $order->update([
                'prescription_match_status' => $data['prescription_match_status'],
                'prescription_match_note' => $data['prescription_match_note'] ?? null,
                'prescription_matched_by_staff_id' => $request->user()->id,
                'prescription_matched_at' => now(),
                'order_status' => $data['prescription_match_status'] === 'matched'
                    ? $order->order_status
                    : 'prescription_review',
            ]);

            DB::table('admin_activity_logs')->insert([
                'staff_id' => $request->user()->id,
                'action_type' => 'prescription_match_review',
                'module_name' => 'orders',
                'record_id' => $order->id,
                'old_value' => json_encode($oldValue, JSON_UNESCAPED_UNICODE),
                'new_value' => json_encode([
                    'prescription_match_status' => $data['prescription_match_status'],
                    'prescription_match_note' => $data['prescription_match_note'] ?? null,
                ], JSON_UNESCAPED_UNICODE),
                'ip_address' => $request->ip(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $order->fresh()->load($orders->relations());
        });

        return $this->ok($updatedOrder, 'Prescription match review saved successfully.');
    }
}
