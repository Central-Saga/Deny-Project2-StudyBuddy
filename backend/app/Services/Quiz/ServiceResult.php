<?php

namespace App\Services\Quiz;

/**
 * Hasil operasi service yang dipetakan controller menjadi JSON response.
 */
class ServiceResult
{
    public function __construct(
        public readonly array $body,
        public readonly int $status = 200
    ) {
    }

    public static function error(string $message, int $status): self
    {
        return new self(['message' => $message], $status);
    }

    public function isError(): bool
    {
        return $this->status >= 400;
    }
}
