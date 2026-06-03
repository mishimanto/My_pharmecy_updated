<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;

class TicketReply extends PharmacyModel
{
    protected $appends = ['attachment_url'];

    public function ticket() { return $this->belongsTo(SupportTicket::class, 'ticket_id'); }
    public function customer() { return $this->belongsTo(User::class, 'replied_by_user_id'); }
    public function staff() { return $this->belongsTo(Staff::class, 'replied_by_staff_id'); }

    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment ? Storage::disk('public')->url($this->attachment) : null;
    }
}
