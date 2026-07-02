<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name')->default('My Pharmecy');
            $table->string('site_tagline')->nullable();
            $table->string('support_phone')->nullable();
            $table->string('support_email')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('support_hours')->nullable();
            $table->string('whatsapp_number')->nullable();
            $table->string('facebook_url')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('youtube_url')->nullable();
            $table->text('map_embed_url')->nullable();
            $table->text('footer_note')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });

        DB::table('site_settings')->insert([
            'id' => 1,
            'site_name' => 'My Pharmecy',
            'site_tagline' => 'Trusted online pharmacy support',
            'support_phone' => '09610-001122',
            'support_email' => 'support@mypharmecy.test',
            'address' => 'Dhaka service point',
            'city' => 'Dhaka',
            'support_hours' => '8AM to 11PM support',
            'whatsapp_number' => '09610-001122',
            'map_embed_url' => 'https://www.google.com/maps?q=Dhaka%2C%20Bangladesh&z=12&output=embed',
            'footer_note' => 'All rights reserved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
