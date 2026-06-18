<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Proposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParametreTest extends TestCase
{
    use RefreshDatabase;

    public function test_tous_les_roles_authentifies_peuvent_lire_les_parametres(): void
    {
        foreach (['commercial', 'comptable', 'dg'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->actingAs($user)->getJson('/api/parametres')->assertOk();
        }
    }

    public function test_seul_le_dg_peut_modifier_les_parametres(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);
        $dg = User::factory()->create(['role' => 'dg']);

        $this->actingAs($comptable)->putJson('/api/parametres', [
            'devise' => 'EUR',
            'tva_taux' => 18,
        ])->assertForbidden();

        $this->actingAs($dg)->putJson('/api/parametres', [
            'devise' => 'EUR',
            'tva_taux' => 18,
        ])->assertOk()->assertJsonPath('tva_taux', '18.00');
    }

    public function test_le_nouveau_taux_de_tva_s_applique_aux_nouvelles_propositions(): void
    {
        $dg = User::factory()->create(['role' => 'dg']);
        $commercial = User::factory()->create(['role' => 'commercial']);
        $client = Client::factory()->create();

        $this->actingAs($dg)->putJson('/api/parametres', ['devise' => 'FCFA', 'tva_taux' => 18])->assertOk();

        $response = $this->actingAs($commercial)->postJson('/api/propositions', [
            'client_id' => $client->id,
            'date' => '2026-06-18',
            'lignes' => [['designation' => 'Article', 'quantite' => 1, 'prix_unitaire' => 1000]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('total_ht', '1000.00')
            ->assertJsonPath('total_tva', '180.00')
            ->assertJsonPath('total_ttc', '1180.00');
    }
}
