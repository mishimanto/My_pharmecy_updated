<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Refund;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RefundController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Refund::query()->with('returnRequest.user', 'returnRequest.order')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'রিফান্ড তালিকা পাওয়া গেছে।');
    }

    public function show(int $id)
    {
        return $this->ok(Refund::query()->with('returnRequest.user', 'returnRequest.order.payment')->findOrFail($id), 'রিফান্ড বিস্তারিত পাওয়া গেছে।');
    }

    public function status(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,processing,completed,rejected'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
        ]);

        $refund = Refund::query()->with('returnRequest.order.payment')->findOrFail($id);
        $old = $refund->toArray();
        $refund->update([
            'status' => $data['status'],
            'transaction_id' => $data['transaction_id'] ?? $refund->transaction_id,
            'refunded_at' => $data['status'] === 'completed' ? now() : $refund->refunded_at,
        ]);

        if ($data['status'] === 'completed') {
            $refund->returnRequest->update(['status' => 'refunded', 'approved_by_staff_id' => $request->user()->id]);
            $refund->returnRequest->order?->update(['order_status' => 'refunded', 'payment_status' => 'refunded']);
            $refund->returnRequest->order?->payment?->update(['payment_status' => 'refunded']);
        }

        $activity->log($request, 'status_update', 'refunds', $refund->id, $old, $refund->fresh()->toArray());
        DB::table('notifications')->insert([
            'user_id' => $refund->returnRequest->user_id,
            'notification_type' => 'refund_update',
            'title' => 'রিফান্ড আপডেট',
            'message' => "আপনার রিফান্ড স্ট্যাটাস {$data['status']}।",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->ok($refund->fresh()->load('returnRequest.user', 'returnRequest.order.payment'), 'রিফান্ড স্ট্যাটাস আপডেট হয়েছে।');
    }
}
