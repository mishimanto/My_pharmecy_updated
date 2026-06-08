<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'pieces_per_strip')) {
            Schema::table('products', function (Blueprint $table) {
                $table->unsignedInteger('pieces_per_strip')->default(10)->after('dosage_form');
            });
        }

        if (!Schema::hasColumn('products', 'strips_per_box')) {
            Schema::table('products', function (Blueprint $table) {
                $table->unsignedInteger('strips_per_box')->default(10)->after('pieces_per_strip');
            });
        }

        if (!Schema::hasColumn('products', 'strip_price')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('strip_price', 12, 2)->nullable()->after('strips_per_box');
            });
        }

        if (!Schema::hasColumn('products', 'box_price')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('box_price', 12, 2)->nullable()->after('strip_price');
            });
        }

        if (!Schema::hasColumn('cart_items', 'purchase_unit')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->string('purchase_unit')->default('piece')->after('product_id');
            });
        }

        if (!Schema::hasColumn('cart_items', 'pieces_per_unit')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->unsignedInteger('pieces_per_unit')->default(1)->after('purchase_unit');
            });
        }

        if (!Schema::hasColumn('cart_items', 'piece_quantity')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->unsignedInteger('piece_quantity')->default(0)->after('quantity');
            });
        }

        DB::table('cart_items')->update(['piece_quantity' => DB::raw('quantity * COALESCE(pieces_per_unit, 1)')]);

        if (!$this->hasIndex('cart_items', 'cart_items_cart_id_index')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->index('cart_id');
            });
        }

        if ($this->hasIndex('cart_items', 'cart_items_cart_id_product_id_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropUnique(['cart_id', 'product_id']);
            });
        }

        if (!$this->hasIndex('cart_items', 'cart_items_cart_id_product_id_purchase_unit_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->unique(['cart_id', 'product_id', 'purchase_unit']);
            });
        }

        if (!Schema::hasColumn('order_items', 'purchase_unit')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->string('purchase_unit')->default('piece')->after('product_id');
            });
        }

        if (!Schema::hasColumn('order_items', 'pieces_per_unit')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedInteger('pieces_per_unit')->default(1)->after('purchase_unit');
            });
        }

        if (!Schema::hasColumn('order_items', 'piece_quantity')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->unsignedInteger('piece_quantity')->default(0)->after('quantity');
            });
        }

        DB::table('order_items')->update(['piece_quantity' => DB::raw('quantity * COALESCE(pieces_per_unit, 1)')]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('order_items', 'purchase_unit') || Schema::hasColumn('order_items', 'pieces_per_unit') || Schema::hasColumn('order_items', 'piece_quantity')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropColumn(['purchase_unit', 'pieces_per_unit', 'piece_quantity']);
            });
        }

        if ($this->hasIndex('cart_items', 'cart_items_cart_id_product_id_purchase_unit_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropUnique(['cart_id', 'product_id', 'purchase_unit']);
            });
        }

        if (!$this->hasIndex('cart_items', 'cart_items_cart_id_product_id_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->unique(['cart_id', 'product_id']);
            });
        }

        if ($this->hasIndex('cart_items', 'cart_items_cart_id_index')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropIndex(['cart_id']);
            });
        }

        if (Schema::hasColumn('cart_items', 'purchase_unit') || Schema::hasColumn('cart_items', 'pieces_per_unit') || Schema::hasColumn('cart_items', 'piece_quantity')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropColumn(['purchase_unit', 'pieces_per_unit', 'piece_quantity']);
            });
        }

        $productColumns = ['pieces_per_strip', 'strips_per_box', 'strip_price', 'box_price'];
        $existingProductColumns = array_values(array_filter($productColumns, fn ($column) => Schema::hasColumn('products', $column)));

        if ($existingProductColumns !== []) {
            Schema::table('products', function (Blueprint $table) use ($existingProductColumns) {
                $table->dropColumn($existingProductColumns);
            });
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->contains(fn ($index) => $index->Key_name === $indexName);
    }
};
