<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\InventoryService;
use App\Services\ProductCatalogService;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use ApiResponse;

    public function index(Request $request, InventoryService $inventory, ProductCatalogService $catalog, ShopperContextService $shopper)
    {
        return $this->ok($this->cartPayload($this->cart($request, $shopper), $inventory, $catalog), 'Cart data loaded successfully.');
    }

    public function store(Request $request, InventoryService $inventory, ProductCatalogService $catalog, ShopperContextService $shopper)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'purchase_unit' => ['nullable', 'in:piece,strip,box'],
        ]);

        $product = Product::with(['images', 'batches' => $catalog->validBatchConstraint()])->findOrFail($data['product_id']);
        abort_unless($product->is_active, 422, 'Product is not active.');

        [$user] = $shopper->requireGuestOrUser($request);
        abort_if($product->requires_prescription && ! $user, 403, 'Please login before ordering prescription medicines.');

        $product = $catalog->appendComputedFields($product);
        $purchaseUnit = $data['purchase_unit'] ?? $product->default_purchase_unit;
        $option = $catalog->purchaseOption($product, $purchaseUnit);

        abort_if(! $option, 422, 'Selected unit is not available.');

        $pieceQuantity = $data['quantity'] * $option['pieces_per_unit'];
        abort_if($product->available_stock < $pieceQuantity, 422, 'Not enough stock is available.');

        $item = $this->cart($request, $shopper)->items()->updateOrCreate(
            ['product_id' => $product->id, 'purchase_unit' => $option['code']],
            [
                'quantity' => $data['quantity'],
                'pieces_per_unit' => $option['pieces_per_unit'],
                'piece_quantity' => $pieceQuantity,
                'unit_price' => $option['unit_price'],
            ]
        );

        return $this->ok([
            'item' => $this->cartItemPayload($item->load('product.images'), $inventory, $catalog),
            'cart' => $this->cartPayload($this->cart($request, $shopper), $inventory, $catalog),
        ], 'Cart updated successfully.', 201);
    }

    public function update(Request $request, int $itemId, InventoryService $inventory, ProductCatalogService $catalog, ShopperContextService $shopper)
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:1']]);
        $item = $this->cart($request, $shopper)->items()->with('product.images')->findOrFail($itemId);

        $product = Product::with(['images', 'batches' => $catalog->validBatchConstraint()])->findOrFail($item->product_id);
        $product = $catalog->appendComputedFields($product);
        $option = $catalog->purchaseOption($product, $item->purchase_unit);

        abort_if(! $option, 422, 'Selected unit is not available.');

        $pieceQuantity = $data['quantity'] * $option['pieces_per_unit'];
        abort_if($product->available_stock < $pieceQuantity, 422, 'Not enough stock is available.');

        $item->update([
            'quantity' => $data['quantity'],
            'pieces_per_unit' => $option['pieces_per_unit'],
            'piece_quantity' => $pieceQuantity,
            'unit_price' => $option['unit_price'],
        ]);

        return $this->ok([
            'item' => $this->cartItemPayload($item->refresh()->load('product.images'), $inventory, $catalog),
            'cart' => $this->cartPayload($this->cart($request, $shopper), $inventory, $catalog),
        ], 'Cart item updated successfully.');
    }

    public function destroy(Request $request, int $itemId, InventoryService $inventory, ProductCatalogService $catalog, ShopperContextService $shopper)
    {
        $this->cart($request, $shopper)->items()->whereKey($itemId)->delete();

        return $this->ok($this->cartPayload($this->cart($request, $shopper), $inventory, $catalog), 'Cart item removed successfully.');
    }

    public function clear(Request $request, ShopperContextService $shopper)
    {
        $this->cart($request, $shopper)->items()->delete();

        return $this->ok([
            'cart_id' => $this->cart($request, $shopper)->id,
            'items' => [],
            'subtotal' => 0,
            'requires_prescription' => false,
            'warnings' => [],
        ], 'Cart cleared successfully.');
    }

    private function cart(Request $request, ShopperContextService $shopper): Cart
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        if ($user) {
            return Cart::firstOrCreate(['user_id' => $user->id]);
        }

        return Cart::firstOrCreate(['guest_token' => $guestToken]);
    }

    private function cartPayload(Cart $cart, InventoryService $inventory, ProductCatalogService $catalog): array
    {
        $cart->load('items.product.images');

        $items = $cart->items->map(fn (CartItem $item) => $this->cartItemPayload($item, $inventory, $catalog))->values();
        $requiresPrescription = $items->contains(fn ($item) => (bool) $item['requires_prescription']);
        $warnings = [];

        foreach ($cart->items as $item) {
            $available = $inventory->getAvailableStock($item->product_id);
            if ($available < $item->piece_quantity) {
                $warnings[] = "{$item->product->product_name} does not have enough stock.";
            }
        }

        if ($requiresPrescription) {
            $warnings[] = 'This cart contains prescription medicines.';
        }

        return [
            'cart_id' => $cart->id,
            'items' => $items,
            'subtotal' => $items->sum('subtotal'),
            'requires_prescription' => $requiresPrescription,
            'warnings' => array_values(array_unique($warnings)),
        ];
    }

    private function cartItemPayload(CartItem $item, InventoryService $inventory, ProductCatalogService $catalog): array
    {
        $product = $item->product;
        $availableStock = $inventory->getAvailableStock($product->id);
        $primaryImage = $product->images->firstWhere('is_primary', true) ?? $product->images->first();
        $piecesPerUnit = max(1, (int) $item->pieces_per_unit);
        $unitLabel = $catalog->unitLabel($item->purchase_unit);

        return [
            'cart_item_id' => $item->id,
            'id' => $item->id,
            'product_id' => $product->id,
            'product_name' => $product->product_name,
            'product_name_bn' => $product->product_name_bn,
            'generic_name' => $product->generic_name,
            'generic_name_bn' => $product->generic_name_bn,
            'strength' => $product->strength,
            'dosage_form' => $product->dosage_form,
            'requires_prescription' => (bool) $product->requires_prescription,
            'image_url' => $primaryImage?->image_url,
            'quantity' => (int) $item->quantity,
            'purchase_quantity' => (int) $item->quantity,
            'purchase_unit' => $item->purchase_unit,
            'purchase_unit_label' => $unitLabel,
            'pieces_per_unit' => $piecesPerUnit,
            'piece_quantity' => (int) $item->piece_quantity,
            'conversion_label' => "1 {$unitLabel} = {$piecesPerUnit} pieces",
            'unit_price' => (float) $item->unit_price,
            'subtotal' => (float) ($item->quantity * $item->unit_price),
            'available_stock' => $availableStock,
            'available_quantity' => intdiv($availableStock, $piecesPerUnit),
        ];
    }
}
