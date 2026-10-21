<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiCorsTest extends TestCase
{
    public function test_allowed_frontend_origin_receives_cors_headers(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type',
        ])->call('OPTIONS', '/api/v1/login');

        $response
            ->assertSuccessful()
            ->assertHeader(
                'Access-Control-Allow-Origin',
                'http://localhost:3000'
            )
            ->assertHeader(
                'Access-Control-Allow-Credentials',
                'true'
            );
    }

    public function test_unlisted_origin_does_not_receive_cors_permission(): void
    {
        $untrustedOrigin = 'https://untrusted.example';

        $response = $this->withHeaders([
            'Origin' => $untrustedOrigin,
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type',
        ])->call('OPTIONS', '/api/v1/login');

        $allowedOrigin = $response->headers->get(
            'Access-Control-Allow-Origin'
        );

        // Domain asing tidak boleh mendapatkan izin CORS.
        $this->assertNotSame(
            $untrustedOrigin,
            $allowedOrigin
        );

        // Wildcard juga tidak boleh digunakan.
        $this->assertNotSame(
            '*',
            $allowedOrigin
        );
    }

}