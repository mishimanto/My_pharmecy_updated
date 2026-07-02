<?php

return [
    'enabled' => env('CUSTOMER_AI_ENABLED', false),

    'provider' => env('CUSTOMER_AI_PROVIDER', env('AI_PROVIDER', 'openai')),
    'model' => env('CUSTOMER_AI_MODEL'),
    'timeout' => (int) env('CUSTOMER_AI_TIMEOUT', 25),
    'max_tokens' => (int) env('CUSTOMER_AI_MAX_TOKENS', 700),
    'temperature' => (float) env('CUSTOMER_AI_TEMPERATURE', 0.2),

    'features' => [
        'product_questions' => env('CUSTOMER_AI_PRODUCT_QA_ENABLED', true),
        'smart_search' => env('CUSTOMER_AI_SMART_SEARCH_ENABLED', true),
        'support_assistant' => env('CUSTOMER_AI_SUPPORT_ENABLED', true),
        'prescription_summary' => env('CUSTOMER_AI_PRESCRIPTION_SUMMARY_ENABLED', false),
    ],

    'safety_disclaimer' => 'This answer is general pharmacy information only. It is not a diagnosis or prescription. Please consult a doctor or pharmacist before using medicine.',
];
