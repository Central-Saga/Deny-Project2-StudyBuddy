<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;
use App\Services\MaterialService;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function __construct(private readonly MaterialService $service)
    {
    }

    /**
     * Tampilkan daftar materi dengan pencarian dan filter subjek.
     */
    public function index(Request $request)
    {
        $search = $request->filled('search')
            ? $request->string('search')->trim()->toString()
            : null;

        $subject = $request->filled('subject') && $request->subject !== 'All'
            ? $request->subject
            : null;

        $paginator = $this->service->paginate($search, $subject);

        return MaterialResource::collection($paginator)
            ->additional([
                'success' => true,
                'message' => 'Daftar materi berhasil diambil.',
                'errors' => null,
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ]);
    }

    /**
     * Upload materi baru.
     */
    public function store(StoreMaterialRequest $request)
    {
        $material = $this->service->store(
            $request->user()->id,
            $request->validated(),
            $request->file('file')
        );

        return response()->json([
            'message' => 'Materi berhasil diunggah!',
            'material' => new MaterialResource($material),
        ], 201);
    }

    /**
     * Tampilkan detail satu materi.
     */
    public function show(Material $material)
    {
        return new MaterialResource($this->service->show($material));
    }

    /**
     * Update materi. Hanya pemilik materi yang diizinkan.
     */
    public function update(UpdateMaterialRequest $request, Material $material)
    {
        $updated = $this->service->update(
            $material,
            (int) $request->user()->id,
            $request->validated(),
            $request->file('file')
        );

        return response()->json([
            'message' => 'Materi berhasil diperbarui.',
            'material' => new MaterialResource($updated),
        ]);
    }

    /**
     * Hapus materi. Hanya pemilik materi yang diizinkan.
     */
    public function destroy(Request $request, Material $material)
    {
        $this->service->delete($material, (int) $request->user()->id);

        return response()->json([
            'message' => 'Materi berhasil dihapus',
        ]);
    }

    /**
     * Unduh file materi.
     */
    public function download(Material $material)
    {
        $file = $this->service->downloadInfo($material);

        return response()->download($file['path'], $file['name']);
    }
}
