<?php

namespace App\Services\Tutoring;

use RuntimeException;

class TutoringException extends RuntimeException
{
    public function __construct(string $message, private readonly int $status)
    {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }
}
