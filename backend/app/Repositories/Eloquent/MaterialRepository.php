<?php

namespace App\Repositories\Eloquent;

use App\Models\Material;
use App\Models\MaterialReport;
use App\Repositories\Contracts\MaterialRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MaterialRepository implements MaterialRepositoryInterface
{
    private const MATERIAL_COLUMNS = 'material:id,user_id,title,description,subject,file_path,file_type,file_size,deleted_at,created_at,updated_at';

    private const USER_RELATIONS = [
        'user:id,name,email',
        'user.profile:id,user_id,avatar_url',
    ];

    public function paginateMaterials(
        ?string $search,
        ?string $subject,
        int $perPage
    ): LengthAwarePaginator {
        $query = Material::with(self::USER_RELATIONS)->latest();

        if ($search !== null) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($subject !== null) {
            $query->where('subject', $subject);
        }

        return $query->paginate($perPage);
    }

    public function createMaterial(array $data): Material
    {
        return Material::create($data);
    }

    public function updateMaterial(Material $material, array $data): void
    {
        $material->update($data);
    }

    public function deleteMaterial(Material $material): void
    {
        $material->delete();
    }

    public function restoreMaterial(Material $material): void
    {
        $material->restore();
    }

    public function loadMaterialUser(Material $material): Material
    {
        return $material->load(self::USER_RELATIONS);
    }

    public function freshMaterial(Material $material): Material
    {
        return $material->fresh();
    }

    public function reportsByReporter(int $reporterId): Collection
    {
        return MaterialReport::query()
            ->with([
                'material:id,title,subject',
                'reporter:id,name,email',
            ])
            ->where('reporter_id', $reporterId)
            ->latest()
            ->get();
    }

    public function findPendingReport(
        int $materialId,
        int $reporterId
    ): ?MaterialReport {
        return MaterialReport::query()
            ->where('material_id', $materialId)
            ->where('reporter_id', $reporterId)
            ->where('status', 'pending')
            ->first();
    }

    public function createReport(array $data): MaterialReport
    {
        return MaterialReport::create($data);
    }

    public function loadReportBasic(MaterialReport $report): MaterialReport
    {
        return $report->load([
            'material:id,title,subject',
            'reporter:id,name,email',
        ]);
    }

    public function listReports(?string $status): Collection
    {
        return MaterialReport::query()
            ->with($this->reportRelations())
            ->when(
                $status !== null,
                fn ($query) => $query->where('status', $status)
            )
            ->latest()
            ->get();
    }

    public function updateReport(MaterialReport $report, array $data): void
    {
        $report->update($data);
    }

    public function loadReportMaterial(MaterialReport $report): MaterialReport
    {
        return $report->load('material');
    }

    public function loadReportRelations(MaterialReport $report): MaterialReport
    {
        return $report->load($this->reportRelations());
    }

    public function transaction(callable $callback): mixed
    {
        return DB::transaction($callback);
    }

    private function reportRelations(): array
    {
        return [
            self::MATERIAL_COLUMNS,
            'material.user:id,name,email',
            'reporter:id,name,email',
            'reviewer:id,name,email',
        ];
    }
}
