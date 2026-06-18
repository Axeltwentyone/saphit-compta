<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'numero', 'type', 'origine_facture_id', 'proposition_id', 'client_id', 'commercial_id',
    'date', 'date_echeance', 'statut', 'total_ht', 'total_tva', 'total_ttc', 'remarque',
])]
class Facture extends Model
{
    use HasFactory;

    protected $appends = ['solde_restant'];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'date_echeance' => 'date',
            'total_ht' => 'decimal:2',
            'total_tva' => 'decimal:2',
            'total_ttc' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Client, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function commercial(): BelongsTo
    {
        return $this->belongsTo(User::class, 'commercial_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Proposition, $this>
     */
    public function proposition(): BelongsTo
    {
        return $this->belongsTo(Proposition::class);
    }

    /**
     * @return BelongsTo<Facture, $this>
     */
    public function origineFacture(): BelongsTo
    {
        return $this->belongsTo(Facture::class, 'origine_facture_id');
    }

    /**
     * @return HasMany<Facture, $this>
     */
    public function avoirs(): HasMany
    {
        return $this->hasMany(Facture::class, 'origine_facture_id');
    }

    /**
     * @return HasMany<FactureLigne, $this>
     */
    public function lignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }

    /**
     * @return HasMany<Paiement, $this>
     */
    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function recalculerTotaux(): void
    {
        $totalHt = $this->lignes->sum('total_ligne');
        $tauxTva = (float) Parametre::actuel()->tva_taux;

        $this->total_ht = $totalHt;
        $this->total_tva = round($totalHt * $tauxTva / 100, 2);
        $this->total_ttc = $this->total_ht + $this->total_tva;
        $this->save();
    }

    public function getSoldeRestantAttribute(): float
    {
        if ($this->type === 'avoir') {
            return 0;
        }

        $totalPaye = $this->paiements->sum('montant');
        $totalAvoirs = $this->avoirs->where('statut', '!=', 'annulee')->sum('total_ttc');

        return round((float) $this->total_ttc - (float) $totalPaye - (float) $totalAvoirs, 2);
    }

    public function rafraichirStatutPaiement(): void
    {
        if (! in_array($this->statut, ['emise', 'partiellement_reglee', 'soldee'], true)) {
            return;
        }

        $this->load('paiements', 'avoirs');
        $solde = $this->soldeRestant;

        if ($solde <= 0) {
            $this->statut = 'soldee';
        } elseif ($solde < (float) $this->total_ttc) {
            $this->statut = 'partiellement_reglee';
        } else {
            $this->statut = 'emise';
        }

        $this->save();
    }

    public function sortirStock(int $userId): void
    {
        $this->load('lignes.produit');

        foreach ($this->lignes as $ligne) {
            if ($ligne->produit_id === null) {
                continue;
            }

            $ligne->produit->enregistrerMouvement(
                'sortie',
                -(float) $ligne->quantite,
                $this->id,
                null,
                $userId,
                $this->date->toDateString(),
            );
        }
    }

    public function reapprovisionnerStock(int $userId): void
    {
        $this->load('lignes.produit');

        foreach ($this->lignes as $ligne) {
            if ($ligne->produit_id === null) {
                continue;
            }

            $ligne->produit->enregistrerMouvement(
                'entree',
                (float) $ligne->quantite,
                $this->id,
                null,
                $userId,
                $this->date->toDateString(),
            );
        }
    }
}
