<?php

use App\Models\InventoryBatch;
use App\Models\SiteSetting;
use App\Models\Staff;
use App\Services\AdminReportService;
use App\Services\InventoryService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('inventory:expire-batches {--dry-run : Count expired active batches without changing them}', function () {
    $query = InventoryBatch::query()
        ->where('status', 'active')
        ->whereDate('expiry_date', '<=', now());

    if ($this->option('dry-run')) {
        $this->info($query->count().' active batch(es) are expired.');

        return 0;
    }

    $expired = 0;
    $inventory = app(InventoryService::class);

    $query->orderBy('id')->chunkById(100, function ($batches) use (&$expired, $inventory): void {
        foreach ($batches as $batch) {
            $changed = DB::transaction(function () use ($batch, $inventory): bool {
                $fresh = InventoryBatch::query()
                    ->whereKey($batch->id)
                    ->where('status', 'active')
                    ->whereDate('expiry_date', '<=', now())
                    ->lockForUpdate()
                    ->first();

                if (! $fresh) {
                    return false;
                }

                $fresh->update(['status' => 'expired']);
                $inventory->transaction($fresh->id, 'expired', 0, 'inventory_batch', $fresh->id, 'Batch expired automatically');

                return true;
            });

            if ($changed) {
                $expired++;
            }
        }
    });

    $this->info("Expired {$expired} inventory batch(es).");

    return 0;
})->purpose('Mark active inventory batches as expired after their expiry date passes');

Schedule::command('inventory:expire-batches')->dailyAt('00:15')->withoutOverlapping();

Artisan::command('reports:email {frequency=daily : daily or weekly} {--to=* : Email recipient}', function (AdminReportService $reports) {
    $frequency = strtolower((string) $this->argument('frequency'));

    if (! in_array($frequency, ['daily', 'weekly'], true)) {
        $this->error('Frequency must be daily or weekly.');

        return 1;
    }

    $dateTo = now()->subDay()->toDateString();
    $dateFrom = $frequency === 'daily'
        ? $dateTo
        : now()->subDays(7)->toDateString();
    $filters = ['date_from' => $dateFrom, 'date_to' => $dateTo];
    $types = ['sales', 'profit', 'inventory'];
    $recipients = collect($this->option('to'))->filter()->values();

    if ($recipients->isEmpty()) {
        try {
            $recipients = Staff::query()
                ->permission('report.view')
                ->where('status', 'active')
                ->whereNotNull('email')
                ->pluck('email')
                ->filter()
                ->values();
        } catch (\Throwable) {
            $recipients = Staff::query()
                ->where('status', 'active')
                ->whereNotNull('email')
                ->pluck('email')
                ->filter()
                ->values();
        }
    }

    if ($recipients->isEmpty()) {
        $supportEmail = SiteSetting::singleton()->support_email;
        if ($supportEmail) {
            $recipients = collect([$supportEmail]);
        }
    }

    if ($recipients->isEmpty()) {
        $this->warn('No report email recipients found.');

        return 0;
    }

    $attachments = collect($types)->map(fn ($type) => [
        'name' => $reports->filename($frequency.'-'.$type),
        'data' => $reports->pdf($type, $filters),
    ]);

    $subject = ucfirst($frequency).' My Pharmecy report: '.$dateFrom.' to '.$dateTo;
    $body = implode("\n", [
        'Hello,',
        '',
        "Attached are the {$frequency} sales, profit, and inventory reports.",
        "Date range: {$dateFrom} to {$dateTo}",
        '',
        'My Pharmecy',
    ]);

    $sent = 0;
    foreach ($recipients as $email) {
        try {
            Mail::raw($body, function ($mail) use ($email, $subject, $attachments) {
                $mail->to($email)->subject($subject);

                foreach ($attachments as $attachment) {
                    $mail->attachData($attachment['data'], $attachment['name'], ['mime' => 'application/pdf']);
                }
            });
            $sent++;
        } catch (\Throwable $exception) {
            Log::warning('Scheduled report email could not be sent.', [
                'email' => $email,
                'subject' => $subject,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    $this->info("Report email sent to {$sent} recipient(s).");

    return 0;
})->purpose('Email daily or weekly sales, profit, and inventory reports');

Schedule::command('reports:email daily')->dailyAt('06:00')->withoutOverlapping();
Schedule::command('reports:email weekly')->weeklyOn(1, '06:30')->withoutOverlapping();
