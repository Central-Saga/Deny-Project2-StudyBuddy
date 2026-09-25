<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'subject_id' => [
                'sometimes',
                'required',
                'exists:subjects,id',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'max_members' => [
                'sometimes',
                'required',
                'integer',
                'min:2',
                'max:100',
            ],

            'is_private' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}