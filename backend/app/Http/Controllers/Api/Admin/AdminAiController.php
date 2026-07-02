<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiInteraction;
use App\Services\Ai\CustomerAiConfigService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminAiController extends Controller
{
    use ApiResponse;

    public function summary(CustomerAiConfigService $config)
    {
        $settings = $config->settings();
        $provider = (string) $settings['provider'];
        $providerConfig = config("ai.providers.{$provider}", []);
        $features = collect($settings['features'])
            ->map(fn ($enabled, $key) => [
                'key' => $key,
                'label' => $this->featureLabel($key),
                'enabled' => (bool) $settings['enabled'] && (bool) $enabled,
                'feature_enabled' => (bool) $enabled,
                'configured' => $this->providerReady($provider, $providerConfig),
            ])
            ->values();

        $stats = [
            'total' => AiInteraction::query()->count(),
            'completed' => AiInteraction::query()->where('status', 'completed')->count(),
            'failed' => AiInteraction::query()->where('status', 'failed')->count(),
            'today' => AiInteraction::query()->whereDate('created_at', today())->count(),
            'tokens' => (int) AiInteraction::query()->sum('total_tokens'),
        ];

        $featureBreakdown = AiInteraction::query()
            ->select('feature', DB::raw('count(*) as total'))
            ->groupBy('feature')
            ->orderByDesc('total')
            ->get();

        return $this->ok([
            'enabled' => (bool) $settings['enabled'],
            'provider' => $provider,
            'driver' => $providerConfig['driver'] ?? $provider,
            'model' => $settings['model'],
            'timeout' => (int) $settings['timeout'],
            'max_tokens' => (int) $settings['max_tokens'],
            'temperature' => (float) $settings['temperature'],
            'key_configured' => $this->providerReady($provider, $providerConfig),
            'features' => $features,
            'settings' => $settings,
            'stats' => $stats,
            'feature_breakdown' => $featureBreakdown,
            'env_keys' => [
                'CUSTOMER_AI_ENABLED',
                'CUSTOMER_AI_PROVIDER',
                'CUSTOMER_AI_MODEL',
                'CUSTOMER_AI_PRODUCT_QA_ENABLED',
                'CUSTOMER_AI_SMART_SEARCH_ENABLED',
                'CUSTOMER_AI_SUPPORT_ENABLED',
                strtoupper($provider) . '_API_KEY',
            ],
        ], 'AI configuration summary loaded successfully.');
    }

    public function updateSettings(Request $request, CustomerAiConfigService $config)
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'provider' => ['required', 'string', Rule::in(array_keys(config('ai.providers', [])))],
            'model' => ['nullable', 'string', 'max:120'],
            'timeout' => ['required', 'integer', 'min:5', 'max:120'],
            'max_tokens' => ['required', 'integer', 'min:100', 'max:4000'],
            'temperature' => ['required', 'numeric', 'min:0', 'max:2'],
            'features' => ['required', 'array'],
            'features.product_questions' => ['required', 'boolean'],
            'features.smart_search' => ['required', 'boolean'],
            'features.support_assistant' => ['required', 'boolean'],
            'features.prescription_summary' => ['required', 'boolean'],
        ]);

        $settings = $config->update($data);

        return $this->ok($settings, 'AI settings updated successfully.');
    }

    public function interactions(Request $request)
    {
        $data = $request->validate([
            'feature' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', Rule::in(['pending', 'completed', 'failed'])],
            'search' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = AiInteraction::query()
            ->with('user:id,full_name,email,phone')
            ->latest();

        if (! empty($data['feature'])) {
            $query->where('feature', $data['feature']);
        }

        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        if (! empty($data['date_from'])) {
            $query->whereDate('created_at', '>=', $data['date_from']);
        }

        if (! empty($data['date_to'])) {
            $query->whereDate('created_at', '<=', $data['date_to']);
        }

        if (! empty($data['search'])) {
            $search = $data['search'];
            $query->where(function ($where) use ($search) {
                $where
                    ->where('prompt', 'like', "%{$search}%")
                    ->orWhere('response', 'like', "%{$search}%")
                    ->orWhere('guest_token', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($user) use ($search) {
                        $user->where('full_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        return $this->ok(
            $query->paginate($request->integer('per_page', 15)),
            'AI interactions loaded successfully.'
        );
    }

    private function providerReady(string $provider, array $providerConfig): bool
    {
        if ($provider === 'ollama') {
            return true;
        }

        return filled($providerConfig['key'] ?? null);
    }

    private function featureLabel(string $feature): string
    {
        return [
            'product_questions' => 'Product questions',
            'smart_search' => 'Smart search',
            'support_assistant' => 'Support assistant',
            'prescription_summary' => 'Prescription summary',
        ][$feature] ?? str($feature)->replace('_', ' ')->title()->toString();
    }
}
