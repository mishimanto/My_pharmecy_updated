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
            if (! Schema::hasColumn('orders', 'prescription_match_status')) {
                $table->string('prescription_match_status')->nullable()->after('memo_emailed_at');
            }

            if (! Schema::hasColumn('orders', 'prescription_match_note')) {
                $table->text('prescription_match_note')->nullable()->after('prescription_match_status');
            }

            if (! Schema::hasColumn('orders', 'prescription_matched_by_staff_id')) {
                $table->foreignId('prescription_matched_by_staff_id')->nullable()->after('prescription_match_note')->constrained('staffs')->nullOnDelete();
            }

            if (! Schema::hasColumn('orders', 'prescription_matched_at')) {
                $table->timestamp('prescription_matched_at')->nullable()->after('prescription_matched_by_staff_id');
            }
        });

        DB::table('orders')
            ->whereNull('prescription_match_status')
            ->whereExists(function ($query) {
                $query->selectRaw('1')
                    ->from('prescriptions')
                    ->whereColumn('prescriptions.order_id', 'orders.id');
            })
            ->update([
                'prescription_match_status' => 'pending',
                'order_status' => DB::raw("CASE WHEN order_status = 'pending_confirmation' THEN 'prescription_review' ELSE order_status END"),
            ]);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'prescription_matched_at')) {
                $table->dropColumn('prescription_matched_at');
            }

            if (Schema::hasColumn('orders', 'prescription_matched_by_staff_id')) {
                $table->dropConstrainedForeignId('prescription_matched_by_staff_id');
            }

            if (Schema::hasColumn('orders', 'prescription_match_note')) {
                $table->dropColumn('prescription_match_note');
            }

            if (Schema::hasColumn('orders', 'prescription_match_status')) {
                $table->dropColumn('prescription_match_status');
            }
        });
    }
};
