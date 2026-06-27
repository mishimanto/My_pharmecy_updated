<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SiteSetting;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OrderMemoService
{
    public function ensureMemo(Order $order, bool $markEmailed = false): Order
    {
        if (! $order->memo_number) {
            $order->forceFill([
                'memo_number' => 'INVOICE-'.now()->format('Ymd').Str::upper(Str::random(3)),
                'memo_generated_at' => now(),
            ])->save();
        }

        if ($markEmailed && ! $order->memo_emailed_at) {
            $order->forceFill(['memo_emailed_at' => now()])->save();
        }

        return $order->fresh();
    }

    public function filename(Order $order): string
    {
        $number = $order->memo_number ?: $order->order_number;

        return str_replace(['/', '\\', ' '], '-', $number).'.pdf';
    }

    public function isAvailableForAdmin(Order $order): bool
    {
        return in_array($order->order_status, ['confirmed', 'processing', 'delivered', 'returned', 'refunded'], true);
    }

    public function isDownloadableByCustomer(Order $order): bool
    {
        if (! $this->isAvailableForAdmin($order)) {
            return false;
        }

        if (strtoupper((string) $order->payment_method) === 'COD') {
            return $order->order_status === 'delivered';
        }

        return true;
    }

    public function pdf(Order $order): string
    {
        $order = $this->ensureMemo($order)
            ->loadMissing('user', 'address', 'deliveryArea', 'items.product', 'payment', 'delivery');

        $settings = SiteSetting::singleton()->toPayload();
        $html = view('pdf.order-memo', [
            'order' => $order,
            'settings' => $settings,
            'logoDataUri' => $this->logoDataUri($settings),
        ])->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        return $dompdf->output();
    }

    private function logoDataUri(array $settings): ?string
    {
        $path = $settings['logo_path'] ?? null;
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $absolutePath = Storage::disk('public')->path($path);
        $mime = mime_content_type($absolutePath) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode(file_get_contents($absolutePath));
    }
}
