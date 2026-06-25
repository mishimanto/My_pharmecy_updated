<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->string('discount_type')->default('percent')->after('show_popup');
            $table->decimal('discount_value', 12, 2)->default(0)->after('discount_type');
            $table->decimal('max_discount', 12, 2)->nullable()->after('discount_value');
            $table->string('applies_to')->default('all')->after('max_discount');
            $table->foreignId('category_id')->nullable()->after('applies_to')->constrained('categories')->nullOnDelete();
            $table->foreignId('manufacturer_id')->nullable()->after('category_id')->constrained('manufacturers')->nullOnDelete();
            $table->json('product_ids')->nullable()->after('manufacturer_id');
        });
    }

    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
            $table->dropConstrainedForeignId('manufacturer_id');
            $table->dropColumn(['discount_type', 'discount_value', 'max_discount', 'applies_to', 'product_ids']);
        });
    }
};
