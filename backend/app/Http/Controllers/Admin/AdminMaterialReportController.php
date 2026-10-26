<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HandlesMaterialExceptions;
use App\Http\Controllers\Controller;
use App\Http\Resources\MaterialReportResource;
use App\Models\MaterialReport;
use App\Services\AdminMaterialReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminMaterialReportController extends Controller
{
    use HandlesMaterialExceptions;

    public function __construct(
        private readonly AdminMaterialReportService $service
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(AdminMaterialReportService::STATUSES)],
        ]);

        $reports = $this->service->list($validated['status'] ?? null);

        return response()->json([
            'message' => 'Daftar laporan material berhasil diambil.',
            'data' => MaterialReportResource::collection($reports)
                ->resolve($request),
        ]);
    }

    public function show(Request $request, MaterialReport $report): JsonResponse
    {
        return $this->reportResponse(
            $request,
            'Detail laporan material berhasil diambil.',
            $this->service->show($report)
        );
    }

    public function update(Request $request, MaterialReport $report): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(AdminMaterialReportService::STATUSES),
            ],
            'resolution_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $report = $this->service->updateStatus(
            $report,
            $request->user()->id,
            $validated['status'],
            $validated['resolution_note'] ?? null
        );

        return $this->reportResponse(
            $request,
            'Status laporan material berhasil diperbarui.',
            $report
        );
    }

    public function download(MaterialReport $report)
    {
        $file = $this->service->downloadInfo($report);

        return response()->download($file['path'], $file['name']);
    }

    /**
     * Menonaktifkan material melalui soft delete.
     * File fisik TIDAK dihapus agar material masih dapat dipulihkan.
     */
    public function removeMaterial(
        Request $request,
        MaterialReport $report
    ): JsonResponse {
        $validated = $this->validateNote($request);

        $report = $this->service->removeMaterial(
            $report,
            $request->user()->id,
            $validated['resolution_note']
        );

        return $this->reportResponse(
            $request,
            'Material berhasil dinonaktifkan. File tetap disimpan dan material dapat dipulihkan.',
            $report
        );
    }

    /**
     * Mengaktifkan kembali material yang sebelumnya di-soft-delete.
     */
    public function restoreMaterial(
        Request $request,
        MaterialReport $report
    ): JsonResponse {
        $validated = $this->validateNote($request);

        $report = $this->service->restoreMaterial(
            $report,
            $request->user()->id,
            $validated['resolution_note']
        );

        return $this->reportResponse(
            $request,
            'Material berhasil dipulihkan dan dapat diakses kembali oleh pengguna.',
            $report
        );
    }

    private function validateNote(Request $request): array
    {
        return $request->validate([
            'resolution_note' => ['required', 'string', 'min:10', 'max:2000'],
        ]);
    }

    private function reportResponse(
        Request $request,
        string $message,
        MaterialReport $report
    ): JsonResponse {
        return response()->json([
            'message' => $message,
            'data' => (new MaterialReportResource($report))
                ->resolve($request),
        ]);
    }
}
