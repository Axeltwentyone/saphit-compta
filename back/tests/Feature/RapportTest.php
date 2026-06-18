<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RapportTest extends TestCase
{
    use RefreshDatabase;

    public function test_commercial_ne_peut_pas_telecharger_les_rapports(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);

        $this->actingAs($commercial)->get('/api/rapports/creances/csv')->assertForbidden();
    }

    public function test_comptable_peut_telecharger_chaque_rapport_csv_et_pdf(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);

        foreach (['creances', 'stock', 'journal-ventes'] as $rapport) {
            $this->actingAs($comptable)->get("/api/rapports/{$rapport}/csv")
                ->assertOk()
                ->assertHeader('content-type', 'text/csv; charset=UTF-8');

            $this->actingAs($comptable)->get("/api/rapports/{$rapport}/pdf")
                ->assertOk()
                ->assertHeader('content-type', 'application/pdf');
        }
    }

    public function test_format_invalide_renvoie_404(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);

        $this->actingAs($comptable)->get('/api/rapports/creances/xml')->assertNotFound();
    }
}
