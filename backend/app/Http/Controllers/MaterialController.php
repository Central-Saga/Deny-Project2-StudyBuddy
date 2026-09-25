<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MaterialController extends Controller
{
    /**
     * Tampilkan daftar materi dengan pencarian dan filter subjek.
     */
    public function index(Request $request)
    {
        $query = Material::with([
            'user:id,name,email',
            'user.profile:id,user_id,avatar_url',
        ])->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->trim()->toString();

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('subject') && $request->subject !== 'All') {
            $query->where('subject', $request->subject);
        }

        return MaterialResource::collection(
            $query->paginate(12)
        );
    }

    /**
     * Upload materi baru.
     */
    public function store(StoreMaterialRequest $request)
    {
        $validated = $request->validated();

        $file = $request->file('file');
        $path = $file->store('materials', 'public');

        $material = Material::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'subject' => $validated['subject'],
            'file_path' => $path,
            'file_type' => strtolower($file->getClientOriginalExtension()),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'message' => 'Materi berhasil diunggah!',
            'material' => new MaterialResource(
                $material->load([
                    'user:id,name,email',
                    'user.profile:id,user_id,avatar_url',
                ])
            ),
        ], 201);
    }

    /**
     * Tampilkan detail satu materi.
     */
    public function show(Material $material)
    {
        return new MaterialResource(
            $material->load([
                    'user:id,name,email',
                    'user.profile:id,user_id,avatar_url',
                ])
        );
    }

    /**
     * Update materi. Hanya pemilik materi yang diizinkan.
     *
     * File bersifat opsional. Jika file baru dikirim,
     * file lama akan dihapus setelah data berhasil diperbarui.
     */
    public function update(
        UpdateMaterialRequest $request,
        Material $material
    ) {
        if ((int) $material->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk mengubah materi ini',
            ], 403);
        }

        $validated = $request->validated();

        $updateData = [];

        foreach (['title', 'description', 'subject'] as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        $oldPath = $material->file_path;
        $newPath = null;

        try {
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $newPath = $file->store('materials', 'public');

                $updateData['file_path'] = $newPath;
                $updateData['file_type'] = strtolower(
                    $file->getClientOriginalExtension()
                );
                $updateData['file_size'] = $file->getSize();
            }

            $material->update($updateData);
        } catch (\Throwable $e) {
            if (
                $newPath &&
                Storage::disk('public')->exists($newPath)
            ) {
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

        return response()->json([
            'message' => 'Materi berhasil diperbarui.',
            'material' => new MaterialResource(
                $material->fresh()->load([
                    'user:id,name,email',
                    'user.profile:id,user_id,avatar_url',
                ])
            ),
        ]);
    }

    /**
     * Hapus materi. Hanya pemilik materi yang diizinkan.
     */
    public function destroy(Request $request, Material $material)
    {
        if ((int) $material->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk menghapus materi ini',
            ], 403);
        }

        if (
            $material->file_path &&
            Storage::disk('public')->exists($material->file_path)
        ) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();

        return response()->json([
            'message' => 'Materi berhasil dihapus',
        ]);
    }

    /**
     * Unduh file materi.
     */
    public function download(Material $material)
    {
        $disk = Storage::disk('public');

        if (
            !$material->file_path ||
            !$disk->exists($material->file_path)
        ) {
            return response()->json([
                'message' => 'File tidak ditemukan',
            ], 404);
        }

        $baseName = Str::slug($material->title);

        if ($baseName === '') {
            $baseName = 'materi';
        }

        $downloadName = $baseName . '.' . $material->file_type;

        return response()->download(
            $disk->path($material->file_path),
            $downloadName
        );
    }
}
