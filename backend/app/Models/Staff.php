<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['role_id', 'full_name', 'email', 'phone', 'password', 'license_no', 'status', 'last_login_at'])]
#[Hidden(['password', 'remember_token'])]
class Staff extends Authenticatable
{
    use HasApiTokens, HasRoles;

    protected $table = 'staffs';

    protected $guard_name = 'staff';

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'last_login_at' => 'datetime',
        ];
    }

    public function sessions()
    {
        return $this->hasMany(StaffSession::class);
    }
}
