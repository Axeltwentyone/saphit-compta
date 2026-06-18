<?php

namespace Database\Factories;

use App\Models\Produit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Produit>
 */
class ProduitFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('PRD-####'),
            'designation' => fake()->words(3, true),
            'categorie' => fake()->word(),
            'unite_mesure' => 'pièce',
            'prix_vente' => fake()->randomFloat(2, 500, 50000),
            'seuil_alerte' => 5,
            'quantite_stock' => 0,
            'actif' => true,
        ];
    }
}
