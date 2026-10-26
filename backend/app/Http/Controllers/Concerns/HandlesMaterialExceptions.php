<?php

namespace App\Http\Controllers\Concerns;

use App\Exceptions\MaterialException;

trait HandlesMaterialExceptions
{
    /**
     * Ubah MaterialException menjadi respons JSON {message}. Ditangani di
     * controller karena handler global menulis ulang skema error.
     */
    public function callAction($method, $parameters)
    {
        try {
            return $this->{$method}(...array_values($parameters));
        } catch (MaterialException $e) {
            return $e->toResponse();
        }
    }
}
