<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    use ApiResponse;

    public function index(Request $request, ShopperContextService $shopper)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $prescriptions = Prescription::query()
            ->with(['reviews.reviewer:id,full_name'])
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken))
            ->latest('id')
            ->paginate($request->integer('per_page', 10));

        return $this->ok($prescriptions, 'Prescriptions loaded successfully.');
    }

    public function store(Request $request, ShopperContextService $shopper)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $data = $request->validate([
            'prescription_file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'patient_name' => ['nullable', 'string', 'max:255'],
            'doctor_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $path = $data['prescription_file']->store('prescriptions', 'public');

        $prescription = Prescription::create([
            'user_id' => $user?->id,
            'guest_token' => $guestToken,
            'prescription_image' => $path,
            'patient_name' => $data['patient_name'] ?? null,
            'doctor_name' => $data['doctor_name'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => 'pending',
            'uploaded_at' => now(),
        ]);

        return $this->ok($prescription->load('reviews.reviewer:id,full_name'), 'Prescription uploaded successfully.', 201);
    }

    public function show(Request $request, int $id, ShopperContextService $shopper)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $prescription = Prescription::with(['reviews.reviewer:id,full_name'])
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken))
            ->findOrFail($id);

        return $this->ok($prescription, 'Prescription loaded successfully.');
    }
}
