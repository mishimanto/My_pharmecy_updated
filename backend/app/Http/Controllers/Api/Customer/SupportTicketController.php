<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\SupportTicket;
use App\Services\NotificationService;
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

    public function store(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'order_id' => ['nullable', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
        ]);

        $orderId = $this->resolveCustomerOrderId($request, $data['order_id'] ?? null);

        return DB::transaction(function () use ($request, $data, $orderId, $notifications) {
            $ticket = $request->user()->supportTickets()->create([
                'order_id' => $orderId,
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

            $notifications->create([
                'notification_type' => 'new_support_ticket',
                'title' => 'Support ticket received',
                'message' => "{$request->user()->full_name} opened a support ticket: {$ticket->subject}.",
                'metadata' => [
                    'resource' => 'support',
                    'resource_id' => $ticket->id,
                    'link' => "/admin/support/{$ticket->id}",
                    'ticket_id' => $ticket->id,
                ],
            ]);

            return $this->ok($ticket->load($this->relations()), 'সাপোর্ট টিকিট তৈরি হয়েছে।', 201);
        });
    }

    public function show(Request $request, string $reference)
    {
        return $this->ok(
            $this->resolveCustomerTicket($request, $reference)->load($this->relations()),
            'সাপোর্ট টিকিট বিস্তারিত পাওয়া গেছে।'
        );
    }

    public function reply(Request $request, string $reference, NotificationService $notifications)
    {
        $data = $request->validate([
            'message' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
        ]);

        $ticket = $this->resolveCustomerTicket($request, $reference);
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

        $notifications->create([
            'notification_type' => 'support_customer_reply',
            'title' => 'Customer replied to support',
            'message' => "{$request->user()->full_name} replied to ticket: {$ticket->subject}.",
            'metadata' => [
                'resource' => 'support',
                'resource_id' => $ticket->id,
                'link' => "/admin/support/{$ticket->id}",
                'ticket_id' => $ticket->id,
            ],
        ]);

        return $this->ok($ticket->fresh()->load($this->relations()), 'রিপ্লাই পাঠানো হয়েছে।');
    }

    private function relations(): array
    {
        return ['order', 'assignedStaff', 'replies.customer', 'replies.staff'];
    }

    private function resolveCustomerTicket(Request $request, string $reference): SupportTicket
    {
        $ticketId = $this->ticketIdFromReference($reference);

        return $request->user()
            ->supportTickets()
            ->whereKey($ticketId)
            ->firstOrFail();
    }

    private function ticketIdFromReference(string $reference): int
    {
        $reference = trim($reference);

        if (ctype_digit($reference)) {
            return (int) $reference;
        }

        if (preg_match('/^ticket-([a-z0-9]+)/i', $reference, $matches)) {
            return (int) base_convert(strtolower($matches[1]), 36, 10);
        }

        abort(404);
    }

    private function resolveCustomerOrderId(Request $request, ?string $reference): ?int
    {
        $reference = trim((string) $reference);

        if ($reference === '') {
            return null;
        }

        $order = Order::query()
            ->where('user_id', $request->user()->id)
            ->where(function ($query) use ($reference) {
                if (ctype_digit($reference)) {
                    $query->whereKey((int) $reference);
                }

                $query->orWhere('order_number', strtoupper($reference));
            })
            ->first();

        abort_unless($order, 422, 'The selected order could not be found in your account.');

        return (int) $order->id;
    }
}
