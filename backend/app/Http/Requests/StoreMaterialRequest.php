<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'subject' => ['required', 'string', 'max:100'],
            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,ppt,pptx,zip,rar,jpg,png',
                'max:10240',
            ],
        ];
    }
}