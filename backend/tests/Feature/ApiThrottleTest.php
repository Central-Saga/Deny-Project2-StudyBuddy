<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiThrottleTest extends TestCase
{
    public function test_login_is_throttled_after_five_attempts(): void
    {
        // IP berbeda pada setiap pengujian untuk menghindari
        // sisa hitungan rate limiter dari pengujian sebelumnya.
        $testIp = '198.18.'
            . random_int(0, 255)
            . '.'
            . random_int(1, 254);

        $this->withServerVariables([
            'REMOTE_ADDR' => $testIp,
        ]);

        $credentials = [
            'email' => 'invalid-throttle-44@example.com',
            'password' => 'wrong-password-123',
        ];

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $response = $this->postJson(
                '/api/v1/login',
                $credentials
            );

            $this->assertNotSame(
                429,
                $response->status(),
                "Login attempt {$attempt} was throttled too early."
            );
        }

        $this->postJson('/api/v1/login', $credentials)
            ->assertStatus(429)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'errors',
            ])
            ->assertJsonPath('success', false);
    }

    public function test_register_is_throttled_after_five_attempts(): void
    {
        $testIp = '198.18.'
            . random_int(0, 255)
            . '.'
            . random_int(1, 254);

        $this->withServerVariables([
            'REMOTE_ADDR' => $testIp,
        ]);

        // Data tidak valid agar tidak membuat pengguna baru.
        $invalidData = [];

        // Lima request pertama menghasilkan validasi 422.
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/v1/register', $invalidData)
                ->assertStatus(422);
        }

        // Request keenam harus dibatasi.
        $this->postJson('/api/v1/register', $invalidData)
            ->assertStatus(429)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'errors',
            ])
            ->assertJsonPath('success', false);
    }
}