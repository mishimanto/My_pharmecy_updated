<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staffs', function (Blueprint $table) {
            if (! Schema::hasColumn('staffs', 'two_factor_enabled')) {
                $table->boolean('two_factor_enabled')->default(false)->after('last_login_at');
            }

            if (! Schema::hasColumn('staffs', 'two_factor_code_hash')) {
                $table->string('two_factor_code_hash')->nullable()->after('two_factor_enabled');
            }

            if (! Schema::hasColumn('staffs', 'two_factor_expires_at')) {
                $table->timestamp('two_factor_expires_at')->nullable()->after('two_factor_code_hash');
            }
        });

        Schema::table('staff_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('staff_sessions', 'personal_access_token_id')) {
                $table->unsignedBigInteger('personal_access_token_id')->nullable()->after('device_token')->index();
            }
        });

        Schema::table('user_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('user_sessions', 'personal_access_token_id')) {
                $table->unsignedBigInteger('personal_access_token_id')->nullable()->after('device_token')->index();
            }
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            if (! Schema::hasColumn('personal_access_tokens', 'password_confirmed_at')) {
                $table->timestamp('password_confirmed_at')->nullable()->after('last_used_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            if (Schema::hasColumn('personal_access_tokens', 'password_confirmed_at')) {
                $table->dropColumn('password_confirmed_at');
            }
        });

        Schema::table('user_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('user_sessions', 'personal_access_token_id')) {
                $table->dropColumn('personal_access_token_id');
            }
        });

        Schema::table('staff_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('staff_sessions', 'personal_access_token_id')) {
                $table->dropColumn('personal_access_token_id');
            }
        });

        Schema::table('staffs', function (Blueprint $table) {
            foreach (['two_factor_expires_at', 'two_factor_code_hash', 'two_factor_enabled'] as $column) {
                if (Schema::hasColumn('staffs', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
