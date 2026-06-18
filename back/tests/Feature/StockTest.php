<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Produit;
use App\Models\Proposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockTest extends TestCase
{
    use RefreshDatabase;

    public function test_commercial_peut_consulter_le_catalogue_mais_pas_le_gerer(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $produit = Produit::factory()->create();

        $this->actingAs($commercial)->getJson('/api/produits')->assertOk();
        $this->actingAs($commercial)->postJson('/api/produits', [])->assertForbidden();
        $this->actingAs($commercial)->postJson("/api/produits/{$produit->id}/entree", [])->assertForbidden();
    }

    public function test_entree_de_stock_augmente_la_quantite(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);
        $produit = Produit::factory()->create(['quantite_stock' => 0]);

        $response = $this->actingAs($comptable)->postJson("/api/produits/{$produit->id}/entree", [
            'quantite' => 10,
            'date' => '2026-06-18',
        ]);

        $response->assertOk()->assertJsonPath('quantite_stock', '10.00');
    }

    public function test_correction_sans_motif_est_rejetee(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);
        $produit = Produit::factory()->create(['quantite_stock' => 10]);

        $this->actingAs($comptable)->postJson("/api/produits/{$produit->id}/correction", [
            'quantite_physique' => 8,
        ])->assertUnprocessable();
    }

    public function test_correction_avec_motif_ajuste_le_stock(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);
        $produit = Produit::factory()->create(['quantite_stock' => 10]);

        $response = $this->actingAs($comptable)->postJson("/api/produits/{$produit->id}/correction", [
            'quantite_physique' => 7,
            'motif' => 'Casse constatée en inventaire',
            'date' => '2026-06-18',
        ]);

        $response->assertOk()->assertJsonPath('quantite_stock', '7.00');
    }

    public function test_emission_facture_decremente_le_stock_et_annulation_le_restaure(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();
        $produit = Produit::factory()->create(['quantite_stock' => 20]);

        $proposition = Proposition::create([
            'numero' => 'PROP-TEST-STOCK',
            'client_id' => $client->id,
            'user_id' => $commercial->id,
            'date' => '2026-06-18',
            'statut' => 'soumise',
        ]);
        $proposition->lignes()->create([
            'produit_id' => $produit->id,
            'designation' => $produit->designation,
            'quantite' => 3,
            'prix_unitaire' => 1000,
            'remise_pourcentage' => 0,
            'total_ligne' => 3000,
        ]);
        $proposition->recalculerTotaux();

        $facture = $this->actingAs($comptable)
            ->postJson("/api/propositions/{$proposition->id}/convertir")
            ->assertCreated()
            ->json();

        $this->assertEquals(17, $produit->refresh()->quantite_stock);

        $this->actingAs($comptable)->postJson("/api/factures/{$facture['id']}/annuler")->assertOk();

        $this->assertEquals(20, $produit->refresh()->quantite_stock);
    }

    public function test_avoir_avec_ligne_produit_reapprovisionne_le_stock(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $client = Client::factory()->create();
        $produit = Produit::factory()->create(['quantite_stock' => 20]);

        $proposition = Proposition::create([
            'numero' => 'PROP-TEST-STOCK-2',
            'client_id' => $client->id,
            'user_id' => $commercial->id,
            'date' => '2026-06-18',
            'statut' => 'soumise',
        ]);
        $proposition->lignes()->create([
            'produit_id' => $produit->id,
            'designation' => $produit->designation,
            'quantite' => 5,
            'prix_unitaire' => 1000,
            'remise_pourcentage' => 0,
            'total_ligne' => 5000,
        ]);
        $proposition->recalculerTotaux();

        $facture = $this->actingAs($comptable)
            ->postJson("/api/propositions/{$proposition->id}/convertir")
            ->json();

        $this->assertEquals(15, $produit->refresh()->quantite_stock);

        $this->actingAs($comptable)->postJson("/api/factures/{$facture['id']}/avoir", [
            'date' => '2026-06-19',
            'lignes' => [
                ['produit_id' => $produit->id, 'designation' => $produit->designation, 'quantite' => 2, 'prix_unitaire' => 1000],
            ],
        ])->assertCreated();

        $this->assertEquals(17, $produit->refresh()->quantite_stock);
    }
}
