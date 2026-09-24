<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'skills' => ['nullable', 'array'],
            'bio' => ['nullable', 'string'],
        ];
    }
}