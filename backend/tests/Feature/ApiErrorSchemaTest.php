<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiErrorSchemaTest extends TestCase
{
    public function test_api_error_500_uses_safe_json_schema(): void
    {
        // Simulasikan konfigurasi production.
        config()->set('app.debug', false);

        // Route ini hanya dibuat selama pengujian.
        Route::middleware('api')->get(
            '/api/v1/__test-server-error',
            function () {
                throw new \RuntimeException(
                    'SECRET_INTERNAL_ERROR_44'
                );
            }
        );

        $response = $this->getJson(
            '/api/v1/__test-server-error'
        );

        $response
            ->assertStatus(500)
            ->assertExactJson([
                'success' => false,
                'message' => 'Terjadi kesalahan pada server.',
                'data' => null,
                'errors' => null,
            ])
            ->assertDontSee('SECRET_INTERNAL_ERROR_44');
    }
}
