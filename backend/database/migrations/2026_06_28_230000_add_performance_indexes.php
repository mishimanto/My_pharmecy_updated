<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->indexIfColumnsExist('products', ['is_active', 'category_id', 'manufacturer_id'], 'products_catalog_filter_idx');
        $this->indexIfColumnsExist('products', ['generic_name'], 'products_generic_idx');

        $this->indexIfColumnsExist('inventory_batches', ['product_id', 'status', 'expiry_date'], 'inventory_batches_catalog_idx');
        $this->indexIfColumnsExist('inventory_batches', ['status', 'expiry_date'], 'inventory_batches_expiry_idx');
        $this->indexIfColumnsExist('inventory_batches', ['product_id', 'status', 'expiry_date', 'id'], 'inventory_batches_fefo_idx');

        $this->indexIfColumnsExist('orders', ['user_id', 'order_date'], 'orders_user_date_idx');
        $this->indexIfColumnsExist('orders', ['guest_token', 'created_at'], 'orders_guest_date_idx');
        $this->indexIfColumnsExist('orders', ['order_status', 'order_date'], 'orders_status_date_idx');
        $this->indexIfColumnsExist('orders', ['payment_status', 'order_date'], 'orders_payment_date_idx');

        $this->indexIfColumnsExist('payments', ['payment_status', 'paid_at'], 'payments_status_paid_at_idx');
        $this->indexIfColumnsExist('payments', ['created_at', 'payment_status'], 'payments_created_status_idx');

        $this->indexIfColumnsExist('notifications', ['user_id', 'status', 'created_at'], 'notifications_user_status_date_idx');
        $this->indexIfColumnsExist('notifications', ['staff_id', 'status', 'created_at'], 'notifications_staff_status_date_idx');
        $this->indexIfColumnsExist('notifications', ['notification_type', 'created_at'], 'notifications_type_date_idx');

        $this->indexIfColumnsExist('prescriptions', ['user_id', 'status', 'created_at'], 'prescriptions_user_status_date_idx');
        $this->indexIfColumnsExist('prescriptions', ['status', 'uploaded_at'], 'prescriptions_status_uploaded_idx');

        $this->indexIfColumnsExist('support_tickets', ['user_id', 'status', 'created_at'], 'support_tickets_user_status_date_idx');
        $this->indexIfColumnsExist('support_tickets', ['status', 'created_at'], 'support_tickets_status_date_idx');

        $this->indexIfColumnsExist('deliveries', ['delivery_status', 'created_at'], 'deliveries_status_date_idx');
        $this->indexIfColumnsExist('deliveries', ['rider_id', 'delivery_status'], 'deliveries_rider_status_idx');

        $this->indexIfColumnsExist('inventory_transactions', ['batch_id', 'transaction_date'], 'inventory_transactions_batch_date_idx');
        $this->indexIfColumnsExist('inventory_transactions', ['transaction_date'], 'inventory_transactions_date_idx');

        $this->indexIfColumnsExist('order_items', ['order_id', 'product_id'], 'order_items_order_product_idx');
        $this->indexIfColumnsExist('order_item_batches', ['batch_id', 'order_item_id'], 'order_item_batches_batch_item_idx');
    }

    public function down(): void
    {
        $this->dropIndexIfTableExists('products', 'products_catalog_filter_idx');
        $this->dropIndexIfTableExists('products', 'products_generic_idx');

        $this->dropIndexIfTableExists('inventory_batches', 'inventory_batches_catalog_idx');
        $this->dropIndexIfTableExists('inventory_batches', 'inventory_batches_expiry_idx');
        $this->dropIndexIfTableExists('inventory_batches', 'inventory_batches_fefo_idx');

        $this->dropIndexIfTableExists('orders', 'orders_user_date_idx');
        $this->dropIndexIfTableExists('orders', 'orders_guest_date_idx');
        $this->dropIndexIfTableExists('orders', 'orders_status_date_idx');
        $this->dropIndexIfTableExists('orders', 'orders_payment_date_idx');

        $this->dropIndexIfTableExists('payments', 'payments_status_paid_at_idx');
        $this->dropIndexIfTableExists('payments', 'payments_created_status_idx');

        $this->dropIndexIfTableExists('notifications', 'notifications_user_status_date_idx');
        $this->dropIndexIfTableExists('notifications', 'notifications_staff_status_date_idx');
        $this->dropIndexIfTableExists('notifications', 'notifications_type_date_idx');

        $this->dropIndexIfTableExists('prescriptions', 'prescriptions_user_status_date_idx');
        $this->dropIndexIfTableExists('prescriptions', 'prescriptions_status_uploaded_idx');

        $this->dropIndexIfTableExists('support_tickets', 'support_tickets_user_status_date_idx');
        $this->dropIndexIfTableExists('support_tickets', 'support_tickets_status_date_idx');

        $this->dropIndexIfTableExists('deliveries', 'deliveries_status_date_idx');
        $this->dropIndexIfTableExists('deliveries', 'deliveries_rider_status_idx');

        $this->dropIndexIfTableExists('inventory_transactions', 'inventory_transactions_batch_date_idx');
        $this->dropIndexIfTableExists('inventory_transactions', 'inventory_transactions_date_idx');

        $this->dropIndexIfTableExists('order_items', 'order_items_order_product_idx');
        $this->dropIndexIfTableExists('order_item_batches', 'order_item_batches_batch_item_idx');
    }

    private function indexIfColumnsExist(string $table, array $columns, string $name): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                return;
            }
        }

        Schema::table($table, fn (Blueprint $blueprint) => $blueprint->index($columns, $name));
    }

    private function dropIndexIfTableExists(string $table, string $name): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        try {
            Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropIndex($name));
        } catch (Throwable) {
            //
        }
    }
};
