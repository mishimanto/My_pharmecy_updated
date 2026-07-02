<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->longText('indications')->nullable()->after('description_bn');
            $table->longText('indications_bn')->nullable()->after('indications');
            $table->longText('pharmacology')->nullable()->after('indications_bn');
            $table->longText('pharmacology_bn')->nullable()->after('pharmacology');
            $table->longText('dosage_administration')->nullable()->after('pharmacology_bn');
            $table->longText('dosage_administration_bn')->nullable()->after('dosage_administration');
            $table->longText('interaction_details')->nullable()->after('dosage_administration_bn');
            $table->longText('interaction_details_bn')->nullable()->after('interaction_details');
            $table->longText('contraindications')->nullable()->after('interaction_details_bn');
            $table->longText('contraindications_bn')->nullable()->after('contraindications');
            $table->longText('side_effects')->nullable()->after('contraindications_bn');
            $table->longText('side_effects_bn')->nullable()->after('side_effects');
            $table->longText('pregnancy_lactation')->nullable()->after('side_effects_bn');
            $table->longText('pregnancy_lactation_bn')->nullable()->after('pregnancy_lactation');
            $table->longText('precautions_warnings')->nullable()->after('pregnancy_lactation_bn');
            $table->longText('precautions_warnings_bn')->nullable()->after('precautions_warnings');
            $table->text('therapeutic_class')->nullable()->after('precautions_warnings_bn');
            $table->text('therapeutic_class_bn')->nullable()->after('therapeutic_class');
            $table->text('storage_conditions')->nullable()->after('therapeutic_class_bn');
            $table->text('storage_conditions_bn')->nullable()->after('storage_conditions');
            $table->string('leaflet_url')->nullable()->after('storage_conditions_bn');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'indications',
                'indications_bn',
                'pharmacology',
                'pharmacology_bn',
                'dosage_administration',
                'dosage_administration_bn',
                'interaction_details',
                'interaction_details_bn',
                'contraindications',
                'contraindications_bn',
                'side_effects',
                'side_effects_bn',
                'pregnancy_lactation',
                'pregnancy_lactation_bn',
                'precautions_warnings',
                'precautions_warnings_bn',
                'therapeutic_class',
                'therapeutic_class_bn',
                'storage_conditions',
                'storage_conditions_bn',
                'leaflet_url',
            ]);
        });
    }
};
