<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InventoryBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $status = $this->input('status');
        $batchId = $this->route('id');

        return [
            'product_id' => ['required', 'exists:products,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'batch_number' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_batches', 'batch_number')
                    ->where(fn ($query) => $query->where('product_id', $this->input('product_id')))
                    ->ignore($batchId),
            ],
            'expiry_date' => [
                'required',
                'date',
                Rule::when($status === 'active', ['after:today']),
            ],
            'manufactured_date' => ['nullable', 'date', 'before_or_equal:expiry_date'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'stock_quantity' => ['required', 'integer', 'min:0', 'gte:reserved_quantity'],
            'reserved_quantity' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive', 'expired', 'damaged'])],
        ];
    }

    public function messages(): array
    {
        return [
            'batch_number.unique' => 'This product already has a batch with the same number.',
            'expiry_date.after' => 'Active batches must use a future expiry date.',
            'manufactured_date.before_or_equal' => 'Manufactured date must be on or before the expiry date.',
            'stock_quantity.gte' => 'Stock quantity cannot be lower than the reserved quantity.',
        ];
    }
}
