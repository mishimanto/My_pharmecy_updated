<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_adjustment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained('inventory_batches')->cascadeOnDelete();
            $table->foreignId('requested_by_staff_id')->nullable()->constrained('staffs')->nullOnDelete();
            $table->foreignId('reviewed_by_staff_id')->nullable()->constrained('staffs')->nullOnDelete();
            $table->integer('quantity_change');
            $table->string('reason', 40);
            $table->text('note')->nullable();
            $table->string('status', 30)->default('pending')->index();
            $table->text('review_note')->nullable();
            $table->integer('stock_before')->nullable();
            $table->integer('stock_after')->nullable();
            $table->integer('reserved_quantity_snapshot')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['reason', 'status']);
            $table->index(['batch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustment_requests');
    }
};
