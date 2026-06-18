<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['proposition_id', 'produit_id', 'designation', 'quantite', 'prix_unitaire', 'remise_pourcentage', 'total_ligne'])]
class PropositionLigne extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'quantite' => 'decimal:2',
            'prix_unitaire' => 'decimal:2',
            'remise_pourcentage' => 'decimal:2',
            'total_ligne' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Proposition, $this>
     */
    public function proposition(): BelongsTo
    {
        return $this->belongsTo(Proposition::class);
    }

    /**
     * @return BelongsTo<Produit, $this>
     */
    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class);
    }
}
