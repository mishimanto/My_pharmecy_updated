<?php

namespace Database\Seeders;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'user.view', 'user.manage', 'staff.view', 'staff.manage', 'role.manage',
            'product.view', 'product.create', 'product.edit', 'product.delete',
            'inventory.view', 'inventory.manage', 'prescription.view', 'prescription.review',
            'order.view', 'order.update', 'payment.view', 'delivery.manage',
            'support.manage', 'return.manage', 'refund.approve', 'report.view', 'activity-log.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'staff']);
        }

        foreach (['Super Admin', 'Admin', 'Pharmacist', 'Inventory Manager', 'Order Manager', 'Support Agent', 'Delivery Manager'] as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'staff']);
            if ($roleName === 'Super Admin') {
                $role->syncPermissions($permissions);
            }
        }

        $superRole = Role::where('name', 'Super Admin')->where('guard_name', 'staff')->first();
        $admin = Staff::updateOrCreate(
            ['email' => 'admin@pharmacy.com'],
            [
                'role_id' => $superRole->id,
                'full_name' => 'Super Admin',
                'phone' => '01700000000',
                'password' => 'password',
                'status' => 'active',
            ]
        );
        $admin->assignRole($superRole);

        $users = [
            ['full_name' => 'Rahim Customer', 'phone' => '01800000001', 'email' => 'rahim@example.com', 'password' => 'password'],
            ['full_name' => 'Karim Customer', 'phone' => '01800000002', 'email' => 'karim@example.com', 'password' => 'password'],
        ];
        foreach ($users as $user) {
            User::updateOrCreate(['phone' => $user['phone']], $user + ['status' => 'active']);
        }

        $categoryIds = [];
        foreach (['Pain Relief', 'Gastric Care', 'Respiratory', 'Prescription Medicines'] as $name) {
            $categoryIds[$name] = DB::table('categories')->updateOrInsert(
                ['category_name' => $name],
                ['status' => 'active', 'created_at' => now(), 'updated_at' => now()]
            );
        }

        $manufacturers = ['Beximco Pharma', 'Square Pharmaceuticals', 'Eskayef', 'Incepta'];
        foreach ($manufacturers as $name) {
            DB::table('manufacturers')->updateOrInsert(['manufacturer_name' => $name], ['country' => 'Bangladesh', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
        }

        DB::table('suppliers')->updateOrInsert(['supplier_name' => 'Central Medicine Supply'], ['phone' => '01711111111', 'email' => 'supplier@example.com', 'address' => 'Dhaka', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
        $supplierId = DB::table('suppliers')->where('supplier_name', 'Central Medicine Supply')->value('id');
        $manufacturerId = DB::table('manufacturers')->where('manufacturer_name', 'Beximco Pharma')->value('id');
        $painId = DB::table('categories')->where('category_name', 'Pain Relief')->value('id');
        $gastricId = DB::table('categories')->where('category_name', 'Gastric Care')->value('id');
        $respiratoryId = DB::table('categories')->where('category_name', 'Respiratory')->value('id');

        $products = [
            ['Napa 500mg Tablet', 'Paracetamol', 'Napa', '500mg', 'Tablet', false, $painId, 10],
            ['Ace 500mg Tablet', 'Paracetamol', 'Ace', '500mg', 'Tablet', false, $painId, 10],
            ['Seclo 20mg Capsule', 'Omeprazole', 'Seclo', '20mg', 'Capsule', false, $gastricId, 12],
            ['Sergel 20mg Capsule', 'Esomeprazole', 'Sergel', '20mg', 'Capsule', false, $gastricId, 14],
            ['Monas 10mg Tablet', 'Montelukast', 'Monas', '10mg', 'Tablet', true, $respiratoryId, 18],
        ];

        foreach ($products as [$name, $generic, $brand, $strength, $form, $rx, $categoryId, $price]) {
            DB::table('products')->updateOrInsert(
                ['product_name' => $name],
                [
                    'category_id' => $categoryId,
                    'manufacturer_id' => $manufacturerId,
                    'generic_name' => $generic,
                    'brand_name' => $brand,
                    'strength' => $strength,
                    'dosage_form' => $form,
                    'requires_prescription' => $rx,
                    'description' => "$name sample product.",
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
            $productId = DB::table('products')->where('product_name', $name)->value('id');
            DB::table('product_images')->updateOrInsert(
                ['product_id' => $productId, 'is_primary' => true],
                ['image_url' => '/storage/products/placeholders/medicine.webp', 'image_path' => 'products/placeholders/medicine.png', 'image_webp_path' => 'products/placeholders/medicine.webp', 'created_at' => now(), 'updated_at' => now()]
            );
            DB::table('inventory_batches')->updateOrInsert(
                ['product_id' => $productId, 'batch_number' => 'BATCH-' . $productId],
                [
                    'supplier_id' => $supplierId,
                    'expiry_date' => now()->addYear()->toDateString(),
                    'manufactured_date' => now()->subMonth()->toDateString(),
                    'purchase_price' => max(1, $price - 3),
                    'selling_price' => $price,
                    'stock_quantity' => 200,
                    'reserved_quantity' => 0,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        foreach ([['Dhaka', 'Dhanmondi', 60], ['Dhaka', 'Mirpur', 70], ['Dhaka', 'Gulshan', 80]] as [$city, $area, $charge]) {
            DB::table('delivery_areas')->updateOrInsert(['city' => $city, 'area_name' => $area], ['delivery_charge' => $charge, 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
        }
    }
}
