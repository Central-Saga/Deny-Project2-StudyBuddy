<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'material_id' => $this->material_id,
            'reporter_id' => $this->reporter_id,

            'reason' => $this->reason,
            'status' => $this->status,

            'resolution_note' =>
                $this->resolution_note,

            'reviewed_by' =>
                $this->reviewed_by,

            'reviewed_at' =>
                $this->reviewed_at
                    ?->toIso8601String(),

            'created_at' =>
                $this->created_at
                    ?->toIso8601String(),

            'updated_at' =>
                $this->updated_at
                    ?->toIso8601String(),

            'material' =>
                $this->whenLoaded(
                    'material',
                    function () {
                        if (!$this->material) {
                            return null;
                        }

                        return [
                            'id' =>
                                $this->material->id,

                            'user_id' =>
                                $this->material->user_id,

                            'title' =>
                                $this->material->title,

                            'description' =>
                                $this->material->description,

                            'subject' =>
                                $this->material->subject,

                            'file_type' =>
                                $this->material->file_type,

                            'file_size' =>
                                $this->material->file_size,

                            'is_removed' =>
                                $this->material->trashed(),

                            'deleted_at' =>
                                $this->material->deleted_at
                                    ?->toIso8601String(),

                            'uploader' =>
                                $this->material
                                    ->relationLoaded('user') &&
                                $this->material->user
                                    ? [
                                        'id' =>
                                            $this->material
                                                ->user->id,

                                        'name' =>
                                            $this->material
                                                ->user->name,

                                        'email' =>
                                            $this->material
                                                ->user->email,
                                    ]
                                    : null,
                        ];
                    }
                ),

            'reporter' =>
                $this->whenLoaded(
                    'reporter',
                    function () {
                        if (!$this->reporter) {
                            return null;
                        }

                        return [
                            'id' =>
                                $this->reporter->id,

                            'name' =>
                                $this->reporter->name,

                            'email' =>
                                $this->reporter->email,
                        ];
                    }
                ),

            'reviewer' =>
                $this->whenLoaded(
                    'reviewer',
                    function () {
                        if (!$this->reviewer) {
                            return null;
                        }

                        return [
                            'id' =>
                                $this->reviewer->id,

                            'name' =>
                                $this->reviewer->name,

                            'email' =>
                                $this->reviewer->email,
                        ];
                    }
                ),
        ];
    }
}