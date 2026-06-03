<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryArea;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class DeliveryAreaController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = DeliveryArea::query()->latest();
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(fn ($where) => $where->where('area_name', 'like', "%{$search}%")->orWhere('city', 'like', "%{$search}%")->orWhere('status', 'like', "%{$search}%"));
        }

        return $this->ok($query->paginate($request->integer('per_page', 10)), 'ডেলিভারি এলাকা পাওয়া গেছে।');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $this->validated($request);
        $area = DeliveryArea::create($data);
        $activity->log($request, 'create', 'delivery_areas', $area->id, null, $area->toArray());

        return $this->ok($area, 'ডেলিভারি এলাকা তৈরি হয়েছে।', 201);
    }

    public function show(int $id)
    {
        return $this->ok(DeliveryArea::findOrFail($id), 'ডেলিভারি এলাকা বিস্তারিত পাওয়া গেছে।');
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $area = DeliveryArea::findOrFail($id);
        $old = $area->toArray();
        $area->update($this->validated($request));
        $activity->log($request, 'update', 'delivery_areas', $area->id, $old, $area->fresh()->toArray());

        return $this->ok($area->fresh(), 'ডেলিভারি এলাকা আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $area = DeliveryArea::findOrFail($id);
        $old = $area->toArray();
        $area->delete();
        $activity->log($request, 'delete', 'delivery_areas', $id, $old);

        return $this->ok(null, 'ডেলিভারি এলাকা মুছে ফেলা হয়েছে।');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'area_name' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'delivery_charge' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);
    }
}
