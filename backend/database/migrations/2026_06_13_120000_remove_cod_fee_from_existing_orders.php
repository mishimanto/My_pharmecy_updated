<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $orders = DB::table('orders')
            ->select('id', 'total_amount', 'cod_fee')
            ->where('cod_fee', '>', 0)
            ->get();

        foreach ($orders as $order) {
            $codFee = (float) $order->cod_fee;
            $nextTotal = max(0, (float) $order->total_amount - $codFee);

            DB::table('orders')
                ->where('id', $order->id)
                ->update([
                    'cod_fee' => 0,
                    'total_amount' => $nextTotal,
                ]);

            $payment = DB::table('payments')
                ->select('amount')
                ->where('order_id', $order->id)
                ->first();

            if ($payment) {
                DB::table('payments')
                    ->where('order_id', $order->id)
                    ->update([
                        'amount' => max(0, (float) $payment->amount - $codFee),
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Intentionally left blank. Previous COD fees were removed from stored totals.
    }
};
