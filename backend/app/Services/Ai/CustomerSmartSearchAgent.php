<?php

namespace App\Services\Ai;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;

#[MaxTokens(450)]
#[Temperature(0.1)]
#[Timeout(20)]
class CustomerSmartSearchAgent implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
You convert customer pharmacy search text into practical product search terms.

Rules:
- The customer may write Bangla, Banglish, or English.
- Do not diagnose or give medical advice.
- Return only a valid JSON object.
- Keep terms short and useful for searching product_name, generic_name, brand_name, category, or dosage form.
- Include generic medicine names when the customer intent is obvious.
- Do not invent unavailable brands.

JSON shape:
{
  "search_terms": ["term 1", "term 2"],
  "intent": "short customer intent",
  "note": "short safe customer-facing note"
}
PROMPT;
    }
}
