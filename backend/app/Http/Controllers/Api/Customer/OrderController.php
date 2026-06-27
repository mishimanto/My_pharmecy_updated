<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderMemoService;
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
                ->with('user', 'address', 'deliveryArea', 'items.product', 'items.batches.batch', 'payment', 'delivery')
                ->latest()
                ->paginate(10),
            'Orders loaded successfully.'
        );
    }

    public function show(Request $request, string $id, ShopperContextService $shopper)
    {
        return $this->ok(
            $this->orderQuery($request, $shopper)
                ->with('user', 'address', 'deliveryArea', 'items.product', 'items.batches.batch', 'payment', 'delivery', 'prescription:id,order_id,prescription_code,status')
                ->where(fn ($query) => ctype_digit($id)
                    ? $query->whereKey((int) $id)->orWhere('order_number', $id)
                    : $query->where('order_number', $id))
                ->firstOrFail(),
            'Order details loaded successfully.'
        );
    }

    public function cancel(Request $request, string $id, OrderStatusService $orders, ShopperContextService $shopper)
    {
        $order = $this->findCustomerOrder($request, $shopper, $id);

        return $this->ok($orders->cancelByCustomer($order), 'Order cancelled successfully.');
    }

    public function memo(Request $request, string $id, ShopperContextService $shopper, OrderMemoService $memo)
    {
        $order = $this->findCustomerOrder($request, $shopper, $id);
        abort_unless($memo->isDownloadableByCustomer($order), 422, 'The invoice is not available for download yet.');

        $pdf = $memo->pdf($order);
        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$memo->filename($order).'"',
        ]);
    }

    private function findCustomerOrder(Request $request, ShopperContextService $shopper, string $id): Order
    {
        return $this->orderQuery($request, $shopper)
            ->where(fn ($query) => ctype_digit($id)
                ? $query->whereKey((int) $id)->orWhere('order_number', $id)
                : $query->where('order_number', $id))
            ->firstOrFail();
    }

    private function orderQuery(Request $request, ShopperContextService $shopper)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        return Order::query()
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken));
    }
}
