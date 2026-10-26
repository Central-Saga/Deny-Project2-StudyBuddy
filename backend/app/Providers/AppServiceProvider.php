<?php

namespace App\Providers;

use App\Repositories\Contracts\BuddyRepositoryInterface;
use App\Repositories\Contracts\GroupRepositoryInterface;
use App\Repositories\Contracts\MaterialRepositoryInterface;
use App\Repositories\Contracts\QuizRepositoryInterface;
use App\Repositories\Contracts\TutoringRepositoryInterface;
use App\Repositories\Eloquent\BuddyRepository;
use App\Repositories\Eloquent\GroupRepository;
use App\Repositories\Eloquent\MaterialRepository;
use App\Repositories\Eloquent\QuizRepository;
use App\Repositories\Eloquent\TutoringRepository;
use App\Services\AdminGroupService;
use App\Services\AdminMaterialReportService;
use App\Services\AdminQuizService;
use App\Services\AdminTutorService;
use App\Services\BuddyService;
use App\Services\GroupService;
use App\Services\MaterialService;
use App\Services\QuizService;
use App\Services\SessionParticipantService;
use App\Services\StudySessionService;
use App\Services\TutoringReviewService;
use App\Services\TutoringService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $singletons = [
        BuddyRepositoryInterface::class => BuddyRepository::class,
        GroupRepositoryInterface::class => GroupRepository::class,
        MaterialRepositoryInterface::class => MaterialRepository::class,
        QuizRepositoryInterface::class => QuizRepository::class,
        TutoringRepositoryInterface::class => TutoringRepository::class,

        BuddyService::class => BuddyService::class,
        GroupService::class => GroupService::class,
        AdminGroupService::class => AdminGroupService::class,
        StudySessionService::class => StudySessionService::class,
        SessionParticipantService::class => SessionParticipantService::class,
        MaterialService::class => MaterialService::class,
        AdminMaterialReportService::class => AdminMaterialReportService::class,
        QuizService::class => QuizService::class,
        AdminQuizService::class => AdminQuizService::class,
        TutoringService::class => TutoringService::class,
        TutoringReviewService::class => TutoringReviewService::class,
        AdminTutorService::class => AdminTutorService::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Model::preventLazyLoading(! $this->app->isProduction());
    }
}
