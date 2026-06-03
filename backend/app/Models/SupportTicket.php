<?php

namespace App\Models;

class SupportTicket extends PharmacyModel
{
    public function user() { return $this->belongsTo(User::class); }
    public function order() { return $this->belongsTo(Order::class); }
    public function assignedStaff() { return $this->belongsTo(Staff::class, 'assigned_staff_id'); }
    public function replies() { return $this->hasMany(TicketReply::class, 'ticket_id'); }
}
