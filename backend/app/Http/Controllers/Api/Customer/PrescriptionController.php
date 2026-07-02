<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Services\NotificationService;
use App\Services\PrescriptionFileService;
use App\Services\ShopperContextService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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

    public function store(Request $request, ShopperContextService $shopper, PrescriptionFileService $files, NotificationService $notifications)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $prescriptionCount = Prescription::query()
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken))
            ->count();

        abort_if($prescriptionCount >= 10, 422, 'You can keep up to 10 prescriptions. Please delete an old prescription before uploading a new one.');

        $data = $request->validate([
            'prescription_file' => ['required', 'file', 'max:4096'],
            'patient_name' => ['nullable', 'string', 'max:255'],
            'doctor_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        if (! str_starts_with((string) $data['prescription_file']->getMimeType(), 'image/')) {
            throw ValidationException::withMessages([
                'prescription_file' => 'The prescription file must be an image.',
            ]);
        }

        $path = $files->store($data['prescription_file']);

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

        $notifications->create([
            'notification_type' => 'new_prescription',
            'title' => 'New prescription uploaded',
            'message' => ($user?->full_name ?: 'Guest customer').' uploaded a prescription for review.',
            'metadata' => [
                'resource' => 'prescriptions',
                'resource_id' => $prescription->id,
                'link' => "/admin/prescriptions/{$prescription->id}",
                'prescription_id' => $prescription->id,
            ],
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

    public function destroy(Request $request, int $id, ShopperContextService $shopper, PrescriptionFileService $files)
    {
        [$user, $guestToken] = $shopper->requireGuestOrUser($request);

        $prescription = Prescription::query()
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->when(! $user, fn ($query) => $query->where('guest_token', $guestToken))
            ->findOrFail($id);

        $files->delete($prescription->prescription_image);
        $prescription->delete();

        return $this->ok(null, 'Prescription deleted successfully.');
    }
}
