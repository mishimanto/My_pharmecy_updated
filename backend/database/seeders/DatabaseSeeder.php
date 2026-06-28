<?php

namespace Database\Seeders;

use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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
            'inventory.view', 'inventory.manage', 'stock-adjustment.approve', 'prescription.view', 'prescription.review',
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
            ['full_name' => 'Nusrat Ahmed', 'phone' => '01800000003', 'email' => 'nusrat@example.com', 'password' => 'password'],
            ['full_name' => 'Shafin Hasan', 'phone' => '01800000004', 'email' => 'shafin@example.com', 'password' => 'password'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['phone' => $user['phone']], $user + ['status' => 'active']);
        }

        $this->seedCatalog();
        $this->call(OfferSeeder::class);
        $this->seedDeliveryAreas();
    }

    private function seedCatalog(): void
    {
        $now = now();

        $categories = [
            ['category_name' => 'Pain Relief', 'description' => 'Tablets, capsules, and suspensions for pain and fever relief.'],
            ['category_name' => 'Gastric Care', 'description' => 'Acidity, reflux, and stomach protection products.'],
            ['category_name' => 'Respiratory', 'description' => 'Allergy, cold, cough, and breathing support products.'],
            ['category_name' => 'Prescription Products', 'description' => 'Prescription-first products for guided treatment plans.'],
            ['category_name' => 'Diabetes Care', 'description' => 'Diabetes management tablets and insulin support products.'],
            ['category_name' => 'Cardiac Care', 'description' => 'Blood pressure, cholesterol, and heart-care products.'],
            ['category_name' => 'Vitamins & Supplements', 'description' => 'Daily wellness vitamins, minerals, and nutritional support.'],
            ['category_name' => 'Skin Care', 'description' => 'Creams, gels, and shampoos for skin and scalp care.'],
            ['category_name' => 'Child Care', 'description' => 'Syrups, drops, and pediatric essentials for children.'],
            ['category_name' => "Women's Health", 'description' => 'Supplements and products for women-focused care needs.'],
            ['category_name' => 'Medical Devices', 'description' => 'Home health devices, monitoring tools, and pharmacy equipment.'],
            ['category_name' => 'First Aid & Hygiene', 'description' => 'Bandages, sanitizers, antiseptics, masks, and daily hygiene essentials.'],
            ['category_name' => 'Mother & Baby Care', 'description' => 'Baby care, feeding, diapering, and maternity support products.'],
            ['category_name' => 'Personal Care', 'description' => 'Pharmacy-approved personal care and wellness products.'],
        ];

        foreach ($categories as $category) {
            DB::table('categories')->updateOrInsert(
                ['category_name' => $category['category_name']],
                [
                    'description' => $category['description'],
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $categoryIds = DB::table('categories')->pluck('id', 'category_name')->all();

        $manufacturers = [
            ['manufacturer_name' => 'Beximco Pharma', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Square Pharmaceuticals', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Eskayef', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Incepta', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Renata', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'ACI Limited', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Opsonin Pharma', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Aristopharma', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Healthcare Pharma', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Drug International', 'country' => 'Bangladesh'],
        ];

        foreach ($manufacturers as $manufacturer) {
            DB::table('manufacturers')->updateOrInsert(
                ['manufacturer_name' => $manufacturer['manufacturer_name']],
                [
                    'country' => $manufacturer['country'],
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $manufacturerIds = DB::table('manufacturers')->pluck('id', 'manufacturer_name')->all();

        $suppliers = [
            ['supplier_name' => 'Central Medicine Supply', 'phone' => '01711111111', 'email' => 'central.supply@example.com', 'address' => 'Dhanmondi, Dhaka'],
            ['supplier_name' => 'HealthBridge Distribution', 'phone' => '01711111112', 'email' => 'healthbridge@example.com', 'address' => 'Tejgaon, Dhaka'],
            ['supplier_name' => 'CityCare Wholesale', 'phone' => '01711111113', 'email' => 'citycare@example.com', 'address' => 'Uttara, Dhaka'],
        ];

        foreach ($suppliers as $supplier) {
            DB::table('suppliers')->updateOrInsert(
                ['supplier_name' => $supplier['supplier_name']],
                [
                    'phone' => $supplier['phone'],
                    'email' => $supplier['email'],
                    'address' => $supplier['address'],
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $supplierIds = DB::table('suppliers')->pluck('id', 'supplier_name')->all();

        $products = [
            ['product_name' => 'Napa 500mg Tablet', 'generic_name' => 'Paracetamol', 'brand_name' => 'Napa', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => 'Pain Relief', 'manufacturer' => 'Beximco Pharma', 'selling_price' => 10, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 240],
            ['product_name' => 'Ace 500mg Tablet', 'generic_name' => 'Paracetamol', 'brand_name' => 'Ace', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => 'Pain Relief', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 10, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 220],
            ['product_name' => 'Tufnil 200mg Tablet', 'generic_name' => 'Ibuprofen', 'brand_name' => 'Tufnil', 'strength' => '200mg', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => 'Pain Relief', 'manufacturer' => 'Drug International', 'selling_price' => 14, 'pieces_per_strip' => 10, 'strips_per_box' => 8, 'stock_quantity' => 180],
            ['product_name' => 'Xpa 50mg Tablet', 'generic_name' => 'Diclofenac Potassium', 'brand_name' => 'Xpa', 'strength' => '50mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Pain Relief', 'manufacturer' => 'Opsonin Pharma', 'selling_price' => 16, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 140],

            ['product_name' => 'Seclo 20mg Capsule', 'generic_name' => 'Omeprazole', 'brand_name' => 'Seclo', 'strength' => '20mg', 'dosage_form' => 'Capsule', 'requires_prescription' => false, 'category' => 'Gastric Care', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 12, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 260],
            ['product_name' => 'Sergel 20mg Capsule', 'generic_name' => 'Esomeprazole', 'brand_name' => 'Sergel', 'strength' => '20mg', 'dosage_form' => 'Capsule', 'requires_prescription' => false, 'category' => 'Gastric Care', 'manufacturer' => 'Healthcare Pharma', 'selling_price' => 14, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 200],
            ['product_name' => 'Maxpro 20mg Capsule', 'generic_name' => 'Esomeprazole', 'brand_name' => 'Maxpro', 'strength' => '20mg', 'dosage_form' => 'Capsule', 'requires_prescription' => false, 'category' => 'Gastric Care', 'manufacturer' => 'Renata', 'selling_price' => 15, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 210],
            ['product_name' => 'Algin 500ml Suspension', 'generic_name' => 'Antacid Suspension', 'brand_name' => 'Algin', 'strength' => '500ml', 'dosage_form' => 'Suspension', 'requires_prescription' => false, 'category' => 'Gastric Care', 'manufacturer' => 'ACI Limited', 'selling_price' => 185, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 90],

            ['product_name' => 'Monas 10mg Tablet', 'generic_name' => 'Montelukast', 'brand_name' => 'Monas', 'strength' => '10mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Respiratory', 'manufacturer' => 'Incepta', 'selling_price' => 18, 'pieces_per_strip' => 10, 'strips_per_box' => 6, 'stock_quantity' => 130],
            ['product_name' => 'Fexo 120mg Tablet', 'generic_name' => 'Fexofenadine', 'brand_name' => 'Fexo', 'strength' => '120mg', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => 'Respiratory', 'manufacturer' => 'Renata', 'selling_price' => 22, 'pieces_per_strip' => 10, 'strips_per_box' => 6, 'stock_quantity' => 125],
            ['product_name' => 'Deslor 5mg Tablet', 'generic_name' => 'Desloratadine', 'brand_name' => 'Deslor', 'strength' => '5mg', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => 'Respiratory', 'manufacturer' => 'Aristopharma', 'selling_price' => 20, 'pieces_per_strip' => 10, 'strips_per_box' => 6, 'stock_quantity' => 115],
            ['product_name' => 'Breathex Inhaler', 'generic_name' => 'Salbutamol', 'brand_name' => 'Breathex', 'strength' => '100mcg', 'dosage_form' => 'Inhaler', 'requires_prescription' => true, 'category' => 'Respiratory', 'manufacturer' => 'Beximco Pharma', 'selling_price' => 285, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 60],

            ['product_name' => 'Zimax 500mg Tablet', 'generic_name' => 'Azithromycin', 'brand_name' => 'Zimax', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Prescription Products', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 35, 'pieces_per_strip' => 3, 'strips_per_box' => 4, 'stock_quantity' => 90],
            ['product_name' => 'Cef-3 400mg Capsule', 'generic_name' => 'Cefixime', 'brand_name' => 'Cef-3', 'strength' => '400mg', 'dosage_form' => 'Capsule', 'requires_prescription' => true, 'category' => 'Prescription Products', 'manufacturer' => 'Renata', 'selling_price' => 48, 'pieces_per_strip' => 6, 'strips_per_box' => 4, 'stock_quantity' => 85],
            ['product_name' => 'Moxacil 500mg Capsule', 'generic_name' => 'Amoxicillin', 'brand_name' => 'Moxacil', 'strength' => '500mg', 'dosage_form' => 'Capsule', 'requires_prescription' => true, 'category' => 'Prescription Products', 'manufacturer' => 'Opsonin Pharma', 'selling_price' => 32, 'pieces_per_strip' => 8, 'strips_per_box' => 5, 'stock_quantity' => 120],
            ['product_name' => 'Neocef 250mg Suspension', 'generic_name' => 'Cefuroxime', 'brand_name' => 'Neocef', 'strength' => '250mg/5ml', 'dosage_form' => 'Suspension', 'requires_prescription' => true, 'category' => 'Prescription Products', 'manufacturer' => 'Eskayef', 'selling_price' => 240, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 55],

            ['product_name' => 'Comet 500mg Tablet', 'generic_name' => 'Metformin', 'brand_name' => 'Comet', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Diabetes Care', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 9, 'pieces_per_strip' => 10, 'strips_per_box' => 12, 'stock_quantity' => 280],
            ['product_name' => 'Glyset 80mg Tablet', 'generic_name' => 'Gliclazide', 'brand_name' => 'Glyset', 'strength' => '80mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Diabetes Care', 'manufacturer' => 'Incepta', 'selling_price' => 11, 'pieces_per_strip' => 10, 'strips_per_box' => 12, 'stock_quantity' => 190],
            ['product_name' => 'Galvus Met 50/500 Tablet', 'generic_name' => 'Vildagliptin + Metformin', 'brand_name' => 'Galvus Met', 'strength' => '50/500mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Diabetes Care', 'manufacturer' => 'Healthcare Pharma', 'selling_price' => 28, 'pieces_per_strip' => 14, 'strips_per_box' => 6, 'stock_quantity' => 100],
            ['product_name' => 'Insulatard FlexPen', 'generic_name' => 'Human Insulin', 'brand_name' => 'Insulatard', 'strength' => '100IU/ml', 'dosage_form' => 'Injection', 'requires_prescription' => true, 'category' => 'Diabetes Care', 'manufacturer' => 'Beximco Pharma', 'selling_price' => 760, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 45],

            ['product_name' => 'Amdocal 5mg Tablet', 'generic_name' => 'Amlodipine', 'brand_name' => 'Amdocal', 'strength' => '5mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Cardiac Care', 'manufacturer' => 'Beximco Pharma', 'selling_price' => 8, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 210],
            ['product_name' => 'Losucon 50mg Tablet', 'generic_name' => 'Losartan', 'brand_name' => 'Losucon', 'strength' => '50mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Cardiac Care', 'manufacturer' => 'ACI Limited', 'selling_price' => 14, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 185],
            ['product_name' => 'Rosuva 10mg Tablet', 'generic_name' => 'Rosuvastatin', 'brand_name' => 'Rosuva', 'strength' => '10mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Cardiac Care', 'manufacturer' => 'Incepta', 'selling_price' => 18, 'pieces_per_strip' => 10, 'strips_per_box' => 8, 'stock_quantity' => 150],
            ['product_name' => 'Ecosprin 75mg Tablet', 'generic_name' => 'Aspirin', 'brand_name' => 'Ecosprin', 'strength' => '75mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => 'Cardiac Care', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 6, 'pieces_per_strip' => 14, 'strips_per_box' => 10, 'stock_quantity' => 240],

            ['product_name' => 'A-Z Gold Tablet', 'generic_name' => 'Multivitamin & Minerals', 'brand_name' => 'A-Z Gold', 'strength' => 'Daily Formula', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => 'Vitamins & Supplements', 'manufacturer' => 'Eskayef', 'selling_price' => 15, 'pieces_per_strip' => 15, 'strips_per_box' => 6, 'stock_quantity' => 160],
            ['product_name' => 'Ostocal D Tablet', 'generic_name' => 'Calcium + Vitamin D', 'brand_name' => 'Ostocal D', 'strength' => '500mg + 200IU', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => 'Vitamins & Supplements', 'manufacturer' => 'Healthcare Pharma', 'selling_price' => 12, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 180],
            ['product_name' => 'Ceevit 250mg Tablet', 'generic_name' => 'Vitamin C', 'brand_name' => 'Ceevit', 'strength' => '250mg', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => 'Vitamins & Supplements', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 7, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 230],
            ['product_name' => 'Zinc B Syrup', 'generic_name' => 'Zinc + B-Complex', 'brand_name' => 'Zinc B', 'strength' => '100ml', 'dosage_form' => 'Syrup', 'requires_prescription' => false, 'category' => 'Vitamins & Supplements', 'manufacturer' => 'Drug International', 'selling_price' => 125, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 95],

            ['product_name' => 'Pevisone Cream', 'generic_name' => 'Econazole + Triamcinolone', 'brand_name' => 'Pevisone', 'strength' => '15g', 'dosage_form' => 'Cream', 'requires_prescription' => true, 'category' => 'Skin Care', 'manufacturer' => 'Beximco Pharma', 'selling_price' => 95, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 85],
            ['product_name' => 'Dermasol Ointment', 'generic_name' => 'Clobetasol', 'brand_name' => 'Dermasol', 'strength' => '25g', 'dosage_form' => 'Ointment', 'requires_prescription' => true, 'category' => 'Skin Care', 'manufacturer' => 'Aristopharma', 'selling_price' => 110, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 70],
            ['product_name' => 'Nizoral Shampoo', 'generic_name' => 'Ketoconazole', 'brand_name' => 'Nizoral', 'strength' => '60ml', 'dosage_form' => 'Shampoo', 'requires_prescription' => false, 'category' => 'Skin Care', 'manufacturer' => 'Opsonin Pharma', 'selling_price' => 220, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 50],
            ['product_name' => 'AcneFree Gel', 'generic_name' => 'Clindamycin + Nicotinamide', 'brand_name' => 'AcneFree', 'strength' => '20g', 'dosage_form' => 'Gel', 'requires_prescription' => true, 'category' => 'Skin Care', 'manufacturer' => 'Renata', 'selling_price' => 145, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 65],

            ['product_name' => 'Napa Syrup', 'generic_name' => 'Paracetamol', 'brand_name' => 'Napa', 'strength' => '120mg/5ml', 'dosage_form' => 'Syrup', 'requires_prescription' => false, 'category' => 'Child Care', 'manufacturer' => 'Beximco Pharma', 'selling_price' => 42, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 150],
            ['product_name' => 'Xinc B Kids Syrup', 'generic_name' => 'Zinc', 'brand_name' => 'Xinc B Kids', 'strength' => '100ml', 'dosage_form' => 'Syrup', 'requires_prescription' => false, 'category' => 'Child Care', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 95, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 88],
            ['product_name' => 'Pedifen Suspension', 'generic_name' => 'Ibuprofen', 'brand_name' => 'Pedifen', 'strength' => '100mg/5ml', 'dosage_form' => 'Suspension', 'requires_prescription' => false, 'category' => 'Child Care', 'manufacturer' => 'Incepta', 'selling_price' => 68, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 92],
            ['product_name' => 'BabySaline Nasal Drops', 'generic_name' => 'Sodium Chloride', 'brand_name' => 'BabySaline', 'strength' => '15ml', 'dosage_form' => 'Drops', 'requires_prescription' => false, 'category' => 'Child Care', 'manufacturer' => 'ACI Limited', 'selling_price' => 58, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 74],

            ['product_name' => 'Fefol Capsule', 'generic_name' => 'Iron + Folic Acid', 'brand_name' => 'Fefol', 'strength' => 'Daily Support', 'dosage_form' => 'Capsule', 'requires_prescription' => false, 'category' => "Women's Health", 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 9, 'pieces_per_strip' => 10, 'strips_per_box' => 8, 'stock_quantity' => 175],
            ['product_name' => 'Femicon Tablet', 'generic_name' => 'Ethinyl Estradiol + Levonorgestrel', 'brand_name' => 'Femicon', 'strength' => '0.03mg/0.15mg', 'dosage_form' => 'Tablet', 'requires_prescription' => true, 'category' => "Women's Health", 'manufacturer' => 'Renata', 'selling_price' => 38, 'pieces_per_strip' => 28, 'strips_per_box' => 3, 'stock_quantity' => 80],
            ['product_name' => 'Ovacare Tablet', 'generic_name' => 'Myo-Inositol + Folic Acid', 'brand_name' => 'Ovacare', 'strength' => 'Wellness Blend', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => "Women's Health", 'manufacturer' => 'Healthcare Pharma', 'selling_price' => 22, 'pieces_per_strip' => 10, 'strips_per_box' => 6, 'stock_quantity' => 96],
            ['product_name' => 'Calbo D Tablet', 'generic_name' => 'Calcium + Vitamin D3', 'brand_name' => 'Calbo D', 'strength' => '500mg + 400IU', 'dosage_form' => 'Tablet', 'requires_prescription' => false, 'category' => "Women's Health", 'manufacturer' => 'Drug International', 'selling_price' => 13, 'pieces_per_strip' => 10, 'strips_per_box' => 10, 'stock_quantity' => 140],

            ['product_name' => 'Digital Thermometer', 'generic_name' => 'Body Temperature Monitor', 'brand_name' => 'CareTemp', 'strength' => 'Digital', 'dosage_form' => 'Device', 'requires_prescription' => false, 'category' => 'Medical Devices', 'manufacturer' => 'ACI Limited', 'selling_price' => 260, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 70],
            ['product_name' => 'Blood Pressure Monitor', 'generic_name' => 'Automatic BP Monitor', 'brand_name' => 'HealthTrack', 'strength' => 'Arm Type', 'dosage_form' => 'Device', 'requires_prescription' => false, 'category' => 'Medical Devices', 'manufacturer' => 'Healthcare Pharma', 'selling_price' => 2350, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 35],
            ['product_name' => 'Glucometer Starter Kit', 'generic_name' => 'Blood Glucose Monitoring Kit', 'brand_name' => 'GlucoCare', 'strength' => 'Kit', 'dosage_form' => 'Device', 'requires_prescription' => false, 'category' => 'Medical Devices', 'manufacturer' => 'Beximco Pharma', 'selling_price' => 1450, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 45],
            ['product_name' => 'Pulse Oximeter', 'generic_name' => 'Oxygen Saturation Monitor', 'brand_name' => 'OxyCheck', 'strength' => 'Finger Tip', 'dosage_form' => 'Device', 'requires_prescription' => false, 'category' => 'Medical Devices', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 980, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 40],

            ['product_name' => 'Alcohol Hand Sanitizer 250ml', 'generic_name' => 'Hand Sanitizer', 'brand_name' => 'SafeHands', 'strength' => '250ml', 'dosage_form' => 'Liquid', 'requires_prescription' => false, 'category' => 'First Aid & Hygiene', 'manufacturer' => 'ACI Limited', 'selling_price' => 120, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 160],
            ['product_name' => 'Sterile Gauze Pack', 'generic_name' => 'Sterile Gauze', 'brand_name' => 'MediGauze', 'strength' => '10 pcs', 'dosage_form' => 'First Aid', 'requires_prescription' => false, 'category' => 'First Aid & Hygiene', 'manufacturer' => 'Renata', 'selling_price' => 85, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 130],
            ['product_name' => 'Surgical Face Mask Box', 'generic_name' => 'Disposable Face Mask', 'brand_name' => 'CareMask', 'strength' => '50 pcs', 'dosage_form' => 'Hygiene', 'requires_prescription' => false, 'category' => 'First Aid & Hygiene', 'manufacturer' => 'Eskayef', 'selling_price' => 210, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 95],
            ['product_name' => 'Antiseptic Solution 500ml', 'generic_name' => 'Antiseptic Solution', 'brand_name' => 'SafeClean', 'strength' => '500ml', 'dosage_form' => 'Liquid', 'requires_prescription' => false, 'category' => 'First Aid & Hygiene', 'manufacturer' => 'Drug International', 'selling_price' => 175, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 100],

            ['product_name' => 'Baby Diaper Medium Pack', 'generic_name' => 'Disposable Diaper', 'brand_name' => 'BabySoft', 'strength' => 'M / 32 pcs', 'dosage_form' => 'Baby Care', 'requires_prescription' => false, 'category' => 'Mother & Baby Care', 'manufacturer' => 'ACI Limited', 'selling_price' => 620, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 55],
            ['product_name' => 'Baby Wipes Pack', 'generic_name' => 'Wet Wipes', 'brand_name' => 'BabySoft', 'strength' => '80 pcs', 'dosage_form' => 'Baby Care', 'requires_prescription' => false, 'category' => 'Mother & Baby Care', 'manufacturer' => 'Square Pharmaceuticals', 'selling_price' => 180, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 90],
            ['product_name' => 'Feeding Bottle 250ml', 'generic_name' => 'Baby Feeding Bottle', 'brand_name' => 'CareBaby', 'strength' => '250ml', 'dosage_form' => 'Baby Care', 'requires_prescription' => false, 'category' => 'Mother & Baby Care', 'manufacturer' => 'Healthcare Pharma', 'selling_price' => 290, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 60],

            ['product_name' => 'Oral Care Mouthwash 250ml', 'generic_name' => 'Mouthwash', 'brand_name' => 'FreshCare', 'strength' => '250ml', 'dosage_form' => 'Personal Care', 'requires_prescription' => false, 'category' => 'Personal Care', 'manufacturer' => 'ACI Limited', 'selling_price' => 165, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 85],
            ['product_name' => 'Moisturizing Lotion 200ml', 'generic_name' => 'Moisturizing Lotion', 'brand_name' => 'DermaSoft', 'strength' => '200ml', 'dosage_form' => 'Personal Care', 'requires_prescription' => false, 'category' => 'Personal Care', 'manufacturer' => 'Renata', 'selling_price' => 340, 'pieces_per_strip' => 1, 'strips_per_box' => 1, 'stock_quantity' => 65],
        ];

        $placeholderImage = [
            'image_url' => '/storage/products/placeholders/medicine.webp',
            'image_path' => 'products/placeholders/medicine.png',
            'image_webp_path' => 'products/placeholders/medicine.webp',
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $supplierRotation = array_values($supplierIds);

        foreach ($products as $index => $product) {
            $priceProfile = $this->buildPriceProfile($product['selling_price'], $product['pieces_per_strip'], $product['strips_per_box']);
            $supplierId = $supplierRotation[$index % count($supplierRotation)];

            DB::table('products')->updateOrInsert(
                ['product_name' => $product['product_name']],
                [
                    'slug' => $this->buildSeederSlug($product['product_name']),
                    'category_id' => $categoryIds[$product['category']],
                    'manufacturer_id' => $manufacturerIds[$product['manufacturer']],
                    'generic_name' => $product['generic_name'],
                    'brand_name' => $product['brand_name'],
                    'strength' => $product['strength'],
                    'dosage_form' => $product['dosage_form'],
                    'pieces_per_strip' => $product['pieces_per_strip'],
                    'strips_per_box' => $product['strips_per_box'],
                    'strip_price' => $priceProfile['strip_price'],
                    'box_price' => $priceProfile['box_price'],
                    'requires_prescription' => $product['requires_prescription'],
                    'description' => $this->buildDescription($product),
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            $productId = DB::table('products')->where('product_name', $product['product_name'])->value('id');

            DB::table('product_images')->updateOrInsert(
                ['product_id' => $productId, 'is_primary' => true],
                $placeholderImage + ['product_id' => $productId, 'is_primary' => true]
            );

            DB::table('inventory_batches')->updateOrInsert(
                ['product_id' => $productId, 'batch_number' => sprintf('MP-%04d', $productId)],
                [
                    'supplier_id' => $supplierId,
                    'expiry_date' => $now->copy()->addMonths(18 + ($index % 6))->toDateString(),
                    'manufactured_date' => $now->copy()->subMonths(2 + ($index % 4))->toDateString(),
                    'purchase_price' => $priceProfile['purchase_price'],
                    'selling_price' => $product['selling_price'],
                    'stock_quantity' => $product['stock_quantity'],
                    'reserved_quantity' => 0,
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    private function seedDeliveryAreas(): void
    {
        $now = now();

        foreach ([['Dhaka', 'Dhanmondi', 60], ['Dhaka', 'Mirpur', 70], ['Dhaka', 'Gulshan', 80], ['Dhaka', 'Uttara', 75], ['Dhaka', 'Mohammadpur', 65]] as [$city, $area, $charge]) {
            DB::table('delivery_areas')->updateOrInsert(
                ['city' => $city, 'area_name' => $area],
                ['delivery_charge' => $charge, 'status' => 'active', 'created_at' => $now, 'updated_at' => $now]
            );
        }
    }

    private function buildDescription(array $product): string
    {
        $prescriptionLine = $product['requires_prescription']
            ? 'Consult a registered physician or pharmacist before use.'
            : 'Suitable for regular pharmacy support when used as directed.';

        return sprintf(
            '%s is a %s pharmacy product under %s. %s',
            $product['product_name'],
            strtolower($product['dosage_form']),
            $product['category'],
            $prescriptionLine
        );
    }

    private function buildPriceProfile(float|int $piecePrice, int $piecesPerStrip, int $stripsPerBox): array
    {
        $stripPrice = null;
        $boxPrice = null;

        if ($piecesPerStrip > 1) {
            $stripPrice = round($piecePrice * $piecesPerStrip * 0.96, 2);
        }

        if ($piecesPerStrip > 1 && $stripsPerBox > 1) {
            $boxPrice = round($stripPrice * $stripsPerBox * 0.93, 2);
        }

        return [
            'purchase_price' => round(max(1, $piecePrice * 0.72), 2),
            'strip_price' => $stripPrice,
            'box_price' => $boxPrice,
        ];
    }

    private function buildSeederSlug(string $name): string
    {
        return Str::slug($name) ?: 'product';
    }
}
