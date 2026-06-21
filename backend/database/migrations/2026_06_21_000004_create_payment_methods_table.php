<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payment_methods')) {
            Schema::create('payment_methods', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('label');
                $table->string('label_bn')->nullable();
                $table->string('description')->nullable();
                $table->string('description_bn')->nullable();
                $table->string('number')->nullable();
                $table->string('account_name')->nullable();
                $table->string('dial_code')->nullable();
                $table->string('logo_url')->nullable();
                $table->string('brand_color')->nullable();
                $table->boolean('requires_proof')->default(false);
                $table->boolean('is_active')->default(true)->index();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }

        $methods = [
            [
                'code' => 'COD',
                'label' => 'Cash on delivery',
                'label_bn' => 'Cash on delivery',
                'description' => 'Pay in cash when the order is delivered.',
                'description_bn' => 'Pay in cash when the order is delivered.',
                'number' => null,
                'account_name' => null,
                'dial_code' => null,
                'logo_url' => null,
                'brand_color' => null,
                'requires_proof' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'BKASH',
                'label' => 'bKash',
                'label_bn' => 'bKash',
                'description' => 'Pay the full amount with bKash and submit transaction proof.',
                'description_bn' => 'Pay the full amount with bKash and submit transaction proof.',
                'number' => config('payment.channels.BKASH.number'),
                'account_name' => config('payment.channels.BKASH.account_name'),
                'dial_code' => '*247#',
                'logo_url' => 'https://cdn.brandfetch.io/id_4D40okd/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1773019907118',
                'brand_color' => '#e2136e',
                'requires_proof' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'NAGAD',
                'label' => 'Nagad',
                'label_bn' => 'Nagad',
                'description' => 'Pay the full amount with Nagad and submit transaction proof.',
                'description_bn' => 'Pay the full amount with Nagad and submit transaction proof.',
                'number' => config('payment.channels.NAGAD.number'),
                'account_name' => config('payment.channels.NAGAD.account_name'),
                'dial_code' => '*167#',
                'logo_url' => 'https://cdn.brandfetch.io/idPKXOsXfF/w/512/h/512/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1778051284059',
                'brand_color' => '#f28c16',
                'requires_proof' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($methods as $method) {
            DB::table('payment_methods')->updateOrInsert(
                ['code' => $method['code']],
                [
                    ...$method,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
