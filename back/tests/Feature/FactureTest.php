<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Proposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FactureTest extends TestCase
{
    use RefreshDatabase;

    private function creerPropositionSoumise(User $commercial, Client $client): Proposition
    {
        $proposition = Proposition::create([
            'numero' => 'PROP-TEST-1',
            'client_id' => $client->id,
            'user_id' => $commercial->id,
            'date' => '2026-06-17',
            'statut' => 'soumise',
        ]);

        $proposition->lignes()->create([
            'designation' => 'Article A',
            'quantite' => 2,
            'prix_unitaire' => 1000,
            'remise_pourcentage' => 0,
            'total_ligne' => 2000,
        ]);

        $proposition->recalculerTotaux();

        return $proposition;
    }

    public function test_comptable_can_convert_proposition_to_facture(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();
        $proposition = $this->creerPropositionSoumise($commercial, $client);

        $response = $this->actingAs($comptable)
            ->postJson("/api/propositions/{$proposition->id}/convertir");

        $response->assertCreated()
            ->assertJsonPath('statut', 'emise')
            ->assertJsonPath('total_ttc', '2000.00');

        $this->assertDatabaseHas('propositions', ['id' => $proposition->id, 'statut' => 'convertie']);
        $this->assertStringStartsWith('FAC-', $response->json('numero'));
    }

    public function test_commercial_cannot_convert_or_access_factures(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $client = Client::factory()->create();
        $proposition = $this->creerPropositionSoumise($commercial, $client);

        $this->actingAs($commercial)
            ->postJson("/api/propositions/{$proposition->id}/convertir")
            ->assertForbidden();

        $this->actingAs($commercial)->getJson('/api/factures')->assertForbidden();
        $this->actingAs($commercial)->getJson('/api/paiements')->assertForbidden();
    }

    public function test_paiements_update_facture_solde_and_statut(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();
        $proposition = $this->creerPropositionSoumise($commercial, $client);

        $facture = $this->actingAs($comptable)
            ->postJson("/api/propositions/{$proposition->id}/convertir")
            ->json();

        // Paiement partiel
        $this->actingAs($comptable)->postJson('/api/paiements', [
            'client_id' => $client->id,
            'facture_id' => $facture['id'],
            'montant' => 1200,
            'mode_reglement' => 'especes',
            'date' => '2026-06-17',
        ])->assertCreated();

        $apresPartiel = $this->actingAs($comptable)->getJson("/api/factures/{$facture['id']}")->json();
        $this->assertEquals('partiellement_reglee', $apresPartiel['statut']);
        $this->assertEquals(800, $apresPartiel['solde_restant']);

        // Solde final
        $this->actingAs($comptable)->postJson('/api/paiements', [
            'client_id' => $client->id,
            'facture_id' => $facture['id'],
            'montant' => 800,
            'mode_reglement' => 'virement',
            'date' => '2026-06-17',
        ])->assertCreated();

        $apresSolde = $this->actingAs($comptable)->getJson("/api/factures/{$facture['id']}")->json();
        $this->assertEquals('soldee', $apresSolde['statut']);
        $this->assertEquals(0, $apresSolde['solde_restant']);
    }

    public function test_avance_non_affectee_peut_etre_affectee_a_une_facture(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();
        $proposition = $this->creerPropositionSoumise($commercial, $client);

        $facture = $this->actingAs($comptable)
            ->postJson("/api/propositions/{$proposition->id}/convertir")
            ->json();

        $paiement = $this->actingAs($comptable)->postJson('/api/paiements', [
            'client_id' => $client->id,
            'montant' => 500,
            'mode_reglement' => 'mobile_money',
            'date' => '2026-06-17',
        ])->assertCreated()->json();

        $this->assertNull($paiement['facture_id']);

        $this->actingAs($comptable)
            ->patchJson("/api/paiements/{$paiement['id']}/affecter", ['facture_id' => $facture['id']])
            ->assertOk()
            ->assertJsonPath('facture_id', $facture['id']);

        $apres = $this->actingAs($comptable)->getJson("/api/factures/{$facture['id']}")->json();
        $this->assertEquals(1500, $apres['solde_restant']);
        $this->assertEquals('partiellement_reglee', $apres['statut']);
    }

    public function test_avoir_reduit_le_solde_restant(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();
        $proposition = $this->creerPropositionSoumise($commercial, $client);

        $facture = $this->actingAs($comptable)
            ->postJson("/api/propositions/{$proposition->id}/convertir")
            ->json();

        $this->actingAs($comptable)->postJson("/api/factures/{$facture['id']}/avoir", [
            'date' => '2026-06-18',
            'lignes' => [
                ['designation' => 'Retour Article A', 'quantite' => 1, 'prix_unitaire' => 1000],
            ],
        ])->assertCreated()->assertJsonPath('type', 'avoir');

        $apres = $this->actingAs($comptable)->getJson("/api/factures/{$facture['id']}")->json();
        $this->assertEquals('partiellement_reglee', $apres['statut']);
        $this->assertEquals(1000, $apres['solde_restant']);
    }

    public function test_dg_peut_annuler_une_facture_deja_soldee_mais_pas_le_comptable(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $dg = User::factory()->create(['role' => 'dg']);
        $client = Client::factory()->create();
        $proposition = $this->creerPropositionSoumise($commercial, $client);

        $facture = $this->actingAs($comptable)
            ->postJson("/api/propositions/{$proposition->id}/convertir")
            ->json();

        $this->actingAs($comptable)->postJson('/api/paiements', [
            'client_id' => $client->id,
            'facture_id' => $facture['id'],
            'montant' => 2000,
            'mode_reglement' => 'especes',
            'date' => '2026-06-17',
        ])->assertCreated();

        $this->assertDatabaseHas('factures', ['id' => $facture['id'], 'statut' => 'soldee']);

        $this->actingAs($comptable)
            ->postJson("/api/factures/{$facture['id']}/annuler")
            ->assertForbidden();

        $this->actingAs($dg)
            ->postJson("/api/factures/{$facture['id']}/annuler")
            ->assertOk()
            ->assertJsonPath('statut', 'annulee');
    }

    public function test_creation_manuelle_avec_acompte_cree_un_paiement_et_reduit_le_solde(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();

        $facture = $this->actingAs($comptable)->postJson('/api/factures', [
            'client_id' => $client->id,
            'date' => '2026-06-18',
            'lignes' => [
                ['designation' => 'Prestation', 'quantite' => 1, 'prix_unitaire' => 3000],
            ],
            'acompte_montant' => 1000,
            'acompte_mode_reglement' => 'mobile_money',
        ])->assertCreated()->json();

        $this->assertCount(1, $facture['paiements']);
        $this->assertEquals(1000, $facture['paiements'][0]['montant']);
        $this->assertEquals(2000, $facture['solde_restant']);

        // L'émission doit refléter l'acompte déjà versé avant la facture officielle.
        $apresEmission = $this->actingAs($comptable)
            ->postJson("/api/factures/{$facture['id']}/emettre")
            ->json();

        $this->assertEquals('partiellement_reglee', $apresEmission['statut']);
    }

    public function test_acompte_couvrant_le_total_solde_directement_la_facture_a_l_emission(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();

        $facture = $this->actingAs($comptable)->postJson('/api/factures', [
            'client_id' => $client->id,
            'date' => '2026-06-18',
            'lignes' => [
                ['designation' => 'Prestation', 'quantite' => 1, 'prix_unitaire' => 1500],
            ],
            'acompte_montant' => 1500,
            'acompte_mode_reglement' => 'especes',
        ])->assertCreated()->json();

        $apresEmission = $this->actingAs($comptable)
            ->postJson("/api/factures/{$facture['id']}/emettre")
            ->json();

        $this->assertEquals('soldee', $apresEmission['statut']);
        $this->assertEquals(0, $apresEmission['solde_restant']);
    }

    public function test_facture_manuelle_est_associee_a_son_createur_par_defaut(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable', 'name' => 'Comptabilité']);
        $dg = User::factory()->create(['role' => 'dg', 'name' => 'DG']);
        $client = Client::factory()->create();

        $factureComptable = $this->actingAs($comptable)->postJson('/api/factures', [
            'client_id' => $client->id,
            'date' => '2026-06-18',
            'lignes' => [['designation' => 'Prestation', 'quantite' => 1, 'prix_unitaire' => 1000]],
        ])->assertCreated()->json();
        $this->assertEquals('Comptabilité', $factureComptable['commercial']['name']);

        $factureDg = $this->actingAs($dg)->postJson('/api/factures', [
            'client_id' => $client->id,
            'date' => '2026-06-18',
            'lignes' => [['designation' => 'Prestation', 'quantite' => 1, 'prix_unitaire' => 1000]],
        ])->assertCreated()->json();
        $this->assertEquals('DG', $factureDg['commercial']['name']);
    }
}
