<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Error domain yang dipetakan controller menjadi JSON {message}
 * dengan status tertentu.
 */
class DomainException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly int $status = 422
    ) {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function toResponse(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
        ], $this->status);
    }
}
