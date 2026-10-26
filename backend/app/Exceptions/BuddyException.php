<?php

namespace App\Exceptions;

use RuntimeException;

class BuddyException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status,
        public readonly array $extra = []
    ) {
        parent::__construct($message);
    }

    public function payload(): array
    {
        return ['message' => $this->getMessage()] + $this->extra;
    }
}
