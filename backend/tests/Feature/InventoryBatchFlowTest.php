<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryBatch;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\Staff;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InventoryBatchFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_cannot_create_an_active_batch_with_invalid_dates(): void
    {
        $this->actingAsInventoryAdmin();
        $product = $this->createProduct();
        $supplier = Supplier::create([
            'supplier_name' => 'Central Supply',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/admin/inventory/batches', [
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'BATCH-INVALID',
            'expiry_date' => now()->subDay()->toDateString(),
            'manufactured_date' => now()->addDay()->toDateString(),
            'purchase_price' => 12,
            'selling_price' => 15,
            'stock_quantity' => 20,
            'status' => 'active',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['expiry_date', 'manufactured_date']);
    }

    public function test_admin_cannot_reduce_stock_below_reserved_quantity(): void
    {
        $this->actingAsInventoryAdmin();
        $product = $this->createProduct();
        $supplier = Supplier::create([
            'supplier_name' => 'Central Supply',
            'status' => 'active',
        ]);

        $batch = InventoryBatch::create([
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'BATCH-RESERVED',
            'expiry_date' => now()->addMonth()->toDateString(),
            'manufactured_date' => now()->subMonth()->toDateString(),
            'purchase_price' => 10,
            'selling_price' => 14,
            'stock_quantity' => 12,
            'reserved_quantity' => 5,
            'status' => 'active',
        ]);

        $response = $this->putJson("/api/admin/inventory/batches/{$batch->id}", [
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'batch_number' => $batch->batch_number,
            'expiry_date' => $batch->expiry_date->toDateString(),
            'manufactured_date' => $batch->manufactured_date?->toDateString(),
            'purchase_price' => 10,
            'selling_price' => 14,
            'stock_quantity' => 4,
            'reserved_quantity' => 5,
            'status' => 'active',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock_quantity']);

        $this->assertDatabaseHas('inventory_batches', [
            'id' => $batch->id,
            'stock_quantity' => 12,
            'reserved_quantity' => 5,
        ]);
    }

    private function actingAsInventoryAdmin(): void
    {
        $role = Role::create(['name' => 'Inventory Admin', 'guard_name' => 'staff']);
        Permission::create(['name' => 'inventory.manage', 'guard_name' => 'staff']);
        Permission::create(['name' => 'inventory.view', 'guard_name' => 'staff']);
        $role->givePermissionTo(['inventory.manage', 'inventory.view']);

        $staff = Staff::create([
            'role_id' => $role->id,
            'full_name' => 'Inventory Admin',
            'email' => 'inventory-admin@example.com',
            'phone' => '01700000002',
            'password' => 'password123',
            'status' => 'active',
        ]);
        $staff->assignRole($role);

        Sanctum::actingAs($staff, ['staff']);
    }

    private function createProduct(): Product
    {
        $category = Category::create([
            'category_name' => 'Medicine',
            'status' => 'active',
        ]);

        $manufacturer = Manufacturer::create([
            'manufacturer_name' => 'Healthcare Labs',
            'status' => 'active',
        ]);

        return Product::create([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'product_name' => 'Test Tablet',
            'generic_name' => 'Paracetamol',
            'brand_name' => 'Test',
            'strength' => '500 mg',
            'dosage_form' => 'Tablet',
            'pieces_per_strip' => 10,
            'strips_per_box' => 10,
            'strip_price' => 90,
            'box_price' => 850,
            'requires_prescription' => false,
            'description' => 'Test description',
            'is_active' => true,
        ]);
    }
}
