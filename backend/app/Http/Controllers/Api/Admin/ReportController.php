<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminReportService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ApiResponse;

    public function sales(Request $request, AdminReportService $reports)
    {
        return $this->jsonReport($reports, 'sales', $request);
    }

    public function orders(Request $request, AdminReportService $reports)
    {
        return $this->jsonReport($reports, 'orders', $request);
    }

    public function inventory(Request $request, AdminReportService $reports)
    {
        return $this->jsonReport($reports, 'inventory', $request);
    }

    public function profit(Request $request, AdminReportService $reports)
    {
        return $this->jsonReport($reports, 'profit', $request);
    }

    public function payments(Request $request, AdminReportService $reports)
    {
        return $this->jsonReport($reports, 'payments', $request);
    }

    public function prescriptions(Request $request, AdminReportService $reports)
    {
        return $this->jsonReport($reports, 'prescriptions', $request);
    }

    public function deliveries(Request $request, AdminReportService $reports)
    {
        return $this->jsonReport($reports, 'deliveries', $request);
    }

    public function refunds(Request $request, AdminReportService $reports)
    {
        return $this->jsonReport($reports, 'refunds', $request);
    }

    public function pdf(Request $request, string $type, AdminReportService $reports)
    {
        abort_unless(in_array($type, AdminReportService::TYPES, true), 404, 'Report not found.');

        $pdf = $reports->pdf($type, $this->filters($request));
        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$reports->filename($type).'"',
        ]);
    }

    private function jsonReport(AdminReportService $reports, string $type, Request $request)
    {
        $report = $reports->generate($type, $this->filters($request));

        return $this->ok(
            collect($report)->except('message')->all(),
            $report['message'] ?? "{$reports->title($type)} generated successfully."
        );
    }

    private function filters(Request $request): array
    {
        return $request->only(['date_from', 'date_to']);
    }
}
