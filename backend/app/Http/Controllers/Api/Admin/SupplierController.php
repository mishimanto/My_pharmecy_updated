<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $suppliers = Supplier::query()
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('supplier_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%")))
            ->latest('id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($suppliers, 'সাপ্লায়ার তালিকা পাওয়া গেছে।');
    }

    public function store(Request $request, AdminActivityService $activity)
    {
        $data = $this->validated($request);
        $supplier = Supplier::create($data);
        $activity->log($request, 'create', 'supplier', $supplier->id, null, $supplier->toArray());

        return $this->ok($supplier, 'সাপ্লায়ার তৈরি হয়েছে।', 201);
    }

    public function show(int $id)
    {
        return $this->ok(Supplier::findOrFail($id), 'সাপ্লায়ার তথ্য পাওয়া গেছে।');
    }

    public function update(Request $request, int $id, AdminActivityService $activity)
    {
        $supplier = Supplier::findOrFail($id);
        $old = $supplier->toArray();
        $supplier->update($this->validated($request));
        $activity->log($request, 'update', 'supplier', $supplier->id, $old, $supplier->fresh()->toArray());

        return $this->ok($supplier, 'সাপ্লায়ার আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity)
    {
        $supplier = Supplier::findOrFail($id);
        abort_if($supplier->batches()->exists(), 422, 'ব্যাচ থাকা সাপ্লায়ার ডিলিট করা যাবে না।');
        $old = $supplier->toArray();
        $supplier->delete();
        $activity->log($request, 'delete', 'supplier', $id, $old);

        return $this->ok(null, 'সাপ্লায়ার ডিলিট হয়েছে।');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'supplier_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);
    }
}
