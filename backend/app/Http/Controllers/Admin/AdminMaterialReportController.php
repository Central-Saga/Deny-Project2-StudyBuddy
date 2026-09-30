<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MaterialReportResource;
use App\Models\MaterialReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminMaterialReportController extends Controller
{
    private const STATUSES = [
        'pending',
        'reviewed',
        'dismissed',
        'action_taken',
    ];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'nullable',
                Rule::in(self::STATUSES),
            ],
        ]);

        $reports = MaterialReport::query()
            ->with([
                'material:id,user_id,title,description,subject,file_path,file_type,file_size,deleted_at,created_at,updated_at',
                'material.user:id,name,email',
                'reporter:id,name,email',
                'reviewer:id,name,email',
            ])
            ->when(
                isset($validated['status']),
                fn ($query) => $query->where(
                    'status',
                    $validated['status']
                )
            )
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Daftar laporan material berhasil diambil.',
            'data' => MaterialReportResource::collection($reports)
                ->resolve($request),
        ]);
    }

    public function show(
        Request $request,
        MaterialReport $report
    ): JsonResponse {
        $this->loadReportRelations($report);

        return response()->json([
            'message' => 'Detail laporan material berhasil diambil.',
            'data' => (new MaterialReportResource($report))
                ->resolve($request),
        ]);
    }

    public function update(
        Request $request,
        MaterialReport $report
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(self::STATUSES),
            ],
            'resolution_note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $status = $validated['status'];
        $resolutionNote = trim(
            (string) ($validated['resolution_note'] ?? '')
        );

        if (
            in_array(
                $status,
                ['dismissed', 'action_taken'],
                true
            ) &&
            strlen($resolutionNote) < 10
        ) {
            return response()->json([
                'message' =>
                    'Catatan penyelesaian minimal 10 karakter untuk status Dismissed atau Action Taken.',
                'errors' => [
                    'resolution_note' => [
                        'Catatan penyelesaian minimal 10 karakter.',
                    ],
                ],
            ], 422);
        }

        if ($status === 'pending') {
            $report->update([
                'status' => 'pending',
                'resolution_note' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]);
        } else {
            $report->update([
                'status' => $status,
                'resolution_note' => $resolutionNote !== ''
                    ? $resolutionNote
                    : null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        }

        $this->loadReportRelations($report);

        return response()->json([
            'message' => 'Status laporan material berhasil diperbarui.',
            'data' => (new MaterialReportResource($report))
                ->resolve($request),
        ]);
    }

    public function download(MaterialReport $report)
    {
        $report->load('material');

        $material = $report->material;

        if (!$material) {
            return response()->json([
                'message' => 'Material pada laporan ini tidak ditemukan.',
            ], 404);
        }

        if ($material->trashed()) {
            return response()->json([
                'message' =>
                    'Material sedang dinonaktifkan melalui proses moderasi.',
            ], 410);
        }

        $disk = Storage::disk('public');

        if (
            !$material->file_path ||
            !$disk->exists($material->file_path)
        ) {
            return response()->json([
                'message' => 'File material tidak ditemukan.',
            ], 404);
        }

        $baseName = Str::slug($material->title);

        if ($baseName === '') {
            $baseName = 'material';
        }

        $extension = $material->file_type ?: 'file';

        return response()->download(
            $disk->path($material->file_path),
            $baseName . '.' . $extension
        );
    }

    /**
     * Menonaktifkan material melalui soft delete.
     * File fisik TIDAK dihapus agar material masih dapat dipulihkan.
     */
    public function removeMaterial(
        Request $request,
        MaterialReport $report
    ): JsonResponse {
        $validated = $request->validate([
            'resolution_note' => [
                'required',
                'string',
                'min:10',
                'max:2000',
            ],
        ]);

        $report->load('material');
        $material = $report->material;

        if (!$material) {
            return response()->json([
                'message' => 'Material pada laporan ini tidak ditemukan.',
            ], 404);
        }

        if ($material->trashed()) {
            return response()->json([
                'message' => 'Material ini sudah dinonaktifkan sebelumnya.',
            ], 422);
        }

        DB::transaction(function () use (
            $material,
            $report,
            $validated,
            $request
        ) {
            $material->delete();

            $report->update([
                'status' => 'action_taken',
                'resolution_note' => trim(
                    $validated['resolution_note']
                ),
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        $this->loadReportRelations($report);

        return response()->json([
            'message' =>
                'Material berhasil dinonaktifkan. File tetap disimpan dan material dapat dipulihkan.',
            'data' => (new MaterialReportResource($report))
                ->resolve($request),
        ]);
    }

    /**
     * Mengaktifkan kembali material yang sebelumnya di-soft-delete.
     */
    public function restoreMaterial(
        Request $request,
        MaterialReport $report
    ): JsonResponse {
        $validated = $request->validate([
            'resolution_note' => [
                'required',
                'string',
                'min:10',
                'max:2000',
            ],
        ]);

        $report->load('material');
        $material = $report->material;

        if (!$material) {
            return response()->json([
                'message' => 'Material pada laporan ini tidak ditemukan.',
            ], 404);
        }

        if (!$material->trashed()) {
            return response()->json([
                'message' => 'Material ini masih aktif dan tidak perlu dipulihkan.',
            ], 422);
        }

        $disk = Storage::disk('public');

        if (
            !$material->file_path ||
            !$disk->exists($material->file_path)
        ) {
            return response()->json([
                'message' =>
                    'File material tidak tersedia sehingga material tidak dapat dipulihkan.',
            ], 422);
        }

        DB::transaction(function () use (
            $material,
            $report,
            $validated,
            $request
        ) {
            $material->restore();

            $report->update([
                'status' => 'dismissed',
                'resolution_note' => trim(
                    $validated['resolution_note']
                ),
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        $this->loadReportRelations($report);

        return response()->json([
            'message' =>
                'Material berhasil dipulihkan dan dapat diakses kembali oleh pengguna.',
            'data' => (new MaterialReportResource($report))
                ->resolve($request),
        ]);
    }

    private function loadReportRelations(
        MaterialReport $report
    ): void {
        $report->load([
            'material:id,user_id,title,description,subject,file_path,file_type,file_size,deleted_at,created_at,updated_at',
            'material.user:id,name,email',
            'reporter:id,name,email',
            'reviewer:id,name,email',
        ]);
    }
}
