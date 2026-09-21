<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class BuddyController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        // Jangan tampilkan user yang sedang login
        if ($request->user()) {
            $query->where('id', '!=', $request->user()->id);
        }

        // Search berdasarkan nama atau skill
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('course', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan mata kuliah
        if ($request->has('course') && $request->course != 'Semua') {
            $query->where('course', $request->course);
        }

        return response()->json($query->get());
    }
}