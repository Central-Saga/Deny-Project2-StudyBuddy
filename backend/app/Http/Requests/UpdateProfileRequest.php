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
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'course' => [
                'nullable',
                'string',
                'max:255',
            ],

            'skills' => [
                'nullable',
                'array',
            ],

            'skills.*' => [
                'string',
                'max:100',
            ],

            'bio' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'phone_number' => [
                'nullable',
                'string',
                'max:30',
            ],

            'university' => [
                'nullable',
                'string',
                'max:255',
            ],

            'major' => [
                'nullable',
                'string',
                'max:255',
            ],

            'github_url' => [
                'nullable',
                'url',
                'max:255',
            ],

            'linkedin_url' => [
                'nullable',
                'url',
                'max:255',
            ],
        ];
    }
}