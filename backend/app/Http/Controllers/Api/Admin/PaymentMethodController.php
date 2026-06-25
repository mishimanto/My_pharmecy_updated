<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Services\AdminActivityService;
use App\Services\PaymentMethodLogoService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->ok(
            PaymentMethod::query()->orderBy('sort_order')->orderBy('id')->get(),
            'Payment methods loaded successfully.'
        );
    }

    public function store(Request $request, AdminActivityService $activity, PaymentMethodLogoService $logos)
    {
        $data = $this->validated($request);
        unset($data['logo'], $data['logo_data'], $data['remove_logo']);

        if ($request->filled('logo_data')) {
            $data = [...$data, ...$logos->storeDataUri($request->string('logo_data')->toString())];
        } elseif ($request->hasFile('logo')) {
            $data = [...$data, ...$logos->store($request->file('logo'))];
        }

        $method = PaymentMethod::create($data);
        $activity->log($request, 'create', 'payment_methods', $method->id, null, $method->toArray());

        return $this->ok($method, 'Payment method created successfully.', 201);
    }

    public function update(Request $request, int $id, AdminActivityService $activity, PaymentMethodLogoService $logos)
    {
        $method = PaymentMethod::findOrFail($id);
        $old = $method->toArray();
        $data = $this->validated($request, $method->id);
        unset($data['logo'], $data['logo_data'], $data['remove_logo']);

        if ($request->boolean('remove_logo')) {
            if ($method->logo_path) {
                $logos->delete($method->logo_path);
            }
            $data['logo_url'] = null;
            $data['logo_path'] = null;
        }

        if ($request->filled('logo_data')) {
            $data = [...$data, ...$logos->storeDataUri($request->string('logo_data')->toString(), $method->logo_path)];
        } elseif ($request->hasFile('logo')) {
            $data = [...$data, ...$logos->store($request->file('logo'), $method->logo_path)];
        } elseif ($request->filled('logo_url') && $request->string('logo_url')->toString() !== ($old['logo_url'] ?? null) && $method->logo_path) {
            $logos->delete($method->logo_path);
            $data['logo_path'] = null;
        }

        $method->update($data);
        $activity->log($request, 'update', 'payment_methods', $method->id, $old, $method->fresh()->toArray());

        return $this->ok($method->fresh(), 'Payment method updated successfully.');
    }

    public function destroy(Request $request, int $id, AdminActivityService $activity, PaymentMethodLogoService $logos)
    {
        $method = PaymentMethod::findOrFail($id);
        abort_if($method->code === 'COD', 422, 'Cash on delivery cannot be deleted.');
        $old = $method->toArray();

        if ($method->logo_path) {
            $logos->delete($method->logo_path);
        }

        $method->delete();
        $activity->log($request, 'delete', 'payment_methods', $id, $old);

        return $this->ok(null, 'Payment method deleted successfully.');
    }

    private function validated(Request $request, ?int $id = null): array
    {
        $request->merge([
            'code' => strtoupper(trim((string) $request->input('code'))),
            'requires_proof' => filter_var($request->input('requires_proof'), FILTER_VALIDATE_BOOLEAN),
            'is_active' => filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ]);

        return $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('payment_methods', 'code')->ignore($id)],
            'label' => ['required', 'string', 'max:255'],
            'label_bn' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'description_bn' => ['nullable', 'string', 'max:255'],
            'number' => ['nullable', 'string', 'max:255'],
            'account_name' => ['nullable', 'string', 'max:255'],
            'dial_code' => ['nullable', 'string', 'max:255'],
            'logo_url' => ['nullable', 'url', 'max:2000'],
            'logo' => ['nullable', 'file'],
            'logo_data' => ['nullable', 'string'],
            'remove_logo' => ['nullable', 'boolean'],
            'brand_color' => ['nullable', 'string', 'max:30'],
            'requires_proof' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
