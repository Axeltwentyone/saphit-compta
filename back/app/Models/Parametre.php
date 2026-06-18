<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['devise', 'tva_taux', 'raison_sociale', 'adresse', 'telephone'])]
class Parametre extends Model
{
    protected function casts(): array
    {
        return [
            'tva_taux' => 'decimal:2',
        ];
    }

    public static function actuel(): self
    {
        return static::firstOrCreate([], [
            'devise' => 'FCFA',
            'tva_taux' => 0,
        ]);
    }
}
