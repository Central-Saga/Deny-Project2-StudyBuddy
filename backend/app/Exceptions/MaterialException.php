<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class MaterialException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly int $status,
        private readonly ?array $errors = null
    ) {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        $body = ['message' => $this->getMessage()];

        if ($this->errors !== null) {
            $body['errors'] = $this->errors;
        }

        return response()->json($body, $this->status);
    }
}
