<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_popups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_offer_id')->nullable()->constrained('offers')->nullOnDelete();
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
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(false)->index();
            $table->timestamps();
        });

        DB::table('marketing_popups')->insert([
            'label' => 'Weekend care',
            'label_bn' => 'উইকেন্ড কেয়ার',
            'title' => 'Stock up on pharmacy essentials.',
            'title_bn' => 'প্রয়োজনীয় ফার্মেসি পণ্য আগেই সংগ্রহ করুন।',
            'body' => 'Explore active offers and order your daily healthcare products with doorstep delivery.',
            'body_bn' => 'চলমান অফার দেখুন এবং দরজায় ডেলিভারিসহ প্রয়োজনীয় স্বাস্থ্যসেবা পণ্য অর্ডার করুন।',
            'button_label' => 'Explore offers',
            'button_label_bn' => 'অফার দেখুন',
            'link_url' => '/offers',
            'image_url' => 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1400&q=85',
            'ends_at' => now()->addDays(7),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_popups');
    }
};
