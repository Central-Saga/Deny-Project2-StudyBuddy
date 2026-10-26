<?php

namespace Database\Factories;

use App\Models\Material;
use App\Models\MaterialReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MaterialReport>
 */
class MaterialReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'material_id' => Material::factory(),
            'reporter_id' => User::factory(),
            'reason' => fake()->sentence(),
            'status' => 'pending',
        ];
    }

    public function reviewed(?User $reviewer = null): static
    {
        return $this->state(fn () => [
            'status' => 'reviewed',
            'resolution_note' => fake()->sentence(),
            'reviewed_by' => $reviewer?->id ?? User::factory()->admin(),
            'reviewed_at' => now(),
        ]);
    }

    public function dismissed(): static
    {
        return $this->reviewed()->state(fn () => ['status' => 'dismissed']);
    }

    public function actionTaken(): static
    {
        return $this->reviewed()->state(fn () => ['status' => 'action_taken']);
    }
}
