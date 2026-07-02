<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PharmacyCatalogMegaSeeder extends Seeder
{
    private array $columnCache = [];

    private array $productIdsByName = [];

    private const PLACEHOLDER_URL = '/storage/products/placeholders/medicine.webp';
    private const PLACEHOLDER_PATH = 'products/placeholders/medicine.webp';

    public function run(): void
    {
        DB::transaction(function () {
            $now = now();

            $categoryIds = $this->seedCategories($now);
            $manufacturerIds = $this->seedManufacturers($now);
            $supplierIds = $this->seedSuppliers($now);

            $this->seedProducts($categoryIds, $manufacturerIds, $supplierIds, $now);
            $this->seedProductAlternatives($now);
            $this->seedDrugInteractions($now);
        });
    }

    private function seedCategories($now): array
    {
        $categories = [
            ['category_name' => 'Pain Relief', 'category_name_bn' => 'ব্যথা ও জ্বর', 'description' => 'Pain, fever, headache, and body ache relief medicines.'],
            ['category_name' => 'Gastric Care', 'category_name_bn' => 'গ্যাস্ট্রিক কেয়ার', 'description' => 'Acidity, reflux, ulcer protection, and antacid medicines.'],
            ['category_name' => 'Respiratory & Allergy', 'category_name_bn' => 'শ্বাসতন্ত্র ও অ্যালার্জি', 'description' => 'Cold, cough, allergy, inhaler, and breathing support products.'],
            ['category_name' => 'Antibiotics & Infection', 'category_name_bn' => 'অ্যান্টিবায়োটিক ও সংক্রমণ', 'description' => 'Prescription antibiotics and infection management products.'],
            ['category_name' => 'Diabetes Care', 'category_name_bn' => 'ডায়াবেটিস কেয়ার', 'description' => 'Diabetes tablets, insulin, and glucose management essentials.'],
            ['category_name' => 'Cardiac Care', 'category_name_bn' => 'হৃদরোগ কেয়ার', 'description' => 'Blood pressure, cholesterol, and heart-health medicines.'],
            ['category_name' => 'Vitamins & Supplements', 'category_name_bn' => 'ভিটামিন ও সাপ্লিমেন্ট', 'description' => 'Daily vitamins, minerals, calcium, iron, and immunity support.'],
            ['category_name' => 'Child Care Medicines', 'category_name_bn' => 'শিশুদের ওষুধ', 'description' => 'Pediatric syrups, drops, suspensions, and child care medicines.'],
            ['category_name' => "Women's Health", 'category_name_bn' => 'নারী স্বাস্থ্য', 'description' => 'Women-focused wellness, supplements, and gyne support medicines.'],
            ['category_name' => 'Skin & Hair Care', 'category_name_bn' => 'ত্বক ও চুলের কেয়ার', 'description' => 'Creams, gels, lotions, shampoos, and dermatology support medicines.'],
            ['category_name' => 'Eye & ENT Care', 'category_name_bn' => 'চোখ, কান ও নাকের কেয়ার', 'description' => 'Eye drops, ear drops, nasal care, and ENT support products.'],
            ['category_name' => 'Bone & Joint Care', 'category_name_bn' => 'হাড় ও জয়েন্ট কেয়ার', 'description' => 'Bone strength, joint support, gels, and ortho wellness products.'],
            ['category_name' => 'Medical Devices', 'category_name_bn' => 'মেডিকেল ডিভাইস', 'description' => 'Thermometers, monitors, nebulizers, and home medical devices.'],
            ['category_name' => 'First Aid & Bandages', 'category_name_bn' => 'ফার্স্ট এইড ও ব্যান্ডেজ', 'description' => 'Bandages, gauze, antiseptics, tapes, and emergency care items.'],
            ['category_name' => 'Saline & Hydration', 'category_name_bn' => 'স্যালাইন ও হাইড্রেশন', 'description' => 'Saline, ORS, infusion, and hydration support products.'],
            ['category_name' => 'Sanitary Care', 'category_name_bn' => 'স্যানিটারি কেয়ার', 'description' => 'Pads, liners, pregnancy kits, and women hygiene essentials.'],
            ['category_name' => 'Mother & Baby Care', 'category_name_bn' => 'মা ও শিশু কেয়ার', 'description' => 'Diapers, wipes, baby toiletries, and maternity essentials.'],
            ['category_name' => 'Personal Care & Hygiene', 'category_name_bn' => 'পার্সোনাল কেয়ার ও হাইজিন', 'description' => 'Daily personal care, grooming, and hygiene products.'],
            ['category_name' => 'Home Health Support', 'category_name_bn' => 'হোম হেলথ সাপোর্ট', 'description' => 'Masks, gloves, braces, supports, and practical home-care tools.'],
        ];

        foreach ($categories as $category) {
            $payload = [
                'description' => $category['description'],
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($this->hasColumn('categories', 'category_name_bn')) {
                $payload['category_name_bn'] = $category['category_name_bn'];
            }

            if ($this->hasColumn('categories', 'image_url')) {
                $payload['image_url'] = self::PLACEHOLDER_URL;
            }

            if ($this->hasColumn('categories', 'image_path')) {
                $payload['image_path'] = self::PLACEHOLDER_PATH;
            }

            DB::table('categories')->updateOrInsert(
                ['category_name' => $category['category_name']],
                $payload,
            );
        }

        return DB::table('categories')->pluck('id', 'category_name')->all();
    }

    private function seedManufacturers($now): array
    {
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
            ['manufacturer_name' => 'General Pharmaceuticals', 'country' => 'Bangladesh'],
            ['manufacturer_name' => 'Popular Pharmaceuticals', 'country' => 'Bangladesh'],
        ];

        foreach ($manufacturers as $manufacturer) {
            $payload = [
                'country' => $manufacturer['country'],
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($this->hasColumn('manufacturers', 'logo_url')) {
                $payload['logo_url'] = null;
            }

            if ($this->hasColumn('manufacturers', 'logo_path')) {
                $payload['logo_path'] = null;
            }

            DB::table('manufacturers')->updateOrInsert(
                ['manufacturer_name' => $manufacturer['manufacturer_name']],
                $payload,
            );
        }

        return DB::table('manufacturers')->pluck('id', 'manufacturer_name')->all();
    }

    private function seedSuppliers($now): array
    {
        $suppliers = [
            ['supplier_name' => 'Central Medicine Supply', 'phone' => '01711000001', 'email' => 'central.supply@example.com', 'address' => 'Dhanmondi, Dhaka'],
            ['supplier_name' => 'HealthBridge Distribution', 'phone' => '01711000002', 'email' => 'healthbridge@example.com', 'address' => 'Tejgaon, Dhaka'],
            ['supplier_name' => 'CityCare Wholesale', 'phone' => '01711000003', 'email' => 'citycare@example.com', 'address' => 'Uttara, Dhaka'],
            ['supplier_name' => 'MediLine Traders', 'phone' => '01711000004', 'email' => 'mediline@example.com', 'address' => 'Mohakhali, Dhaka'],
            ['supplier_name' => 'Prime Health Depot', 'phone' => '01711000005', 'email' => 'primehealth@example.com', 'address' => 'Mirpur, Dhaka'],
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
                ],
            );
        }

        return array_values(DB::table('suppliers')->pluck('id')->all());
    }

    private function seedProducts(array $categoryIds, array $manufacturerIds, array $supplierIds, $now): void
    {
        $products = $this->catalogProducts();

        foreach ($products as $index => $product) {
            $productPayload = [
                'category_id' => $categoryIds[$product['category']],
                'manufacturer_id' => $manufacturerIds[$product['manufacturer']],
                'generic_name' => $product['generic_name'],
                'brand_name' => $product['brand_name'],
                'strength' => $product['strength'],
                'dosage_form' => $product['dosage_form'],
                'requires_prescription' => $product['requires_prescription'],
                'description' => $this->buildDescription($product),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($this->hasColumn('products', 'slug')) {
                $productPayload['slug'] = Str::slug($product['product_name']);
            }

            if ($this->hasColumn('products', 'description_bn')) {
                $productPayload['description_bn'] = $this->buildBanglaDescription($product);
            }

            if ($this->hasColumn('products', 'pieces_per_strip')) {
                $productPayload['pieces_per_strip'] = $product['pieces_per_strip'];
            }

            if ($this->hasColumn('products', 'strips_per_box')) {
                $productPayload['strips_per_box'] = $product['strips_per_box'];
            }

            if ($this->hasColumn('products', 'strip_price')) {
                $productPayload['strip_price'] = $this->buildPriceProfile($product)['strip_price'];
            }

            if ($this->hasColumn('products', 'box_price')) {
                $productPayload['box_price'] = $this->buildPriceProfile($product)['box_price'];
            }

            if ($this->hasColumn('products', 'product_type')) {
                $productPayload['product_type'] = $product['product_type'];
            }

            if ($this->hasColumn('products', 'package_unit')) {
                $productPayload['package_unit'] = $product['package_unit'];
            }

            if ($this->hasColumn('products', 'package_size')) {
                $productPayload['package_size'] = $product['package_size'];
            }

            if ($this->hasColumn('products', 'specifications')) {
                $productPayload['specifications'] = $product['specifications'];
            }

            DB::table('products')->updateOrInsert(
                ['product_name' => $product['product_name']],
                $productPayload,
            );

            $productId = (int) DB::table('products')
                ->where('product_name', $product['product_name'])
                ->value('id');

            $this->productIdsByName[$product['product_name']] = $productId;

            $this->seedProductImage($productId, $product['product_type'], $now);
            $this->seedInventoryBatch($productId, $supplierIds[$index % count($supplierIds)], $product, $index, $now);
        }
    }

    private function seedProductImage(int $productId, string $productType, $now): void
    {
        $url = self::PLACEHOLDER_URL;
        $path = self::PLACEHOLDER_PATH;

        $payload = [
            'product_id' => $productId,
            'image_url' => $url,
            'image_path' => $path,
            'is_primary' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        if ($this->hasColumn('product_images', 'image_webp_path')) {
            $payload['image_webp_path'] = $path;
        }

        if ($this->hasColumn('product_images', 'thumbnail_path')) {
            $payload['thumbnail_path'] = $path;
        }

        DB::table('product_images')->updateOrInsert(
            ['product_id' => $productId, 'is_primary' => true],
            $payload,
        );
    }

    private function seedInventoryBatch(int $productId, int $supplierId, array $product, int $index, $now): void
    {
        $priceProfile = $this->buildPriceProfile($product);

        DB::table('inventory_batches')->updateOrInsert(
            ['product_id' => $productId, 'batch_number' => sprintf('CAT-%05d', $productId)],
            [
                'supplier_id' => $supplierId,
                'expiry_date' => $now->copy()->addMonths(14 + ($index % 18))->toDateString(),
                'manufactured_date' => $now->copy()->subMonths(1 + ($index % 6))->toDateString(),
                'purchase_price' => $priceProfile['purchase_price'],
                'selling_price' => $product['selling_price'],
                'stock_quantity' => $product['stock_quantity'],
                'reserved_quantity' => 0,
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );
    }

    private function seedProductAlternatives($now): void
    {
        if (! Schema::hasTable('product_alternatives')) {
            return;
        }

        $alternativeGroups = [
            ['Napa 500mg Tablet', 'Ace 500mg Tablet', 'Fast 500mg Tablet'],
            ['Seclo 20mg Capsule', 'Sergel 20mg Capsule', 'Maxpro 20mg Capsule'],
            ['Fexo 120mg Tablet', 'Fenadin 120mg Tablet', 'Deslor 5mg Tablet'],
            ['Comet 500mg Tablet', 'Metlong 500mg Tablet'],
            ['Ostocal D Tablet', 'Coralcal-D Tablet', 'Calcee D Tablet'],
            ['Digital Thermometer', 'FlexTemp Digital Thermometer'],
            ['Pregnancy Test Kit', 'Rapid Pregnancy Test Kit'],
        ];

        foreach ($alternativeGroups as $group) {
            $productIds = collect($group)
                ->map(fn ($name) => $this->productIdsByName[$name] ?? null)
                ->filter()
                ->values();

            for ($i = 0; $i < $productIds->count(); $i++) {
                for ($j = 0; $j < $productIds->count(); $j++) {
                    if ($i === $j) {
                        continue;
                    }

                    DB::table('product_alternatives')->updateOrInsert(
                        [
                            'product_id' => $productIds[$i],
                            'alternative_product_id' => $productIds[$j],
                        ],
                        [
                            'note' => 'Similar pharmacy alternative',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ],
                    );
                }
            }
        }
    }

    private function seedDrugInteractions($now): void
    {
        if (! Schema::hasTable('drug_interactions')) {
            return;
        }

        $pairs = [
            ['Ibuprofen', 'Diclofenac Potassium', 'moderate', 'Avoid taking multiple NSAID pain medicines together without pharmacist advice.'],
            ['Aspirin', 'Ibuprofen', 'moderate', 'Ibuprofen can reduce aspirin cardioprotective effect and increase stomach irritation.'],
            ['Losartan', 'Diclofenac Potassium', 'moderate', 'Pain medicines like diclofenac may reduce blood pressure control and affect kidney function.'],
            ['Salbutamol', 'Theophylline', 'moderate', 'Combined bronchodilator use may increase palpitation and tremor risk.'],
            ['Clopidogrel', 'Omeprazole', 'moderate', 'Some gastric medicines may reduce antiplatelet effectiveness.'],
            ['Metformin', 'Dextrose Saline', 'mild', 'Monitor glucose carefully if receiving glucose-containing fluids.'],
        ];

        foreach ($pairs as [$generic, $interactsWith, $severity, $warning]) {
            DB::table('drug_interactions')->updateOrInsert(
                [
                    'generic_name' => $generic,
                    'interacts_with_generic_name' => $interactsWith,
                ],
                [
                    'severity' => $severity,
                    'warning' => $warning,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );

            DB::table('drug_interactions')->updateOrInsert(
                [
                    'generic_name' => $interactsWith,
                    'interacts_with_generic_name' => $generic,
                ],
                [
                    'severity' => $severity,
                    'warning' => $warning,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    private function buildPriceProfile(array $product): array
    {
        $piecePrice = (float) $product['selling_price'];
        $piecesPerStrip = max(1, (int) $product['pieces_per_strip']);
        $stripsPerBox = max(1, (int) $product['strips_per_box']);

        $stripPrice = $piecesPerStrip > 1
            ? round($piecePrice * $piecesPerStrip * 0.96, 2)
            : null;

        $boxPrice = ($piecesPerStrip > 1 && $stripsPerBox > 1 && $stripPrice)
            ? round($stripPrice * $stripsPerBox * 0.93, 2)
            : null;

        return [
            'purchase_price' => round(max(1, $piecePrice * 0.72), 2),
            'strip_price' => $stripPrice,
            'box_price' => $boxPrice,
        ];
    }

    private function buildDescription(array $product): string
    {
        $prescriptionText = $product['requires_prescription']
            ? 'Use under physician or pharmacist guidance.'
            : 'Suitable for regular pharmacy support when used as directed.';

        return "{$product['product_name']} is a pharmacy-ready {$product['dosage_form']} in the {$product['category']} category. {$prescriptionText}";
    }

    private function buildBanglaDescription(array $product): string
    {
        $prescriptionText = $product['requires_prescription']
            ? 'চিকিৎসক বা ফার্মাসিস্টের পরামর্শ অনুযায়ী ব্যবহার করুন।'
            : 'নির্দেশনা মেনে সাধারণ ফার্মেসি ব্যবহারের জন্য উপযোগী।';

        return "{$product['product_name']} হলো {$product['category']} ক্যাটাগরির একটি {$product['dosage_form']} ধরনের ফার্মেসি পণ্য। {$prescriptionText}";
    }

    private function hasColumn(string $table, string $column): bool
    {
        return $this->columnCache[$table][$column] ??= Schema::hasColumn($table, $column);
    }

    private function medicineProduct(
        string $category,
        string $productName,
        string $generic,
        string $brand,
        string $strength,
        string $dosageForm,
        string $manufacturer,
        float $sellingPrice,
        bool $requiresPrescription,
        int $stockQuantity = 120,
        int $piecesPerStrip = 10,
        int $stripsPerBox = 10,
        array $extra = [],
    ): array {
        $packageUnit = $extra['package_unit'] ?? 'piece';
        $packageSize = $extra['package_size'] ?? match (strtolower($dosageForm)) {
            'tablet', 'capsule' => "{$piecesPerStrip} {$dosageForm}s / strip",
            'syrup', 'suspension', 'drops' => '1 bottle',
            'cream', 'gel', 'ointment', 'shampoo', 'lotion' => '1 pack',
            'inhaler', 'injection', 'spray' => '1 unit',
            default => '1 pack',
        };

        return [
            'category' => $category,
            'product_name' => $productName,
            'generic_name' => $generic,
            'brand_name' => $brand,
            'strength' => $strength,
            'dosage_form' => $dosageForm,
            'manufacturer' => $manufacturer,
            'selling_price' => $sellingPrice,
            'requires_prescription' => $requiresPrescription,
            'stock_quantity' => $stockQuantity,
            'pieces_per_strip' => $piecesPerStrip,
            'strips_per_box' => $stripsPerBox,
            'product_type' => 'medicine',
            'package_unit' => $packageUnit,
            'package_size' => $packageSize,
            'specifications' => $extra['specifications'] ?? "{$strength} | {$dosageForm} | Pharmacy catalog item",
        ];
    }

    private function nonMedicineProduct(
        string $category,
        string $productName,
        string $generic,
        string $brand,
        string $packageSize,
        string $dosageForm,
        string $manufacturer,
        float $sellingPrice,
        int $stockQuantity = 90,
        string $packageUnit = 'unit',
        array $extra = [],
    ): array {
        return [
            'category' => $category,
            'product_name' => $productName,
            'generic_name' => $generic,
            'brand_name' => $brand,
            'strength' => $extra['strength'] ?? $packageSize,
            'dosage_form' => $dosageForm,
            'manufacturer' => $manufacturer,
            'selling_price' => $sellingPrice,
            'requires_prescription' => false,
            'stock_quantity' => $stockQuantity,
            'pieces_per_strip' => $extra['pieces_per_strip'] ?? 1,
            'strips_per_box' => $extra['strips_per_box'] ?? 1,
            'product_type' => 'other',
            'package_unit' => $packageUnit,
            'package_size' => $packageSize,
            'specifications' => $extra['specifications'] ?? "{$packageSize} | {$dosageForm} | Pharmacy support item",
        ];
    }

    private function catalogProducts(): array
    {
        return array_merge($this->medicineProducts(), $this->nonMedicineProducts());
    }

    private function medicineProducts(): array
    {
        return [
            $this->medicineProduct('Pain Relief', 'Napa 500mg Tablet', 'Paracetamol', 'Napa', '500mg', 'Tablet', 'Beximco Pharma', 10, false, 320),
            $this->medicineProduct('Pain Relief', 'Ace 500mg Tablet', 'Paracetamol', 'Ace', '500mg', 'Tablet', 'Square Pharmaceuticals', 10, false, 280),
            $this->medicineProduct('Pain Relief', 'Fast 500mg Tablet', 'Paracetamol', 'Fast', '500mg', 'Tablet', 'Drug International', 10, false, 240),
            $this->medicineProduct('Pain Relief', 'Tufnil 200mg Tablet', 'Ibuprofen', 'Tufnil', '200mg', 'Tablet', 'Drug International', 14, false, 210),
            $this->medicineProduct('Pain Relief', 'Xpa 50mg Tablet', 'Diclofenac Potassium', 'Xpa', '50mg', 'Tablet', 'Opsonin Pharma', 16, true, 180),
            $this->medicineProduct('Pain Relief', 'Naprox 250mg Tablet', 'Naproxen', 'Naprox', '250mg', 'Tablet', 'Healthcare Pharma', 18, true, 165),
            $this->medicineProduct('Pain Relief', 'Catazor 50mg Tablet', 'Diclofenac Potassium', 'Catazor', '50mg', 'Tablet', 'Aristopharma', 17, true, 175),

            $this->medicineProduct('Gastric Care', 'Seclo 20mg Capsule', 'Omeprazole', 'Seclo', '20mg', 'Capsule', 'Square Pharmaceuticals', 12, false, 300),
            $this->medicineProduct('Gastric Care', 'Sergel 20mg Capsule', 'Esomeprazole', 'Sergel', '20mg', 'Capsule', 'Healthcare Pharma', 14, false, 250),
            $this->medicineProduct('Gastric Care', 'Maxpro 20mg Capsule', 'Esomeprazole', 'Maxpro', '20mg', 'Capsule', 'Renata', 15, false, 220),
            $this->medicineProduct('Gastric Care', 'Pantonix 20mg Tablet', 'Pantoprazole', 'Pantonix', '20mg', 'Tablet', 'Incepta', 13, false, 260),
            $this->medicineProduct('Gastric Care', 'Antacid Plus Suspension 200ml', 'Antacid Suspension', 'Antacid Plus', '200ml', 'Suspension', 'ACI Limited', 125, false, 120, 1, 1, ['package_unit' => 'bottle', 'package_size' => '200ml bottle']),
            $this->medicineProduct('Gastric Care', 'Losectil 40mg Capsule', 'Omeprazole', 'Losectil', '40mg', 'Capsule', 'General Pharmaceuticals', 18, true, 145),
            $this->medicineProduct('Gastric Care', 'Esotid 40mg Capsule', 'Esomeprazole', 'Esotid', '40mg', 'Capsule', 'Popular Pharmaceuticals', 20, true, 135),

            $this->medicineProduct('Respiratory & Allergy', 'Fexo 120mg Tablet', 'Fexofenadine', 'Fexo', '120mg', 'Tablet', 'Renata', 22, false, 190),
            $this->medicineProduct('Respiratory & Allergy', 'Fenadin 120mg Tablet', 'Fexofenadine', 'Fenadin', '120mg', 'Tablet', 'Aristopharma', 21, false, 175),
            $this->medicineProduct('Respiratory & Allergy', 'Monas 10mg Tablet', 'Montelukast', 'Monas', '10mg', 'Tablet', 'Incepta', 18, true, 155),
            $this->medicineProduct('Respiratory & Allergy', 'Deslor 5mg Tablet', 'Desloratadine', 'Deslor', '5mg', 'Tablet', 'Aristopharma', 20, false, 165),
            $this->medicineProduct('Respiratory & Allergy', 'Ambrox Syrup 100ml', 'Ambroxol', 'Ambrox', '100ml', 'Syrup', 'Opsonin Pharma', 90, false, 105, 1, 1, ['package_unit' => 'bottle', 'package_size' => '100ml bottle']),
            $this->medicineProduct('Respiratory & Allergy', 'Breathex Inhaler', 'Salbutamol', 'Breathex', '100mcg', 'Inhaler', 'Beximco Pharma', 285, true, 70, 1, 1, ['package_unit' => 'device', 'package_size' => '1 inhaler']),
            $this->medicineProduct('Respiratory & Allergy', 'Coughnil Syrup 100ml', 'Dextromethorphan + Guaifenesin', 'Coughnil', '100ml', 'Syrup', 'Healthcare Pharma', 115, false, 110, 1, 1, ['package_unit' => 'bottle', 'package_size' => '100ml bottle']),

            $this->medicineProduct('Antibiotics & Infection', 'Zimax 500mg Tablet', 'Azithromycin', 'Zimax', '500mg', 'Tablet', 'Square Pharmaceuticals', 35, true, 130, 3, 4),
            $this->medicineProduct('Antibiotics & Infection', 'Cef-3 400mg Capsule', 'Cefixime', 'Cef-3', '400mg', 'Capsule', 'Renata', 48, true, 110, 6, 4),
            $this->medicineProduct('Antibiotics & Infection', 'Moxacil 500mg Capsule', 'Amoxicillin', 'Moxacil', '500mg', 'Capsule', 'Opsonin Pharma', 32, true, 180, 8, 5),
            $this->medicineProduct('Antibiotics & Infection', 'Neocef 250mg Suspension', 'Cefuroxime', 'Neocef', '250mg/5ml', 'Suspension', 'Eskayef', 240, true, 95, 1, 1, ['package_unit' => 'bottle', 'package_size' => '70ml bottle']),
            $this->medicineProduct('Antibiotics & Infection', 'Ciprox 500mg Tablet', 'Ciprofloxacin', 'Ciprox', '500mg', 'Tablet', 'ACI Limited', 24, true, 145),
            $this->medicineProduct('Antibiotics & Infection', 'Fluclox 250mg Capsule', 'Flucloxacillin', 'Fluclox', '250mg', 'Capsule', 'Popular Pharmaceuticals', 19, true, 125),
            $this->medicineProduct('Antibiotics & Infection', 'Azin Suspension 200mg/5ml', 'Azithromycin', 'Azin', '200mg/5ml', 'Suspension', 'General Pharmaceuticals', 155, true, 82, 1, 1, ['package_unit' => 'bottle', 'package_size' => '15ml bottle']),

            $this->medicineProduct('Diabetes Care', 'Comet 500mg Tablet', 'Metformin', 'Comet', '500mg', 'Tablet', 'Square Pharmaceuticals', 9, true, 320),
            $this->medicineProduct('Diabetes Care', 'Metlong 500mg Tablet', 'Metformin', 'Metlong', '500mg', 'Tablet', 'Renata', 10, true, 275),
            $this->medicineProduct('Diabetes Care', 'Glyset 80mg Tablet', 'Gliclazide', 'Glyset', '80mg', 'Tablet', 'Incepta', 11, true, 210),
            $this->medicineProduct('Diabetes Care', 'Galvus Met 50/500 Tablet', 'Vildagliptin + Metformin', 'Galvus Met', '50/500mg', 'Tablet', 'Healthcare Pharma', 28, true, 130, 14, 6),
            $this->medicineProduct('Diabetes Care', 'Insulatard FlexPen', 'Human Insulin', 'Insulatard', '100IU/ml', 'Injection', 'Beximco Pharma', 760, true, 55, 1, 1, ['package_unit' => 'device', 'package_size' => '1 pen']),
            $this->medicineProduct('Diabetes Care', 'Linaglip 5mg Tablet', 'Linagliptin', 'Linaglip', '5mg', 'Tablet', 'Drug International', 22, true, 115),
            $this->medicineProduct('Diabetes Care', 'Glimitor 2mg Tablet', 'Glimepiride', 'Glimitor', '2mg', 'Tablet', 'Aristopharma', 7, true, 225),

            $this->medicineProduct('Cardiac Care', 'Amdocal 5mg Tablet', 'Amlodipine', 'Amdocal', '5mg', 'Tablet', 'Beximco Pharma', 8, true, 300),
            $this->medicineProduct('Cardiac Care', 'Losucon 50mg Tablet', 'Losartan', 'Losucon', '50mg', 'Tablet', 'ACI Limited', 14, true, 240),
            $this->medicineProduct('Cardiac Care', 'Rosuva 10mg Tablet', 'Rosuvastatin', 'Rosuva', '10mg', 'Tablet', 'Incepta', 18, true, 190),
            $this->medicineProduct('Cardiac Care', 'Ecosprin 75mg Tablet', 'Aspirin', 'Ecosprin', '75mg', 'Tablet', 'Square Pharmaceuticals', 6, true, 330, 14, 10),
            $this->medicineProduct('Cardiac Care', 'Bisocor 2.5mg Tablet', 'Bisoprolol', 'Bisocor', '2.5mg', 'Tablet', 'Renata', 12, true, 175),
            $this->medicineProduct('Cardiac Care', 'Clopid 75mg Tablet', 'Clopidogrel', 'Clopid', '75mg', 'Tablet', 'Healthcare Pharma', 15, true, 185),
            $this->medicineProduct('Cardiac Care', 'Atorva 20mg Tablet', 'Atorvastatin', 'Atorva', '20mg', 'Tablet', 'Popular Pharmaceuticals', 11, true, 215),

            $this->medicineProduct('Vitamins & Supplements', 'A-Z Gold Tablet', 'Multivitamin & Minerals', 'A-Z Gold', 'Daily Formula', 'Tablet', 'Eskayef', 15, false, 185, 15, 6),
            $this->medicineProduct('Vitamins & Supplements', 'Ostocal D Tablet', 'Calcium + Vitamin D', 'Ostocal D', '500mg + 200IU', 'Tablet', 'Healthcare Pharma', 12, false, 230),
            $this->medicineProduct('Vitamins & Supplements', 'Coralcal-D Tablet', 'Calcium + Vitamin D3', 'Coralcal-D', '500mg + 200IU', 'Tablet', 'Drug International', 13, false, 210),
            $this->medicineProduct('Vitamins & Supplements', 'Ceevit 250mg Tablet', 'Vitamin C', 'Ceevit', '250mg', 'Tablet', 'Square Pharmaceuticals', 7, false, 290),
            $this->medicineProduct('Vitamins & Supplements', 'Vitabion Tablet', 'Vitamin B Complex', 'Vitabion', 'B-Complex', 'Tablet', 'Beximco Pharma', 8, false, 260),
            $this->medicineProduct('Vitamins & Supplements', 'Zinc B Syrup', 'Zinc + B-Complex', 'Zinc B', '100ml', 'Syrup', 'Drug International', 125, false, 125, 1, 1, ['package_unit' => 'bottle', 'package_size' => '100ml bottle']),
            $this->medicineProduct('Vitamins & Supplements', 'Ferovit Syrup', 'Iron + Vitamins', 'Ferovit', '200ml', 'Syrup', 'ACI Limited', 145, false, 110, 1, 1, ['package_unit' => 'bottle', 'package_size' => '200ml bottle']),

            $this->medicineProduct('Child Care Medicines', 'Napa Syrup', 'Paracetamol', 'Napa', '120mg/5ml', 'Syrup', 'Beximco Pharma', 42, false, 180, 1, 1, ['package_unit' => 'bottle', 'package_size' => '60ml bottle']),
            $this->medicineProduct('Child Care Medicines', 'Pedifen Suspension', 'Ibuprofen', 'Pedifen', '100mg/5ml', 'Suspension', 'Incepta', 68, false, 145, 1, 1, ['package_unit' => 'bottle', 'package_size' => '60ml bottle']),
            $this->medicineProduct('Child Care Medicines', 'BabySaline Nasal Drops', 'Sodium Chloride', 'BabySaline', '15ml', 'Drops', 'ACI Limited', 58, false, 135, 1, 1, ['package_unit' => 'bottle', 'package_size' => '15ml bottle']),
            $this->medicineProduct('Child Care Medicines', 'Xinc B Kids Syrup', 'Zinc', 'Xinc B Kids', '100ml', 'Syrup', 'Square Pharmaceuticals', 95, false, 120, 1, 1, ['package_unit' => 'bottle', 'package_size' => '100ml bottle']),
            $this->medicineProduct('Child Care Medicines', 'Mox Kids Suspension', 'Amoxicillin', 'Mox Kids', '125mg/5ml', 'Suspension', 'Opsonin Pharma', 105, true, 98, 1, 1, ['package_unit' => 'bottle', 'package_size' => '100ml bottle']),
            $this->medicineProduct('Child Care Medicines', 'TummyCare Drops', 'Simethicone', 'TummyCare', '30ml', 'Drops', 'Popular Pharmaceuticals', 88, false, 102, 1, 1, ['package_unit' => 'bottle', 'package_size' => '30ml bottle']),
            $this->medicineProduct('Child Care Medicines', 'Neobion Drops', 'Multivitamin', 'Neobion', '30ml', 'Drops', 'General Pharmaceuticals', 78, false, 108, 1, 1, ['package_unit' => 'bottle', 'package_size' => '30ml bottle']),

            $this->medicineProduct("Women's Health", 'Fefol Capsule', 'Iron + Folic Acid', 'Fefol', 'Daily Support', 'Capsule', 'Square Pharmaceuticals', 9, false, 210),
            $this->medicineProduct("Women's Health", 'Ovacare Tablet', 'Myo-Inositol + Folic Acid', 'Ovacare', 'Wellness Blend', 'Tablet', 'Healthcare Pharma', 22, false, 140),
            $this->medicineProduct("Women's Health", 'Calbo D Tablet', 'Calcium + Vitamin D3', 'Calbo D', '500mg + 400IU', 'Tablet', 'Drug International', 13, false, 195),
            $this->medicineProduct("Women's Health", 'Femicon Tablet', 'Ethinyl Estradiol + Levonorgestrel', 'Femicon', '0.03mg/0.15mg', 'Tablet', 'Renata', 38, true, 92, 28, 3),
            $this->medicineProduct("Women's Health", 'Pregnafol Tablet', 'Folic Acid + DHA', 'Pregnafol', 'Prenatal Formula', 'Tablet', 'Incepta', 18, false, 125),
            $this->medicineProduct("Women's Health", 'Menocare Capsule', 'Evening Primrose Oil + Vitamins', 'Menocare', 'Softgel', 'Capsule', 'Aristopharma', 16, false, 118),
            $this->medicineProduct("Women's Health", 'CraniCare Sachet', 'Cranberry + D-Mannose', 'CraniCare', '5g', 'Sachet', 'ACI Limited', 28, false, 90, 1, 10, ['package_unit' => 'packet', 'package_size' => '10 sachets / box']),

            $this->medicineProduct('Skin & Hair Care', 'Pevisone Cream', 'Econazole + Triamcinolone', 'Pevisone', '15g', 'Cream', 'Beximco Pharma', 95, true, 110, 1, 1, ['package_unit' => 'tube', 'package_size' => '15g tube']),
            $this->medicineProduct('Skin & Hair Care', 'Dermasol Ointment', 'Clobetasol', 'Dermasol', '25g', 'Ointment', 'Aristopharma', 110, true, 95, 1, 1, ['package_unit' => 'tube', 'package_size' => '25g tube']),
            $this->medicineProduct('Skin & Hair Care', 'Nizoral Shampoo', 'Ketoconazole', 'Nizoral', '60ml', 'Shampoo', 'Opsonin Pharma', 220, false, 88, 1, 1, ['package_unit' => 'bottle', 'package_size' => '60ml bottle']),
            $this->medicineProduct('Skin & Hair Care', 'AcneFree Gel', 'Clindamycin + Nicotinamide', 'AcneFree', '20g', 'Gel', 'Renata', 145, true, 96, 1, 1, ['package_unit' => 'tube', 'package_size' => '20g tube']),
            $this->medicineProduct('Skin & Hair Care', 'Clindac Lotion', 'Clindamycin', 'Clindac', '30ml', 'Lotion', 'Healthcare Pharma', 130, true, 90, 1, 1, ['package_unit' => 'bottle', 'package_size' => '30ml bottle']),
            $this->medicineProduct('Skin & Hair Care', 'Scalpex Shampoo', 'Coal Tar + Salicylic Acid', 'Scalpex', '80ml', 'Shampoo', 'General Pharmaceuticals', 240, false, 72, 1, 1, ['package_unit' => 'bottle', 'package_size' => '80ml bottle']),
            $this->medicineProduct('Skin & Hair Care', 'Fungin Cream', 'Terbinafine', 'Fungin', '15g', 'Cream', 'Popular Pharmaceuticals', 125, true, 86, 1, 1, ['package_unit' => 'tube', 'package_size' => '15g tube']),

            $this->medicineProduct('Eye & ENT Care', 'Tears Naturale Eye Drop', 'Hypromellose', 'Tears Naturale', '10ml', 'Drops', 'ACI Limited', 135, false, 85, 1, 1, ['package_unit' => 'bottle', 'package_size' => '10ml bottle']),
            $this->medicineProduct('Eye & ENT Care', 'Moxiflox Eye Drop', 'Moxifloxacin', 'Moxiflox', '5ml', 'Drops', 'Beximco Pharma', 160, true, 78, 1, 1, ['package_unit' => 'bottle', 'package_size' => '5ml bottle']),
            $this->medicineProduct('Eye & ENT Care', 'EarCalm Drops', 'Ofloxacin + Lidocaine', 'EarCalm', '10ml', 'Drops', 'Square Pharmaceuticals', 145, true, 76, 1, 1, ['package_unit' => 'bottle', 'package_size' => '10ml bottle']),
            $this->medicineProduct('Eye & ENT Care', 'Xylorin Nasal Drop', 'Xylometazoline', 'Xylorin', '10ml', 'Drops', 'Incepta', 85, false, 118, 1, 1, ['package_unit' => 'bottle', 'package_size' => '10ml bottle']),
            $this->medicineProduct('Eye & ENT Care', 'Opatadine Eye Drop', 'Olopatadine', 'Opatadine', '5ml', 'Drops', 'Renata', 210, true, 60, 1, 1, ['package_unit' => 'bottle', 'package_size' => '5ml bottle']),
            $this->medicineProduct('Eye & ENT Care', 'LubriGel Eye Ointment', 'Lubricating Eye Ointment', 'LubriGel', '5g', 'Ointment', 'Healthcare Pharma', 115, false, 74, 1, 1, ['package_unit' => 'tube', 'package_size' => '5g tube']),
            $this->medicineProduct('Eye & ENT Care', 'Saline Nasal Spray', 'Sodium Chloride', 'Saline Spray', '20ml', 'Spray', 'Drug International', 95, false, 94, 1, 1, ['package_unit' => 'bottle', 'package_size' => '20ml spray']),

            $this->medicineProduct('Bone & Joint Care', 'Osteo Plus Tablet', 'Calcium + Minerals', 'Osteo Plus', 'Bone Support', 'Tablet', 'Square Pharmaceuticals', 14, false, 155),
            $this->medicineProduct('Bone & Joint Care', 'Calcee D Tablet', 'Calcium + Vitamin D', 'Calcee D', '500mg + 400IU', 'Tablet', 'ACI Limited', 12, false, 170),
            $this->medicineProduct('Bone & Joint Care', 'Jointace Capsule', 'Glucosamine + Chondroitin', 'Jointace', 'Joint Blend', 'Capsule', 'Healthcare Pharma', 24, false, 125),
            $this->medicineProduct('Bone & Joint Care', 'FlexiGel', 'Diclofenac Diethylamine', 'FlexiGel', '30g', 'Gel', 'Renata', 135, false, 98, 1, 1, ['package_unit' => 'tube', 'package_size' => '30g tube']),
            $this->medicineProduct('Bone & Joint Care', 'Diclo Gel', 'Diclofenac Diethylamine', 'Diclo Gel', '20g', 'Gel', 'Drug International', 110, false, 92, 1, 1, ['package_unit' => 'tube', 'package_size' => '20g tube']),
            $this->medicineProduct('Bone & Joint Care', 'Carticare Sachet', 'Collagen + MSM', 'Carticare', '10g', 'Sachet', 'Aristopharma', 30, false, 88, 1, 14, ['package_unit' => 'packet', 'package_size' => '14 sachets / box']),
            $this->medicineProduct('Bone & Joint Care', 'OrthoCal Tablet', 'Calcium Citrate + Vitamin D', 'OrthoCal', 'Bone Formula', 'Tablet', 'General Pharmaceuticals', 16, false, 138),
        ];
    }

    private function nonMedicineProducts(): array
    {
        return [
            $this->nonMedicineProduct('Medical Devices', 'Digital Thermometer', 'Body Temperature Monitor', 'CareTemp', '1 device', 'Device', 'ACI Limited', 260, 90, 'device'),
            $this->nonMedicineProduct('Medical Devices', 'FlexTemp Digital Thermometer', 'Body Temperature Monitor', 'FlexTemp', '1 device', 'Device', 'Square Pharmaceuticals', 290, 84, 'device'),
            $this->nonMedicineProduct('Medical Devices', 'Blood Pressure Monitor', 'Automatic BP Monitor', 'HealthTrack', '1 device', 'Device', 'Healthcare Pharma', 2350, 55, 'device'),
            $this->nonMedicineProduct('Medical Devices', 'Glucometer Starter Kit', 'Blood Glucose Monitoring Kit', 'GlucoCare', '1 kit', 'Device', 'Beximco Pharma', 1450, 62, 'kit'),
            $this->nonMedicineProduct('Medical Devices', 'Pulse Oximeter', 'Oxygen Saturation Monitor', 'OxyCheck', '1 device', 'Device', 'Square Pharmaceuticals', 980, 70, 'device'),
            $this->nonMedicineProduct('Medical Devices', 'Nebulizer Machine', 'Compressor Nebulizer', 'BreathEase', '1 device', 'Device', 'Incepta', 2850, 34, 'device'),
            $this->nonMedicineProduct('Medical Devices', 'Bathroom Weighing Scale', 'Weight Monitor', 'BodyTrack', '1 device', 'Device', 'Popular Pharmaceuticals', 1650, 41, 'device'),

            $this->nonMedicineProduct('First Aid & Bandages', 'Sterile Gauze Pack', 'Sterile Gauze', 'MediGauze', '10 pcs pack', 'First Aid', 'Renata', 85, 180, 'pack'),
            $this->nonMedicineProduct('First Aid & Bandages', 'Crepe Bandage 4 Inch', 'Elastic Bandage', 'FlexWrap', '1 roll', 'First Aid', 'Drug International', 120, 135, 'roll'),
            $this->nonMedicineProduct('First Aid & Bandages', 'Adhesive Bandage Box', 'Adhesive Bandage', 'QuickHeal', '100 pcs box', 'First Aid', 'Eskayef', 160, 98, 'box'),
            $this->nonMedicineProduct('First Aid & Bandages', 'Cotton Roll 100g', 'Absorbent Cotton', 'SoftCare', '100g pack', 'First Aid', 'ACI Limited', 75, 145, 'pack'),
            $this->nonMedicineProduct('First Aid & Bandages', 'Antiseptic Solution 500ml', 'Antiseptic Solution', 'SafeClean', '500ml bottle', 'Liquid', 'Drug International', 175, 122, 'bottle'),
            $this->nonMedicineProduct('First Aid & Bandages', 'Micropore Tape', 'Surgical Tape', 'MediTape', '1 roll', 'First Aid', 'General Pharmaceuticals', 65, 150, 'roll'),
            $this->nonMedicineProduct('First Aid & Bandages', 'Wound Dressing Pad', 'Wound Pad', 'CarePad', '5 pcs pack', 'First Aid', 'Healthcare Pharma', 95, 112, 'pack'),

            $this->nonMedicineProduct('Saline & Hydration', 'Normal Saline 500ml', 'Sodium Chloride Solution', 'Normal Saline', '500ml bottle', 'Fluid', 'Opsonin Pharma', 95, 96, 'bottle'),
            $this->nonMedicineProduct('Saline & Hydration', 'Dextrose Saline 500ml', 'Dextrose + Sodium Chloride', 'Dextrose Saline', '500ml bottle', 'Fluid', 'Beximco Pharma', 105, 90, 'bottle'),
            $this->nonMedicineProduct('Saline & Hydration', 'Ringer Lactate 500ml', 'Ringer Lactate Solution', 'Ringer Lactate', '500ml bottle', 'Fluid', 'Square Pharmaceuticals', 115, 86, 'bottle'),
            $this->nonMedicineProduct('Saline & Hydration', 'ORS Sachet Box', 'Oral Rehydration Salts', 'Orsaline', '20 sachets box', 'Hydration', 'Renata', 130, 115, 'box'),
            $this->nonMedicineProduct('Saline & Hydration', 'Infusion Set', 'IV Infusion Set', 'FlowSet', '1 set', 'Consumable', 'Popular Pharmaceuticals', 28, 170, 'unit'),
            $this->nonMedicineProduct('Saline & Hydration', 'IV Cannula 22G', 'Intravenous Cannula', 'VeinLine', '1 unit', 'Consumable', 'ACI Limited', 32, 185, 'unit'),
            $this->nonMedicineProduct('Saline & Hydration', 'Feeding Saline Set', 'Enteral Feeding Set', 'NutriLine', '1 set', 'Consumable', 'Healthcare Pharma', 55, 92, 'unit'),

            $this->nonMedicineProduct('Sanitary Care', 'Whisper Maxi Flow Pack', 'Sanitary Napkin', 'Whisper', '8 pads pack', 'Sanitary Care', 'ACI Limited', 140, 130, 'pack'),
            $this->nonMedicineProduct('Sanitary Care', 'Freedom Heavy Flow Pack', 'Sanitary Napkin', 'Freedom', '8 pads pack', 'Sanitary Care', 'Square Pharmaceuticals', 135, 118, 'pack'),
            $this->nonMedicineProduct('Sanitary Care', 'Panty Liner Pack', 'Panty Liner', 'FreshLiner', '20 pcs pack', 'Sanitary Care', 'Renata', 120, 110, 'pack'),
            $this->nonMedicineProduct('Sanitary Care', 'Pregnancy Test Kit', 'Pregnancy Test Device', 'SureTest', '1 kit', 'Diagnostic', 'Healthcare Pharma', 90, 140, 'kit'),
            $this->nonMedicineProduct('Sanitary Care', 'Rapid Pregnancy Test Kit', 'Pregnancy Test Device', 'RapidTest', '1 kit', 'Diagnostic', 'Drug International', 95, 128, 'kit'),
            $this->nonMedicineProduct('Sanitary Care', 'Ovulation Test Kit', 'Ovulation Test Device', 'OvulCheck', '5 strips pack', 'Diagnostic', 'Popular Pharmaceuticals', 260, 80, 'kit'),
            $this->nonMedicineProduct('Sanitary Care', 'Intimate Wash 100ml', 'Intimate Hygiene Wash', 'FemFresh', '100ml bottle', 'Liquid', 'Aristopharma', 220, 86, 'bottle'),

            $this->nonMedicineProduct('Mother & Baby Care', 'Baby Diaper Medium Pack', 'Disposable Diaper', 'BabySoft', 'M / 32 pcs', 'Baby Care', 'ACI Limited', 620, 72, 'pack'),
            $this->nonMedicineProduct('Mother & Baby Care', 'Baby Wipes Pack', 'Wet Wipes', 'BabySoft', '80 pcs pack', 'Baby Care', 'Square Pharmaceuticals', 180, 118, 'pack'),
            $this->nonMedicineProduct('Mother & Baby Care', 'Feeding Bottle 250ml', 'Baby Feeding Bottle', 'CareBaby', '250ml bottle', 'Baby Care', 'Healthcare Pharma', 290, 68, 'unit'),
            $this->nonMedicineProduct('Mother & Baby Care', 'Baby Lotion 200ml', 'Baby Lotion', 'CareBaby', '200ml bottle', 'Baby Care', 'Drug International', 240, 84, 'bottle'),
            $this->nonMedicineProduct('Mother & Baby Care', 'Baby Soap Bar', 'Baby Soap', 'CareBaby', '75g bar', 'Baby Care', 'Beximco Pharma', 90, 132, 'unit'),
            $this->nonMedicineProduct('Mother & Baby Care', 'Baby Shampoo 200ml', 'Baby Shampoo', 'CareBaby', '200ml bottle', 'Baby Care', 'Renata', 255, 75, 'bottle'),
            $this->nonMedicineProduct('Mother & Baby Care', 'Nursing Pad Pack', 'Breast Nursing Pad', 'MomComfort', '30 pcs pack', 'Maternity Care', 'Popular Pharmaceuticals', 320, 52, 'pack'),

            $this->nonMedicineProduct('Personal Care & Hygiene', 'Oral Care Mouthwash 250ml', 'Mouthwash', 'FreshCare', '250ml bottle', 'Personal Care', 'ACI Limited', 165, 108, 'bottle'),
            $this->nonMedicineProduct('Personal Care & Hygiene', 'Moisturizing Lotion 200ml', 'Moisturizing Lotion', 'DermaSoft', '200ml bottle', 'Personal Care', 'Renata', 340, 82, 'bottle'),
            $this->nonMedicineProduct('Personal Care & Hygiene', 'Sensitive Toothpaste 120g', 'Toothpaste', 'SmileCare', '120g tube', 'Personal Care', 'Square Pharmaceuticals', 145, 122, 'tube'),
            $this->nonMedicineProduct('Personal Care & Hygiene', 'Alcohol Hand Sanitizer 250ml', 'Hand Sanitizer', 'SafeHands', '250ml bottle', 'Liquid', 'ACI Limited', 120, 156, 'bottle'),
            $this->nonMedicineProduct('Personal Care & Hygiene', 'Herbal Shampoo 340ml', 'Herbal Shampoo', 'HerbaSilk', '340ml bottle', 'Personal Care', 'Popular Pharmaceuticals', 310, 70, 'bottle'),
            $this->nonMedicineProduct('Personal Care & Hygiene', 'Face Wash 100ml', 'Facial Cleanser', 'DermaGlow', '100ml tube', 'Personal Care', 'Aristopharma', 195, 96, 'tube'),
            $this->nonMedicineProduct('Personal Care & Hygiene', 'Petroleum Jelly 50ml', 'Petroleum Jelly', 'SoftSkin', '50ml jar', 'Personal Care', 'Drug International', 88, 128, 'jar'),

            $this->nonMedicineProduct('Home Health Support', 'Surgical Face Mask Box', 'Disposable Face Mask', 'CareMask', '50 pcs box', 'Hygiene', 'Eskayef', 210, 115, 'box'),
            $this->nonMedicineProduct('Home Health Support', 'Disposable Gloves Box', 'Disposable Gloves', 'SafeGrip', '100 pcs box', 'Hygiene', 'Healthcare Pharma', 320, 76, 'box'),
            $this->nonMedicineProduct('Home Health Support', 'Adult Diaper Pack', 'Adult Diaper', 'ComfortDry', '10 pcs pack', 'Home Care', 'ACI Limited', 420, 62, 'pack'),
            $this->nonMedicineProduct('Home Health Support', 'Steam Inhaler', 'Steam Vapor Device', 'BreathPot', '1 device', 'Device', 'General Pharmaceuticals', 480, 45, 'device'),
            $this->nonMedicineProduct('Home Health Support', 'Back Support Belt', 'Lumbar Support Belt', 'OrthoSupport', '1 belt', 'Support', 'Popular Pharmaceuticals', 680, 48, 'unit'),
            $this->nonMedicineProduct('Home Health Support', 'Knee Support Brace', 'Knee Brace', 'JointSupport', '1 pair', 'Support', 'Renata', 520, 54, 'pair'),
            $this->nonMedicineProduct('Home Health Support', 'Underpad Pack', 'Disposable Underpad', 'DryCare', '10 pcs pack', 'Home Care', 'Drug International', 350, 58, 'pack'),
        ];
    }
}
