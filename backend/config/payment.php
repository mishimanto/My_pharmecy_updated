<?php

return [
    'channels' => [
        'BKASH' => [
            'label' => 'bKash',
            'number' => env('PAYMENT_BKASH_NUMBER', ''),
            'account_name' => env('PAYMENT_BKASH_ACCOUNT_NAME', 'My Pharmecy'),
            'dial_code' => '*247#',
        ],
        'NAGAD' => [
            'label' => 'Nagad',
            'number' => env('PAYMENT_NAGAD_NUMBER', ''),
            'account_name' => env('PAYMENT_NAGAD_ACCOUNT_NAME', 'My Pharmecy'),
            'dial_code' => '*167#',
        ],
    ],
];
