<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Proposition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PropositionController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Proposition::class);

        $query = Proposition::with(['client', 'commercial'])->latest('date');

        if ($request->user()->isCommercial()) {
            $query->where('user_id', $request->user()->id);
        } else {
            $query->when($request->filled('client_id'), fn ($q) => $q->where('client_id', $request->integer('client_id')))
                ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
                ->when($request->filled('statut'), fn ($q) => $q->where('statut', $request->string('statut')));
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorize('create', Proposition::class);

        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'date' => ['required', 'date'],
            'remarque' => ['nullable', 'string'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.produit_id' => ['nullable', 'exists:produits,id'],
            'lignes.*.designation' => ['required', 'string', 'max:255'],
            'lignes.*.quantite' => ['required', 'numeric', 'min:0.01'],
            'lignes.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
            'lignes.*.remise_pourcentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $proposition = DB::transaction(function () use ($data, $request) {
            $proposition = Proposition::create([
                'numero' => 'TEMP',
                'client_id' => $data['client_id'],
                'user_id' => $request->user()->id,
                'date' => $data['date'],
                'statut' => 'brouillon',
                'remarque' => $data['remarque'] ?? null,
            ]);

            $proposition->update(['numero' => sprintf('PROP-%s-%03d', now()->year, $proposition->id)]);

            $this->synchroniserLignes($proposition, $data['lignes']);

            return $proposition;
        });

        return response()->json($proposition->load('lignes', 'client', 'commercial'), 201);
    }

    public function show(Proposition $proposition)
    {
        $this->authorize('view', $proposition);

        return $proposition->load('lignes', 'client', 'commercial');
    }

    public function update(Request $request, Proposition $proposition)
    {
        $this->authorize('update', $proposition);

        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'date' => ['required', 'date'],
            'remarque' => ['nullable', 'string'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.produit_id' => ['nullable', 'exists:produits,id'],
            'lignes.*.designation' => ['required', 'string', 'max:255'],
            'lignes.*.quantite' => ['required', 'numeric', 'min:0.01'],
            'lignes.*.prix_unitaire' => ['required', 'numeric', 'min:0'],
            'lignes.*.remise_pourcentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($proposition, $data) {
            $proposition->update([
                'client_id' => $data['client_id'],
                'date' => $data['date'],
                'remarque' => $data['remarque'] ?? null,
            ]);

            $proposition->lignes()->delete();
            $this->synchroniserLignes($proposition, $data['lignes']);
        });

        return $proposition->load('lignes', 'client', 'commercial');
    }

    public function submit(Proposition $proposition)
    {
        $this->authorize('update', $proposition);

        abort_unless($proposition->statut === 'brouillon', 422, 'Seule une proposition en brouillon peut être soumise.');

        $proposition->update(['statut' => 'soumise']);

        return $proposition->load('lignes', 'client', 'commercial');
    }

    public function convertir(Request $request, Proposition $proposition)
    {
        $this->authorize('view', $proposition);
        $this->authorize('create', Facture::class);

        abort_unless($proposition->statut === 'soumise', 422, 'Seule une proposition soumise peut être convertie en facture.');

        $facture = DB::transaction(function () use ($proposition) {
            $proposition->load('lignes');

            $facture = Facture::create([
                'numero' => 'TEMP',
                'type' => 'facture',
                'proposition_id' => $proposition->id,
                'client_id' => $proposition->client_id,
                'commercial_id' => $proposition->user_id,
                'date' => now()->toDateString(),
                'statut' => 'emise',
                'remarque' => $proposition->remarque,
            ]);

            $facture->update(['numero' => sprintf('FAC-%s-%03d', now()->year, $facture->id)]);

            foreach ($proposition->lignes as $ligne) {
                $facture->lignes()->create([
                    'produit_id' => $ligne->produit_id,
                    'designation' => $ligne->designation,
                    'quantite' => $ligne->quantite,
                    'prix_unitaire' => $ligne->prix_unitaire,
                    'remise_pourcentage' => $ligne->remise_pourcentage,
                    'total_ligne' => $ligne->total_ligne,
                ]);
            }

            $facture->load('lignes');
            $facture->recalculerTotaux();

            $proposition->update(['statut' => 'convertie']);

            return $facture;
        });

        $facture->sortirStock($request->user()->id);

        return response()->json($facture->load('lignes', 'client', 'commercial'), 201);
    }

    public function destroy(Proposition $proposition)
    {
        $this->authorize('delete', $proposition);

        $proposition->delete();

        return response()->json(null, 204);
    }

    private function synchroniserLignes(Proposition $proposition, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $remise = $ligne['remise_pourcentage'] ?? 0;
            $totalLigne = round($ligne['quantite'] * $ligne['prix_unitaire'] * (1 - $remise / 100), 2);

            $proposition->lignes()->create([
                'produit_id' => $ligne['produit_id'] ?? null,
                'designation' => $ligne['designation'],
                'quantite' => $ligne['quantite'],
                'prix_unitaire' => $ligne['prix_unitaire'],
                'remise_pourcentage' => $remise,
                'total_ligne' => $totalLigne,
            ]);
        }

        $proposition->load('lignes');
        $proposition->recalculerTotaux();
    }
}
