<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderStatusService;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        return $this->ok(
            $request->user()->hasMany(Order::class)
                ->with('user', 'address', 'items.product', 'items.batches.batch', 'payment', 'delivery')
                ->latest()
                ->paginate(10),
            'Orders loaded successfully.'
        );
    }

    public function show(Request $request, int $id, ShopperContextService $shopper)
    {
        return $this->ok(
            $this->orderQuery($request, $shopper)
                ->with('user', 'address', 'items.product', 'items.batches.batch', 'payment', 'delivery')
                ->findOrFail($id),
            'Order details loaded successfully.'
        );
    }

    public function cancel(Request $request, int $id, OrderStatusService $orders, ShopperContextService $shopper)
    {
        $order = $this->orderQuery($request, $shopper)->findOrFail($id);

        return $this->ok($orders->cancelByCustomer($order), 'Order cancelled successfully.');
    }

    private function orderQuery(Request $request, ShopperContextService $shopper)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        return Order::query()
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken));
    }
}
