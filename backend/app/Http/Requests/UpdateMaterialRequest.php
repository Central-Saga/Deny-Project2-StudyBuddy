<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'subject' => ['sometimes', 'required', 'string', 'max:100'],
            'file' => [
                'sometimes',
                'nullable',
                'file',
                'mimes:pdf,doc,docx,ppt,pptx,zip,rar,jpg,png',
                'max:10240',
            ],
        ];
    }
}