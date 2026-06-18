<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use Illuminate\Http\Request;

class ProduitController extends Controller
{
    public function index(Request $request)
    {
        return Produit::when($request->filled('actif'), fn ($q) => $q->where('actif', $request->boolean('actif')))
            ->orderBy('designation')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $this->validerDonnees($request);

        return response()->json(Produit::create($data), 201);
    }

    public function show(Produit $produit)
    {
        return $produit->load([
            'mouvements' => fn ($q) => $q->latest('id')->limit(20)->with('utilisateur', 'facture'),
        ]);
    }

    public function update(Request $request, Produit $produit)
    {
        $data = $this->validerDonnees($request, $produit);
        $data['actif'] = $request->boolean('actif', $produit->actif);

        $produit->update($data);

        return $produit;
    }

    public function entree(Request $request, Produit $produit)
    {
        $data = $request->validate([
            'quantite' => ['required', 'numeric', 'min:0.01'],
            'motif' => ['nullable', 'string'],
            'date' => ['required', 'date'],
        ]);

        $produit->enregistrerMouvement('entree', (float) $data['quantite'], null, $data['motif'] ?? null, $request->user()->id, $data['date']);

        return $produit;
    }

    public function correction(Request $request, Produit $produit)
    {
        $data = $request->validate([
            'quantite_physique' => ['required', 'numeric', 'min:0'],
            'motif' => ['required', 'string'],
            'date' => ['required', 'date'],
        ]);

        $delta = round($data['quantite_physique'] - (float) $produit->quantite_stock, 2);

        if ($delta !== 0.0) {
            $produit->enregistrerMouvement('correction', $delta, null, $data['motif'], $request->user()->id, $data['date']);
        }

        return $produit;
    }

    private function validerDonnees(Request $request, ?Produit $produit = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:produits,code'.($produit ? ",{$produit->id}" : '')],
            'designation' => ['required', 'string', 'max:255'],
            'categorie' => ['nullable', 'string', 'max:255'],
            'unite_mesure' => ['required', 'string', 'max:50'],
            'prix_vente' => ['required', 'numeric', 'min:0'],
            'seuil_alerte' => ['nullable', 'numeric', 'min:0'],
        ]);
    }
}
