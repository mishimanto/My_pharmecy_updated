<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminTwoFactorCodeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $code)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your admin verification code')
            ->view('emails.admin-two-factor-code', [
                'appName' => config('app.name', 'Pharmacy Admin'),
                'code' => $this->code,
                'expiresIn' => '10 minutes',
                'recipientName' => $notifiable->full_name ?? 'Admin',
            ]);
    }
}
