<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prescription;
use App\Models\PrescriptionReview;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PrescriptionReviewController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $prescriptions = Prescription::query()
            ->with(['user:id,full_name,phone,email', 'order:id,order_number', 'reviews.reviewer:id,full_name'])
            ->when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->when($request->search, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('prescription_code', 'like', "%{$search}%")
                ->orWhere('patient_name', 'like', "%{$search}%")
                ->orWhere('doctor_name', 'like', "%{$search}%")
                ->orWhereHas('user', fn ($user) => $user->where('full_name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"))))
            ->latest('id')
            ->paginate($request->integer('per_page', 15));

        return $this->ok($prescriptions, 'Prescription list loaded successfully.');
    }

    public function show(int $id)
    {
        $prescription = Prescription::with([
            'user:id,full_name,phone,email',
            'order:id,order_number,order_status,prescription_match_status,total_amount',
            'order.items:id,order_id,product_id,quantity,piece_quantity',
            'order.items.product:id,product_name,generic_name',
            'reviews.reviewer:id,full_name',
        ])
            ->findOrFail($id);

        return $this->ok($prescription, 'Prescription details loaded successfully.');
    }

    public function review(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'review_status' => ['required', Rule::in(['approved', 'rejected', 'need_clarification'])],
            'review_note' => [
                Rule::requiredIf(fn () => in_array($request->input('review_status'), ['rejected', 'need_clarification'], true)),
                'nullable',
                'string',
            ],
        ]);

        $prescription = Prescription::findOrFail($id);
        $old = $prescription->toArray();

        return DB::transaction(function () use ($request, $activity, $data, $prescription, $old) {
            $review = PrescriptionReview::create([
                'prescription_id' => $prescription->id,
                'reviewed_by' => $request->user()->id,
                'review_status' => $data['review_status'],
                'review_note' => $data['review_note'] ?? null,
                'reviewed_at' => now(),
            ]);

            $prescription->update(['status' => $data['review_status']]);

            DB::table('notifications')->insert([
                'user_id' => $prescription->user_id,
                'notification_type' => 'prescription_review',
                'title' => 'প্রেসক্রিপশন রিভিউ আপডেট',
                'message' => match ($data['review_status']) {
                    'approved' => 'আপনার প্রেসক্রিপশন অনুমোদিত হয়েছে।',
                    'rejected' => 'আপনার প্রেসক্রিপশন বাতিল করা হয়েছে।',
                    default => 'আপনার প্রেসক্রিপশনে আরও তথ্য প্রয়োজন।',
                },
                'channel' => 'in_app',
                'status' => 'unread',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $activity->log($request, 'review', 'prescription', $prescription->id, $old, [
                'prescription' => $prescription->fresh()->toArray(),
                'review' => $review->toArray(),
            ]);

            return $this->ok($prescription->fresh()->load([
                'user:id,full_name,phone,email',
                'order:id,order_number,order_status,prescription_match_status,total_amount',
                'order.items:id,order_id,product_id,quantity,piece_quantity',
                'order.items.product:id,product_name,generic_name',
                'reviews.reviewer:id,full_name',
            ]), 'Prescription review saved successfully.');
        });
    }
}
