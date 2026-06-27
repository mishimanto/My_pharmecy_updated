<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            if (! Schema::hasColumn('notifications', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('read_at');
            }
        });

        Schema::create('staff_notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staffs')->cascadeOnDelete();
            $table->string('notification_type');
            $table->boolean('in_app_enabled')->default(true);
            $table->boolean('email_enabled')->default(true);
            $table->timestamps();
            $table->unique(['staff_id', 'notification_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_notification_preferences');

        Schema::table('notifications', function (Blueprint $table) {
            if (Schema::hasColumn('notifications', 'archived_at')) {
                $table->dropColumn('archived_at');
            }
        });
    }
};
