<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['facture_id', 'produit_id', 'designation', 'quantite', 'prix_unitaire', 'remise_pourcentage', 'total_ligne'])]
class FactureLigne extends Model
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
     * @return BelongsTo<Facture, $this>
     */
    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }

    /**
     * @return BelongsTo<Produit, $this>
     */
    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class);
    }
}
