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

class StockAdjustmentApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_request_does_not_change_stock_until_super_admin_approves(): void
    {
        $batch = $this->createBatch(stock: 20);

        $this->actingAsInventoryStaff();
        $requestResponse = $this->postJson('/api/admin/stock-adjustments', [
            'batch_id' => $batch->id,
            'reason' => 'damaged',
            'quantity_change' => -5,
            'note' => 'Broken strips found during shelf count.',
        ]);

        $requestResponse->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.quantity_change', -5);

        $this->assertDatabaseHas('inventory_batches', [
            'id' => $batch->id,
            'stock_quantity' => 20,
        ]);

        $adjustmentId = $requestResponse->json('data.id');

        $this->actingAsSuperAdmin();
        $approveResponse = $this->patchJson("/api/admin/stock-adjustments/{$adjustmentId}/approve", [
            'review_note' => 'Approved after checking damaged stock.',
        ]);

        $approveResponse->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.stock_before', 20)
            ->assertJsonPath('data.stock_after', 15);

        $this->assertDatabaseHas('inventory_batches', [
            'id' => $batch->id,
            'stock_quantity' => 15,
        ]);

        $this->assertDatabaseHas('inventory_transactions', [
            'batch_id' => $batch->id,
            'transaction_type' => 'adjustment',
            'quantity_change' => -5,
            'reference_type' => 'stock_adjustment_request',
            'reference_id' => $adjustmentId,
        ]);
    }

    public function test_non_super_admin_cannot_approve_stock_adjustment(): void
    {
        $batch = $this->createBatch(stock: 20);

        $this->actingAsInventoryStaff();
        $adjustmentId = $this->postJson('/api/admin/stock-adjustments', [
            'batch_id' => $batch->id,
            'reason' => 'lost',
            'quantity_change' => -2,
        ])->assertCreated()->json('data.id');

        $response = $this->patchJson("/api/admin/stock-adjustments/{$adjustmentId}/approve");

        $response->assertForbidden();

        $this->assertDatabaseHas('stock_adjustment_requests', [
            'id' => $adjustmentId,
            'status' => 'pending',
        ]);
    }

    public function test_approval_blocks_stock_below_reserved_quantity(): void
    {
        $batch = $this->createBatch(stock: 10, reserved: 0);

        $this->actingAsInventoryStaff();
        $adjustmentId = $this->postJson('/api/admin/stock-adjustments', [
            'batch_id' => $batch->id,
            'reason' => 'correction',
            'quantity_change' => -8,
            'note' => 'Count correction requested.',
        ])->assertCreated()->json('data.id');

        $batch->update(['reserved_quantity' => 5]);

        $this->actingAsSuperAdmin();
        $response = $this->patchJson("/api/admin/stock-adjustments/{$adjustmentId}/approve");

        $response->assertStatus(422);

        $this->assertDatabaseHas('inventory_batches', [
            'id' => $batch->id,
            'stock_quantity' => 10,
            'reserved_quantity' => 5,
        ]);

        $this->assertDatabaseHas('stock_adjustment_requests', [
            'id' => $adjustmentId,
            'status' => 'pending',
        ]);
    }

    public function test_damaged_expired_and_lost_reasons_must_reduce_stock(): void
    {
        $batch = $this->createBatch(stock: 20);

        $this->actingAsInventoryStaff();
        $response = $this->postJson('/api/admin/stock-adjustments', [
            'batch_id' => $batch->id,
            'reason' => 'expired',
            'quantity_change' => 3,
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseMissing('stock_adjustment_requests', [
            'batch_id' => $batch->id,
            'reason' => 'expired',
            'quantity_change' => 3,
        ]);
    }

    public function test_inventory_staff_cannot_directly_change_batch_stock_quantity(): void
    {
        $batch = $this->createBatch(stock: 20);

        $this->actingAsInventoryStaff();
        $response = $this->putJson("/api/admin/inventory/batches/{$batch->id}", [
            'product_id' => $batch->product_id,
            'supplier_id' => $batch->supplier_id,
            'batch_number' => $batch->batch_number,
            'expiry_date' => $batch->expiry_date->toDateString(),
            'manufactured_date' => $batch->manufactured_date?->toDateString(),
            'purchase_price' => 10,
            'selling_price' => 14,
            'stock_quantity' => 15,
            'reserved_quantity' => 0,
            'status' => 'active',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Submit a stock adjustment request for stock quantity changes.');

        $this->assertDatabaseHas('inventory_batches', [
            'id' => $batch->id,
            'stock_quantity' => 20,
        ]);
    }

    public function test_super_admin_uses_direct_adjustment_instead_of_pending_self_request(): void
    {
        $batch = $this->createBatch(stock: 20);

        $this->actingAsSuperAdmin();
        $requestResponse = $this->postJson('/api/admin/stock-adjustments', [
            'batch_id' => $batch->id,
            'reason' => 'correction',
            'quantity_change' => 5,
            'note' => 'Direct count correction.',
        ]);

        $requestResponse->assertStatus(422)
            ->assertJsonPath('message', 'Approvers should use direct stock adjustment instead of creating a pending request.');

        $directResponse = $this->postJson('/api/admin/stock-adjustments/direct', [
            'batch_id' => $batch->id,
            'reason' => 'correction',
            'quantity_change' => 5,
            'note' => 'Direct count correction.',
        ]);

        $directResponse->assertCreated()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.stock_before', 20)
            ->assertJsonPath('data.stock_after', 25)
            ->assertJsonPath('data.review_note', 'Applied directly by approver.');

        $this->assertDatabaseHas('inventory_batches', [
            'id' => $batch->id,
            'stock_quantity' => 25,
        ]);

        $this->assertDatabaseHas('inventory_transactions', [
            'batch_id' => $batch->id,
            'transaction_type' => 'adjustment',
            'quantity_change' => 5,
            'reference_type' => 'stock_adjustment_request',
            'reference_id' => $directResponse->json('data.id'),
        ]);
    }

    public function test_inventory_staff_cannot_apply_direct_adjustment(): void
    {
        $batch = $this->createBatch(stock: 20);

        $this->actingAsInventoryStaff();
        $response = $this->postJson('/api/admin/stock-adjustments/direct', [
            'batch_id' => $batch->id,
            'reason' => 'correction',
            'quantity_change' => 5,
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('inventory_batches', [
            'id' => $batch->id,
            'stock_quantity' => 20,
        ]);
    }

    private function actingAsInventoryStaff(): Staff
    {
        $this->ensurePermissions();
        $role = Role::firstOrCreate(['name' => 'Inventory Staff', 'guard_name' => 'staff']);
        $role->syncPermissions(['inventory.view', 'inventory.manage']);

        return $this->actingAsStaff('inventory-staff@example.com', $role);
    }

    private function actingAsSuperAdmin(): Staff
    {
        $this->ensurePermissions();
        $role = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'staff']);
        $role->syncPermissions(['inventory.view', 'inventory.manage', 'stock-adjustment.approve']);

        return $this->actingAsStaff('super-admin@example.com', $role);
    }

    private function actingAsStaff(string $email, Role $role): Staff
    {
        $staff = Staff::firstOrCreate(
            ['email' => $email],
            [
                'role_id' => $role->id,
                'full_name' => $role->name,
                'phone' => $role->name === 'Super Admin' ? '01700000009' : '01700000008',
                'password' => 'password123',
                'status' => 'active',
            ]
        );

        $staff->syncRoles([$role]);
        Sanctum::actingAs($staff, ['staff']);

        return $staff;
    }

    private function ensurePermissions(): void
    {
        foreach (['inventory.view', 'inventory.manage', 'stock-adjustment.approve'] as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'staff']);
        }
    }

    private function createBatch(int $stock, int $reserved = 0): InventoryBatch
    {
        $category = Category::create([
            'category_name' => 'Medicine',
            'status' => 'active',
        ]);

        $manufacturer = Manufacturer::create([
            'manufacturer_name' => 'Healthcare Labs',
            'status' => 'active',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'product_name' => 'Adjustment Tablet',
            'generic_name' => 'Paracetamol',
            'brand_name' => 'Adjust',
            'strength' => '500 mg',
            'dosage_form' => 'Tablet',
            'pieces_per_strip' => 10,
            'strips_per_box' => 10,
            'requires_prescription' => false,
            'description' => 'Test description',
            'is_active' => true,
        ]);

        $supplier = Supplier::create([
            'supplier_name' => 'Central Supply',
            'status' => 'active',
        ]);

        return InventoryBatch::create([
            'product_id' => $product->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'ADJ-BATCH-'.$stock.'-'.$reserved,
            'expiry_date' => now()->addMonth()->toDateString(),
            'manufactured_date' => now()->subMonth()->toDateString(),
            'purchase_price' => 10,
            'selling_price' => 14,
            'stock_quantity' => $stock,
            'reserved_quantity' => $reserved,
            'status' => 'active',
        ]);
    }
}
