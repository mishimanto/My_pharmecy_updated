<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->roundTable('products', ['strip_price', 'box_price']);
        $this->roundTable('inventory_batches', ['purchase_price', 'selling_price']);
        $this->roundTable('cart_items', ['unit_price']);
        $this->roundTable('orders', ['subtotal_amount', 'discount_amount', 'delivery_charge', 'total_amount', 'cod_fee']);
        $this->roundTable('order_items', ['unit_price', 'discount', 'subtotal']);
        $this->roundTable('order_item_batches', ['unit_price', 'subtotal']);
        $this->roundTable('payments', ['amount']);
        $this->roundTable('delivery_areas', ['delivery_charge']);
        $this->roundTable('deliveries', ['delivery_charge']);
    }

    public function down(): void
    {
        // This migration intentionally normalizes existing money values in place.
    }

    private function roundTable(string $table, array $columns): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $presentColumns = array_values(array_filter(
            $columns,
            fn (string $column) => Schema::hasColumn($table, $column)
        ));

        if ($presentColumns === []) {
            return;
        }

        DB::table($table)
            ->select(array_merge(['id'], $presentColumns))
            ->orderBy('id')
            ->lazyById()
            ->each(function ($row) use ($table, $presentColumns) {
                $updates = [];

                foreach ($presentColumns as $column) {
                    $value = $row->{$column};

                    if ($value === null) {
                        continue;
                    }

                    $rounded = (float) round((float) $value, 0);

                    if ((float) $value !== $rounded) {
                        $updates[$column] = $rounded;
                    }
                }

                if ($updates !== []) {
                    DB::table($table)->where('id', $row->id)->update($updates);
                }
            });
    }
};
