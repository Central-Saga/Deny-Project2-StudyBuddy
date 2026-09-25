<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'skills.*' => ['string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:2000'],

            'phone_number' => ['nullable', 'string', 'max:30'],
            'university' => ['nullable', 'string', 'max:255'],
            'major' => ['nullable', 'string', 'max:255'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],

            'learning_styles' => ['nullable', 'array', 'max:4'],
            'learning_styles.*' => [
                'string',
                'distinct',
                Rule::in([
                    'Visual',
                    'Diskusi',
                    'Membaca Mandiri',
                    'Praktik Soal',
                ]),
            ],

            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => [
                'integer',
                'distinct',
                'exists:subjects,id',
            ],

            'availabilities' => ['nullable', 'array'],
            'availabilities.*.day_of_week' => [
                'required',
                'integer',
                'between:0,6',
            ],
            'availabilities.*.start_time' => [
                'required',
                'date_format:H:i',
            ],
            'availabilities.*.end_time' => [
                'required',
                'date_format:H:i',
            ],
            'availabilities.*.timezone' => [
                'nullable',
                'string',
                'max:64',
            ],
            'availabilities.*.is_recurring' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                foreach ($this->input('availabilities', []) as $index => $availability) {
                    $start = $availability['start_time'] ?? null;
                    $end = $availability['end_time'] ?? null;

                    if ($start && $end && $end <= $start) {
                        $validator->errors()->add(
                            "availabilities.{$index}.end_time",
                            'Jam selesai harus setelah jam mulai.'
                        );
                    }
                }
            },
        ];
    }
}
