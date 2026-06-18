<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

#[Fillable(['code', 'designation', 'categorie', 'unite_mesure', 'prix_vente', 'seuil_alerte', 'actif'])]
class Produit extends Model
{
    use HasFactory;

    protected $appends = ['sous_seuil'];

    protected function casts(): array
    {
        return [
            'prix_vente' => 'decimal:2',
            'seuil_alerte' => 'decimal:2',
            'quantite_stock' => 'decimal:2',
            'actif' => 'boolean',
        ];
    }

    /**
     * @return HasMany<StockMouvement, $this>
     */
    public function mouvements(): HasMany
    {
        return $this->hasMany(StockMouvement::class);
    }

    public function getSousSeuilAttribute(): bool
    {
        return (float) $this->quantite_stock <= (float) $this->seuil_alerte;
    }

    public function enregistrerMouvement(
        string $type,
        float $quantite,
        ?int $factureId,
        ?string $motif,
        int $userId,
        ?string $date = null,
    ): StockMouvement {
        return DB::transaction(function () use ($type, $quantite, $factureId, $motif, $userId, $date) {
            $produit = static::whereKey($this->id)->lockForUpdate()->first();

            $mouvement = $produit->mouvements()->create([
                'type' => $type,
                'quantite' => $quantite,
                'motif' => $motif,
                'facture_id' => $factureId,
                'user_id' => $userId,
                'date' => $date ?? now()->toDateString(),
            ]);

            $produit->increment('quantite_stock', $quantite);
            $this->quantite_stock = $produit->quantite_stock;

            return $mouvement;
        });
    }
}
