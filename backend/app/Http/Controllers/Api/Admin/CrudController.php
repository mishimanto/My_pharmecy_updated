<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CrudController extends Controller
{
    use ApiResponse;

    public function index(Request $request, string $table)
    {
        $query = DB::table($this->table($table))->latest('id');
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $columns = collect(DB::getSchemaBuilder()->getColumnListing($this->table($table)))
                ->filter(fn ($column) => str_contains($column, 'name') || str_contains($column, 'email') || str_contains($column, 'phone') || str_contains($column, 'status'));
            $query->where(fn ($inner) => $columns->each(fn ($column) => $inner->orWhere($column, 'like', "%{$search}%")));
        }

        return $this->ok($query->paginate($request->integer('per_page', 15)));
    }

    public function store(Request $request, string $table, AdminActivityService $activity)
    {
        $data = $this->payload($request);
        $data['created_at'] = now();
        $data['updated_at'] = now();
        $id = DB::table($this->table($table))->insertGetId($data);
        $activity->log($request, 'create', $table, $id, null, $data);

        return $this->ok(DB::table($this->table($table))->find($id), 'Record created.', 201);
    }

    public function show(string $table, int $id)
    {
        return $this->ok(DB::table($this->table($table))->find($id));
    }

    public function update(Request $request, string $table, int $id, AdminActivityService $activity)
    {
        $old = DB::table($this->table($table))->find($id);
        $data = $this->payload($request);
        $data['updated_at'] = now();
        DB::table($this->table($table))->where('id', $id)->update($data);
        $activity->log($request, 'update', $table, $id, $old, $data);

        return $this->ok(DB::table($this->table($table))->find($id), 'Record updated.');
    }

    public function destroy(Request $request, string $table, int $id, AdminActivityService $activity)
    {
        $old = DB::table($this->table($table))->find($id);
        DB::table($this->table($table))->where('id', $id)->delete();
        $activity->log($request, 'delete', $table, $id, $old);

        return $this->ok(null, 'Record deleted.');
    }

    private function payload(Request $request): array
    {
        return collect($request->except(['id', 'created_at', 'updated_at']))->filter(fn ($value) => $value !== null)->all();
    }

    private function table(string $key): string
    {
        $allowed = [
            'users', 'staffs', 'roles', 'permissions', 'categories', 'manufacturers', 'products', 'product_images',
            'suppliers', 'inventory_batches', 'inventory_transactions', 'prescriptions',
            'prescription_reviews', 'orders', 'payments', 'delivery_areas', 'riders',
            'deliveries', 'support_tickets', 'ticket_replies', 'return_requests',
            'refunds', 'notifications', 'admin_activity_logs', 'user_admin_actions',
        ];

        abort_unless(in_array($key, $allowed, true), 404);

        return $key;
    }
}
