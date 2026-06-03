<?php

namespace App\Support;

trait ApiResponse
{
    protected function ok(mixed $data = null, string $message = 'OK', int $status = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ], $status);
    }

    protected function fail(string $message, int $status = 422, mixed $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $status);
    }
}
