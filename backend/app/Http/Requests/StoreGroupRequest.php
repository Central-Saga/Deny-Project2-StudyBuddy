<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'description' => ['nullable', 'string'],
            'max_members' => ['required', 'integer', 'min:2', 'max:100'],
            'is_private' => ['boolean'],
        ];
    }
}