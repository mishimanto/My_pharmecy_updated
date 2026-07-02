<?php

namespace App\Services\Ai;

use App\Models\AiInteraction;
use App\Models\Product;
use App\Services\ProductCatalogService;
use RuntimeException;
use Throwable;

class CustomerAiService
{
    public function __construct(
        private ProductCatalogService $catalog,
        private CustomerAiConfigService $config,
    ) {}

    public function askProductQuestion(Product $product, string $question, array $actor = []): array
    {
        $this->ensureFeatureAvailable('product_questions');

        $provider = $this->config->provider();
        $model = $this->config->model();
        $this->ensureProviderReady($provider);

        $prompt = $this->productQuestionPrompt($product, $question);

        $interaction = AiInteraction::create([
            'user_id' => $actor['user_id'] ?? null,
            'guest_token' => $actor['guest_token'] ?? null,
            'feature' => 'product_questions',
            'provider' => $provider,
            'model' => $model,
            'subject_type' => Product::class,
            'subject_id' => $product->id,
            'prompt' => $question,
            'metadata' => [
                'product_slug' => $product->slug,
                'product_name' => $product->product_name,
            ],
            'status' => 'pending',
        ]);

        try {
            $response = (new CustomerProductQuestionAgent)->prompt(
                $prompt,
                provider: $provider,
                model: $model,
                timeout: $this->config->timeout(),
            );

            $usage = $response->usage;
            $answer = trim($response->text);

            $interaction->update([
                'response' => $answer,
                'prompt_tokens' => $usage->promptTokens,
                'completion_tokens' => $usage->completionTokens,
                'total_tokens' => $usage->promptTokens + $usage->completionTokens,
                'status' => 'completed',
            ]);

            return [
                'answer' => $answer,
                'disclaimer' => $this->config->safetyDisclaimer(),
                'provider' => $provider,
                'model' => $model,
                'interaction_id' => $interaction->id,
            ];
        } catch (Throwable $exception) {
            $interaction->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    public function enabled(string $feature): bool
    {
        return $this->config->enabled($feature);
    }

    public function smartSearch(string $query, array $actor = [], int $limit = 8): array
    {
        $this->ensureFeatureAvailable('smart_search');

        $provider = $this->config->provider();
        $model = $this->config->model();
        $this->ensureProviderReady($provider);

        $interaction = AiInteraction::create([
            'user_id' => $actor['user_id'] ?? null,
            'guest_token' => $actor['guest_token'] ?? null,
            'feature' => 'smart_search',
            'provider' => $provider,
            'model' => $model,
            'prompt' => $query,
            'metadata' => ['limit' => $limit],
            'status' => 'pending',
        ]);

        try {
            $response = (new CustomerSmartSearchAgent)->prompt(
                "Customer search query:\n{$query}",
                provider: $provider,
                model: $model,
                timeout: $this->config->timeout(),
            );

            $parsed = $this->parseSmartSearchResponse($response->text, $query);
            $products = $this->searchProductsByTerms($parsed['search_terms'], $limit);
            $usage = $response->usage;

            $interaction->update([
                'response' => $response->text,
                'prompt_tokens' => $usage->promptTokens,
                'completion_tokens' => $usage->completionTokens,
                'total_tokens' => $usage->promptTokens + $usage->completionTokens,
                'metadata' => [
                    'limit' => $limit,
                    'parsed' => $parsed,
                    'result_count' => $products->count(),
                ],
                'status' => 'completed',
            ]);

            return [
                'query' => $query,
                'intent' => $parsed['intent'],
                'note' => $parsed['note'],
                'search_terms' => $parsed['search_terms'],
                'products' => $products,
                'provider' => $provider,
                'model' => $model,
                'interaction_id' => $interaction->id,
            ];
        } catch (Throwable $exception) {
            $interaction->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    public function supportTicketDraft(string $subject, string $description, ?array $orderContext = null, array $actor = []): array
    {
        $this->ensureFeatureAvailable('support_assistant');

        $provider = $this->config->provider();
        $model = $this->config->model();
        $this->ensureProviderReady($provider);

        $context = [
            'subject' => $subject,
            'description' => $description,
            'order' => $orderContext,
        ];

        $interaction = AiInteraction::create([
            'user_id' => $actor['user_id'] ?? null,
            'guest_token' => $actor['guest_token'] ?? null,
            'feature' => 'support_assistant',
            'provider' => $provider,
            'model' => $model,
            'prompt' => $description,
            'metadata' => [
                'subject' => $subject,
                'order_id' => $orderContext['id'] ?? null,
                'order_number' => $orderContext['order_number'] ?? null,
            ],
            'status' => 'pending',
        ]);

        try {
            $response = (new CustomerSupportDraftAgent)->prompt(
                'Support request context:' . PHP_EOL . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                provider: $provider,
                model: $model,
                timeout: $this->config->timeout(),
            );

            $draft = $this->parseSupportDraftResponse($response->text, $subject, $description);
            $usage = $response->usage;

            $interaction->update([
                'response' => $response->text,
                'prompt_tokens' => $usage->promptTokens,
                'completion_tokens' => $usage->completionTokens,
                'total_tokens' => $usage->promptTokens + $usage->completionTokens,
                'metadata' => [
                    'subject' => $subject,
                    'order_id' => $orderContext['id'] ?? null,
                    'order_number' => $orderContext['order_number'] ?? null,
                    'parsed' => $draft,
                ],
                'status' => 'completed',
            ]);

            return [
                ...$draft,
                'disclaimer' => $this->config->safetyDisclaimer(),
                'provider' => $provider,
                'model' => $model,
                'interaction_id' => $interaction->id,
            ];
        } catch (Throwable $exception) {
            $interaction->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    private function ensureFeatureAvailable(string $feature): void
    {
        if (! $this->enabled($feature)) {
            throw new RuntimeException('Customer AI is not enabled for this feature.');
        }
    }

    private function ensureProviderReady(string $provider): void
    {
        $key = config("ai.providers.{$provider}.key");

        if ($provider !== 'ollama' && blank($key)) {
            throw new RuntimeException("AI provider [{$provider}] is missing an API key.");
        }
    }

    private function parseSmartSearchResponse(string $text, string $fallbackQuery): array
    {
        $decoded = json_decode(trim($text), true);

        if (! is_array($decoded)) {
            preg_match('/\{.*\}/s', $text, $matches);
            $decoded = isset($matches[0]) ? json_decode($matches[0], true) : null;
        }

        $decoded = is_array($decoded) ? $decoded : [];

        $terms = collect($decoded['search_terms'] ?? [])
            ->filter(fn ($term) => is_string($term) && trim($term) !== '')
            ->map(fn ($term) => trim($term))
            ->unique(fn ($term) => mb_strtolower($term))
            ->take(6)
            ->values()
            ->all();

        if ($terms === []) {
            $terms = [trim($fallbackQuery)];
        }

        return [
            'search_terms' => $terms,
            'intent' => is_string($decoded['intent'] ?? null) ? trim($decoded['intent']) : trim($fallbackQuery),
            'note' => is_string($decoded['note'] ?? null) ? trim($decoded['note']) : 'Showing products that may match your search.',
        ];
    }

    private function searchProductsByTerms(array $terms, int $limit)
    {
        $cleanTerms = collect($terms)
            ->filter(fn ($term) => is_string($term) && trim($term) !== '')
            ->map(fn ($term) => trim($term))
            ->take(6)
            ->values();

        if ($cleanTerms->isEmpty()) {
            return collect();
        }

        $products = Product::query()
            ->select($this->catalog->customerSelectFields())
            ->with($this->catalog->customerRelations())
            ->where('is_active', true)
            ->whereHas('batches', $this->catalog->validBatchConstraint())
            ->where(function ($query) use ($cleanTerms) {
                foreach ($cleanTerms as $term) {
                    $query->orWhere('product_name', 'like', "%{$term}%")
                        ->orWhere('generic_name', 'like', "%{$term}%")
                        ->orWhere('brand_name', 'like', "%{$term}%")
                        ->orWhere('dosage_form', 'like', "%{$term}%")
                        ->orWhereHas('category', fn ($category) => $category->where('category_name', 'like', "%{$term}%"))
                        ->orWhereHas('manufacturer', fn ($manufacturer) => $manufacturer->where('manufacturer_name', 'like', "%{$term}%"));
                }
            })
            ->limit(max(1, min(20, $limit)))
            ->get();

        return $this->catalog->appendProductCollection($products);
    }

    private function parseSupportDraftResponse(string $text, string $fallbackSubject, string $fallbackDescription): array
    {
        $decoded = json_decode(trim($text), true);

        if (! is_array($decoded)) {
            preg_match('/\{.*\}/s', $text, $matches);
            $decoded = isset($matches[0]) ? json_decode($matches[0], true) : null;
        }

        $decoded = is_array($decoded) ? $decoded : [];

        $subject = is_string($decoded['subject'] ?? null) ? trim($decoded['subject']) : trim($fallbackSubject);
        $draftMessage = is_string($decoded['draft_message'] ?? null) ? trim($decoded['draft_message']) : trim($fallbackDescription);
        $priority = is_string($decoded['priority'] ?? null) ? strtolower(trim($decoded['priority'])) : 'normal';
        $category = is_string($decoded['category'] ?? null) ? strtolower(trim($decoded['category'])) : 'general';

        if (! in_array($priority, ['low', 'normal', 'high', 'urgent'], true)) {
            $priority = 'normal';
        }

        if (! in_array($category, ['order', 'delivery', 'payment', 'prescription', 'product', 'return', 'general'], true)) {
            $category = 'general';
        }

        $missingInformation = collect($decoded['missing_information'] ?? [])
            ->filter(fn ($item) => is_string($item) && trim($item) !== '')
            ->map(fn ($item) => trim($item))
            ->take(5)
            ->values()
            ->all();

        return [
            'subject' => $subject !== '' ? mb_substr($subject, 0, 180) : trim($fallbackSubject),
            'draft_message' => $draftMessage !== '' ? $draftMessage : trim($fallbackDescription),
            'priority' => $priority,
            'category' => $category,
            'summary' => is_string($decoded['summary'] ?? null) ? trim($decoded['summary']) : 'Draft prepared for support review.',
            'missing_information' => $missingInformation,
        ];
    }

    private function productQuestionPrompt(Product $product, string $question): string
    {
        $context = [
            'product_name' => $product->product_name,
            'generic_name' => $product->generic_name,
            'brand_name' => $product->brand_name,
            'strength' => $product->strength,
            'dosage_form' => $product->dosage_form,
            'requires_prescription' => (bool) $product->requires_prescription,
            'description' => $product->description,
            'description_bn' => $product->description_bn,
            'category' => $product->category?->category_name,
            'manufacturer' => $product->manufacturer?->manufacturer_name,
            'pieces_per_strip' => $product->pieces_per_strip,
            'strips_per_box' => $product->strips_per_box,
            'strip_price' => $product->strip_price,
            'box_price' => $product->box_price,
        ];

        $encodedContext = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return <<<PROMPT
Product context:
{$encodedContext}

Customer question:
{$question}
PROMPT;
    }
}
