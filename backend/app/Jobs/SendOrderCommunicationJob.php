<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\NotificationService;
use App\Services\OrderMemoService;
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
        public bool $attachMemo = false,
    ) {}

    public function handle(NotificationService $notifications, OrderMemoService $memo): void
    {
        $order = Order::query()->with('user', 'address', 'deliveryArea', 'items.product', 'payment', 'delivery')->find($this->orderId);
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
            $memoPdf = $this->attachMemo ? $memo->pdf($order) : null;

            Mail::raw($body, function ($mail) use ($email, $order, $memo, $memoPdf) {
                $mail->to($email, $order->customer_name ?: 'Customer')
                    ->subject($this->emailSubject);

                if ($memoPdf) {
                    $mail->attachData($memoPdf, $memo->filename($order), ['mime' => 'application/pdf']);
                }
            });

            if ($this->attachMemo) {
                $memo->ensureMemo($order, true);
            }
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
        $summary = [
            'Order number: '.$order->order_number,
            'Order status: '.$this->label($order->order_status),
            'Payment status: '.$this->label($order->payment_status),
            'Payment method: '.($order->payment_method_label ?: $order->payment_method ?: '-'),
            'Total amount: BDT '.number_format((float) $order->total_amount),
        ];

        if ($this->attachMemo && $order->memo_number) {
            $summary[] = 'Invoice number: '.$order->memo_number;
        }

        $lines = $this->emailLines !== [] ? $this->emailLines : [$this->message];

        return implode("\n", [
            'Dear '.($order->customer_name ?: 'Customer').',',
            '',
            ...$lines,
            '',
            'Order summary',
            '-------------',
            ...$summary,
            '',
            $this->attachMemo
                ? 'Your invoice PDF is attached with this email for your records.'
                : 'You can check the latest order status from your account or tracking page.',
            '',
            'If you need any help, reply to this email or contact our support team.',
            '',
            'Thank you for choosing My Pharmecy.',
            'My Pharmecy Team',
        ]);
    }

    private function label(?string $value): string
    {
        return $value ? ucwords(str_replace('_', ' ', $value)) : '-';
    }
}
