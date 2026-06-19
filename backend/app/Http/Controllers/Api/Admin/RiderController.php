<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Rider::query()->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($where) use ($search) {
                $where
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('vehicle_type', 'like', "%{$search}%")
                    ->orWhere('vehicle_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('vehicle_type')) {
            $query->where('vehicle_type', $request->string('vehicle_type')->toString());
        }

        return $this->ok(
            $query->paginate($request->integer('per_page', 10)),
            'রাইডার তালিকা পাওয়া গেছে।'
        );
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $rider = Rider::create($this->validated($request));
        $activity->log($request, 'create', 'riders', $rider->id, null, $rider->toArray());

        return $this->ok($rider, 'রাইডার তৈরি হয়েছে।', 201);
    }

    public function show(int $id)
    {
        return $this->ok(
            Rider::query()->with('deliveries')->findOrFail($id),
            'রাইডার বিস্তারিত পাওয়া গেছে।'
        );
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $rider = Rider::findOrFail($id);
        $old = $rider->toArray();
        $rider->update($this->validated($request));
        $activity->log($request, 'update', 'riders', $rider->id, $old, $rider->fresh()->toArray());

        return $this->ok($rider->fresh(), 'রাইডার আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $rider = Rider::findOrFail($id);
        $old = $rider->toArray();
        $rider->delete();
        $activity->log($request, 'delete', 'riders', $id, $old);

        return $this->ok(null, 'রাইডার মুছে ফেলা হয়েছে।');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'vehicle_number' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
        ]);
    }
}
