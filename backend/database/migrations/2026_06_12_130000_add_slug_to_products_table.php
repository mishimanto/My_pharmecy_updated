<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'slug')) {
            Schema::table('products', function (Blueprint $table) {
                $table->string('slug')->nullable()->after('product_name');
            });
        }

        $products = DB::table('products')->select('id', 'product_name')->orderBy('id')->get();

        foreach ($products as $product) {
            DB::table('products')
                ->where('id', $product->id)
                ->update(['slug' => $this->uniqueSlug($product->product_name, (int) $product->id)]);
        }

        if (! $this->hasUniqueIndex('products', 'products_slug_unique')) {
            Schema::table('products', function (Blueprint $table) {
                $table->unique('slug');
            });
        }
    }

    public function down(): void
    {
        if ($this->hasUniqueIndex('products', 'products_slug_unique')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropUnique('products_slug_unique');
            });
        }

        if (Schema::hasColumn('products', 'slug')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('slug');
            });
        }
    }

    private function uniqueSlug(string $name, int $ignoreId): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $suffix = 2;

        while (
            DB::table('products')
                ->where('slug', $slug)
                ->where('id', '!=', $ignoreId)
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix += 1;
        }

        return $slug;
    }

    private function hasUniqueIndex(string $table, string $indexName): bool
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return false;
        }

        return collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->contains(fn ($index) => $index->Key_name === $indexName);
    }
};
