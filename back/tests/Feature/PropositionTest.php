<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Proposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropositionTest extends TestCase
{
    use RefreshDatabase;

    private function payload(int $clientId): array
    {
        return [
            'client_id' => $clientId,
            'date' => '2026-06-17',
            'lignes' => [
                ['designation' => 'Article A', 'quantite' => 2, 'prix_unitaire' => 1000, 'remise_pourcentage' => 10],
                ['designation' => 'Article B', 'quantite' => 1, 'prix_unitaire' => 500],
            ],
        ];
    }

    public function test_commercial_can_create_proposition_with_correct_totals(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $client = Client::factory()->create();

        $response = $this->actingAs($commercial)
            ->postJson('/api/propositions', $this->payload($client->id));

        // (2 * 1000 * 0.9) + (1 * 500) = 1800 + 500 = 2300
        $response->assertCreated()
            ->assertJsonPath('statut', 'brouillon')
            ->assertJsonPath('total_ht', '2300.00');
    }

    public function test_commercial_cannot_see_other_commercials_propositions(): void
    {
        $sandra = User::factory()->create(['role' => 'commercial']);
        $junior = User::factory()->create(['role' => 'commercial']);
        $client = Client::factory()->create();

        $this->actingAs($sandra)->postJson('/api/propositions', $this->payload($client->id));

        $response = $this->actingAs($junior)->getJson('/api/propositions');

        $response->assertOk()->assertJsonCount(0);
    }

    public function test_comptable_can_see_all_propositions(): void
    {
        $sandra = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();

        $this->actingAs($sandra)->postJson('/api/propositions', $this->payload($client->id));

        $response = $this->actingAs($comptable)->getJson('/api/propositions');

        $response->assertOk()->assertJsonCount(1);
    }

    public function test_commercial_cannot_update_another_commercials_proposition(): void
    {
        $sandra = User::factory()->create(['role' => 'commercial']);
        $junior = User::factory()->create(['role' => 'commercial']);
        $client = Client::factory()->create();

        $created = $this->actingAs($sandra)
            ->postJson('/api/propositions', $this->payload($client->id))
            ->json();

        $this->actingAs($junior)
            ->putJson("/api/propositions/{$created['id']}", $this->payload($client->id))
            ->assertForbidden();
    }

    public function test_submitting_changes_statut_to_soumise(): void
    {
        $sandra = User::factory()->create(['role' => 'commercial']);
        $client = Client::factory()->create();

        $created = $this->actingAs($sandra)
            ->postJson('/api/propositions', $this->payload($client->id))
            ->json();

        $this->actingAs($sandra)
            ->postJson("/api/propositions/{$created['id']}/submit")
            ->assertOk()
            ->assertJsonPath('statut', 'soumise');

        $this->assertDatabaseHas('propositions', [
            'id' => $created['id'],
            'statut' => 'soumise',
        ]);
    }

    public function test_le_nom_du_commercial_reste_visible_apres_suppression_de_son_compte(): void
    {
        $sandra = User::factory()->create(['role' => 'commercial', 'name' => 'Sandra']);
        $dg = User::factory()->create(['role' => 'dg']);
        $client = Client::factory()->create();

        $created = $this->actingAs($sandra)
            ->postJson('/api/propositions', $this->payload($client->id))
            ->json();

        $sandra->delete();

        $response = $this->actingAs($dg)->getJson("/api/propositions/{$created['id']}");

        $response->assertOk()->assertJsonPath('commercial.name', 'Sandra');
    }
}
