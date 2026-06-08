<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('carts', 'guest_token')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->string('guest_token')->nullable()->after('user_id');
            });
        }

        if (! $this->hasIndex('carts', 'carts_guest_token_unique')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->unique('guest_token');
            });
        }

        if (! $this->isNullable('carts', 'user_id')) {
            DB::statement('ALTER TABLE `carts` MODIFY `user_id` BIGINT UNSIGNED NULL');
        }

        if (! Schema::hasColumn('orders', 'guest_token')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('guest_token')->nullable()->after('address_id');
                $table->string('guest_full_name')->nullable()->after('guest_token');
                $table->string('guest_phone')->nullable()->after('guest_full_name');
                $table->string('guest_address_line_1')->nullable()->after('guest_phone');
                $table->string('guest_address_line_2')->nullable()->after('guest_address_line_1');
                $table->string('guest_city')->nullable()->after('guest_address_line_2');
                $table->string('guest_area')->nullable()->after('guest_city');
                $table->string('guest_postal_code')->nullable()->after('guest_area');
            });
        }

        if (! $this->hasIndex('orders', 'orders_guest_token_index')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index('guest_token');
            });
        }

        if (! $this->isNullable('orders', 'user_id')) {
            DB::statement('ALTER TABLE `orders` MODIFY `user_id` BIGINT UNSIGNED NULL');
        }

        if (! $this->isNullable('orders', 'address_id')) {
            DB::statement('ALTER TABLE `orders` MODIFY `address_id` BIGINT UNSIGNED NULL');
        }

        if (! Schema::hasColumn('prescriptions', 'guest_token')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->string('guest_token')->nullable()->after('user_id');
            });
        }

        if (! $this->hasIndex('prescriptions', 'prescriptions_guest_token_index')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->index('guest_token');
            });
        }

        if (! $this->isNullable('prescriptions', 'user_id')) {
            DB::statement('ALTER TABLE `prescriptions` MODIFY `user_id` BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        if ($this->isNullable('prescriptions', 'user_id')) {
            DB::statement('ALTER TABLE `prescriptions` MODIFY `user_id` BIGINT UNSIGNED NOT NULL');
        }

        if ($this->hasIndex('prescriptions', 'prescriptions_guest_token_index')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropIndex('prescriptions_guest_token_index');
            });
        }

        if (Schema::hasColumn('prescriptions', 'guest_token')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropColumn('guest_token');
            });
        }

        if ($this->isNullable('orders', 'address_id')) {
            DB::statement('ALTER TABLE `orders` MODIFY `address_id` BIGINT UNSIGNED NOT NULL');
        }

        if ($this->isNullable('orders', 'user_id')) {
            DB::statement('ALTER TABLE `orders` MODIFY `user_id` BIGINT UNSIGNED NOT NULL');
        }

        if ($this->hasIndex('orders', 'orders_guest_token_index')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex('orders_guest_token_index');
            });
        }

        $orderGuestColumns = [
            'guest_token',
            'guest_full_name',
            'guest_phone',
            'guest_address_line_1',
            'guest_address_line_2',
            'guest_city',
            'guest_area',
            'guest_postal_code',
        ];

        $existingOrderColumns = array_values(array_filter($orderGuestColumns, fn ($column) => Schema::hasColumn('orders', $column)));
        if ($existingOrderColumns !== []) {
            Schema::table('orders', function (Blueprint $table) use ($existingOrderColumns) {
                $table->dropColumn($existingOrderColumns);
            });
        }

        if ($this->isNullable('carts', 'user_id')) {
            DB::statement('ALTER TABLE `carts` MODIFY `user_id` BIGINT UNSIGNED NOT NULL');
        }

        if ($this->hasIndex('carts', 'carts_guest_token_unique')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->dropUnique('carts_guest_token_unique');
            });
        }

        if (Schema::hasColumn('carts', 'guest_token')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->dropColumn('guest_token');
            });
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->contains(fn ($index) => $index->Key_name === $indexName);
    }

    private function isNullable(string $table, string $column): bool
    {
        $result = DB::selectOne(
            'SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$table, $column],
        );

        return ($result->IS_NULLABLE ?? 'NO') === 'YES';
    }
};
