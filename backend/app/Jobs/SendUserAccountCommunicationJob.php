<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendUserAccountCommunicationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ?int $userId,
        public ?string $email,
        public string $fullName,
        public string $notificationType,
        public string $title,
        public string $message,
        public ?string $emailSubject = null,
        public array $emailLines = [],
    ) {}

    public function handle(): void
    {
        if ($this->userId) {
            $user = User::query()->find($this->userId);

            if ($user) {
                DB::table('notifications')->insert([
                    'user_id' => $user->id,
                    'notification_type' => $this->notificationType,
                    'title' => $this->title,
                    'message' => $this->message,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if (! $this->email || ! $this->emailSubject) {
            return;
        }

        $body = implode("\n", [
            'Dear '.($this->fullName ?: 'Customer').',',
            '',
            ...($this->emailLines !== [] ? $this->emailLines : [$this->message]),
            '',
            'Thank you for choosing My Pharmecy.',
        ]);

        try {
            Mail::raw($body, function ($mail) {
                $mail->to($this->email, $this->fullName ?: 'Customer')
                    ->subject($this->emailSubject);
            });
        } catch (\Throwable $exception) {
            Log::warning('User account email could not be sent from queued job.', [
                'user_id' => $this->userId,
                'email' => $this->email,
                'subject' => $this->emailSubject,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
