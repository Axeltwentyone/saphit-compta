<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Proposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_annuler_une_facture_cree_une_entree_d_audit(): void
    {
        $commercial = User::factory()->create(['role' => 'commercial']);
        $comptable = User::factory()->create(['role' => 'comptable']);
        $dg = User::factory()->create(['role' => 'dg']);
        $client = Client::factory()->create();

        $proposition = Proposition::create([
            'numero' => 'PROP-AUDIT-1',
            'client_id' => $client->id,
            'user_id' => $commercial->id,
            'date' => '2026-06-18',
            'statut' => 'soumise',
        ]);
        $proposition->lignes()->create([
            'designation' => 'Article', 'quantite' => 1, 'prix_unitaire' => 1000, 'remise_pourcentage' => 0, 'total_ligne' => 1000,
        ]);
        $proposition->recalculerTotaux();

        $facture = $this->actingAs($comptable)
            ->postJson("/api/propositions/{$proposition->id}/convertir")
            ->json();

        $this->actingAs($comptable)->postJson("/api/factures/{$facture['id']}/annuler")->assertOk();

        $this->assertDatabaseHas('audit_logs', ['action' => 'facture.annuler']);

        $this->actingAs($comptable)->getJson('/api/audit')->assertForbidden();
        $this->actingAs($dg)->getJson('/api/audit')->assertOk()->assertJsonCount(1);
    }
}
