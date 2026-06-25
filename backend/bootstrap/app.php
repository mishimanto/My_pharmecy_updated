<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        $middleware->alias([
            'customer.auth' => \App\Http\Middleware\EnsureCustomerToken::class,
            'staff.auth' => \App\Http\Middleware\EnsureStaffToken::class,
            'customer.token' => \App\Http\Middleware\EnsureCustomerToken::class,
            'staff.token' => \App\Http\Middleware\EnsureStaffToken::class,
            'permission' => \App\Http\Middleware\EnsureStaffPermission::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'ভ্যালিডেশন ব্যর্থ হয়েছে',
                'data' => null,
                'errors' => $exception->errors(),
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'অনুমোদিত টোকেন প্রয়োজন।',
                'data' => null,
                'errors' => null,
            ], 401);
        });

        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage() ?: 'রিকোয়েস্ট সম্পন্ন করা যায়নি।',
                'data' => null,
                'errors' => null,
            ], $exception->getStatusCode());
        });
    })->create();
