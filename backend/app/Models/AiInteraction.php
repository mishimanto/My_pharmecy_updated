<?php

namespace App\Models;

class AiInteraction extends PharmacyModel
{
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'prompt_tokens' => 'integer',
            'completion_tokens' => 'integer',
            'total_tokens' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
