<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'delivery_area_id')) {
                $table->foreignId('delivery_area_id')->nullable()->after('address_id')->constrained('delivery_areas')->nullOnDelete();
            }

            if (! Schema::hasColumn('orders', 'guest_email')) {
                $table->string('guest_email')->nullable()->after('guest_phone');
            }

            if (! Schema::hasColumn('orders', 'cod_fee')) {
                $table->decimal('cod_fee', 12, 2)->default(0)->after('delivery_charge');
            }

            if (! Schema::hasColumn('orders', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('notes');
            }

            if (! Schema::hasColumn('orders', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('admin_note');
            }

            if (! Schema::hasColumn('orders', 'confirmed_at')) {
                $table->timestamp('confirmed_at')->nullable()->after('cancellation_reason');
            }

            if (! Schema::hasColumn('orders', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('confirmed_at');
            }

            if (! Schema::hasColumn('orders', 'confirmed_by_staff_id')) {
                $table->foreignId('confirmed_by_staff_id')->nullable()->after('cancelled_at')->constrained('staffs')->nullOnDelete();
            }

            if (! Schema::hasColumn('orders', 'cancelled_by_staff_id')) {
                $table->foreignId('cancelled_by_staff_id')->nullable()->after('confirmed_by_staff_id')->constrained('staffs')->nullOnDelete();
            }

            if (! Schema::hasColumn('orders', 'memo_number')) {
                $table->string('memo_number')->nullable()->after('cancelled_by_staff_id');
            }

            if (! Schema::hasColumn('orders', 'memo_generated_at')) {
                $table->timestamp('memo_generated_at')->nullable()->after('memo_number');
            }

            if (! Schema::hasColumn('orders', 'memo_emailed_at')) {
                $table->timestamp('memo_emailed_at')->nullable()->after('memo_generated_at');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'payment_proof_path')) {
                $table->string('payment_proof_path')->nullable()->after('transaction_id');
            }

            if (! Schema::hasColumn('payments', 'proof_submitted_at')) {
                $table->timestamp('proof_submitted_at')->nullable()->after('payment_proof_path');
            }

            if (! Schema::hasColumn('payments', 'reviewed_note')) {
                $table->text('reviewed_note')->nullable()->after('payment_status');
            }

            if (! Schema::hasColumn('payments', 'reviewed_by_staff_id')) {
                $table->foreignId('reviewed_by_staff_id')->nullable()->after('reviewed_note')->constrained('staffs')->nullOnDelete();
            }

            if (! Schema::hasColumn('payments', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by_staff_id');
            }
        });

        DB::table('orders')
            ->where('order_status', 'pending')
            ->update(['order_status' => 'pending_confirmation']);

        DB::table('payments')
            ->where('payment_method', '!=', 'COD')
            ->where('payment_status', 'pending')
            ->update(['payment_status' => 'awaiting_proof']);
    }

    public function down(): void
    {
        DB::table('orders')
            ->where('order_status', 'pending_confirmation')
            ->update(['order_status' => 'pending']);

        DB::table('payments')
            ->where('payment_status', 'awaiting_proof')
            ->update(['payment_status' => 'pending']);

        Schema::table('payments', function (Blueprint $table) {
            foreach (['reviewed_at', 'reviewed_by_staff_id', 'reviewed_note', 'proof_submitted_at', 'payment_proof_path'] as $column) {
                if (Schema::hasColumn('payments', $column)) {
                    if ($column === 'reviewed_by_staff_id') {
                        $table->dropConstrainedForeignId($column);
                    } else {
                        $table->dropColumn($column);
                    }
                }
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            foreach ([
                'memo_emailed_at',
                'memo_generated_at',
                'memo_number',
                'cancelled_by_staff_id',
                'confirmed_by_staff_id',
                'cancelled_at',
                'confirmed_at',
                'cancellation_reason',
                'admin_note',
                'cod_fee',
                'guest_email',
                'delivery_area_id',
            ] as $column) {
                if (! Schema::hasColumn('orders', $column)) {
                    continue;
                }

                if (in_array($column, ['delivery_area_id', 'confirmed_by_staff_id', 'cancelled_by_staff_id'], true)) {
                    $table->dropConstrainedForeignId($column);
                } else {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
