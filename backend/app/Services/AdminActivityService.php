<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminActivityService
{
    public function log(Request $request, string $action, string $module, ?int $recordId = null, mixed $old = null, mixed $new = null): void
    {
        DB::table('admin_activity_logs')->insert([
            'staff_id' => $request->user()?->id,
            'action_type' => $action,
            'module_name' => $module,
            'record_id' => $recordId,
            'old_value' => $old ? json_encode($old) : null,
            'new_value' => $new ? json_encode($new) : null,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

