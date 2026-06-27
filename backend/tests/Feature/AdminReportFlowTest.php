<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBatch;
use App\Models\Manufacturer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemBatch;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use App\Models\UserAddress;
use App\Services\AdminReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReportFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_reports_include_category_sales_profit_and_pdf_export(): void
    {
        $this->seedSale();

        $reports = app(AdminReportService::class);
        $filters = ['date_from' => now()->toDateString(), 'date_to' => now()->toDateString()];

        $sales = $reports->generate('sales', $filters);
        $categorySales = collect($sales['tables']['sales_by_category'])->first();

        $this->assertSame('Pain Relief', $categorySales->category_name);
        $this->assertSame(20, (int) $categorySales->quantity_sold);
        $this->assertSame(300.0, (float) $categorySales->sales_amount);

        $profit = $reports->generate('profit', $filters);
        $summary = collect($profit['summary'])->pluck('value', 'label');
        $productProfit = collect($profit['tables']['profit_by_product'])->first();

        $this->assertSame(300.0, (float) $summary['Sales Revenue']);
        $this->assertSame(200.0, (float) $summary['Purchase Cost']);
        $this->assertSame(100.0, (float) $summary['Gross Profit']);
        $this->assertSame(100.0, (float) $productProfit->gross_profit);

        $inventory = $reports->generate('inventory');
        $stockValue = collect($inventory['tables']['stock_value'])->first();

        $this->assertSame(1000.0, (float) $stockValue->stock_cost);
        $this->assertSame(1500.0, (float) $stockValue->stock_value);
        $this->assertSame(500.0, (float) $stockValue->potential_profit);

        $this->assertStringStartsWith('%PDF', $reports->pdf('profit', $filters));
    }

    private function seedSale(): void
    {
        $category = Category::create([
            'category_name' => 'Pain Relief',
            'status' => 'active',
        ]);

        $manufacturer = Manufacturer::create([
            'manufacturer_name' => 'Healthcare Labs',
            'status' => 'active',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'product_name' => 'Test Tablet',
            'requires_prescription' => false,
            'is_active' => true,
        ]);

        $supplier = Supplier::create([
            'supplier_name' => 'Central Supply',
            'status' => 'active',
        ]);

        $batch = InventoryBatch::create([
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'PROFIT-001',
            'expiry_date' => now()->addMonth()->toDateString(),
            'purchase_price' => 10,
            'selling_price' => 15,
            'stock_quantity' => 100,
            'reserved_quantity' => 0,
            'status' => 'active',
        ]);

        $user = User::create([
            'full_name' => 'Report Customer',
            'phone' => '01700000001',
            'email' => 'report-customer@example.com',
            'password' => 'password123',
            'status' => 'active',
        ]);

        $address = UserAddress::create([
            'user_id' => $user->id,
            'full_name' => 'Report Customer',
            'phone' => '01700000001',
            'address_line_1' => 'Dhaka',
            'city' => 'Dhaka',
            'area' => 'Dhanmondi',
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'address_id' => $address->id,
            'order_number' => 'RPT-001',
            'order_date' => now(),
            'order_status' => 'delivered',
            'payment_method' => 'COD',
            'payment_status' => 'paid',
            'subtotal_amount' => 300,
            'discount_amount' => 0,
            'delivery_charge' => 0,
            'total_amount' => 300,
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'purchase_unit' => 'strip',
            'pieces_per_unit' => 10,
            'piece_quantity' => 20,
            'unit_price' => 150,
            'discount' => 0,
            'subtotal' => 300,
        ]);

        OrderItemBatch::create([
            'order_item_id' => $orderItem->id,
            'batch_id' => $batch->id,
            'quantity' => 20,
            'unit_price' => 15,
            'subtotal' => 300,
        ]);

        Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'COD',
            'amount' => 300,
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);
    }
}
