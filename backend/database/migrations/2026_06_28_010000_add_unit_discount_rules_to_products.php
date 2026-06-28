<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'strip_discount')) {
                $table->decimal('strip_discount', 12, 2)->nullable()->after('box_price');
            }

            if (! Schema::hasColumn('products', 'box_discount')) {
                $table->decimal('box_discount', 12, 2)->nullable()->after('strip_discount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'box_discount')) {
                $table->dropColumn('box_discount');
            }

            if (Schema::hasColumn('products', 'strip_discount')) {
                $table->dropColumn('strip_discount');
            }
        });
    }
};
