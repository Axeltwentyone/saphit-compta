<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    public function index(Request $request)
    {
        $query = Paiement::with(['client', 'facture', 'utilisateur'])->latest('date');

        $query->when($request->filled('client_id'), fn ($q) => $q->where('client_id', $request->integer('client_id')))
            ->when($request->filled('facture_id'), fn ($q) => $q->where('facture_id', $request->integer('facture_id')))
            ->when($request->boolean('non_affecte'), fn ($q) => $q->whereNull('facture_id'));

        return $query->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'facture_id' => ['nullable', 'exists:factures,id'],
            'montant' => ['required', 'numeric', 'min:0.01'],
            'mode_reglement' => ['required', 'in:especes,virement,cheque,mobile_money,autre'],
            'date' => ['required', 'date'],
            'remarque' => ['nullable', 'string'],
        ]);

        $factureId = $data['facture_id'] ?? null;

        $facture = null;
        if ($factureId !== null) {
            $facture = Facture::findOrFail($factureId);
            abort_if($facture->client_id !== (int) $data['client_id'], 422, 'Le client ne correspond pas à la facture sélectionnée.');
        }

        $paiement = Paiement::create([
            'client_id' => $data['client_id'],
            'facture_id' => $factureId,
            'montant' => $data['montant'],
            'mode_reglement' => $data['mode_reglement'],
            'date' => $data['date'],
            'remarque' => $data['remarque'] ?? null,
            'user_id' => $request->user()->id,
        ]);

        $facture?->rafraichirStatutPaiement();

        return response()->json($paiement->load('client', 'facture'), 201);
    }

    public function affecter(Request $request, Paiement $paiement)
    {
        abort_if($paiement->facture_id !== null, 422, 'Ce paiement est déjà affecté à une facture.');

        $data = $request->validate([
            'facture_id' => ['required', 'exists:factures,id'],
        ]);

        $facture = Facture::findOrFail($data['facture_id']);
        abort_if($facture->client_id !== $paiement->client_id, 422, 'Le client de la facture ne correspond pas à celui du paiement.');

        $paiement->update(['facture_id' => $facture->id]);
        $facture->rafraichirStatutPaiement();

        return $paiement->load('client', 'facture');
    }
}
