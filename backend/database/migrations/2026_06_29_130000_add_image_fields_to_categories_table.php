<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (! Schema::hasColumn('categories', 'image_url')) {
                $table->string('image_url')->nullable()->after('category_name_bn');
            }

            if (! Schema::hasColumn('categories', 'image_path')) {
                $table->string('image_path')->nullable()->after('image_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('categories', 'image_path')) {
                $columns[] = 'image_path';
            }

            if (Schema::hasColumn('categories', 'image_url')) {
                $columns[] = 'image_url';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
