<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $commerciaux = ['Sandra', 'Désirée', 'Junior', 'Ève'];

        foreach ($commerciaux as $nom) {
            User::factory()->create([
                'name' => $nom,
                'email' => str_replace(['é', 'è'], 'e', mb_strtolower($nom, 'UTF-8')).'@saphir.test',
                'role' => 'commercial',
                'password' => bcrypt('password'),
            ]);
        }

        User::factory()->create([
            'name' => 'Comptabilité',
            'email' => 'comptabilite@saphir.test',
            'role' => 'comptable',
            'password' => bcrypt('password'),
        ]);

        User::factory()->create([
            'name' => 'DG',
            'email' => 'dg@saphir.test',
            'role' => 'dg',
            'password' => bcrypt('password'),
        ]);
    }
}
