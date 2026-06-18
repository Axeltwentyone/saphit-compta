<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'sandra@saphir.test',
            'password' => bcrypt('password'),
            'role' => 'commercial',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'sandra@saphir.test',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token']);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create(['email' => 'sandra@saphir.test']);

        $response = $this->postJson('/api/login', [
            'email' => 'sandra@saphir.test',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable();
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }
}
