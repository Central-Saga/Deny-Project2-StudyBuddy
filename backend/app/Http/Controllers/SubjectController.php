<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Support\Facades\Cache;

class SubjectController extends Controller
{
    public function index()
    {
        $subjects = Cache::remember(
            'subjects:list',
            config('cache.ttl'),
            fn () => Subject::query()
                ->select('id', 'code', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn (Subject $s) => $s->only(['id', 'code', 'name']))
                ->all()
        );

        return response()->json($subjects);
    }
}