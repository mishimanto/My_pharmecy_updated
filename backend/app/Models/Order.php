<?php

namespace App\Models;

class Order extends PharmacyModel
{
    use Concerns\RoundsCurrencyAttributes;

    protected static array $paymentMethodCache = [];

    protected $appends = ['customer_name', 'customer_phone', 'customer_email', 'shipping_address', 'payment_number', 'payment_account_name', 'payment_dial_code', 'payment_method_label', 'payment_method_logo_url', 'payment_method_brand_color', 'payment_requires_proof'];

    protected function roundedCurrencyAttributes(): array
    {
        return ['subtotal_amount', 'discount_amount', 'delivery_charge', 'total_amount', 'cod_fee'];
    }

    public function items() { return $this->hasMany(OrderItem::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function address() { return $this->belongsTo(UserAddress::class); }
    public function deliveryArea() { return $this->belongsTo(DeliveryArea::class); }
    public function delivery() { return $this->hasOne(Delivery::class); }
    public function payment() { return $this->hasOne(Payment::class); }
    public function paymentMethod() { return $this->belongsTo(PaymentMethod::class, 'payment_method', 'code'); }
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
        return $this->paymentMethodValue('number')
            ?: config("payment.channels.{$this->payment_method}.number");
    }

    public function getPaymentAccountNameAttribute(): ?string
    {
        return $this->paymentMethodValue('account_name')
            ?: config("payment.channels.{$this->payment_method}.account_name");
    }

    public function getPaymentDialCodeAttribute(): ?string
    {
        return $this->paymentMethodValue('dial_code')
            ?: config("payment.channels.{$this->payment_method}.dial_code");
    }

    public function getPaymentMethodLabelAttribute(): ?string
    {
        return $this->paymentMethodValue('label')
            ?: config("payment.channels.{$this->payment_method}.label")
            ?: $this->payment_method;
    }

    public function getPaymentMethodLogoUrlAttribute(): ?string
    {
        return $this->paymentMethodValue('logo_url');
    }

    public function getPaymentMethodBrandColorAttribute(): ?string
    {
        return $this->paymentMethodValue('brand_color');
    }

    public function getPaymentRequiresProofAttribute(): bool
    {
        $requiresProof = $this->paymentMethodValue('requires_proof');

        return $requiresProof === null ? $this->payment_method !== 'COD' : (bool) $requiresProof;
    }

    private function paymentMethodValue(string $key): mixed
    {
        if (! $this->payment_method) {
            return null;
        }

        if (! array_key_exists($this->payment_method, self::$paymentMethodCache)) {
            self::$paymentMethodCache[$this->payment_method] = PaymentMethod::query()
                ->where('code', $this->payment_method)
                ->first()
                ?->toArray();
        }

        return self::$paymentMethodCache[$this->payment_method][$key] ?? null;
    }
}
