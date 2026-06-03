<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $prescriptions = Prescription::query()
            ->with(['reviews.reviewer:id,full_name'])
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->paginate($request->integer('per_page', 10));

        return $this->ok($prescriptions, 'প্রেসক্রিপশন তালিকা পাওয়া গেছে।');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'prescription_file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'patient_name' => ['nullable', 'string', 'max:255'],
            'doctor_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $path = $data['prescription_file']->store('prescriptions', 'public');

        $prescription = Prescription::create([
            'user_id' => $request->user()->id,
            'prescription_image' => $path,
            'patient_name' => $data['patient_name'] ?? null,
            'doctor_name' => $data['doctor_name'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => 'pending',
            'uploaded_at' => now(),
        ]);

        return $this->ok($prescription->load('reviews.reviewer:id,full_name'), 'প্রেসক্রিপশন আপলোড হয়েছে।', 201);
    }

    public function show(Request $request, int $id)
    {
        $prescription = Prescription::with(['reviews.reviewer:id,full_name'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return $this->ok($prescription, 'প্রেসক্রিপশন তথ্য পাওয়া গেছে।');
    }
}

