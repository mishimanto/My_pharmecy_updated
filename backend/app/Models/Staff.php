<?php

namespace App\Models;

use App\Notifications\StaffResetPasswordNotification;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['role_id', 'full_name', 'email', 'phone', 'password', 'license_no', 'status', 'last_login_at', 'two_factor_enabled', 'two_factor_code_hash', 'two_factor_expires_at'])]
#[Hidden(['password', 'remember_token'])]
class Staff extends Authenticatable
{
    use HasApiTokens, HasRoles, Notifiable;

    protected $table = 'staffs';

    protected $guard_name = 'staff';

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'two_factor_expires_at' => 'datetime',
        ];
    }

    public function sessions()
    {
        return $this->hasMany(StaffSession::class);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new StaffResetPasswordNotification($token));
    }
}
