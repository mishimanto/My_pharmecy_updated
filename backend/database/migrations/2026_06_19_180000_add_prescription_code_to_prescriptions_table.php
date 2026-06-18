<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('prescriptions', 'prescription_code')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->string('prescription_code')->nullable()->after('id');
            });
        }

        DB::table('prescriptions')
            ->whereNull('prescription_code')
            ->select('id', 'created_at')
            ->orderBy('id')
            ->chunkById(100, function ($prescriptions) {
                foreach ($prescriptions as $prescription) {
                    $date = $prescription->created_at
                        ? Carbon::parse($prescription->created_at)->format('Ymd')
                        : now()->format('Ymd');

                    DB::table('prescriptions')
                        ->where('id', $prescription->id)
                        ->update([
                            'prescription_code' => sprintf('RX-%s-%05d', $date, $prescription->id),
                        ]);
                }
            });

        if (! $this->hasIndex('prescriptions', 'prescriptions_prescription_code_unique')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->unique('prescription_code');
            });
        }
    }

    public function down(): void
    {
        if ($this->hasIndex('prescriptions', 'prescriptions_prescription_code_unique')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropUnique('prescriptions_prescription_code_unique');
            });
        }

        if (Schema::hasColumn('prescriptions', 'prescription_code')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropColumn('prescription_code');
            });
        }
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
