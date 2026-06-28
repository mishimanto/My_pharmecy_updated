<?php

namespace App\Services;

use App\Models\SiteSetting;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminReportService
{
    public const TYPES = ['sales', 'orders', 'inventory', 'profit', 'payments', 'prescriptions', 'deliveries', 'refunds'];

    public function generate(string $type, array $filters = []): array
    {
        return match ($type) {
            'sales' => $this->sales($filters),
            'orders' => $this->orders($filters),
            'inventory' => $this->inventory(),
            'profit' => $this->profit($filters),
            'payments' => $this->payments($filters),
            'prescriptions' => $this->prescriptions($filters),
            'deliveries' => $this->deliveries($filters),
            'refunds' => $this->refunds($filters),
            default => abort(404, 'Report not found.'),
        };
    }

    public function pdf(string $type, array $filters = []): string
    {
        $report = $this->generate($type, $filters);
        $settings = SiteSetting::singleton()->toPayload();
        $html = view('pdf.admin-report', [
            'title' => $this->title($type),
            'filters' => $filters,
            'report' => $report,
            'settings' => $settings,
        ])->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return $dompdf->output();
    }

    public function filename(string $type, string $extension = 'pdf'): string
    {
        return str_replace('_', '-', $type).'-report-'.now()->format('Ymd-His').'.'.$extension;
    }

    public function title(string $type): string
    {
        return match ($type) {
            'sales' => 'Sales Report',
            'orders' => 'Order Report',
            'inventory' => 'Inventory Report',
            'profit' => 'Profit Report',
            'payments' => 'Payment Report',
            'prescriptions' => 'Prescription Report',
            'deliveries' => 'Delivery Report',
            'refunds' => 'Refund Report',
            default => 'Report',
        };
    }

    private function sales(array $filters): array
    {
        $paidPayments = $this->dateRange(
            DB::table('payments')->where('payment_status', 'paid')->whereNotNull('paid_at'),
            $filters,
            'paid_at'
        );

        $orders = $this->dateRange(DB::table('orders'), $filters, 'order_date');

        $soldItems = $this->dateRange(
            DB::table('order_items')
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->join('categories', 'categories.id', '=', 'products.category_id')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->whereNotIn('orders.order_status', ['cancelled']),
            $filters,
            'orders.order_date'
        );

        return $this->report([
            'Paid Revenue' => (clone $paidPayments)->sum('amount'),
            'Paid Payments' => (clone $paidPayments)->count(),
            'Orders' => (clone $orders)->count(),
            'Average Order Value' => (clone $orders)->avg('total_amount') ?: 0,
        ], [
            'daily_sales' => (clone $paidPayments)
                ->selectRaw('DATE(paid_at) as date, SUM(amount) as revenue, COUNT(*) as payments')
                ->groupByRaw('DATE(paid_at)')
                ->orderByDesc('date')
                ->limit(31)
                ->get(),
            'monthly_sales' => (clone $paidPayments)
                ->selectRaw($this->monthExpression('paid_at') . ' as month, SUM(amount) as revenue, COUNT(*) as payments')
                ->groupByRaw($this->monthExpression('paid_at'))
                ->orderByDesc('month')
                ->limit(12)
                ->get(),
            'top_selling_medicines' => (clone $soldItems)
                ->select(
                    'products.id',
                    'products.product_name',
                    DB::raw('SUM(order_items.piece_quantity) as quantity_sold'),
                    DB::raw('SUM(order_items.subtotal) as sales_amount')
                )
                ->groupBy('products.id', 'products.product_name')
                ->orderByDesc('quantity_sold')
                ->limit(15)
                ->get(),
            'sales_by_category' => (clone $soldItems)
                ->select(
                    'categories.id',
                    'categories.category_name',
                    DB::raw('SUM(order_items.piece_quantity) as quantity_sold'),
                    DB::raw('SUM(order_items.subtotal) as sales_amount')
                )
                ->groupBy('categories.id', 'categories.category_name')
                ->orderByDesc('sales_amount')
                ->limit(25)
                ->get(),
        ], 'Sales report generated successfully.');
    }

    private function orders(array $filters): array
    {
        $orders = $this->dateRange(DB::table('orders'), $filters, 'order_date');

        return $this->report([
            'Total Orders' => (clone $orders)->count(),
            'Today Orders' => DB::table('orders')->whereBetween('order_date', [now()->startOfDay(), now()->endOfDay()])->count(),
            'Order Amount' => (clone $orders)->sum('total_amount'),
            'Pending Orders' => (clone $orders)->whereIn('order_status', ['pending', 'pending_confirmation'])->count(),
        ], [
            'status_report' => (clone $orders)
                ->select('order_status', DB::raw('COUNT(*) as total'), DB::raw('SUM(total_amount) as amount'))
                ->groupBy('order_status')
                ->orderByDesc('total')
                ->get(),
            'payment_status_report' => (clone $orders)
                ->select('payment_status', DB::raw('COUNT(*) as total'), DB::raw('SUM(total_amount) as amount'))
                ->groupBy('payment_status')
                ->orderByDesc('total')
                ->get(),
            'recent_orders' => $this->dateRange(\App\Models\Order::query()->with('user'), $filters, 'order_date')
                ->latest('order_date')
                ->limit(20)
                ->get()
                ->map(fn ($order) => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => $order->user?->full_name,
                    'order_status' => $order->order_status,
                    'payment_status' => $order->payment_status,
                    'total_amount' => $order->total_amount,
                    'order_date' => $order->order_date,
                ]),
        ], 'Order report generated successfully.');
    }

    private function inventory(): array
    {
        $batches = DB::table('inventory_batches')->join('products', 'products.id', '=', 'inventory_batches.product_id');

        return $this->report([
            'Active Batches' => DB::table('inventory_batches')->where('status', 'active')->count(),
            'Available Stock' => DB::table('inventory_batches')->selectRaw('SUM(stock_quantity - reserved_quantity) as total')->value('total') ?: 0,
            'Low Stock Batches' => (clone $batches)->whereRaw('(stock_quantity - reserved_quantity) <= 10')->count(),
            'Near Expiry Batches' => DB::table('inventory_batches')
                ->where('status', 'active')
                ->where('expiry_date', '>', now()->toDateString())
                ->where('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->count(),
        ], [
            'low_stock' => DB::table('inventory_batches')
                ->join('products', 'products.id', '=', 'inventory_batches.product_id')
                ->select('inventory_batches.id', 'inventory_batches.batch_number', 'products.product_name', 'inventory_batches.expiry_date', 'inventory_batches.stock_quantity', 'inventory_batches.reserved_quantity', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
                ->whereRaw('(stock_quantity - reserved_quantity) <= 10')
                ->orderBy('available_stock')
                ->limit(50)
                ->get(),
            'near_expiry' => DB::table('inventory_batches')
                ->join('products', 'products.id', '=', 'inventory_batches.product_id')
                ->select('inventory_batches.id', 'inventory_batches.batch_number', 'products.product_name', 'inventory_batches.expiry_date', 'inventory_batches.stock_quantity', 'inventory_batches.reserved_quantity', DB::raw('(stock_quantity - reserved_quantity) as available_stock'))
                ->where('inventory_batches.status', 'active')
                ->where('expiry_date', '>', now()->toDateString())
                ->where('expiry_date', '<=', now()->addDays(30)->toDateString())
                ->orderBy('expiry_date')
                ->limit(50)
                ->get(),
            'stock_value' => DB::table('inventory_batches')
                ->join('products', 'products.id', '=', 'inventory_batches.product_id')
                ->select(
                    'products.product_name',
                    DB::raw('SUM(stock_quantity - reserved_quantity) as available_stock'),
                    DB::raw('SUM((stock_quantity - reserved_quantity) * purchase_price) as stock_cost'),
                    DB::raw('SUM((stock_quantity - reserved_quantity) * selling_price) as stock_value'),
                    DB::raw('SUM((stock_quantity - reserved_quantity) * (selling_price - purchase_price)) as potential_profit')
                )
                ->groupBy('products.id', 'products.product_name')
                ->orderByDesc('stock_value')
                ->limit(25)
                ->get(),
        ], 'Inventory report generated successfully.');
    }

    private function profit(array $filters): array
    {
        $profitRows = $this->profitBase($filters);

        $summary = DB::query()
            ->fromSub((clone $profitRows)->selectRaw('order_item_batches.subtotal as sales_amount, order_item_batches.quantity * inventory_batches.purchase_price as purchase_cost'), 'profit_rows')
            ->selectRaw('SUM(sales_amount) as revenue, SUM(purchase_cost) as purchase_cost, SUM(sales_amount - purchase_cost) as gross_profit')
            ->first();

        $revenue = (float) ($summary->revenue ?? 0);
        $grossProfit = (float) ($summary->gross_profit ?? 0);

        return $this->report([
            'Sales Revenue' => $revenue,
            'Purchase Cost' => (float) ($summary->purchase_cost ?? 0),
            'Gross Profit' => $grossProfit,
            'Profit Margin %' => $revenue > 0 ? ($grossProfit / $revenue) * 100 : 0,
        ], [
            'profit_by_product' => (clone $profitRows)
                ->select(
                    'products.id',
                    'products.product_name',
                    'categories.category_name',
                    DB::raw('SUM(order_item_batches.quantity) as quantity_sold'),
                    DB::raw('SUM(order_item_batches.subtotal) as sales_amount'),
                    DB::raw('SUM(order_item_batches.quantity * inventory_batches.purchase_price) as purchase_cost'),
                    DB::raw('SUM(order_item_batches.subtotal - (order_item_batches.quantity * inventory_batches.purchase_price)) as gross_profit'),
                    DB::raw('CASE WHEN SUM(order_item_batches.subtotal) > 0 THEN (SUM(order_item_batches.subtotal - (order_item_batches.quantity * inventory_batches.purchase_price)) / SUM(order_item_batches.subtotal)) * 100 ELSE 0 END as margin_percent')
                )
                ->groupBy('products.id', 'products.product_name', 'categories.category_name')
                ->orderByDesc('gross_profit')
                ->limit(50)
                ->get(),
            'profit_by_category' => (clone $profitRows)
                ->select(
                    'categories.id',
                    'categories.category_name',
                    DB::raw('SUM(order_item_batches.quantity) as quantity_sold'),
                    DB::raw('SUM(order_item_batches.subtotal) as sales_amount'),
                    DB::raw('SUM(order_item_batches.quantity * inventory_batches.purchase_price) as purchase_cost'),
                    DB::raw('SUM(order_item_batches.subtotal - (order_item_batches.quantity * inventory_batches.purchase_price)) as gross_profit'),
                    DB::raw('CASE WHEN SUM(order_item_batches.subtotal) > 0 THEN (SUM(order_item_batches.subtotal - (order_item_batches.quantity * inventory_batches.purchase_price)) / SUM(order_item_batches.subtotal)) * 100 ELSE 0 END as margin_percent')
                )
                ->groupBy('categories.id', 'categories.category_name')
                ->orderByDesc('gross_profit')
                ->limit(25)
                ->get(),
            'daily_profit' => (clone $profitRows)
                ->selectRaw('DATE(orders.order_date) as date, SUM(order_item_batches.subtotal) as sales_amount, SUM(order_item_batches.quantity * inventory_batches.purchase_price) as purchase_cost, SUM(order_item_batches.subtotal - (order_item_batches.quantity * inventory_batches.purchase_price)) as gross_profit')
                ->groupByRaw('DATE(orders.order_date)')
                ->orderByDesc('date')
                ->limit(31)
                ->get(),
        ], 'Profit report generated successfully.');
    }

    private function payments(array $filters): array
    {
        $payments = $this->dateRange(DB::table('payments'), $filters, 'payments.created_at');
        $paidPayments = (clone $payments)->where('payment_status', 'paid');

        return $this->report([
            'Total Payments' => (clone $payments)->count(),
            'Paid Amount' => (clone $paidPayments)->sum('amount'),
            'Pending Payments' => (clone $payments)->where('payment_status', 'pending')->count(),
            'Failed Payments' => (clone $payments)->whereIn('payment_status', ['failed', 'rejected'])->count(),
        ], [
            'status_report' => (clone $payments)
                ->select('payment_status', DB::raw('COUNT(*) as total'), DB::raw('SUM(amount) as amount'))
                ->groupBy('payment_status')
                ->orderByDesc('total')
                ->get(),
            'method_report' => (clone $payments)
                ->select('payment_method', DB::raw('COUNT(*) as total'), DB::raw('SUM(amount) as amount'))
                ->groupBy('payment_method')
                ->orderByDesc('total')
                ->get(),
            'recent_payments' => (clone $payments)
                ->leftJoin('orders', 'orders.id', '=', 'payments.order_id')
                ->select('payments.id', 'orders.order_number', 'payments.payment_method', 'payments.transaction_id', 'payments.amount', 'payments.payment_status', 'payments.paid_at', 'payments.created_at')
                ->orderByDesc('payments.created_at')
                ->limit(20)
                ->get(),
        ], 'Payment report generated successfully.');
    }

    private function prescriptions(array $filters): array
    {
        $prescriptions = $this->dateRange(DB::table('prescriptions'), $filters, 'prescriptions.created_at');
        $reviews = $this->dateRange(DB::table('prescription_reviews'), $filters, 'prescription_reviews.reviewed_at');

        return $this->report([
            'Total Prescriptions' => (clone $prescriptions)->count(),
            'Pending Prescriptions' => (clone $prescriptions)->where('status', 'pending')->count(),
            'Reviewed Prescriptions' => (clone $reviews)->count(),
            'Approved Reviews' => (clone $reviews)->where('review_status', 'approved')->count(),
        ], [
            'status_report' => (clone $prescriptions)
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->orderByDesc('total')
                ->get(),
            'review_report' => (clone $reviews)
                ->select('review_status', DB::raw('COUNT(*) as total'))
                ->groupBy('review_status')
                ->orderByDesc('total')
                ->get(),
            'recent_reviews' => $this->dateRange(\App\Models\PrescriptionReview::query()->with('prescription.user'), $filters, 'reviewed_at')
                ->latest('reviewed_at')
                ->limit(20)
                ->get()
                ->map(fn ($review) => [
                    'id' => $review->id,
                    'prescription_id' => $review->prescription_id,
                    'customer' => $review->prescription?->user?->full_name,
                    'patient_name' => $review->prescription?->patient_name,
                    'review_status' => $review->review_status,
                    'reviewed_at' => $review->reviewed_at,
                ]),
        ], 'Prescription report generated successfully.');
    }

    private function deliveries(array $filters): array
    {
        $deliveries = $this->dateRange(DB::table('deliveries'), $filters, 'deliveries.created_at');

        return $this->report([
            'Total Deliveries' => (clone $deliveries)->count(),
            'Assigned Deliveries' => (clone $deliveries)->whereNotNull('rider_id')->count(),
            'Delivered' => (clone $deliveries)->where('delivery_status', 'delivered')->count(),
            'Delivery Charge' => (clone $deliveries)->sum('delivery_charge'),
        ], [
            'status_report' => (clone $deliveries)
                ->select('delivery_status', DB::raw('COUNT(*) as total'))
                ->groupBy('delivery_status')
                ->orderByDesc('total')
                ->get(),
            'rider_report' => (clone $deliveries)
                ->leftJoin('riders', 'riders.id', '=', 'deliveries.rider_id')
                ->select(
                    DB::raw("COALESCE(riders.full_name, 'Unassigned') as rider"),
                    DB::raw('COUNT(deliveries.id) as total'),
                    DB::raw("SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered")
                )
                ->groupBy('riders.full_name')
                ->orderByDesc('total')
                ->get(),
            'recent_deliveries' => (clone $deliveries)
                ->leftJoin('orders', 'orders.id', '=', 'deliveries.order_id')
                ->leftJoin('riders', 'riders.id', '=', 'deliveries.rider_id')
                ->select('deliveries.id', 'orders.order_number', 'riders.full_name as rider', 'deliveries.tracking_no', 'deliveries.delivery_status', 'deliveries.delivery_charge', 'deliveries.created_at')
                ->orderByDesc('deliveries.created_at')
                ->limit(20)
                ->get(),
        ], 'Delivery report generated successfully.');
    }

    private function refunds(array $filters): array
    {
        $refunds = $this->dateRange(DB::table('refunds'), $filters, 'refunds.created_at');
        $returns = $this->dateRange(DB::table('return_requests'), $filters, 'return_requests.created_at');

        return $this->report([
            'Total Refunds' => (clone $refunds)->count(),
            'Refund Amount' => (clone $refunds)->sum('refund_amount'),
            'Pending Refunds' => (clone $refunds)->where('status', 'pending')->count(),
            'Return Requests' => (clone $returns)->count(),
        ], [
            'status_report' => (clone $refunds)
                ->select('status', DB::raw('COUNT(*) as total'), DB::raw('SUM(refund_amount) as amount'))
                ->groupBy('status')
                ->orderByDesc('total')
                ->get(),
            'return_status_report' => (clone $returns)
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->orderByDesc('total')
                ->get(),
            'recent_refunds' => (clone $refunds)
                ->leftJoin('return_requests', 'return_requests.id', '=', 'refunds.return_id')
                ->leftJoin('orders', 'orders.id', '=', 'return_requests.order_id')
                ->leftJoin('users', 'users.id', '=', 'return_requests.user_id')
                ->select('refunds.id', 'orders.order_number', 'users.full_name as customer', 'refunds.refund_amount', 'refunds.refund_method', 'refunds.transaction_id', 'refunds.status', 'refunds.created_at')
                ->orderByDesc('refunds.created_at')
                ->limit(20)
                ->get(),
        ], 'Refund report generated successfully.');
    }

    private function profitBase(array $filters)
    {
        return $this->dateRange(
            DB::table('order_item_batches')
                ->join('order_items', 'order_items.id', '=', 'order_item_batches.order_item_id')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->join('categories', 'categories.id', '=', 'products.category_id')
                ->join('inventory_batches', 'inventory_batches.id', '=', 'order_item_batches.batch_id')
                ->whereNotIn('orders.order_status', ['cancelled']),
            $filters,
            'orders.order_date'
        );
    }

    private function report(array $summary, array $tables, string $message): array
    {
        return [
            'summary' => collect($summary)->map(fn ($value, $label) => [
                'label' => $label,
                'value' => round((float) $value, 2),
            ])->values(),
            'tables' => $tables,
            'message' => $message,
        ];
    }

    private function dateRange($query, array $filters, string $column)
    {
        if (! empty($filters['date_from'])) {
            $query->where($column, '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (! empty($filters['date_to'])) {
            $query->where($column, '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        return $query;
    }

    private function monthExpression(string $column): string
    {
        return DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column})"
            : "DATE_FORMAT({$column}, '%Y-%m')";
    }
}
