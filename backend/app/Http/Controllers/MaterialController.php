<?php

namespace App\Http\Controllers;

use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    /**
     * Tampilkan daftar materi (dengan fitur pencarian & filter subjek)
     */
    public function index(Request $request)
    {
        $query = Material::with('user:id,name,email')->latest();

        // Filter Pencarian kata kunci
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan Subjek
        if ($request->filled('subject') && $request->subject !== 'All') {
            $query->where('subject', $request->subject);
        }

        return response()->json($query->paginate(12));
    }

    /**
     * Upload materi baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject'     => 'required|string|max:100',
            'file'        => 'required|file|mimes:pdf,doc,docx,ppt,pptx,zip,rar,jpg,png|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->store('materials', 'public');

        $material = Material::create([
            'user_id'     => $request->user()->id,
            'title'       => $request->title,
            'description' => $request->description,
            'subject'     => $request->subject,
            'file_path'   => $path,
            'file_type'   => $file->getClientOriginalExtension(),
            'file_size'   => $file->getSize(),
        ]);

        return response()->json([
            'message'  => 'Materi berhasil diunggah!',
            'material' => $material->load('user:id,name,email'),
        ], 201);
    }

    /**
     * Tampilkan detail satu materi
     */
    public function show(Material $material)
    {
        return response()->json(
            $material->load('user:id,name,email')
        );
    }

    /**
     * Hapus materi (Hanya pemilik/pembuat materi yang diizinkan)
     */
    public function destroy(Request $request, Material $material)
    {
        if ($material->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk menghapus materi ini'
            ], 403);
        }

        if (Storage::disk('public')->exists($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return response()->json([
            'message' => 'Materi berhasil dihapus'
        ]);
    }

    /**
     * Unduh file materi
     */
    public function download(Material $material)
    {
        $filePath = storage_path('app/public/' . $material->file_path);

        if (!file_exists($filePath)) {
            return response()->json([
                'message' => 'File tidak ditemukan'
            ], 404);
        }

        return response()->download(
            $filePath,
            $material->title . '.' . $material->file_type
        );
    }
}