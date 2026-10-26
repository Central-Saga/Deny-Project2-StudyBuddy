<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StudyGroup;
use App\Services\AdminGroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminGroupController extends Controller
{
    public function __construct(
        private readonly AdminGroupService $service
    ) {}

    /**
     * Menampilkan seluruh study group untuk monitoring admin.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'privacy' => ['nullable', 'in:public,private'],
        ]);

        return response()->json([
            'message' => 'Daftar study group berhasil diambil.',
            'data' => $this->service->list(
                $validated['search'] ?? null,
                $validated['privacy'] ?? null
            ),
        ]);
    }

    /**
     * Menampilkan detail study group untuk monitoring admin.
     */
    public function show(StudyGroup $group): JsonResponse
    {
        return response()->json([
            'message' => 'Detail study group berhasil diambil.',
            'data' => $this->service->detail($group),
        ]);
    }
}
