<?php

namespace App\Models\Concerns;

use App\Support\Currency;

trait RoundsCurrencyAttributes
{
    protected static function bootRoundsCurrencyAttributes(): void
    {
        static::saving(function ($model) {
            foreach ($model->roundedCurrencyAttributes() as $attribute) {
                if (! array_key_exists($attribute, $model->getAttributes())) {
                    continue;
                }

                $value = $model->getAttribute($attribute);

                if ($value === null || $value === '') {
                    continue;
                }

                $model->setAttribute($attribute, Currency::whole($value));
            }
        });
    }

    protected function roundedCurrencyAttributes(): array
    {
        return [];
    }
}
