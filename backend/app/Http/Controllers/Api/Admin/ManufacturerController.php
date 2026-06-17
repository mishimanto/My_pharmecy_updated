<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Manufacturer;
use App\Services\AdminActivityService;
use App\Services\ManufacturerLogoService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ManufacturerController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $manufacturers = Manufacturer::query()
            ->withCount('products')
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search');

                $query->where(function ($where) use ($search) {
                    $where->where('manufacturer_name', 'like', "%{$search}%")
                        ->orWhere('country', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->orderBy('manufacturer_name')
            ->paginate($perPage);

        return $this->ok($manufacturers, 'Manufacturer list loaded successfully.');
    }

    public function store(Request $request, AdminActivityService $activity, ManufacturerLogoService $logos)
    {
        $data = $request->validate([
            'manufacturer_name' => ['required', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);
        unset($data['logo']);

        if ($request->hasFile('logo')) {
            $data = [...$data, ...$logos->store($request->file('logo'))];
        }

        $manufacturer = Manufacturer::create($data);
        $activity->log($request, 'create', 'manufacturer', $manufacturer->id, null, $manufacturer->toArray());

        return $this->ok($manufacturer->loadCount('products'), 'Manufacturer created successfully.', 201);
    }

    public function show(int $id)
    {
        return $this->ok(Manufacturer::withCount('products')->findOrFail($id), 'Manufacturer details loaded successfully.');
    }

    public function update(Request $request, int $id, AdminActivityService $activity, ManufacturerLogoService $logos)
    {
        $manufacturer = Manufacturer::findOrFail($id);
        $old = $manufacturer->toArray();
        $data = $request->validate([
            'manufacturer_name' => ['required', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_logo' => ['nullable', 'boolean'],
        ]);
        unset($data['logo'], $data['remove_logo']);

        if ($request->boolean('remove_logo') && $manufacturer->logo_path) {
            $logos->delete($manufacturer->logo_path);
            $data['logo_url'] = null;
            $data['logo_path'] = null;
        }

        if ($request->hasFile('logo')) {
            $data = [...$data, ...$logos->store($request->file('logo'), $manufacturer->logo_path)];
        }

        $manufacturer->update($data);
        $activity->log($request, 'update', 'manufacturer', $manufacturer->id, $old, $manufacturer->fresh()->toArray());

        return $this->ok($manufacturer->fresh()->loadCount('products'), 'Manufacturer updated successfully.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity, ManufacturerLogoService $logos)
    {
        $manufacturer = Manufacturer::findOrFail($id);
        abort_if($manufacturer->products()->exists(), 422, 'Manufacturers with products cannot be deleted.');

        $old = $manufacturer->toArray();

        if ($manufacturer->logo_path) {
            $logos->delete($manufacturer->logo_path);
        }

        $manufacturer->delete();
        $activity->log($request, 'delete', 'manufacturer', $id, $old);

        return $this->ok(null, 'Manufacturer deleted successfully.');
    }
}
