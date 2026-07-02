<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
            $table->string('type')->index();
            $table->unsignedInteger('points');
            $table->string('title')->nullable();
            $table->string('title_bn')->nullable();
            $table->string('description')->nullable();
            $table->string('description_bn')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['type', 'order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_transactions');
    }
};
