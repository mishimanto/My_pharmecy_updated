<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $order->memo_number }} - Invoice</title>
    <style>
        @page { margin: 30px; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #eef4f2; color: #0f172a; font-family: "DejaVu Sans", sans-serif; font-size: 12px; line-height: 1.55; }
        h1, h2, h3, p { margin: 0; }
        .page { min-height: 100%; background: #eef4f2; }
        .shell { background: #eef4f2; }
        .topbar { height: 7px; background: #0f766e; }
        .header { padding: 26px 28px 40px; border-bottom: 1px solid #cfded9; }
        .brand { display: table; width: 100%; table-layout: fixed; }
        .brand-left, .brand-right { display: table-cell; vertical-align: top; }
        .brand-left { width: 58%; }
        .brand-right { width: 42%; text-align: right; }
        .logo { display: block; max-width: 185px; max-height: 82px; width: auto; height: auto; margin-bottom: 12px; }
        .logo-fallback { display: inline-block; width: 58px; height: 58px; border: 1px solid #b7d4cc; background: #ecfdf5; text-align: center; line-height: 58px; font-size: 24px; font-weight: 700; color: #047857; }
        .brand-name { font-size: 25px; font-weight: 800; letter-spacing: .04em; color: #0f172a; }
        .tagline { margin-top: 4px; color: #64748b; }
        .contact { margin-top: 12px; color: #475569; }
        .invoice-label { display: inline-block; padding: 6px 0; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
        .invoice-title { font-size: 30px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
        .memo-box { display: inline-block; margin-top: 12px; text-align: left; }
        .memo-row { white-space: nowrap; }
        .muted { color: #64748b; }
        .strong { font-weight: 800; color: #0f172a; }
        .content { padding: 24px 28px 28px; }
        .grid { display: table; width: 100%; table-layout: fixed; border-spacing: 0; }
        .col { display: table-cell; width: 50%; vertical-align: top; }
        .gap-right { padding-right: 9px; border-right: 1px solid #e5e7eb;}
        .gap-left { padding-left: 20px; }
        .card { min-height: 118px; }
        .section-label { margin-bottom: 10px; color: #0f766e; font-size: 10px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .customer-name { font-size: 16px; font-weight: 800; }
        .address { margin-top: 7px; color: #475569; }
        .meta-table { width: 100%; border-collapse: collapse; }
        .meta-table td { padding: 4px 0; vertical-align: top; }
        .meta-table td:first-child { width: 40%; color: #64748b; }
        .status-chip { display: inline-block; padding: 3px 7px; background: #eef6f4; color: #0f766e; font-weight: 800; }
        .items { width: 100%; margin-top: 40px; border-collapse: collapse; border: 1px solid #d8e3df; }
        .items th { padding: 11px 10px; background: #0f172a; color: #ffffff; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; }
        .items td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .items tbody tr:nth-child(even) td { background: #f8fafc; }
        .items .right { text-align: right; }
        .medicine { font-weight: 800; color: #0f172a; }
        .medicine-sub { margin-top: 2px; color: #64748b; font-size: 11px; }
        .summary-wrap { display: table; width: 100%; margin-top: 22px; }
        .summary-left, .summary-right { display: table-cell; vertical-align: top; }
        .summary-left { width: 55%; padding-right: 18px; }
        .summary-right { width: 45%; }
        .payment-card { }
        .payment-card p { margin-top: 3px; color: #475569; }
        .totals { width: 100%; border-collapse: collapse; border: 1px solid #d8e3df; }
        .totals td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
        .totals td:last-child { text-align: right; font-weight: 800; }
        .totals .grand td { background: #ecfdf5; color: #064e3b; border-bottom: 0; padding-top: 13px; padding-bottom: 13px; font-size: 16px; font-weight: 900; }
        .note { margin-top: 18px; padding: 12px 14px; border-left: 4px solid #0f766e; background: #f0fdfa; color: #115e59; }
        .footer { position: fixed; bottom: 18px; left: 28px; right: 28px; padding-top: 8px; border-top: 1px solid #cfded9; color: #64748b; font-size: 10px; }
    </style>
</head>
<body>
    @php
        $memoDate = $order->memo_generated_at ? \Illuminate\Support\Carbon::parse($order->memo_generated_at) : now();
        $orderDate = $order->order_date ? \Illuminate\Support\Carbon::parse($order->order_date) : null;
        $paymentMethod = $order->payment_method_label ?: $order->payment_method;
        $isCod = strtoupper((string) $order->payment_method) === 'COD';
    @endphp

    <div class="page">
        <div class="shell">
            <div class="topbar"></div>
            <div class="header">
                <div class="brand">
                    <div class="brand-left">
                        @if($logoDataUri)
                            <img class="logo" src="{{ $logoDataUri }}" alt="{{ $settings['site_name'] ?? 'Store' }}">
                        @else
                            <span class="logo-fallback">{{ strtoupper(substr($settings['site_name'] ?? 'P', 0, 1)) }}</span>
                            <div class="brand-name">{{ $settings['site_name'] ?? 'My Pharmecy' }}</div>
                        @endif
                        <p class="contact">
                            {{ $settings['address'] ?? '' }}<br>
                            {{ $settings['support_phone'] ?? '' }}
                            @if(!empty($settings['support_email']))
                                | {{ $settings['support_email'] }}
                            @endif
                        </p>
                    </div>
                    <div class="brand-right">
                        <div class="invoice-title">Invoice</div>
                        <div class="memo-box">
                            <div class="memo-row"><span class="muted">Inv. No:</span> <span class="strong">{{ $order->memo_number }}</span></div>
                            <div class="memo-row"><span class="muted">Order No:</span> <span class="strong">{{ $order->order_number }}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content">
                <div class="grid">
                    <div class="col gap-right">
                        <div class="card">
                            <div class="section-label">Bill To</div>
                            <p class="customer-name">{{ $order->customer_name ?: 'Customer' }}</p>
                            <p class="address">{{ $order->customer_phone ?: '-' }}</p>
                            {{-- <p class="address">{{ $order->customer_email ?: '-' }}</p> --}}
                            <p class="address">{{ $order->shipping_address ?: '-' }}</p>
                        </div>
                    </div>
                    <div class="col gap-left">
                        <div class="card">
                            <div class="section-label">Order Details</div>
                            <table class="meta-table">
                                <tr><td>Order date</td><td>{{ $orderDate?->format('M d, Y') ?: '-' }}</td></tr>
                                {{-- <tr><td>Status</td><td><span class="status-chip">{{ ucwords(str_replace('_', ' ', $order->order_status)) }}</span></td></tr> --}}
                                <tr><td>Payment</td><td>{{ $paymentMethod }} ({{ ucwords(str_replace('_', ' ', $order->payment_status)) }}) </td></tr>
                                <tr><td>Delivery area</td><td>{{ $order->deliveryArea?->area_name ?: '-' }}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>

                <table class="items">
                    <thead>
                        <tr>
                            <th>Medicine</th>
                            <th>Unit</th>
                            <th class="right">Qty</th>
                            <th class="right">Pieces</th>
                            <th class="right">Unit Price</th>
                            <th class="right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                            <tr>
                                <td>
                                    <div class="medicine">{{ $item->product?->product_name ?: 'Medicine' }}</div>
                                    <div class="medicine-sub">{{ trim(($item->product?->generic_name ?: '').' '.($item->product?->strength ?: '')) }}</div>
                                </td>
                                <td>{{ ucwords(str_replace('_', ' ', $item->purchase_unit ?: 'piece')) }}</td>
                                <td class="right">{{ number_format($item->quantity) }}</td>
                                <td class="right">{{ number_format($item->piece_quantity ?: $item->quantity) }}</td>
                                <td class="right">BDT {{ number_format((float) $item->unit_price) }}</td>
                                <td class="right">BDT {{ number_format((float) $item->subtotal) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

                <div class="summary-wrap">
                    <div class="summary-left">
                        <div class="payment-card">
                            <div class="section-label">Payment Information</div>
                            <p><span class="strong">Method:</span> {{ $paymentMethod }}</p>
                            <p><span class="strong">Status:</span> {{ ucwords(str_replace('_', ' ', $order->payment_status)) }}</p>
                            @if($order->payment?->transaction_id)
                                <p><span class="strong">Transaction ID:</span> {{ $order->payment->transaction_id }}</p>
                            @endif
                        </div>

                        @if($isCod)
                            <div class="note">
                                <span class="strong">Cash on delivery note:</span>
                                Payment is collected when the customer receives the delivery.
                            </div>
                        @endif
                    </div>

                    <div class="summary-right">
                        <table class="totals">
                            <tr><td>Subtotal</td><td>BDT {{ number_format((float) $order->subtotal_amount) }}</td></tr>
                            @if((float) $order->discount_amount > 0)
                                <tr><td>Discount</td><td>-BDT {{ number_format((float) $order->discount_amount) }}</td></tr>
                            @endif
                            <tr><td>Delivery charge</td><td>BDT {{ number_format((float) $order->delivery_charge) }}</td></tr>
                            <tr class="grand"><td>Total</td><td>BDT {{ number_format((float) $order->total_amount) }}</td></tr>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <div class="footer">
        {{ $settings['site_name'] ?? 'My Pharmecy' }} | {{ $settings['address'] ?? '' }} | {{ $settings['support_phone'] ?? '' }}
    </div>
</body>
</html>
