<?php

namespace App\Services;

use App\Exceptions\MaterialException;
use App\Models\Material;
use App\Models\MaterialReport;
use App\Repositories\Contracts\MaterialRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MaterialService
{
    public function __construct(
        private readonly MaterialRepositoryInterface $materials
    ) {
    }

    public function paginate(?string $search, ?string $subject): LengthAwarePaginator
    {
        return $this->materials->paginateMaterials($search, $subject, 12);
    }

    public function show(Material $material): Material
    {
        return $this->materials->loadMaterialUser($material);
    }

    public function store(int $userId, array $validated, UploadedFile $file): Material
    {
        $path = $file->store('materials', 'public');

        $material = $this->materials->createMaterial([
            'user_id' => $userId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'subject' => $validated['subject'],
            'file_path' => $path,
            'file_type' => strtolower($file->getClientOriginalExtension()),
            'file_size' => $file->getSize(),
        ]);

        return $this->materials->loadMaterialUser($material);
    }

    /**
     * File lama dihapus setelah data berhasil diperbarui.
     */
    public function update(
        Material $material,
        int $userId,
        array $validated,
        ?UploadedFile $file
    ): Material {
        if ((int) $material->user_id !== $userId) {
            throw new MaterialException(
                'Anda tidak memiliki akses untuk mengubah materi ini',
                403
            );
        }

        $updateData = [];

        foreach (['title', 'description', 'subject'] as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        $oldPath = $material->file_path;
        $newPath = null;

        try {
            if ($file) {
                $newPath = $file->store('materials', 'public');

                $updateData['file_path'] = $newPath;
                $updateData['file_type'] = strtolower(
                    $file->getClientOriginalExtension()
                );
                $updateData['file_size'] = $file->getSize();
            }

            $this->materials->updateMaterial($material, $updateData);
        } catch (\Throwable $e) {
            if ($newPath && Storage::disk('public')->exists($newPath)) {
                Storage::disk('public')->delete($newPath);
            }

            throw $e;
        }

        if (
            $newPath &&
            $oldPath &&
            $oldPath !== $newPath &&
            Storage::disk('public')->exists($oldPath)
        ) {
            Storage::disk('public')->delete($oldPath);
        }

        return $this->materials->loadMaterialUser(
            $this->materials->freshMaterial($material)
        );
    }

    public function delete(Material $material, int $userId): void
    {
        if ((int) $material->user_id !== $userId) {
            throw new MaterialException(
                'Anda tidak memiliki akses untuk menghapus materi ini',
                403
            );
        }

        if (
            $material->file_path &&
            Storage::disk('public')->exists($material->file_path)
        ) {
            Storage::disk('public')->delete($material->file_path);
        }

        $this->materials->deleteMaterial($material);
    }

    /**
     * @return array{path: string, name: string}
     */
    public function downloadInfo(Material $material): array
    {
        $disk = Storage::disk('public');

        if (!$material->file_path || !$disk->exists($material->file_path)) {
            throw new MaterialException('File tidak ditemukan', 404);
        }

        $baseName = Str::slug($material->title);

        if ($baseName === '') {
            $baseName = 'materi';
        }

        return [
            'path' => $disk->path($material->file_path),
            'name' => $baseName . '.' . $material->file_type,
        ];
    }

    public function reportsByUser(int $userId): Collection
    {
        return $this->materials->reportsByReporter($userId);
    }

    public function report(Material $material, int $userId, string $reason): MaterialReport
    {
        // Cegah laporan pending berulang terhadap materi yang sama.
        if ($this->materials->findPendingReport($material->id, $userId)) {
            throw new MaterialException(
                'Anda sudah memiliki laporan yang masih menunggu review untuk materi ini.',
                422
            );
        }

        $report = $this->materials->createReport([
            'material_id' => $material->id,
            'reporter_id' => $userId,
            'reason' => $reason,
            'status' => 'pending',
        ]);

        return $this->materials->loadReportBasic($report);
    }
}
