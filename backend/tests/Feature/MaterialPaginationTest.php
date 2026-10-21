<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_material_pagination_uses_consistent_schema(): void
    {
        $user = User::factory()->create();

        // Buat 13 materi untuk menguji dua halaman.
        for ($i = 1; $i <= 13; $i++) {
            Material::create([
                'user_id' => $user->id,
                'title' => "Materi Test {$i}",
                'description' => 'Pengujian pagination API.',
                'subject' => 'Informatika',
                'file_path' => "materials/test-{$i}.pdf",
                'file_type' => 'pdf',
                'file_size' => 1024,
            ]);
        }

        $this->actingAs($user, 'sanctum');

        // Halaman pertama: 12 materi.
        $this->getJson('/api/v1/materials?page=1')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath(
                'message',
                'Daftar materi berhasil diambil.'
            )
            ->assertJsonPath('errors', null)
            ->assertJsonPath('pagination.current_page', 1)
            ->assertJsonPath('pagination.last_page', 2)
            ->assertJsonPath('pagination.per_page', 12)
            ->assertJsonPath('pagination.total', 13)
            ->assertJsonCount(12, 'data');

        // Halaman kedua: 1 materi tersisa.
        $this->getJson('/api/v1/materials?page=2')
            ->assertOk()
            ->assertJsonPath('pagination.current_page', 2)
            ->assertJsonPath('pagination.last_page', 2)
            ->assertJsonPath('pagination.per_page', 12)
            ->assertJsonPath('pagination.total', 13)
            ->assertJsonCount(1, 'data');
    }
}