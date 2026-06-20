<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Coupon::query()->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return $this->ok($query->get(), 'Coupons loaded successfully.');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $this->validated($request);
        $data['code'] = strtoupper($data['code']);
        $coupon = Coupon::create($data);
        $activity->log($request, 'create', 'coupons', $coupon->id, null, $coupon->toArray());

        return $this->ok($coupon, 'Coupon created successfully.', 201);
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $coupon = Coupon::findOrFail($id);
        $old = $coupon->toArray();
        $data = $this->validated($request, $coupon->id);
        $data['code'] = strtoupper($data['code']);
        $coupon->update($data);
        $activity->log($request, 'update', 'coupons', $coupon->id, $old, $coupon->fresh()->toArray());

        return $this->ok($coupon->fresh(), 'Coupon updated successfully.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $coupon = Coupon::findOrFail($id);
        $old = $coupon->toArray();
        $coupon->delete();
        $activity->log($request, 'delete', 'coupons', $id, $old);

        return $this->ok(null, 'Coupon deleted successfully.');
    }

    private function validated(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('coupons', 'code')->ignore($id)],
            'label' => ['nullable', 'string', 'max:255'],
            'label_bn' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:fixed,percent,free_delivery'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'min_subtotal' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'used_count' => ['nullable', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);
    }
}
