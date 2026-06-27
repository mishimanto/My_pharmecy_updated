<?php

namespace App\Services;

use App\Jobs\SendOrderCommunicationJob;
use App\Models\Order;

class OrderCommunicationService
{
    public function __construct(private OrderMemoService $memo) {}

    public function notify(
        Order $order,
        string $notificationType,
        string $title,
        string $message,
        ?string $emailSubject = null,
        array $emailLines = [],
        bool $attachMemo = false,
    ): void {
        SendOrderCommunicationJob::dispatch(
            $order->id,
            $notificationType,
            $title,
            $message,
            $emailSubject,
            $emailLines,
            $attachMemo,
        )->afterCommit();
    }

    public function ensureMemo(Order $order, bool $markEmailed = false): Order
    {
        return $this->memo->ensureMemo($order, $markEmailed);
    }
}
