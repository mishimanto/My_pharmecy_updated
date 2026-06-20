<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->string('support_hours_bn')->nullable()->after('support_hours');
            $table->text('address_bn')->nullable()->after('address');
            $table->string('city_bn')->nullable()->after('city');
            $table->text('footer_note_bn')->nullable()->after('footer_note');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['support_hours_bn', 'address_bn', 'city_bn', 'footer_note_bn']);
        });
    }
};
