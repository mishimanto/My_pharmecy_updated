<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class NotificationManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        return $this->ok(
            $this->filteredQuery($request)
                ->latest()
                ->paginate($request->integer('per_page', 15)),
            'Notifications loaded successfully.'
        );
    }

    public function read(Request $request, int $id)
    {
        $notification = $this->scopedQuery($request)->findOrFail($id);
        $notification->update(['status' => 'read', 'read_at' => $notification->read_at ?: now()]);

        return $this->ok($notification->fresh(), 'Notification marked as read.');
    }

    public function markAllRead(Request $request)
    {
        $updated = $this->filteredQuery($request)
            ->where('status', '!=', 'read')
            ->where('status', '!=', 'archived')
            ->update(['status' => 'read', 'read_at' => now()]);

        return $this->ok(['updated' => $updated], 'Notifications marked as read.');
    }

    public function bulk(Request $request)
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['read', 'archive', 'delete'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $query = $this->scopedQuery($request)->whereIn('id', $data['ids']);

        $affected = match ($data['action']) {
            'read' => $query->update(['status' => 'read', 'read_at' => now()]),
            'archive' => $query->update(['status' => 'archived', 'archived_at' => now()]),
            'delete' => $query->delete(),
        };

        return $this->ok(['affected' => $affected], 'Bulk notification action completed.');
    }

    public function types(Request $request)
    {
        return $this->ok($this->availableTypes(), 'Notification types loaded successfully.');
    }

    public function preferences(Request $request)
    {
        $disabled = DB::table('staff_notification_preferences')
            ->where('staff_id', $request->user()->id)
            ->where('in_app_enabled', false)
            ->pluck('notification_type')
            ->values();

        return $this->ok([
            'types' => $this->availableTypes(),
            'disabled_types' => $disabled,
        ], 'Notification preferences loaded successfully.');
    }

    public function updatePreferences(Request $request)
    {
        $types = $this->availableTypes()->pluck('value')->all();
        $data = $request->validate([
            'disabled_types' => ['nullable', 'array'],
            'disabled_types.*' => ['string', Rule::in($types)],
        ]);

        $disabledTypes = collect($data['disabled_types'] ?? [])->unique()->values();

        DB::transaction(function () use ($request, $types, $disabledTypes): void {
            DB::table('staff_notification_preferences')
                ->where('staff_id', $request->user()->id)
                ->delete();

            $now = now();
            $rows = collect($types)->map(fn ($type) => [
                'staff_id' => $request->user()->id,
                'notification_type' => $type,
                'in_app_enabled' => ! $disabledTypes->contains($type),
                'email_enabled' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all();

            if ($rows !== []) {
                DB::table('staff_notification_preferences')->insert($rows);
            }
        });

        return $this->preferences($request);
    }

    private function filteredQuery(Request $request): Builder
    {
        return $this->scopedQuery($request)
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')->toString()),
                fn ($query) => $query->where('status', '!=', 'archived')
            )
            ->when($request->filled('notification_type'), fn ($query) => $query->where('notification_type', $request->string('notification_type')->toString()))
            ->when($request->filled('date_from'), fn ($query) => $query->whereDate('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($query) => $query->whereDate('created_at', '<=', $request->date('date_to')))
            ->when($request->boolean('apply_preferences', true), function ($query) use ($request) {
                $disabledTypes = DB::table('staff_notification_preferences')
                    ->where('staff_id', $request->user()->id)
                    ->where('in_app_enabled', false)
                    ->pluck('notification_type');

                if ($disabledTypes->isNotEmpty()) {
                    $query->whereNotIn('notification_type', $disabledTypes);
                }
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();

                $query->where(function ($where) use ($search) {
                    $where->where('title', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%")
                        ->orWhere('notification_type', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");
                });
            });
    }

    private function scopedQuery(Request $request): Builder
    {
        return Notification::query()
            ->with('user', 'staff')
            ->whereNull('user_id')
            ->where(fn ($query) => $query->whereNull('staff_id')->orWhere('staff_id', $request->user()->id));
    }

    private function availableTypes()
    {
        $defaults = collect([
            'new_order',
            'new_prescription',
            'new_support_ticket',
            'support_customer_reply',
            'system',
        ]);

        return $defaults
            ->merge(Notification::query()->whereNull('user_id')->distinct()->pluck('notification_type'))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->map(fn ($type) => [
                'value' => $type,
                'label' => ucwords(str_replace('_', ' ', $type)),
            ]);
    }
}
