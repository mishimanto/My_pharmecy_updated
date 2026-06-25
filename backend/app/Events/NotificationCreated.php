<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public Notification $notification) {}

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastOn(): array
    {
        $channels = [];

        if ($this->notification->user_id) {
            $channels[] = new PrivateChannel('customer.notifications.'.$this->notification->user_id);
        }

        if ($this->notification->staff_id) {
            $channels[] = new PrivateChannel('staff.notifications.'.$this->notification->staff_id);
        }

        if (! $this->notification->user_id) {
            $channels[] = new PrivateChannel('staff.notifications');
        }

        return $channels;
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id' => $this->notification->id,
                'user_id' => $this->notification->user_id,
                'staff_id' => $this->notification->staff_id,
                'notification_type' => $this->notification->notification_type,
                'title' => $this->notification->title,
                'message' => $this->notification->message,
                'metadata' => $this->notification->metadata,
                'channel' => $this->notification->channel,
                'status' => $this->notification->status,
                'read_at' => $this->notification->read_at,
                'created_at' => $this->notification->created_at,
                'updated_at' => $this->notification->updated_at,
            ],
        ];
    }
}
