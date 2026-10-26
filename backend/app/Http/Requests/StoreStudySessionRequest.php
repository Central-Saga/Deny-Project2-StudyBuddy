<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudySessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'study_group_id' => [
                'required',
                Rule::exists('study_groups', 'id')
                    ->whereNull('deleted_at'),
            ],
            'title' => [
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
                'required',
                'integer',
                'min:2',
                'max:100',
            ],
            'scheduled_at' => [
                'required',
                'date',
            ],
            'duration_minutes' => [
                'required',
                'integer',
                'min:15',
                'max:480',
            ],
        ];
    }
}