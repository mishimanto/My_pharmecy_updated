<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'product_type')) {
                $table->string('product_type')->default('medicine')->after('manufacturer_id');
            }

            if (! Schema::hasColumn('products', 'package_unit')) {
                $table->string('package_unit')->default('piece')->after('dosage_form');
            }

            if (! Schema::hasColumn('products', 'package_size')) {
                $table->string('package_size')->nullable()->after('package_unit');
            }

            if (! Schema::hasColumn('products', 'specifications')) {
                $table->text('specifications')->nullable()->after('description_bn');
            }
        });
    }

    public function down(): void
    {
        $columns = ['product_type', 'package_unit', 'package_size', 'specifications'];
        $existing = array_values(array_filter($columns, fn ($column) => Schema::hasColumn('products', $column)));

        if ($existing !== []) {
            Schema::table('products', function (Blueprint $table) use ($existing) {
                $table->dropColumn($existing);
            });
        }
    }
};
