<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesMaterialExceptions;
use App\Http\Requests\StoreMaterialReportRequest;
use App\Http\Resources\MaterialReportResource;
use App\Models\Material;
use App\Services\MaterialService;
use Illuminate\Http\Request;

class MaterialReportController extends Controller
{
    use HandlesMaterialExceptions;

    public function __construct(private readonly MaterialService $service)
    {
    }

    /**
     * Menampilkan laporan materi yang dibuat oleh user yang sedang login.
     */
    public function index(Request $request)
    {
        $reports = $this->service->reportsByUser($request->user()->id);

        return response()->json([
            'message' => 'Daftar laporan materi berhasil diambil.',
            'data' => MaterialReportResource::collection($reports)
                ->resolve($request),
        ]);
    }

    /**
     * Membuat laporan terhadap sebuah materi.
     */
    public function store(
        StoreMaterialReportRequest $request,
        Material $material
    ) {
        $report = $this->service->report(
            $material,
            $request->user()->id,
            $request->validated()['reason']
        );

        return response()->json([
            'message' => 'Laporan materi berhasil dikirim.',
            'data' => (new MaterialReportResource($report))
                ->resolve($request),
        ], 201);
    }
}
