<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function index()
    {
        $groups = Group::with(['leader:id,name', 'members:id,name'])->get();
        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'course' => 'required|string',
            'description' => 'nullable|string',
            'max_members' => 'required|integer|min:2',
            'is_private' => 'boolean',
            'schedule' => 'nullable|string',
        ]);

        $group = Group::create([
            ...$validated,
            'leader_id' => $request->user()->id,
        ]);

        // Ketua otomatis jadi anggota pertama
        $group->members()->attach($request->user()->id);

        return response()->json($group->load(['leader', 'members']), 201);
    }

    public function joinToggle(Request $request, $id)
    {
        $group = Group::findOrFail($id);
        $userId = $request->user()->id;

        if ($group->members()->where('user_id', $userId)->exists()) {
            $group->members()->detach($userId);
            return response()->json(['message' => 'Berhasil keluar dari grup']);
        } else {
            if ($group->members()->count() >= $group->max_members) {
                return response()->json(['message' => 'Grup sudah penuh'], 400);
            }
            $group->members()->attach($userId);
            return response()->json(['message' => 'Berhasil bergabung ke grup']);
        }
    }
}