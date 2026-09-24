<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudySessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'meeting_link' => [
                'nullable',
                'url',
                'max:1000',
            ],
            'max_participants' => [
                'sometimes',
                'required',
                'integer',
                'min:2',
                'max:100',
            ],
            'scheduled_at' => [
                'sometimes',
                'required',
                'date',
            ],
            'duration_minutes' => [
                'sometimes',
                'required',
                'integer',
                'min:15',
                'max:480',
            ],
        ];
    }
}