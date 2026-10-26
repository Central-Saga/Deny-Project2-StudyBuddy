<?php

namespace App\Services;

use App\Exceptions\MaterialException;
use App\Models\MaterialReport;
use App\Repositories\Contracts\MaterialRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminMaterialReportService
{
    public const STATUSES = [
        'pending',
        'reviewed',
        'dismissed',
        'action_taken',
    ];

    public function __construct(
        private readonly MaterialRepositoryInterface $materials
    ) {
    }

    public function list(?string $status): Collection
    {
        return $this->materials->listReports($status);
    }

    public function show(MaterialReport $report): MaterialReport
    {
        return $this->materials->loadReportRelations($report);
    }

    public function updateStatus(
        MaterialReport $report,
        int $adminId,
        string $status,
        ?string $note
    ): MaterialReport {
        $resolutionNote = trim((string) $note);

        if (
            in_array($status, ['dismissed', 'action_taken'], true) &&
            strlen($resolutionNote) < 10
        ) {
            throw new MaterialException(
                'Catatan penyelesaian minimal 10 karakter untuk status Dismissed atau Action Taken.',
                422,
                [
                    'resolution_note' => [
                        'Catatan penyelesaian minimal 10 karakter.',
                    ],
                ]
            );
        }

        if ($status === 'pending') {
            $this->materials->updateReport($report, [
                'status' => 'pending',
                'resolution_note' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]);
        } else {
            $this->materials->updateReport($report, [
                'status' => $status,
                'resolution_note' => $resolutionNote !== ''
                    ? $resolutionNote
                    : null,
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);
        }

        return $this->materials->loadReportRelations($report);
    }

    /**
     * @return array{path: string, name: string}
     */
    public function downloadInfo(MaterialReport $report): array
    {
        $material = $this->materials->loadReportMaterial($report)->material;

        if (!$material) {
            throw new MaterialException(
                'Material pada laporan ini tidak ditemukan.',
                404
            );
        }

        if ($material->trashed()) {
            throw new MaterialException(
                'Material sedang dinonaktifkan melalui proses moderasi.',
                410
            );
        }

        $disk = Storage::disk('public');

        if (!$material->file_path || !$disk->exists($material->file_path)) {
            throw new MaterialException(
                'File material tidak ditemukan.',
                404
            );
        }

        $baseName = Str::slug($material->title);

        if ($baseName === '') {
            $baseName = 'material';
        }

        return [
            'path' => $disk->path($material->file_path),
            'name' => $baseName . '.' . ($material->file_type ?: 'file'),
        ];
    }

    /**
     * Soft delete material; file fisik TIDAK dihapus agar dapat dipulihkan.
     */
    public function removeMaterial(
        MaterialReport $report,
        int $adminId,
        string $note
    ): MaterialReport {
        $material = $this->materials->loadReportMaterial($report)->material;

        if (!$material) {
            throw new MaterialException(
                'Material pada laporan ini tidak ditemukan.',
                404
            );
        }

        if ($material->trashed()) {
            throw new MaterialException(
                'Material ini sudah dinonaktifkan sebelumnya.',
                422
            );
        }

        $this->materials->transaction(function () use ($material, $report, $adminId, $note) {
            $this->materials->deleteMaterial($material);

            $this->materials->updateReport($report, [
                'status' => 'action_taken',
                'resolution_note' => trim($note),
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);
        });

        return $this->materials->loadReportRelations($report);
    }

    public function restoreMaterial(
        MaterialReport $report,
        int $adminId,
        string $note
    ): MaterialReport {
        $material = $this->materials->loadReportMaterial($report)->material;

        if (!$material) {
            throw new MaterialException(
                'Material pada laporan ini tidak ditemukan.',
                404
            );
        }

        if (!$material->trashed()) {
            throw new MaterialException(
                'Material ini masih aktif dan tidak perlu dipulihkan.',
                422
            );
        }

        if (
            !$material->file_path ||
            !Storage::disk('public')->exists($material->file_path)
        ) {
            throw new MaterialException(
                'File material tidak tersedia sehingga material tidak dapat dipulihkan.',
                422
            );
        }

        $this->materials->transaction(function () use ($material, $report, $adminId, $note) {
            $this->materials->restoreMaterial($material);

            $this->materials->updateReport($report, [
                'status' => 'dismissed',
                'resolution_note' => trim($note),
                'reviewed_by' => $adminId,
                'reviewed_at' => now(),
            ]);
        });

        return $this->materials->loadReportRelations($report);
    }
}
