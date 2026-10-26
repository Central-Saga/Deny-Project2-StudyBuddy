<?php

namespace App\Http\Controllers;

use App\Exceptions\BuddyException;
use App\Http\Resources\BuddyConnectionResource;
use App\Http\Resources\BuddyUserResource;
use App\Models\BuddyConnection;
use App\Services\BuddyService;
use Closure;
use Illuminate\Http\Request;

class BuddyController extends Controller
{
    public function __construct(private readonly BuddyService $service)
    {
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:255'],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['integer', 'distinct', 'exists:subjects,id'],
            'learning_styles' => ['nullable', 'array'],
            'learning_styles.*' => [
                'string',
                'in:Visual,Diskusi,Membaca Mandiri,Praktik Soal',
            ],
            'day_of_week' => [
                'nullable',
                'integer',
                'between:0,6',
                'required_with:start_time,end_time',
            ],
            'start_time' => [
                'nullable',
                'date_format:H:i',
                'required_with:day_of_week,end_time',
            ],
            'end_time' => [
                'nullable',
                'date_format:H:i',
                'after:start_time',
                'required_with:day_of_week,start_time',
            ],
        ]);

        return $this->service->index(
            $request->user(),
            $validated,
            max(1, (int) $request->input('page', 1)),
            $request->url(),
            $request->query()
        );
    }

    public function show(Request $request, int $id)
    {
        return $this->respond(function () use ($request, $id) {
            $result = $this->service->show($request->user(), $id);

            $buddyData = (new BuddyUserResource($result['buddy']))
                ->resolve($request);

            $buddyData['related_groups'] = $result['related_groups'];

            return response()->json(['data' => $buddyData]);
        });
    }

    public function connections(Request $request)
    {
        $connections = $this->service->connections($request->user());

        return response()->json([
            'data' => BuddyConnectionResource::collection(
                $connections
            )->resolve($request),
        ]);
    }

    public function connect(Request $request, int $id)
    {
        return $this->respond(function () use ($request, $id) {
            $connection = $this->service->connect($request->user(), $id);

            return response()->json([
                'message' => 'Permintaan koneksi berhasil dikirim.',
                'data' => (new BuddyConnectionResource($connection))
                    ->resolve($request),
            ], 201);
        });
    }

    public function accept(Request $request, BuddyConnection $connection)
    {
        return $this->respond(function () use ($request, $connection) {
            $connection = $this->service->accept(
                $request->user(),
                $connection
            );

            return response()->json([
                'message' => 'Permintaan buddy berhasil diterima.',
                'data' => (new BuddyConnectionResource($connection))
                    ->resolve($request),
            ]);
        });
    }

    public function reject(Request $request, BuddyConnection $connection)
    {
        return $this->respond(function () use ($request, $connection) {
            $this->service->reject($request->user(), $connection);

            return response()->json([
                'message' => 'Permintaan buddy berhasil ditolak.',
            ]);
        });
    }

    public function destroy(Request $request, BuddyConnection $connection)
    {
        return $this->respond(function () use ($request, $connection) {
            return response()->json([
                'message' => $this->service->destroy(
                    $request->user(),
                    $connection
                ),
            ]);
        });
    }

    private function respond(Closure $action)
    {
        try {
            return $action();
        } catch (BuddyException $e) {
            return response()->json($e->payload(), $e->status);
        }
    }
}
