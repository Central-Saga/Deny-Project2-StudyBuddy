<?php

namespace App\Http\Controllers\Concerns;

use App\Exceptions\DomainException;
use Symfony\Component\HttpFoundation\Response;

trait HandlesDomainExceptions
{
    /**
     * Jalankan aksi controller dan ubah DomainException menjadi respons JSON.
     */
    protected function handle(callable $action): Response
    {
        try {
            return $action();
        } catch (DomainException $e) {
            return $e->toResponse();
        }
    }
}
