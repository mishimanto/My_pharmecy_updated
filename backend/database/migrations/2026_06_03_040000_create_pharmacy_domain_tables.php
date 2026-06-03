<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('phone');
            $table->string('address_line_1');
            $table->string('address_line_2')->nullable();
            $table->string('city');
            $table->string('area');
            $table->string('postal_code')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('default_address_id')->references('id')->on('user_addresses')->nullOnDelete();
            });
        }

        Schema::create('staffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('password');
            $table->string('license_no')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('device_type')->nullable();
            $table->string('device_token')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamp('login_at');
            $table->timestamp('logout_at')->nullable();
            $table->timestamps();
        });

        Schema::create('staff_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staffs')->cascadeOnDelete();
            $table->string('device_type')->nullable();
            $table->string('device_token')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamp('login_at');
            $table->timestamp('logout_at')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->nullable()->constrained('staffs')->nullOnDelete();
            $table->string('action_type');
            $table->string('module_name');
            $table->unsignedBigInteger('record_id')->nullable();
            $table->longText('old_value')->nullable();
            $table->longText('new_value')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });

        Schema::create('user_admin_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staffs')->cascadeOnDelete();
            $table->string('action_type');
            $table->text('reason')->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('category_name');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('manufacturers', function (Blueprint $table) {
            $table->id();
            $table->string('manufacturer_name');
            $table->string('country')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('manufacturer_id')->constrained()->restrictOnDelete();
            $table->string('product_name');
            $table->string('generic_name')->nullable();
            $table->string('brand_name')->nullable();
            $table->string('strength')->nullable();
            $table->string('dosage_form')->nullable();
            $table->boolean('requires_prescription')->default(false);
            $table->longText('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('image_url');
            $table->string('image_path');
            $table->string('image_webp_path')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->string('batch_number');
            $table->date('expiry_date');
            $table->date('manufactured_date')->nullable();
            $table->decimal('purchase_price', 12, 2);
            $table->decimal('selling_price', 12, 2);
            $table->integer('stock_quantity')->default(0);
            $table->integer('reserved_quantity')->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
            $table->unique(['product_id', 'batch_number']);
        });

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('inventory_batches')->cascadeOnDelete();
            $table->string('transaction_type');
            $table->integer('quantity_change');
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('transaction_date');
            $table->timestamps();
        });

        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->timestamps();
            $table->unique(['cart_id', 'product_id']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('address_id')->constrained('user_addresses')->restrictOnDelete();
            $table->string('order_number')->unique();
            $table->timestamp('order_date');
            $table->string('order_status');
            $table->string('payment_method');
            $table->string('payment_status');
            $table->decimal('subtotal_amount', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('delivery_charge', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        Schema::create('order_item_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained('inventory_batches')->restrictOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('prescription_image');
            $table->string('patient_name')->nullable();
            $table->string('doctor_name')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('prescription_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewed_by')->constrained('staffs')->restrictOnDelete();
            $table->string('review_status');
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at');
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('payment_method');
            $table->string('transaction_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('payment_status');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_areas', function (Blueprint $table) {
            $table->id();
            $table->string('area_name');
            $table->string('city');
            $table->decimal('delivery_charge', 12, 2);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('riders', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('phone');
            $table->string('vehicle_type')->nullable();
            $table->string('vehicle_number')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('riders')->nullOnDelete();
            $table->decimal('delivery_charge', 12, 2);
            $table->string('tracking_no')->unique()->nullable();
            $table->string('delivery_status');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_staff_id')->nullable()->constrained('staffs')->nullOnDelete();
            $table->string('subject');
            $table->longText('description');
            $table->string('status')->default('open');
            $table->timestamps();
        });

        Schema::create('ticket_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('replied_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('replied_by_staff_id')->nullable()->constrained('staffs')->nullOnDelete();
            $table->longText('message');
            $table->string('attachment')->nullable();
            $table->timestamps();
        });

        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->nullable()->constrained('order_items')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->longText('reason');
            $table->string('status')->default('requested');
            $table->foreignId('approved_by_staff_id')->nullable()->constrained('staffs')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('return_requests')->cascadeOnDelete();
            $table->decimal('refund_amount', 12, 2);
            $table->string('refund_method');
            $table->string('transaction_id')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('staffs')->cascadeOnDelete();
            $table->string('notification_type');
            $table->string('title');
            $table->longText('message');
            $table->string('channel')->default('in_app');
            $table->string('status')->default('unread');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach ([
            'notifications', 'refunds', 'return_requests', 'ticket_replies', 'support_tickets',
            'deliveries', 'riders', 'delivery_areas', 'payments', 'prescription_reviews',
            'prescriptions', 'order_item_batches', 'order_items', 'orders', 'cart_items', 'carts',
            'inventory_transactions', 'inventory_batches', 'suppliers', 'product_images',
            'products', 'manufacturers', 'categories', 'user_admin_actions',
            'admin_activity_logs', 'staff_sessions', 'user_sessions',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::table('users', fn (Blueprint $table) => $table->dropForeign(['default_address_id']));
        }
        Schema::dropIfExists('staffs');
        Schema::dropIfExists('user_addresses');
    }
};
