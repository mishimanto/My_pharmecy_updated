<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\SupportTicket;
use App\Services\AdminActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupportManagementController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = SupportTicket::query()
            ->with([
                'user:id,full_name,phone',
                'order:id,order_number',
                'assignedStaff:id,full_name',
            ])
            ->withCount('replies')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($where) use ($search) {
                $where
                    ->where('subject', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($user) use ($search) {
                        $user
                            ->where('full_name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return $this->ok(
            $query->paginate($request->integer('per_page', 10)),
            'সাপোর্ট টিকিট তালিকা পাওয়া গেছে।'
        );
    }

    public function show(int $id)
    {
        $ticket = SupportTicket::query()->with($this->relations())->findOrFail($id)->toArray();
        $ticket['staff_options'] = Staff::query()
            ->select('id', 'full_name', 'email', 'status')
            ->where('status', 'active')
            ->orderBy('full_name')
            ->get();

        return $this->ok($ticket, 'সাপোর্ট টিকিট বিস্তারিত পাওয়া গেছে।');
    }

    public function assign(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'assigned_staff_id' => ['required', 'exists:staffs,id'],
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $old = $ticket->toArray();
        $ticket->update([
            'assigned_staff_id' => $data['assigned_staff_id'],
            'status' => $ticket->status === 'open' ? 'in_progress' : $ticket->status,
        ]);
        $activity->log($request, 'assign', 'support_tickets', $ticket->id, $old, $ticket->fresh()->toArray());

        return $this->ok($ticket->fresh()->load($this->relations()), 'সাপোর্ট টিকিট অ্যাসাইন করা হয়েছে।');
    }

    public function status(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved,closed'],
        ]);

        $ticket = SupportTicket::findOrFail($id);
        $old = $ticket->toArray();
        $ticket->update(['status' => $data['status']]);
        $activity->log($request, 'status_update', 'support_tickets', $ticket->id, $old, $ticket->fresh()->toArray());

        return $this->ok($ticket->fresh()->load($this->relations()), 'সাপোর্ট টিকিট স্ট্যাটাস আপডেট হয়েছে।');
    }

    public function reply(Request $request, int $id, AdminActivityService $activity)
    {
        $data = $request->validate([
            'message' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
        ]);

        $ticket = SupportTicket::findOrFail($id);
        abort_if($ticket->status === 'closed', 422, 'বন্ধ টিকিটে রিপ্লাই করা যাবে না।');

        $reply = $ticket->replies()->create([
            'replied_by_user_id' => null,
            'replied_by_staff_id' => $request->user()->id,
            'message' => $data['message'],
            'attachment' => $request->hasFile('attachment')
                ? $request->file('attachment')->store('support-ticket-attachments', 'public')
                : null,
        ]);

        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        DB::table('notifications')->insert([
            'user_id' => $ticket->user_id,
            'notification_type' => 'support_reply',
            'title' => 'সাপোর্ট থেকে উত্তর এসেছে',
            'message' => "আপনার '{$ticket->subject}' টিকিটে নতুন উত্তর দেওয়া হয়েছে।",
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $activity->log($request, 'reply', 'support_tickets', $ticket->id, null, $reply->toArray());

        return $this->ok($ticket->fresh()->load($this->relations()), 'সাপোর্ট রিপ্লাই পাঠানো হয়েছে।');
    }

    private function relations(): array
    {
        return ['user', 'order', 'assignedStaff', 'replies.customer', 'replies.staff'];
    }
}
