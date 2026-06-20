<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_slides', function (Blueprint $table) {
            $table->id();
            $table->string('eyebrow')->nullable();
            $table->string('eyebrow_bn')->nullable();
            $table->string('title');
            $table->string('title_bn')->nullable();
            $table->string('primary_label')->nullable();
            $table->string('primary_label_bn')->nullable();
            $table->string('primary_url')->nullable();
            $table->string('secondary_label')->nullable();
            $table->string('secondary_label_bn')->nullable();
            $table->string('secondary_url')->nullable();
            $table->string('image_url')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });

        DB::table('hero_slides')->insert([
            [
                'eyebrow' => 'Prescription-aware ordering',
                'eyebrow_bn' => 'প্রেসক্রিপশনসহ নিরাপদ অর্ডার',
                'title' => 'Your trusted online pharmacy in Bangladesh.',
                'title_bn' => 'বাংলাদেশের বিশ্বস্ত অনলাইন ফার্মেসি।',
                'primary_label' => 'Shop medicines',
                'primary_label_bn' => 'ওষুধ দেখুন',
                'primary_url' => '/products',
                'secondary_label' => 'Upload prescription',
                'secondary_label_bn' => 'প্রেসক্রিপশন আপলোড',
                'secondary_url' => '/upload-prescription',
                'image_url' => 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1600&q=80',
                'sort_order' => 1,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'eyebrow' => 'Review and support',
                'eyebrow_bn' => 'রিভিউ ও সহায়তা',
                'title' => 'Prescription upload, review, and delivery in one place.',
                'title_bn' => 'প্রেসক্রিপশন আপলোড, রিভিউ ও ডেলিভারি এক জায়গায়।',
                'primary_label' => 'Shop medicines',
                'primary_label_bn' => 'ওষুধ দেখুন',
                'primary_url' => '/products',
                'secondary_label' => 'Upload prescription',
                'secondary_label_bn' => 'প্রেসক্রিপশন আপলোড',
                'secondary_url' => '/upload-prescription',
                'image_url' => 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1600&q=80',
                'sort_order' => 2,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_slides');
    }
};
