<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('products', 'description_bn')) {
            Schema::table('products', function (Blueprint $table) {
                $table->longText('description_bn')->nullable()->after('description');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'description_bn')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('description_bn');
            });
        }
    }
};
