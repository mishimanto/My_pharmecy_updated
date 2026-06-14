<?php

namespace App\Models;

class Order extends PharmacyModel
{
    protected $appends = ['customer_name', 'customer_phone', 'customer_email', 'shipping_address', 'payment_number', 'payment_account_name', 'payment_dial_code'];

    public function items() { return $this->hasMany(OrderItem::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function address() { return $this->belongsTo(UserAddress::class); }
    public function deliveryArea() { return $this->belongsTo(DeliveryArea::class); }
    public function delivery() { return $this->hasOne(Delivery::class); }
    public function payment() { return $this->hasOne(Payment::class); }
    public function prescription() { return $this->hasOne(Prescription::class); }
    public function returns() { return $this->hasMany(ReturnRequest::class); }

    public function getCustomerNameAttribute(): ?string
    {
        return $this->user?->full_name ?: $this->guest_full_name;
    }

    public function getCustomerPhoneAttribute(): ?string
    {
        return $this->user?->phone ?: $this->guest_phone;
    }

    public function getCustomerEmailAttribute(): ?string
    {
        return $this->user?->email ?: $this->guest_email;
    }

    public function getShippingAddressAttribute(): ?string
    {
        if ($this->relationLoaded('address') && $this->address) {
            return implode(', ', array_filter([
                $this->address->address_line_1,
                $this->address->address_line_2,
                $this->address->area,
                $this->address->city,
                $this->address->postal_code,
            ]));
        }

        return implode(', ', array_filter([
            $this->guest_address_line_1,
            $this->guest_address_line_2,
            $this->guest_area,
            $this->guest_city,
            $this->guest_postal_code,
        ])) ?: null;
    }

    public function getPaymentNumberAttribute(): ?string
    {
        return config("payment.channels.{$this->payment_method}.number");
    }

    public function getPaymentAccountNameAttribute(): ?string
    {
        return config("payment.channels.{$this->payment_method}.account_name");
    }

    public function getPaymentDialCodeAttribute(): ?string
    {
        return config("payment.channels.{$this->payment_method}.dial_code");
    }
}
