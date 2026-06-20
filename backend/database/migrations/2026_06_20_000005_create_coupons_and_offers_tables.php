<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('label')->nullable();
            $table->string('label_bn')->nullable();
            $table->string('type')->default('fixed');
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('min_subtotal', 12, 2)->default(0);
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('label')->nullable();
            $table->string('label_bn')->nullable();
            $table->string('title');
            $table->string('title_bn')->nullable();
            $table->text('body')->nullable();
            $table->text('body_bn')->nullable();
            $table->string('button_label')->nullable();
            $table->string('button_label_bn')->nullable();
            $table->string('link_url')->nullable();
            $table->string('image_url')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });

        DB::table('coupons')->insert([
            'code' => 'WELCOME100',
            'label' => 'Welcome discount',
            'label_bn' => 'স্বাগতম ডিসকাউন্ট',
            'type' => 'fixed',
            'amount' => 100,
            'min_subtotal' => 500,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('offers')->insert([
            'label' => 'Limited offer',
            'label_bn' => 'সীমিত অফার',
            'title' => 'Save more on pharmacy essentials.',
            'title_bn' => 'প্রয়োজনীয় ফার্মেসি পণ্যে সাশ্রয় করুন।',
            'body' => 'Browse active offers and add eligible products to your cart.',
            'body_bn' => 'চলমান অফার দেখুন এবং প্রয়োজনীয় পণ্য কার্টে যোগ করুন।',
            'button_label' => 'Browse medicines',
            'button_label_bn' => 'ওষুধ দেখুন',
            'link_url' => '/products',
            'image_url' => 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1400&q=80',
            'sort_order' => 1,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('offers');
        Schema::dropIfExists('coupons');
    }
};
