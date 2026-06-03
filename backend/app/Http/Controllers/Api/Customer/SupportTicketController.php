<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\SupportTicket;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SupportTicketController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        return $this->ok(
            $request->user()->supportTickets()
                ->with('order', 'assignedStaff')
                ->latest()
                ->paginate($request->integer('per_page', 10)),
            'সাপোর্ট টিকিট তালিকা পাওয়া গেছে।'
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => ['nullable', 'exists:orders,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
        ]);

        if (!empty($data['order_id'])) {
            abort_unless(Order::where('user_id', $request->user()->id)->whereKey($data['order_id'])->exists(), 403);
        }

        return DB::transaction(function () use ($request, $data) {
            $ticket = $request->user()->supportTickets()->create([
                'order_id' => $data['order_id'] ?? null,
                'subject' => $data['subject'],
                'description' => $data['description'],
                'status' => 'open',
            ]);

            if ($request->hasFile('attachment')) {
                $ticket->replies()->create([
                    'replied_by_user_id' => $request->user()->id,
                    'message' => $data['description'],
                    'attachment' => $request->file('attachment')->store('support-ticket-attachments', 'public'),
                ]);
            }

            return $this->ok($ticket->load($this->relations()), 'সাপোর্ট টিকিট তৈরি হয়েছে।', 201);
        });
    }

    public function show(Request $request, int $id)
    {
        return $this->ok(
            $request->user()->supportTickets()->with($this->relations())->findOrFail($id),
            'সাপোর্ট টিকিট বিস্তারিত পাওয়া গেছে।'
        );
    }

    public function reply(Request $request, int $id)
    {
        $data = $request->validate([
            'message' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
        ]);

        $ticket = $request->user()->supportTickets()->findOrFail($id);
        abort_if(in_array($ticket->status, ['resolved', 'closed'], true), 422, 'এই টিকিটে আর রিপ্লাই করা যাবে না।');

        $ticket->replies()->create([
            'replied_by_user_id' => $request->user()->id,
            'replied_by_staff_id' => null,
            'message' => $data['message'],
            'attachment' => $request->hasFile('attachment') ? $request->file('attachment')->store('support-ticket-attachments', 'public') : null,
        ]);

        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        return $this->ok($ticket->fresh()->load($this->relations()), 'রিপ্লাই পাঠানো হয়েছে।');
    }

    private function relations(): array
    {
        return ['order', 'assignedStaff', 'replies.customer', 'replies.staff'];
    }
}
