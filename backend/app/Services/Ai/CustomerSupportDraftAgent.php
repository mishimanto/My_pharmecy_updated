<?php

namespace App\Services\Ai;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;

#[MaxTokens(650)]
#[Temperature(0.2)]
#[Timeout(25)]
class CustomerSupportDraftAgent implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
You help a customer prepare a pharmacy support ticket.

Rules:
- The customer may write Bangla, Banglish, or English.
- Do not diagnose, prescribe, or give medical instructions.
- Do not promise refunds, replacements, delivery times, or approval.
- Keep the message clear, polite, and useful for support staff.
- If important information is missing, list it in missing_information.
- Return only a valid JSON object.

JSON shape:
{
  "subject": "short support ticket subject",
  "draft_message": "customer-ready ticket description",
  "priority": "low|normal|high|urgent",
  "category": "order|delivery|payment|prescription|product|return|general",
  "summary": "one sentence summary for the customer",
  "missing_information": ["item 1", "item 2"]
}
PROMPT;
    }
}
