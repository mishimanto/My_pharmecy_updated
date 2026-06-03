<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    use ApiResponse;

    public function index(Request $request) 
    { 
        return $this->ok($request->user()->addresses()->latest()->get(), 'ঠিকানার তালিকা পাওয়া গেছে।'); 
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string'], 'phone' => ['required', 'string'],
            'address_line_1' => ['required', 'string'], 'address_line_2' => ['nullable', 'string'],
            'city' => ['required', 'string'], 'area' => ['required', 'string'],
            'postal_code' => ['nullable', 'string'], 'is_default' => ['boolean'],
        ]);
        $address = $request->user()->addresses()->create($data);
        if ($address->is_default) {
            $request->user()->update(['default_address_id' => $address->id]);
        }

        return $this->ok($address, 'ঠিকানা সংরক্ষণ হয়েছে।', 201);
    }

    public function update(Request $request, int $id)
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $address->update($request->only(['full_name', 'phone', 'address_line_1', 'address_line_2', 'city', 'area', 'postal_code', 'is_default']));
        if ($address->is_default) {
            $request->user()->update(['default_address_id' => $address->id]);
        }

        return $this->ok($address, 'ঠিকানা আপডেট হয়েছে।');
    }

    public function destroy(Request $request, int $id)
    {
        $request->user()->addresses()->whereKey($id)->delete();

        return $this->ok(null, 'ঠিকানা ডিলিট হয়েছে।');
    }

    public function setDefault(Request $request, int $id)
    {
        $address = $request->user()->addresses()->findOrFail($id);

        $request->user()->addresses()->update(['is_default' => false]);
        $address->update(['is_default' => true]);
        $request->user()->update(['default_address_id' => $address->id]);

        return $this->ok($address->refresh(), 'ডিফল্ট ঠিকানা সেট হয়েছে।');
    }
}
