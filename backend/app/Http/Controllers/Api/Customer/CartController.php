<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\InventoryService;
use App\Services\ProductCatalogService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use ApiResponse;

    public function index(Request $request, InventoryService $inventory, ProductCatalogService $catalog)
    {
        return $this->ok($this->cartPayload($this->cart($request), $inventory, $catalog), 'কার্ট তথ্য পাওয়া গেছে।');
    }

    public function store(Request $request, InventoryService $inventory, ProductCatalogService $catalog)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = Product::with('images')->findOrFail($data['product_id']);
        abort_unless($product->is_active, 422, 'প্রোডাক্ট সক্রিয় নয়।');

        $availableStock = $inventory->getAvailableStock($product->id);
        abort_if($availableStock < $data['quantity'], 422, 'পর্যাপ্ত স্টক নেই।');

        $displayBatch = $inventory->getAvailableBatches($product->id)->first();
        $item = $this->cart($request)->items()->updateOrCreate(
            ['product_id' => $product->id],
            ['quantity' => $data['quantity'], 'unit_price' => $displayBatch->selling_price]
        );

        return $this->ok([
            'item' => $this->cartItemPayload($item->load('product.images'), $inventory),
            'cart' => $this->cartPayload($this->cart($request), $inventory, $catalog),
        ], 'কার্ট আপডেট হয়েছে।', 201);
    }

    public function update(Request $request, int $itemId, InventoryService $inventory, ProductCatalogService $catalog)
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:1']]);
        $item = $this->cart($request)->items()->with('product.images')->findOrFail($itemId);
        $availableStock = $inventory->getAvailableStock($item->product_id);
        abort_if($availableStock < $data['quantity'], 422, 'পর্যাপ্ত স্টক নেই।');

        $displayBatch = $inventory->getAvailableBatches($item->product_id)->first();
        $item->update(['quantity' => $data['quantity'], 'unit_price' => $displayBatch->selling_price]);

        return $this->ok([
            'item' => $this->cartItemPayload($item->refresh()->load('product.images'), $inventory),
            'cart' => $this->cartPayload($this->cart($request), $inventory, $catalog),
        ], 'কার্ট আইটেম আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $itemId, InventoryService $inventory, ProductCatalogService $catalog)
    {
        $this->cart($request)->items()->whereKey($itemId)->delete();

        return $this->ok($this->cartPayload($this->cart($request), $inventory, $catalog), 'কার্ট আইটেম বাদ দেওয়া হয়েছে।');
    }

    public function clear(Request $request)
    {
        $this->cart($request)->items()->delete();

        return $this->ok([
            'cart_id' => $this->cart($request)->id,
            'items' => [],
            'subtotal' => 0,
            'requires_prescription' => false,
            'warnings' => [],
        ], 'কার্ট খালি করা হয়েছে।');
    }

    private function cart(Request $request): Cart
    {
        return Cart::firstOrCreate(['user_id' => $request->user()->id]);
    }

    private function cartPayload(Cart $cart, InventoryService $inventory, ProductCatalogService $catalog): array
    {
        $cart->load('items.product.images');

        $items = $cart->items->map(fn (CartItem $item) => $this->cartItemPayload($item, $inventory))->values();
        $requiresPrescription = $items->contains(fn ($item) => (bool) $item['requires_prescription']);
        $warnings = [];

        foreach ($cart->items as $item) {
            $available = $inventory->getAvailableStock($item->product_id);
            if ($available < $item->quantity) {
                $warnings[] = "{$item->product->product_name} এর পর্যাপ্ত স্টক নেই।";
            }
        }

        if ($requiresPrescription) {
            $warnings[] = 'কার্টে প্রেসক্রিপশন প্রয়োজন এমন ওষুধ আছে।';
        }

        return [
            'cart_id' => $cart->id,
            'items' => $items,
            'subtotal' => $items->sum('subtotal'),
            'requires_prescription' => $requiresPrescription,
            'warnings' => array_values(array_unique($warnings)),
        ];
    }

    private function cartItemPayload(CartItem $item, InventoryService $inventory): array
    {
        $product = $item->product;
        $availableStock = $inventory->getAvailableStock($product->id);
        $primaryImage = $product->images->firstWhere('is_primary', true) ?? $product->images->first();

        return [
            'cart_item_id' => $item->id,
            'id' => $item->id,
            'product_id' => $product->id,
            'product_name' => $product->product_name,
            'generic_name' => $product->generic_name,
            'strength' => $product->strength,
            'dosage_form' => $product->dosage_form,
            'requires_prescription' => (bool) $product->requires_prescription,
            'image_url' => $primaryImage?->image_url,
            'quantity' => (int) $item->quantity,
            'unit_price' => (float) $item->unit_price,
            'subtotal' => (float) ($item->quantity * $item->unit_price),
            'available_stock' => $availableStock,
        ];
    }
}

