<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_alternatives')) {
            Schema::create('product_alternatives', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->foreignId('alternative_product_id')->constrained('products')->cascadeOnDelete();
                $table->text('note')->nullable();
                $table->timestamps();
                $table->unique(['product_id', 'alternative_product_id'], 'product_alt_unique');
            });
        }

        if (! Schema::hasTable('drug_interactions')) {
            Schema::create('drug_interactions', function (Blueprint $table) {
                $table->id();
                $table->string('generic_name');
                $table->string('interacts_with_generic_name');
                $table->string('severity')->default('moderate');
                $table->text('warning')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->unique(['generic_name', 'interacts_with_generic_name'], 'drug_interactions_pair_unique');
            });
        } elseif (! $this->hasIndex('drug_interactions', 'drug_interactions_pair_unique')) {
            Schema::table('drug_interactions', function (Blueprint $table) {
                $table->unique(['generic_name', 'interacts_with_generic_name'], 'drug_interactions_pair_unique');
            });
        }

        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'description_draft')) {
                $table->longText('description_draft')->nullable()->after('description_bn');
            }

            if (! Schema::hasColumn('products', 'description_bn_draft')) {
                $table->longText('description_bn_draft')->nullable()->after('description_draft');
            }

            if (! Schema::hasColumn('products', 'description_draft_status')) {
                $table->string('description_draft_status')->nullable()->after('description_bn_draft');
            }

            if (! Schema::hasColumn('products', 'description_generated_at')) {
                $table->timestamp('description_generated_at')->nullable()->after('description_draft_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            foreach (['description_draft', 'description_bn_draft', 'description_draft_status', 'description_generated_at'] as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('drug_interactions');
        Schema::dropIfExists('product_alternatives');
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return false;
        }

        return collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->contains(fn ($index) => $index->Key_name === $indexName);
    }
};
