<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialReportRequest;
use App\Http\Resources\MaterialReportResource;
use App\Models\Material;
use App\Models\MaterialReport;
use Illuminate\Http\Request;

class MaterialReportController extends Controller
{
    /**
     * Menampilkan laporan materi yang dibuat oleh user yang sedang login.
     */
    public function index(Request $request)
    {
        $reports = MaterialReport::query()
            ->with([
                'material:id,title,subject',
                'reporter:id,name,email',
            ])
            ->where('reporter_id', $request->user()->id)
            ->latest()
            ->get();

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
        $user = $request->user();

        /*
         * Cegah user membuat laporan pending berulang
         * terhadap materi yang sama.
         */
        $existingReport = MaterialReport::query()
            ->where('material_id', $material->id)
            ->where('reporter_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existingReport) {
            return response()->json([
                'message' => 'Anda sudah memiliki laporan yang masih menunggu review untuk materi ini.',
            ], 422);
        }

        $report = MaterialReport::create([
            'material_id' => $material->id,
            'reporter_id' => $user->id,
            'reason' => $request->validated()['reason'],
            'status' => 'pending',
        ]);

        $report->load([
            'material:id,title,subject',
            'reporter:id,name,email',
        ]);

        return response()->json([
            'message' => 'Laporan materi berhasil dikirim.',
            'data' => (new MaterialReportResource($report))
                ->resolve($request),
        ], 201);
    }
}