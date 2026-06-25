<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('customer.notifications.{id}', function ($user, $id) {
    return $user instanceof \App\Models\User
        && $user->tokenCan('customer')
        && $user->status === 'active'
        && (int) $user->id === (int) $id;
});

Broadcast::channel('staff.notifications.{id}', function ($staff, $id) {
    return $staff instanceof \App\Models\Staff
        && $staff->tokenCan('staff')
        && $staff->status === 'active'
        && (int) $staff->id === (int) $id;
});

Broadcast::channel('staff.notifications', function ($staff) {
    return $staff instanceof \App\Models\Staff
        && $staff->tokenCan('staff')
        && $staff->status === 'active';
});
