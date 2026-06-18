<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FactureController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Facture::class);

        $query = Facture::with(['client', 'commercial', 'proposition', 'paiements', 'avoirs'])
            ->where('type', $request->input('type', 'facture'))
            ->latest('date');

        $query->when($request->filled('client_id'), fn ($q) => $q->where('client_id', $request->integer('client_id')))
            ->when($request->filled('commercial_id'), fn ($q) => $q->where('commercial_id', $request->integer('commercial_id')))
            ->when($request->filled('statut'), fn ($q) => $q->where('statut', $request->string('statut')));

        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorize('create', Facture::class);

        $data = $this->validerDonnees($request);
        $acompte = $request->validate([
            'acompte_montant' => ['nullable', 'numeric', 'min:0.01'],
            'acompte_mode_reglement' => ['required_with:acompte_montant', 'in:especes,virement,cheque,mobile_money,autre'],
            'acompte_date' => ['nullable', 'date'],
        ]);

        $facture = DB::transaction(function () use ($data, $acompte, $request) {
            $facture = Facture::create([
                'numero' => 'TEMP',
                'type' => 'facture',
                'client_id' => $data['client_id'],
                'commercial_id' => $data['commercial_id'] ?? $request->user()->id,
                'date' => $data['date'],
                'date_echeance' => $data['date_echeance'] ?? null,
                'statut' => 'brouillon',
                'remarque' => $data['remarque'] ?? null,
            ]);

            $facture->update(['numero' => sprintf('FAC-%s-%03d', now()->year, $facture->id)]);

            $this->synchroniserLignes($facture, $data['lignes']);

            if (! empty($acompte['acompte_montant'])) {
                Paiement::create([
                    'client_id' => $facture->client_id,
                    'facture_id' => $facture->id,
                    'montant' => $acompte['acompte_montant'],
                    'mode_reglement' => $acompte['acompte_mode_reglement'],
                    'date' => $acompte['acompte_date'] ?? $data['date'],
                    'remarque' => 'Acompte versé à la création de la facture',
                    'user_id' => $request->user()->id,
                ]);
                $facture->rafraichirStatutPaiement();
            }

            return $facture;
        });

        return response()->json($facture->load('lignes', 'client', 'commercial', 'paiements'), 201);
    }

    public function show(Facture $facture)
    {
        $this->authorize('view', $facture);

        return $facture->load('lignes', 'client', 'commercial', 'proposition', 'paiements.utilisateur', 'avoirs', 'origineFacture');
    }

    public function update(Request $request, Facture $facture)
    {
        $this->authorize('update', $facture);

        $data = $this->validerDonnees($request);

        DB::transaction(function () use ($facture, $data) {
            $facture->update([
                'client_id' => $data['client_id'],
                'commercial_id' => $data['commercial_id'] ?? null,
                'date' => $data['date'],
                'date_echeance' => $data['date_echeance'] ?? null,
                'remarque' => $data['remarque'] ?? null,
            ]);

            $facture->lignes()->delete();
            $this->synchroniserLignes($facture, $data['lignes']);
        });

        AuditLog::enregistrer(
            $request->user()->id,
            'facture.modifier',
            "Facture {$facture->numero} modifiée (statut : {$facture->statut}).",
        );

        return $facture->load('lignes', 'client', 'commercial');
    }

    public function emettre(Request $request, Facture $facture)
    {
        $this->authorize('emettre', $facture);

        abort_unless($facture->statut === 'brouillon', 422, 'Seule une facture en brouillon peut être émise.');

        $facture->update(['statut' => 'emise']);
        $facture->sortirStock($request->user()->id);
        $facture->rafraichirStatutPaiement();

        return $facture->load('lignes', 'client', 'commercial');
    }

    public function annuler(Request $request, Facture $facture)
    {
        $this->authorize('annuler', $facture);

        $statutAvantAnnulation = $facture->statut;
        $facture->update(['statut' => 'annulee']);

        if ($statutAvantAnnulation !== 'brouillon') {
            $facture->reapprovisionnerStock($request->user()->id);
        }

        $note = in_array($statutAvantAnnulation, ['soldee', 'partiellement_reglee'], true)
            ? ' (dérogation : facture déjà réglée en partie ou totalement)'
            : '';
        AuditLog::enregistrer(
            $request->user()->id,
            'facture.annuler',
            "Facture {$facture->numero} annulée, statut précédent : {$statutAvantAnnulation}{$note}.",
        );

        return $facture->load('lignes', 'client', 'commercial');
    }

    public function avoir(Request $request, Facture $facture)
    {
        $this->authorize('view', $facture);

        abort_if($facture->type === 'avoir', 422, 'Impossible de créer un avoir sur un avoir.');

        $data = $request->validate([
            'date' => ['required', 'date'],
            'remarque' => ['nullable', 'string'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.produit_id' => ['nullable', 'exists:produits,id'],
            'lignes.*.designation' => ['required', 'string', 'max:255'],
            'lignes.*.quantite' => ['required', 'numeric', 'min:0.01'],
            'lignes.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
            'lignes.*.remise_pourcentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $avoir = DB::transaction(function () use ($data, $facture) {
            $avoir = Facture::create([
                'numero' => 'TEMP',
                'type' => 'avoir',
                'origine_facture_id' => $facture->id,
                'client_id' => $facture->client_id,
                'commercial_id' => $facture->commercial_id,
                'date' => $data['date'],
                'statut' => 'emise',
                'remarque' => $data['remarque'] ?? null,
            ]);

            $avoir->update(['numero' => sprintf('AV-%s-%03d', now()->year, $avoir->id)]);

            $this->synchroniserLignes($avoir, $data['lignes']);

            $facture->rafraichirStatutPaiement();

            return $avoir;
        });

        $avoir->reapprovisionnerStock($request->user()->id);

        return response()->json($avoir->load('lignes', 'client', 'commercial'), 201);
    }

    private function validerDonnees(Request $request): array
    {
        return $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'commercial_id' => ['nullable', 'exists:users,id'],
            'date' => ['required', 'date'],
            'date_echeance' => ['nullable', 'date'],
            'remarque' => ['nullable', 'string'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.produit_id' => ['nullable', 'exists:produits,id'],
            'lignes.*.designation' => ['required', 'string', 'max:255'],
            'lignes.*.quantite' => ['required', 'numeric', 'min:0.01'],
            'lignes.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
            'lignes.*.remise_pourcentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);
    }

    private function synchroniserLignes(Facture $facture, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $remise = $ligne['remise_pourcentage'] ?? 0;
            $totalLigne = round($ligne['quantite'] * $ligne['prix_unitaire'] * (1 - $remise / 100), 2);

            $facture->lignes()->create([
                'produit_id' => $ligne['produit_id'] ?? null,
                'designation' => $ligne['designation'],
                'quantite' => $ligne['quantite'],
                'prix_unitaire' => $ligne['prix_unitaire'],
                'remise_pourcentage' => $remise,
                'total_ligne' => $totalLigne,
            ]);
        }

        $facture->load('lignes');
        $facture->recalculerTotaux();
    }
}
