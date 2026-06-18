<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['numero', 'client_id', 'user_id', 'date', 'statut', 'total_ht', 'total_tva', 'total_ttc', 'remarque'])]
class Proposition extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'date' => 'date',
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
        return $this->belongsTo(User::class, 'user_id')->withTrashed();
    }

    /**
     * @return HasMany<PropositionLigne, $this>
     */
    public function lignes(): HasMany
    {
        return $this->hasMany(PropositionLigne::class);
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
}
