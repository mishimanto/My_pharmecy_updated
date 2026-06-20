<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banner_images', function (Blueprint $table) {
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
            $table->string('placement')->default('homepage')->index();
            $table->string('image_url')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });

        DB::table('banner_images')->insert([
            [
                'label' => 'Prescription support',
                'label_bn' => 'প্রেসক্রিপশন সহায়তা',
                'title' => 'Upload prescriptions and order reviewed medicines.',
                'title_bn' => 'প্রেসক্রিপশন আপলোড করে রিভিউ করা ওষুধ অর্ডার করুন।',
                'body' => 'Keep your prescription ready and let the pharmacy team review it before checkout.',
                'body_bn' => 'চেকআউটের আগে ফার্মেসি টিম রিভিউ করার জন্য প্রেসক্রিপশন জমা দিন।',
                'button_label' => 'Upload prescription',
                'button_label_bn' => 'প্রেসক্রিপশন আপলোড',
                'link_url' => '/upload-prescription',
                'placement' => 'homepage',
                'image_url' => 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1400&q=80',
                'sort_order' => 1,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('banner_images');
    }
};
