<?php

namespace App\Http\Controllers;

use App\Http\Resources\SubjectResource;
use App\Models\Subject;

class SubjectController extends Controller
{
    public function index()
    {
        $subjects = Subject::query()
            ->select('id', 'code', 'name')
            ->orderBy('name')
            ->get();

        return response()->json(
            SubjectResource::collection($subjects)
        );
    }
}