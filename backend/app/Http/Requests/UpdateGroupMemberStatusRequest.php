<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGroupMemberStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'manageMembers',
            $this->route('group')
        ) ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    'accepted',
                    'rejected',
                ]),
            ],
        ];
    }
}
