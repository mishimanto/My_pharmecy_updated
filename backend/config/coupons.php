<?php

return [
    'available' => [
        'SAVE50' => [
            'label' => 'Save Tk 50',
            'type' => 'fixed',
            'amount' => 50,
            'min_subtotal' => 500,
        ],
        'SAVE10' => [
            'label' => '10% off',
            'type' => 'percent',
            'amount' => 10,
            'min_subtotal' => 300,
            'max_discount' => 200,
        ],
        'FREESHIP' => [
            'label' => 'Free delivery',
            'type' => 'free_delivery',
            'amount' => 0,
            'min_subtotal' => 200,
        ],
    ],
];
