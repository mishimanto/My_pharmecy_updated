<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\DeliveryArea;
use App\Models\InventoryBatch;
use App\Models\Manufacturer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use App\Models\UserAddress;
use App\Services\AdminReportService;
use App\Services\CheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutPricingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_allocates_discounted_unit_revenue_to_batches_for_profit_reports(): void
    {
        $category = Category::create([
            'category_name' => 'Pain Relief',
            'status' => 'active',
        ]);

        $manufacturer = Manufacturer::create([
            'manufacturer_name' => 'Healthcare Labs',
            'status' => 'active',
        ]);

        $supplier = Supplier::create([
            'supplier_name' => 'Central Supply',
            'status' => 'active',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'product_name' => 'Napa 500mg Tablet',
            'pieces_per_strip' => 10,
            'strips_per_box' => 10,
            'strip_discount' => 10,
            'requires_prescription' => false,
            'is_active' => true,
        ]);

        InventoryBatch::create([
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'PRICE-001',
            'expiry_date' => now()->addMonth()->toDateString(),
            'manufactured_date' => now()->subMonth()->toDateString(),
            'purchase_price' => 5,
            'selling_price' => 10,
            'stock_quantity' => 100,
            'reserved_quantity' => 0,
            'status' => 'active',
        ]);

        $user = User::create([
            'full_name' => 'Pricing Customer',
            'phone' => '01700000001',
            'email' => 'pricing-customer@example.com',
            'password' => 'password123',
            'status' => 'active',
        ]);

        $deliveryArea = DeliveryArea::create([
            'area_name' => 'Dhanmondi',
            'city' => 'Dhaka',
            'delivery_charge' => 0,
            'status' => 'active',
        ]);

        $address = UserAddress::create([
            'user_id' => $user->id,
            'full_name' => 'Pricing Customer',
            'phone' => '01700000001',
            'address_line_1' => 'Dhaka',
            'city' => 'Dhaka',
            'area' => 'Dhanmondi',
        ]);

        PaymentMethod::updateOrCreate(['code' => 'COD'], [
            'code' => 'COD',
            'label' => 'Cash on delivery',
            'requires_proof' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $cart = Cart::create(['user_id' => $user->id]);
        $cart->items()->create([
            'product_id' => $product->id,
            'purchase_unit' => 'strip',
            'quantity' => 1,
            'pieces_per_unit' => 10,
            'piece_quantity' => 10,
            'unit_price' => 90,
        ]);

        $order = app(CheckoutService::class)->checkout($cart, $address->id, $deliveryArea->id, 'COD');
        $batchAllocation = $order->items->first()->batches->first();

        $this->assertSame(90.0, (float) $batchAllocation->subtotal);
        $this->assertSame(9.0, (float) $batchAllocation->unit_price);

        $profit = app(AdminReportService::class)->generate('profit', [
            'date_from' => now()->toDateString(),
            'date_to' => now()->toDateString(),
        ]);
        $summary = collect($profit['summary'])->pluck('value', 'label');

        $this->assertSame(90.0, (float) $summary['Sales Revenue']);
        $this->assertSame(50.0, (float) $summary['Purchase Cost']);
        $this->assertSame(40.0, (float) $summary['Gross Profit']);
    }
}
