<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\Ai\CustomerAiConfigService;
use App\Services\Ai\CustomerAiService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

class AiAssistantController extends Controller
{
    use ApiResponse;

    public function config(CustomerAiConfigService $config)
    {
        $settings = $config->settings();
        $features = collect($settings['features'] ?? [])
            ->map(fn ($enabled) => (bool) $settings['enabled'] && (bool) $enabled)
            ->all();

        return $this->ok([
            'enabled' => (bool) $settings['enabled'],
            'features' => $features,
        ], 'Customer AI configuration loaded.');
    }

    public function supportDraft(Request $request, CustomerAiService $ai)
    {
        $data = $request->validate([
            'subject' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:10', 'max:3000'],
            'order_id' => ['nullable', 'string', 'max:255'],
        ]);

        $order = $this->resolveCustomerOrder($request, $data['order_id'] ?? null);

        try {
            $draft = $ai->supportTicketDraft(
                trim($data['subject'] ?? ''),
                trim($data['description']),
                $order ? [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'order_status' => $order->order_status,
                    'payment_status' => $order->payment_status,
                    'total_amount' => $order->total_amount,
                    'created_at' => $order->created_at?->toDateTimeString(),
                ] : null,
                [
                    'user_id' => $request->user()?->id,
                    'guest_token' => $request->header('X-Guest-Session'),
                ],
            );
        } catch (RuntimeException $exception) {
            if ($this->isDisabledFeatureException($exception)) {
                return $this->disabledFeatureResponse();
            }

            return $this->ok($this->supportDraftUnavailable(trim($data['subject'] ?? ''), trim($data['description'])), $exception->getMessage());
        } catch (Throwable $exception) {
            report($exception);

            return $this->ok($this->supportDraftUnavailable(trim($data['subject'] ?? ''), trim($data['description'])), 'AI support assistant is not available right now. Please try again later.');
        }

        return $this->ok($draft, 'AI support draft generated.');
    }

    public function smartSearch(Request $request, CustomerAiService $ai)
    {
        $data = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:200'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
            'guest_token' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $result = $ai->smartSearch(trim($data['query']), [
                'user_id' => $request->user()?->id,
                'guest_token' => $data['guest_token'] ?? $request->header('X-Guest-Session'),
            ], (int) ($data['limit'] ?? 8));
        } catch (RuntimeException $exception) {
            if ($this->isDisabledFeatureException($exception)) {
                return $this->disabledFeatureResponse();
            }

            return $this->ok($this->smartSearchUnavailable(trim($data['query'])), $exception->getMessage());
        } catch (Throwable $exception) {
            report($exception);

            return $this->ok($this->smartSearchUnavailable(trim($data['query'])), 'AI smart search is not available right now. Please try again later.');
        }

        return $this->ok($result, 'AI smart search completed.');
    }

    public function productQuestion(Request $request, string $slugOrId, CustomerAiService $ai)
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'min:3', 'max:800'],
            'guest_token' => ['nullable', 'string', 'max:255'],
        ]);

        $product = Product::query()
            ->with(['category', 'manufacturer'])
            ->where('is_active', true)
            ->where(function ($query) use ($slugOrId) {
                $query->where('slug', $slugOrId);

                if (ctype_digit($slugOrId)) {
                    $query->orWhereKey((int) $slugOrId);
                }
            })
            ->firstOrFail();

        try {
            $answer = $ai->askProductQuestion($product, trim($data['question']), [
                'user_id' => $request->user()?->id,
                'guest_token' => $data['guest_token'] ?? $request->header('X-Guest-Session'),
            ]);
        } catch (RuntimeException $exception) {
            if ($this->isDisabledFeatureException($exception)) {
                return $this->disabledFeatureResponse();
            }

            return $this->ok($this->productQuestionUnavailable(), $exception->getMessage());
        } catch (Throwable $exception) {
            report($exception);

            return $this->ok($this->productQuestionUnavailable(), 'AI assistant could not answer right now. Please try again later.');
        }

        return $this->ok($answer, 'AI product answer generated.');
    }

    private function resolveCustomerOrder(Request $request, ?string $reference): ?Order
    {
        $reference = trim((string) $reference);

        if ($reference === '' || ! $request->user()) {
            return null;
        }

        return Order::query()
            ->where('user_id', $request->user()->id)
            ->where(function ($query) use ($reference) {
                if (ctype_digit($reference)) {
                    $query->whereKey((int) $reference);
                }

                $query->orWhere('order_number', strtoupper($reference));
            })
            ->first();
    }

    private function productQuestionUnavailable(): array
    {
        return [
            'answer' => 'AI assistant is temporarily unavailable because the configured provider could not process the request. Please try again later or contact support for medicine-related help.',
            'disclaimer' => 'This is a system availability message, not medical advice.',
            'unavailable' => true,
        ];
    }

    private function smartSearchUnavailable(string $query): array
    {
        return [
            'query' => $query,
            'intent' => $query,
            'note' => 'AI smart search is temporarily unavailable. Showing no AI-matched products.',
            'search_terms' => [$query],
            'products' => [],
            'unavailable' => true,
        ];
    }

    private function supportDraftUnavailable(string $subject, string $description): array
    {
        return [
            'subject' => $subject !== '' ? $subject : 'Support request',
            'draft_message' => $description,
            'priority' => 'normal',
            'category' => 'general',
            'summary' => 'AI draft is temporarily unavailable. You can still submit your support ticket normally.',
            'missing_information' => [],
            'unavailable' => true,
        ];
    }

    private function isDisabledFeatureException(RuntimeException $exception): bool
    {
        return str_contains($exception->getMessage(), 'Customer AI is not enabled');
    }

    private function disabledFeatureResponse()
    {
        return $this->fail('AI feature is disabled.', 404);
    }
}
