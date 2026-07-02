<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\CustomerResetPasswordNotification;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['full_name', 'phone', 'email', 'password', 'date_of_birth', 'gender', 'default_address_id', 'status', 'social_provider', 'social_provider_id', 'avatar'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function addresses()
    {
        return $this->hasMany(UserAddress::class);
    }

    public function defaultAddress()
    {
        return $this->belongsTo(UserAddress::class, 'default_address_id');
    }

    public function sessions()
    {
        return $this->hasMany(UserSession::class);
    }

    public function supportTickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function returnRequests()
    {
        return $this->hasMany(ReturnRequest::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function rewardTransactions()
    {
        return $this->hasMany(RewardTransaction::class);
    }

    public function rewardCoupons()
    {
        return $this->hasMany(Coupon::class);
    }

    public function getAvatarAttribute($value): ?string
    {
        if (blank($value)) {
            return null;
        }

        return str_starts_with($value, 'http') ? $value : url(Storage::disk('public')->url($value));
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new CustomerResetPasswordNotification($token));
    }
}
