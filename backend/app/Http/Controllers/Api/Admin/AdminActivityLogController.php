<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminActivityLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = DB::table('admin_activity_logs as logs')
            ->leftJoin('staffs as staff', 'staff.id', '=', 'logs.staff_id')
            ->select([
                'logs.*',
                'staff.full_name as staff_name',
                'staff.email as staff_email',
            ])
            ->latest('logs.id');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($where) use ($search) {
                $where
                    ->where('logs.action_type', 'like', "%{$search}%")
                    ->orWhere('logs.module_name', 'like', "%{$search}%")
                    ->orWhere('logs.ip_address', 'like', "%{$search}%")
                    ->orWhere('logs.record_id', 'like', "%{$search}%")
                    ->orWhere('staff.full_name', 'like', "%{$search}%")
                    ->orWhere('staff.email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('module_name')) {
            $query->where('logs.module_name', $request->string('module_name')->toString());
        }

        if ($request->filled('action_type')) {
            $query->where('logs.action_type', $request->string('action_type')->toString());
        }

        if ($request->filled('staff_id')) {
            $query->where('logs.staff_id', $request->integer('staff_id'));
        }

        return $this->ok(
            $query->paginate($request->integer('per_page', 10)),
            'অ্যাক্টিভিটি লগ পাওয়া গেছে।'
        );
    }

    public function show(int $id)
    {
        $log = DB::table('admin_activity_logs as logs')
            ->leftJoin('staffs as staff', 'staff.id', '=', 'logs.staff_id')
            ->select([
                'logs.*',
                'staff.full_name as staff_name',
                'staff.email as staff_email',
            ])
            ->where('logs.id', $id)
            ->first();

        abort_unless($log, 404);

        $log->old_value = $this->decodeJson($log->old_value);
        $log->new_value = $this->decodeJson($log->new_value);

        return $this->ok($log, 'অ্যাক্টিভিটি লগ বিস্তারিত পাওয়া গেছে।');
    }

    private function decodeJson(?string $value): mixed
    {
        if (!$value) {
            return null;
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
    }
}
