<?php

namespace Tests\Feature;

use Tests\TestCase;

class DatabaseEnvironmentTest extends TestCase
{
    public function test_tests_use_dedicated_postgresql_database(): void
    {
        $this->assertSame(
            'testing',
            app()->environment()
        );

        $this->assertSame(
            'pgsql',
            config('database.default')
        );

        $this->assertSame(
            'study_buddy_test',
            config('database.connections.pgsql.database')
        );
    }
}