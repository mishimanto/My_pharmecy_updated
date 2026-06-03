<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Manufacturer;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ManufacturerController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $manufacturers = Manufacturer::query()
            ->when($request->search, fn ($query, $search) => $query
                ->where('manufacturer_name', 'like', "%{$search}%")
                ->orWhere('country', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%"))
            ->latest('id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($manufacturers, 'ম্যানুফ্যাকচারার তালিকা পাওয়া গেছে।');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $request->validate([
            'manufacturer_name' => ['required', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $manufacturer = Manufacturer::create($data);
        $activity->log($request, 'create', 'manufacturer', $manufacturer->id, null, $manufacturer->toArray());

        return $this->ok($manufacturer, 'ম্যানুফ্যাকচারার তৈরি হয়েছে।', 201);
    }

    public function show(int $id)
    {
        return $this->ok(Manufacturer::findOrFail($id), 'ম্যানুফ্যাকচারার তথ্য পাওয়া গেছে।');
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $manufacturer = Manufacturer::findOrFail($id);
        $old = $manufacturer->toArray();
        $data = $request->validate([
            'manufacturer_name' => ['required', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $manufacturer->update($data);
        $activity->log($request, 'update', 'manufacturer', $manufacturer->id, $old, $manufacturer->fresh()->toArray());

        return $this->ok($manufacturer, 'ম্যানুফ্যাকচারার আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $manufacturer = Manufacturer::findOrFail($id);
        $old = $manufacturer->toArray();
        $manufacturer->delete();
        $activity->log($request, 'delete', 'manufacturer', $id, $old);

        return $this->ok(null, 'ম্যানুফ্যাকচারার ডিলিট হয়েছে।');
    }
}

