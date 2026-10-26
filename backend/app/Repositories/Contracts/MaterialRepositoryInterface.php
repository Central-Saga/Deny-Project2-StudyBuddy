<?php

namespace App\Repositories\Contracts;

use App\Models\Material;
use App\Models\MaterialReport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface MaterialRepositoryInterface
{
    public function paginateMaterials(
        ?string $search,
        ?string $subject,
        int $perPage
    ): LengthAwarePaginator;

    public function createMaterial(array $data): Material;

    public function updateMaterial(Material $material, array $data): void;

    public function deleteMaterial(Material $material): void;

    public function restoreMaterial(Material $material): void;

    public function loadMaterialUser(Material $material): Material;

    public function freshMaterial(Material $material): Material;

    public function reportsByReporter(int $reporterId): Collection;

    public function findPendingReport(
        int $materialId,
        int $reporterId
    ): ?MaterialReport;

    public function createReport(array $data): MaterialReport;

    public function loadReportBasic(MaterialReport $report): MaterialReport;

    public function listReports(?string $status): Collection;

    public function updateReport(MaterialReport $report, array $data): void;

    public function loadReportMaterial(MaterialReport $report): MaterialReport;

    public function loadReportRelations(MaterialReport $report): MaterialReport;

    public function transaction(callable $callback): mixed;
}
