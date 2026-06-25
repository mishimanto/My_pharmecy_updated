<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendOrderCommunicationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $orderId,
        public string $notificationType,
        public string $title,
        public string $message,
        public ?string $emailSubject = null,
        public array $emailLines = [],
    ) {}

    public function handle(NotificationService $notifications): void
    {
        $order = Order::query()->with('user')->find($this->orderId);
        if (! $order) {
            return;
        }

        if ($order->user_id) {
            $notifications->create([
                'user_id' => $order->user_id,
                'notification_type' => $this->notificationType,
                'title' => $this->title,
                'message' => $this->message,
            ]);
        }

        $email = $order->customer_email;
        if (! $email || ! $this->emailSubject) {
            return;
        }

        $body = $this->buildEmailBody($order);

        try {
            Mail::raw($body, function ($mail) use ($email, $order) {
                $mail->to($email, $order->customer_name ?: 'Customer')
                    ->subject($this->emailSubject);
            });
        } catch (\Throwable $exception) {
            Log::warning('Order email could not be sent from queued job.', [
                'order_id' => $order->id,
                'email' => $email,
                'subject' => $this->emailSubject,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function buildEmailBody(Order $order): string
    {
        $details = [
            'Order number: '.$order->order_number,
            'Current status: '.$order->order_status,
            'Payment status: '.$order->payment_status,
            'Total amount: '.$order->total_amount,
        ];

        if ($order->memo_number) {
            $details[] = 'Memo number: '.$order->memo_number;
        }

        return implode("\n", [
            'Dear '.($order->customer_name ?: 'Customer').',',
            '',
            ...($this->emailLines !== [] ? $this->emailLines : [$this->message]),
            '',
            ...$details,
            '',
            'Thank you for choosing My Pharmecy.',
        ]);
    }
}
