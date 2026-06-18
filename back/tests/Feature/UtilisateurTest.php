<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UtilisateurTest extends TestCase
{
    use RefreshDatabase;

    public function test_seul_le_dg_peut_gerer_les_utilisateurs(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);
        $commercial = User::factory()->create(['role' => 'commercial']);

        $this->actingAs($comptable)->getJson('/api/utilisateurs')->assertForbidden();
        $this->actingAs($commercial)->postJson('/api/utilisateurs', [])->assertForbidden();
    }

    public function test_dg_peut_creer_modifier_et_desactiver_un_utilisateur(): void
    {
        $dg = User::factory()->create(['role' => 'dg']);

        $created = $this->actingAs($dg)->postJson('/api/utilisateurs', [
            'name' => 'Nouvel Employé',
            'email' => 'nouvel.employe@saphir.test',
            'password' => 'password123',
            'role' => 'comptable',
        ])->assertCreated()->json();

        $this->actingAs($dg)->putJson("/api/utilisateurs/{$created['id']}", [
            'name' => 'Nouvel Employé',
            'email' => 'nouvel.employe@saphir.test',
            'role' => 'comptable',
            'actif' => false,
        ])->assertOk()->assertJsonPath('actif', false);
    }

    public function test_un_utilisateur_desactive_ne_peut_plus_se_connecter(): void
    {
        $user = User::factory()->create(['role' => 'commercial', 'actif' => false]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertUnprocessable();
    }

    public function test_dg_peut_supprimer_un_utilisateur_qui_disparait_de_la_liste_et_ne_peut_plus_se_connecter(): void
    {
        $dg = User::factory()->create(['role' => 'dg']);
        $user = User::factory()->create(['role' => 'commercial']);

        $this->actingAs($dg)->deleteJson("/api/utilisateurs/{$user->id}")->assertNoContent();

        $this->assertSoftDeleted('users', ['id' => $user->id]);

        $liste = $this->actingAs($dg)->getJson('/api/utilisateurs')->json();
        $this->assertFalse(collect($liste)->contains('id', $user->id));

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertUnprocessable();
    }

    public function test_dg_ne_peut_pas_supprimer_son_propre_compte(): void
    {
        $dg = User::factory()->create(['role' => 'dg']);

        $this->actingAs($dg)->deleteJson("/api/utilisateurs/{$dg->id}")->assertUnprocessable();
    }

    public function test_comptable_ne_peut_pas_supprimer_un_utilisateur(): void
    {
        $comptable = User::factory()->create(['role' => 'comptable']);
        $autre = User::factory()->create(['role' => 'commercial']);

        $this->actingAs($comptable)->deleteJson("/api/utilisateurs/{$autre->id}")->assertForbidden();
    }
}
