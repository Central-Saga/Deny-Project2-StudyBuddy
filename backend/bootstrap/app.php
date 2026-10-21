<?php

use App\Http\Middleware\ActiveAccountMiddleware;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        $middleware->statefulApi();

        $middleware->alias([
            'active' => ActiveAccountMiddleware::class,
            'admin' => AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        // Semua endpoint API harus merespons menggunakan JSON.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) =>
                $request->is('api/*') ||
                $request->expectsJson(),
        );

        // Pertahankan detail validasi untuk error 422.
        $exceptions->render(function (
            ValidationException $exception,
            Request $request
        ) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => 'Data yang dikirim tidak valid.',
                'data' => null,
                'errors' => $exception->errors(),
            ], 422);
        });

        // Standarisasi semua respons error API.
        $exceptions->respond(function (Response $response) {
            $status = $response->getStatusCode();

            if (
                ! request()->is('api/*') ||
                $status < 400
            ) {
                return $response;
            }

            // Ambil respons JSON sebelumnya jika tersedia.
            $original = $response instanceof JsonResponse
                ? $response->getData(true)
                : [];

            if (! is_array($original)) {
                $original = [];
            }

            // Jangan bocorkan detail error internal server.
            if ($status >= 500) {
                $message = 'Terjadi kesalahan pada server.';
                $errors = null;
            } elseif ($status === 429) {
                $message = 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
                $errors = null;
            } else {
                // Pertahankan pesan error asli bila tersedia.
                $message = is_string($original['message'] ?? null)
                    && trim($original['message']) !== ''
                        ? $original['message']
                        : (Response::$statusTexts[$status]
                            ?? 'Permintaan gagal.');

                // Detail validasi dan error lain tetap dipertahankan.
                $errors = is_array($original['errors'] ?? null)
                    ? $original['errors']
                    : null;
            }

            $standard = [
                'success' => false,
                'message' => $message,
                'data' => null,
                'errors' => $errors,
            ];

            // Ubah body respons tanpa kehilangan header asli,
            // termasuk Retry-After pada HTTP 429.
            if ($response instanceof JsonResponse) {
                $response->setData($standard);

                return $response;
            }

            $jsonResponse = response()->json(
                $standard,
                $status
            );

            // Pertahankan header penting dari respons non-JSON.
            foreach ([
                'Retry-After',
                'WWW-Authenticate',
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
            ] as $header) {
                if ($response->headers->has($header)) {
                    $jsonResponse->headers->set(
                        $header,
                        $response->headers->get($header)
                    );
                }
            }

            return $jsonResponse;
        });
    })
    ->create();