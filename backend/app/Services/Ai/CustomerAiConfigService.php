<?php

namespace App\Services\Ai;

use App\Models\AiSetting;
use Illuminate\Support\Facades\Schema;

class CustomerAiConfigService
{
    public const FEATURE_KEYS = [
        'product_questions',
        'smart_search',
        'support_assistant',
        'prescription_summary',
    ];

    public function settings(): array
    {
        $settings = [
            'enabled' => (bool) config('customer_ai.enabled'),
            'provider' => (string) config('customer_ai.provider', config('ai.default', 'openai')),
            'model' => config('customer_ai.model'),
            'timeout' => (int) config('customer_ai.timeout', 25),
            'max_tokens' => (int) config('customer_ai.max_tokens', 700),
            'temperature' => (float) config('customer_ai.temperature', 0.2),
            'features' => collect(self::FEATURE_KEYS)
                ->mapWithKeys(fn ($feature) => [$feature => (bool) config("customer_ai.features.{$feature}")])
                ->all(),
        ];

        if (! Schema::hasTable('ai_settings')) {
            return $settings;
        }

        $overrides = AiSetting::query()
            ->whereIn('key', ['enabled', 'provider', 'model', 'timeout', 'max_tokens', 'temperature', 'features'])
            ->get()
            ->mapWithKeys(fn (AiSetting $setting) => [$setting->key => $setting->value])
            ->all();

        if (array_key_exists('enabled', $overrides)) {
            $settings['enabled'] = (bool) $overrides['enabled'];
        }

        foreach (['provider', 'model'] as $key) {
            if (array_key_exists($key, $overrides)) {
                $settings[$key] = blank($overrides[$key]) ? null : (string) $overrides[$key];
            }
        }

        foreach (['timeout', 'max_tokens'] as $key) {
            if (array_key_exists($key, $overrides)) {
                $settings[$key] = (int) $overrides[$key];
            }
        }

        if (array_key_exists('temperature', $overrides)) {
            $settings['temperature'] = (float) $overrides['temperature'];
        }

        if (isset($overrides['features']) && is_array($overrides['features'])) {
            foreach (self::FEATURE_KEYS as $feature) {
                if (array_key_exists($feature, $overrides['features'])) {
                    $settings['features'][$feature] = (bool) $overrides['features'][$feature];
                }
            }
        }

        return $this->normalize($settings);
    }

    public function update(array $data): array
    {
        $current = $this->settings();
        $next = $this->normalize(array_replace_recursive($current, $data));

        foreach (['enabled', 'provider', 'model', 'timeout', 'max_tokens', 'temperature', 'features'] as $key) {
            AiSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $next[$key]]
            );
        }

        return $next;
    }

    public function enabled(string $feature): bool
    {
        $settings = $this->settings();

        return (bool) $settings['enabled'] && (bool) ($settings['features'][$feature] ?? false);
    }

    public function provider(): string
    {
        return (string) ($this->settings()['provider'] ?: config('ai.default', 'openai'));
    }

    public function model(): ?string
    {
        return $this->settings()['model'] ?: null;
    }

    public function timeout(): int
    {
        return (int) $this->settings()['timeout'];
    }

    public function safetyDisclaimer(): string
    {
        return (string) config('customer_ai.safety_disclaimer');
    }

    private function normalize(array $settings): array
    {
        $settings['enabled'] = (bool) ($settings['enabled'] ?? false);
        $settings['provider'] = (string) ($settings['provider'] ?: 'openai');
        $settings['model'] = blank($settings['model'] ?? null) ? null : (string) $settings['model'];
        $settings['timeout'] = max(5, min(120, (int) ($settings['timeout'] ?? 25)));
        $settings['max_tokens'] = max(100, min(4000, (int) ($settings['max_tokens'] ?? 700)));
        $settings['temperature'] = max(0, min(2, (float) ($settings['temperature'] ?? 0.2)));

        $features = is_array($settings['features'] ?? null) ? $settings['features'] : [];
        $settings['features'] = collect(self::FEATURE_KEYS)
            ->mapWithKeys(fn ($feature) => [$feature => (bool) ($features[$feature] ?? false)])
            ->all();

        return $settings;
    }
}
