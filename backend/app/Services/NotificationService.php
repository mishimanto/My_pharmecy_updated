<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function create(array $data): Notification
    {
        $notification = Notification::create([
            'user_id' => $data['user_id'] ?? null,
            'staff_id' => $data['staff_id'] ?? null,
            'notification_type' => $data['notification_type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'metadata' => $data['metadata'] ?? null,
            'channel' => $data['channel'] ?? 'in_app',
            'status' => $data['status'] ?? 'unread',
            'read_at' => $data['read_at'] ?? null,
        ]);

        if (DB::transactionLevel() > 0) {
            DB::afterCommit(fn () => $this->broadcast($notification->fresh()));
        } else {
            $this->broadcast($notification);
        }

        return $notification;
    }

    private function broadcast(Notification $notification): void
    {
        try {
            broadcast(new NotificationCreated($notification))->toOthers();
        } catch (\Throwable $exception) {
            Log::warning('Realtime notification broadcast skipped.', [
                'notification_id' => $notification->id,
                'notification_type' => $notification->notification_type,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
