<?php

namespace App\Services;

use App\Jobs\SendOrderCommunicationJob;
use App\Models\Order;
use Illuminate\Support\Str;

class OrderCommunicationService
{
    public function notify(
        Order $order,
        string $notificationType,
        string $title,
        string $message,
        ?string $emailSubject = null,
        array $emailLines = [],
    ): void {
        SendOrderCommunicationJob::dispatch(
            $order->id,
            $notificationType,
            $title,
            $message,
            $emailSubject,
            $emailLines,
        )->afterCommit();
    }

    public function ensureMemo(Order $order, bool $markEmailed = false): Order
    {
        if (! $order->memo_number) {
            $order->forceFill([
                'memo_number' => 'MEMO-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
                'memo_generated_at' => now(),
            ])->save();
        }

        if ($markEmailed && ! $order->memo_emailed_at) {
            $order->forceFill(['memo_emailed_at' => now()])->save();
        }

        return $order->fresh();
    }
}
