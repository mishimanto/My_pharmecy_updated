<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DrugInteraction;
use App\Models\InventoryBatch;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\ProductAlternative;
use App\Models\Supplier;
use App\Models\User;
use App\Services\DrugInteractionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductQualityFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_details_include_alternatives_generic_related_and_interaction_warnings(): void
    {
        $source = $this->createProduct('Napa 500mg Tablet', 'Paracetamol');
        $alternative = $this->createProduct('Tufnil 200mg Tablet', 'Ibuprofen');
        $sameGeneric = $this->createProduct('Ace 500mg Tablet', 'Paracetamol');

        ProductAlternative::create([
            'product_id' => $source->id,
            'alternative_product_id' => $alternative->id,
        ]);

        $pair = app(DrugInteractionService::class)->normalizedPair('Paracetamol', 'Warfarin');
        DrugInteraction::create([
            'generic_name' => $pair[0],
            'interacts_with_generic_name' => $pair[1],
            'severity' => 'high',
            'warning' => 'Monitor closely and ask a pharmacist before using together.',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/products/{$source->slug}");

        $response->assertOk()
            ->assertJsonPath('data.alternatives.0.id', $alternative->id)
            ->assertJsonPath('data.generic_related_products.0.id', $sameGeneric->id)
            ->assertJsonPath('data.interaction_warnings.0.severity', 'high');
    }

    public function test_cart_payload_warns_when_selected_products_have_a_drug_interaction(): void
    {
        $paracetamol = $this->createProduct('Napa 500mg Tablet', 'Paracetamol');
        $warfarin = $this->createProduct('Warfarin 5mg Tablet', 'Warfarin');
        $pair = app(DrugInteractionService::class)->normalizedPair('Paracetamol', 'Warfarin');

        DrugInteraction::create([
            'generic_name' => $pair[0],
            'interacts_with_generic_name' => $pair[1],
            'severity' => 'critical',
            'warning' => 'Do not combine without pharmacist review.',
            'is_active' => true,
        ]);

        $user = User::create([
            'full_name' => 'Test Customer',
            'phone' => '01700000001',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'status' => 'active',
        ]);

        $headers = ['Authorization' => 'Bearer '.$user->createToken('test-token', ['customer'])->plainTextToken];

        $this->withHeaders($headers)->postJson('/api/customer/cart/items', [
            'product_id' => $paracetamol->id,
            'quantity' => 1,
            'purchase_unit' => 'piece',
        ])->assertCreated();

        $response = $this->withHeaders($headers)->postJson('/api/customer/cart/items', [
            'product_id' => $warfarin->id,
            'quantity' => 1,
            'purchase_unit' => 'piece',
        ]);

        $response->assertCreated();
        $this->assertTrue(
            collect($response->json('data.cart.warnings'))->contains(fn ($warning) => str_contains($warning, 'Critical interaction'))
        );
    }

    private function createProduct(string $name, string $generic): Product
    {
        $category = Category::firstOrCreate([
            'category_name' => 'Medicine',
        ], [
            'status' => 'active',
        ]);

        $manufacturer = Manufacturer::firstOrCreate([
            'manufacturer_name' => 'Healthcare Labs',
        ], [
            'status' => 'active',
        ]);

        $supplier = Supplier::firstOrCreate([
            'supplier_name' => 'Central Supply',
        ], [
            'status' => 'active',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'product_name' => $name,
            'generic_name' => $generic,
            'brand_name' => strtok($name, ' '),
            'strength' => '500 mg',
            'dosage_form' => 'Tablet',
            'pieces_per_strip' => 10,
            'strips_per_box' => 10,
            'requires_prescription' => false,
            'description' => "{$name} description",
            'is_active' => true,
        ]);

        InventoryBatch::create([
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'BATCH-'.$product->id,
            'expiry_date' => now()->addYear()->toDateString(),
            'manufactured_date' => now()->subMonth()->toDateString(),
            'purchase_price' => 10,
            'selling_price' => 14,
            'stock_quantity' => 100,
            'reserved_quantity' => 0,
            'status' => 'active',
        ]);

        return $product;
    }
}
