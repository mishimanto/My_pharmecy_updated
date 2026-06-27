<?php

namespace App\Services;

use App\Models\DrugInteraction;
use Illuminate\Support\Collection;

class DrugInteractionService
{
    public function normalizeGeneric(?string $generic): ?string
    {
        $normalized = mb_strtolower(trim((string) $generic));

        return $normalized !== '' ? $normalized : null;
    }

    public function normalizedPair(string $first, string $second): ?array
    {
        $first = $this->normalizeGeneric($first);
        $second = $this->normalizeGeneric($second);

        if (! $first || ! $second || $first === $second) {
            return null;
        }

        $pair = [$first, $second];
        sort($pair, SORT_STRING);

        return $pair;
    }

    public function interactionsForGeneric(?string $generic, bool $activeOnly = true): Collection
    {
        $normalized = $this->normalizeGeneric($generic);

        if (! $normalized) {
            return collect();
        }

        return DrugInteraction::query()
            ->when($activeOnly, fn ($query) => $query->where('is_active', true))
            ->where(function ($query) use ($normalized) {
                $query
                    ->where('generic_name', $normalized)
                    ->orWhere('interacts_with_generic_name', $normalized);
            })
            ->orderByRaw("CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'moderate' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
            ->orderBy('generic_name')
            ->get();
    }

    public function warningsForProducts(Collection $products): array
    {
        $genericMap = $products
            ->mapWithKeys(function ($product) {
                $normalized = $this->normalizeGeneric($product?->generic_name);

                return $normalized ? [$normalized => $product->generic_name] : [];
            })
            ->filter()
            ->unique();

        if ($genericMap->count() < 2) {
            return [];
        }

        $generics = $genericMap->keys()->all();

        return DrugInteraction::query()
            ->where('is_active', true)
            ->whereIn('generic_name', $generics)
            ->whereIn('interacts_with_generic_name', $generics)
            ->get()
            ->map(function (DrugInteraction $interaction) use ($genericMap) {
                $first = $genericMap->get($interaction->generic_name, $interaction->generic_name);
                $second = $genericMap->get($interaction->interacts_with_generic_name, $interaction->interacts_with_generic_name);
                $warning = $interaction->warning ?: 'Ask a pharmacist before using these medicines together.';
                $severity = ucfirst($interaction->severity ?: 'moderate');

                return "{$severity} interaction: {$first} + {$second}. {$warning}";
            })
            ->unique()
            ->values()
            ->all();
    }

    public function displayForGeneric(?string $generic, bool $activeOnly = true): array
    {
        $normalized = $this->normalizeGeneric($generic);

        if (! $normalized) {
            return [];
        }

        return $this->interactionsForGeneric($normalized, $activeOnly)
            ->map(function (DrugInteraction $interaction) use ($normalized) {
                $other = $interaction->generic_name === $normalized
                    ? $interaction->interacts_with_generic_name
                    : $interaction->generic_name;

                return [
                    'id' => $interaction->id,
                    'interacts_with_generic_name' => $other,
                    'severity' => $interaction->severity,
                    'warning' => $interaction->warning,
                    'is_active' => (bool) $interaction->is_active,
                ];
            })
            ->values()
            ->all();
    }
}
