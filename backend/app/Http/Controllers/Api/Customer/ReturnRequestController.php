<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ReturnRequest;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ReturnRequestController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        return $this->ok(
            $request->user()->returnRequests()
                ->with('order', 'orderItem.product', 'refund')
                ->latest()
                ->paginate($request->integer('per_page', 10)),
            'রিটার্ন অনুরোধ তালিকা পাওয়া গেছে।'
        );
    }

    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'order_item_id' => ['nullable', 'exists:order_items,id'],
            'reason' => ['required', 'string'],
        ]);

        $order = $this->resolveCustomerOrder($request, $id)->load('items');
        abort_unless($order->order_status === 'delivered', 422, 'শুধু ডেলিভারড অর্ডারের জন্য রিটার্ন অনুরোধ করা যাবে।');

        if (!empty($data['order_item_id'])) {
            abort_unless($order->items->contains('id', (int) $data['order_item_id']), 403);
        }

        $hasActiveReturn = $request->user()->returnRequests()
            ->where('order_id', $order->id)
            ->when(
                !empty($data['order_item_id']),
                fn ($query) => $query->where('order_item_id', (int) $data['order_item_id']),
                fn ($query) => $query->whereNull('order_item_id')
            )
            ->whereNotIn('status', ['rejected', 'closed'])
            ->exists();

        abort_if($hasActiveReturn, 422, 'An active return request already exists for this order.');

        $return = ReturnRequest::create([
            'order_id' => $order->id,
            'order_item_id' => $data['order_item_id'] ?? null,
            'user_id' => $request->user()->id,
            'reason' => $data['reason'],
            'status' => 'requested',
        ]);

        return $this->ok($return->load('order', 'orderItem.product', 'refund'), 'রিটার্ন অনুরোধ তৈরি হয়েছে।', 201);
    }

    public function show(Request $request, string $id)
    {
        return $this->ok(
            $request->user()->returnRequests()->with('order', 'orderItem.product', 'refund')->findOrFail($this->returnIdFromReference($id)),
            'রিটার্ন বিস্তারিত পাওয়া গেছে।'
        );
    }

    private function resolveCustomerOrder(Request $request, string $reference): Order
    {
        $reference = trim($reference);

        return $request->user()
            ->hasMany(Order::class)
            ->where(function ($query) use ($reference) {
                if (ctype_digit($reference)) {
                    $query->whereKey((int) $reference);
                }

                $query->orWhere('order_number', strtoupper($reference));
            })
            ->firstOrFail();
    }

    private function returnIdFromReference(string $reference): int
    {
        $reference = trim($reference);

        if (ctype_digit($reference)) {
            return (int) $reference;
        }

        if (preg_match('/^return-([a-z0-9]+)/i', $reference, $matches)) {
            return (int) base_convert(strtolower($matches[1]), 36, 10);
        }

        abort(404);
    }
}
