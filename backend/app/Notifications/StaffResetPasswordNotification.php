<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class StaffResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://127.0.0.1:5173'), '/');
        $resetUrl = $frontendUrl.'/admin/reset-password?token='.urlencode($this->token).'&email='.urlencode($notifiable->getEmailForPasswordReset());
        $expireMinutes = config('auth.passwords.staffs.expire');

        return (new MailMessage)
            ->subject('Reset your My Pharmecy admin password')
            ->greeting('Hello!')
            ->line('We received a request to reset your My Pharmecy admin account password.')
            ->action('Reset password', $resetUrl)
            ->line("This password reset link will expire in {$expireMinutes} minutes.")
            ->line('If you did not request a password reset, no further action is required.');
    }
}
